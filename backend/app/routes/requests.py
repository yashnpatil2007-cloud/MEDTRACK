import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import Role
from app.models.emergency_request import EmergencyRequest, RequestStatus, EmergencyLevel
from app.models.hospital import Hospital, HospitalVerificationStatus
from app.models.ambulance import AmbulanceProfile, AmbulanceStatus
from app.utils.auth_helpers import jwt_required, roles_required, hospital_approved_required
from app.utils.validators import validate_coordinates, validate_emergency_level
from app.services.socket_service import notify_hospital_new_request, notify_ambulance_request_decision
from app.services.audit_service import log_audit

requests_bp = Blueprint('requests', __name__, url_prefix='/api')

@requests_bp.route('/requests', methods=['POST'])
@roles_required(Role.AMBULANCE)
def create_emergency_request():
    """
    Ambulance submits a new emergency coordination request.
    Fields:
    - patient_name
    - patient_age
    - emergency_level (CRITICAL, HIGH, MEDIUM, LOW)
    - current_lat, current_lng (obtained via GPS or manual fallback)
    - location_address
    - is_manual_location (bool)
    - hospital_id (target destination)
    - selected_route
    """
    user = g.current_user
    ambulance = user.ambulance_profile
    if not ambulance:
        return jsonify({'success': False, 'message': 'Ambulance profile not found.'}), 404

    # Concurrency and duplicate booking prevention
    if not ambulance.is_available:
        return jsonify({
            'success': False,
            'message': f"Ambulance {ambulance.ambulance_id} is currently '{ambulance.status}'. An ambulance cannot accept or submit new requests while occupied."
        }), 400

    data = request.get_json() or {}
    patient_name = data.get('patient_name')
    patient_age = data.get('patient_age')
    emergency_level = data.get('emergency_level')
    current_lat = data.get('current_lat')
    current_lng = data.get('current_lng')
    location_address = data.get('location_address', 'Current Ambulance Location')
    is_manual_location = bool(data.get('is_manual_location', False))
    hospital_id = data.get('hospital_id')
    selected_route = data.get('selected_route', 'Primary Arterial Corridor')

    # Basic validations
    if not all([patient_name, patient_age, emergency_level, current_lat is not None, current_lng is not None, hospital_id]):
        return jsonify({'success': False, 'message': 'Missing required fields for emergency request.'}), 400

    try:
        patient_age = int(patient_age)
        if patient_age < 0 or patient_age > 130:
            return jsonify({'success': False, 'message': 'Patient age must be between 0 and 130.'}), 400
        emergency_level = validate_emergency_level(emergency_level)
        lat, lng = validate_coordinates(current_lat, current_lng)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    # Validate target hospital
    hospital = Hospital.query.filter_by(hospital_id=hospital_id).first()
    if not hospital:
        return jsonify({'success': False, 'message': f"Hospital ID '{hospital_id}' not found."}), 404
    if hospital.verification_status != HospitalVerificationStatus.APPROVED or not hospital.is_active:
        return jsonify({'success': False, 'message': 'Selected hospital is not verified or inactive for emergency routing.'}), 400

    # Generate authoritative unique request ID
    req_code = f"REQ-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    new_request = EmergencyRequest(
        request_id=req_code,
        ambulance_id=ambulance.ambulance_id,
        hospital_id=hospital.hospital_id,
        patient_name=patient_name.strip(),
        patient_age=patient_age,
        emergency_level=emergency_level,
        current_lat=lat,
        current_lng=lng,
        location_address=location_address,
        is_manual_location=is_manual_location,
        destination_hospital_name=hospital.hospital_name,
        selected_route=selected_route,
        status=RequestStatus.PENDING
    )

    # Update ambulance last known position
    ambulance.current_lat = lat
    ambulance.current_lng = lng
    ambulance.last_location_update = datetime.utcnow()
    ambulance.status = 'DISPATCHED'

    db.session.add(new_request)
    db.session.commit()

    req_dict = new_request.to_dict(include_sensitive=True)
    req_dict['ambulance_details'] = ambulance.to_dict()

    log_audit(
        ambulance.ambulance_id,
        Role.AMBULANCE,
        'CREATE_REQUEST',
        'REQUEST',
        req_code,
        f"Emergency request created for {hospital.hospital_name} ({emergency_level})"
    )

    # Dispatch real-time WebSocket notification to hospital
    notify_hospital_new_request(hospital.hospital_id, req_dict)

    return jsonify({
        'success': True,
        'message': 'Emergency request transmitted to hospital coordination center.',
        'request': req_dict
    }), 201

@requests_bp.route('/requests', methods=['GET'])
@jwt_required
def get_requests():
    """
    Get requests for current authenticated entity:
    - Ambulance gets their own requests
    - Hospital gets requests assigned to them
    - Admin gets platform requests
    """
    user = g.current_user
    status_filter = request.args.get('status')

    if user.role == Role.AMBULANCE:
        query = EmergencyRequest.query.filter_by(ambulance_id=user.user_id)
    elif user.role == Role.HOSPITAL:
        query = EmergencyRequest.query.filter_by(hospital_id=user.user_id)
    elif user.role in [Role.ADMIN, Role.SUPERADMIN]:
        query = EmergencyRequest.query
    else:
        return jsonify({'success': False, 'message': 'Forbidden.'}), 403

    if status_filter:
        query = query.filter_by(status=status_filter.upper())

    records = query.order_by(EmergencyRequest.created_at.desc()).all()
    # Mask patient sensitive name for admin general list to protect HIPAA/patient privacy
    include_sensitive = (user.role in [Role.AMBULANCE, Role.HOSPITAL])
    
    return jsonify({
        'success': True,
        'count': len(records),
        'requests': [r.to_dict(include_sensitive=include_sensitive) for r in records]
    }), 200

@requests_bp.route('/requests/<request_id>', methods=['GET'])
@jwt_required
def get_request_detail(request_id):
    user = g.current_user
    req_record = EmergencyRequest.query.filter_by(request_id=request_id).first()
    if not req_record:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    # Authorization check
    if user.role == Role.AMBULANCE and req_record.ambulance_id != user.user_id:
        return jsonify({'success': False, 'message': 'Access unauthorized.'}), 403
    if user.role == Role.HOSPITAL and req_record.hospital_id != user.user_id:
        return jsonify({'success': False, 'message': 'Access unauthorized.'}), 403

    include_sensitive = (user.role in [Role.AMBULANCE, Role.HOSPITAL])
    data = req_record.to_dict(include_sensitive=include_sensitive)
    if req_record.journey:
        data['journey'] = req_record.journey.to_dict()
    if req_record.ambulance:
        data['ambulance_details'] = req_record.ambulance.to_dict()
    if req_record.hospital:
        data['hospital_details'] = req_record.hospital.to_dict()

    return jsonify({'success': True, 'request': data}), 200

@requests_bp.route('/hospital/requests', methods=['GET'])
@hospital_approved_required
def get_hospital_requests():
    """
    Direct endpoint for hospital dashboard incoming queue.
    """
    hospital = g.current_hospital
    status_filter = request.args.get('status')

    query = EmergencyRequest.query.filter_by(hospital_id=hospital.hospital_id)
    if status_filter:
        query = query.filter_by(status=status_filter.upper())

    records = query.order_by(EmergencyRequest.created_at.desc()).all()
    
    res = []
    for r in records:
        d = r.to_dict(include_sensitive=True)
        if r.ambulance:
            d['ambulance_phone'] = r.ambulance.phone_number
            d['ambulance_driver'] = r.ambulance.full_name
        res.append(d)

    return jsonify({
        'success': True,
        'hospital_id': hospital.hospital_id,
        'count': len(res),
        'requests': res
    }), 200

@requests_bp.route('/requests/<request_id>/decision', methods=['POST'])
@hospital_approved_required
def make_request_decision(request_id):
    """
    Hospital Accepts or Rejects an emergency request.
    Only the assigned hospital may accept or reject requests.
    Validates state machine: must be currently PENDING.
    """
    hospital = g.current_hospital
    req_record = EmergencyRequest.query.filter_by(request_id=request_id).first()
    if not req_record:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    # Ownership check
    if req_record.hospital_id != hospital.hospital_id:
        return jsonify({'success': False, 'message': 'Forbidden: You can only decide on requests assigned to your hospital.'}), 403

    if req_record.status != RequestStatus.PENDING:
        return jsonify({
            'success': False,
            'message': f"Cannot make decision: request is already in status '{req_record.status}'."
        }), 400

    data = request.get_json() or {}
    decision = data.get('decision', '').upper()
    reason = data.get('reason')

    if decision not in [RequestStatus.ACCEPTED, RequestStatus.REJECTED]:
        return jsonify({'success': False, 'message': "Decision must be either 'ACCEPTED' or 'REJECTED'."}), 400

    if decision == RequestStatus.REJECTED and not reason:
        reason = "Capacity constraints / trauma room occupied"

    try:
        req_record.transition_to(decision, reason)
        amb_profile = AmbulanceProfile.query.filter_by(ambulance_id=req_record.ambulance_id).first()
        if decision == RequestStatus.ACCEPTED and amb_profile:
            amb_profile.status = AmbulanceStatus.BOOKED
        elif decision == RequestStatus.REJECTED and amb_profile and amb_profile.status == AmbulanceStatus.BOOKED:
            amb_profile.status = AmbulanceStatus.AVAILABLE
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

    decision_data = {
        'request_id': req_record.request_id,
        'ambulance_id': req_record.ambulance_id,
        'hospital_id': hospital.hospital_id,
        'hospital_name': hospital.hospital_name,
        'status': req_record.status,
        'rejection_reason': req_record.rejection_reason,
        'timestamp': datetime.utcnow().isoformat()
    }

    log_audit(
        hospital.hospital_id,
        Role.HOSPITAL,
        f"REQUEST_{decision}",
        'REQUEST',
        req_record.request_id,
        f"Hospital {decision.lower()} request {req_record.request_id}. {reason or ''}"
    )

    # Real-time alert to ambulance
    notify_ambulance_request_decision(req_record.ambulance_id, decision_data)

    return jsonify({
        'success': True,
        'message': f"Request has been {decision.lower()} successfully.",
        'request': req_record.to_dict(include_sensitive=True)
    }), 200

@requests_bp.route('/requests/<request_id>/pickup', methods=['POST'])
@roles_required(Role.AMBULANCE)
def confirm_patient_pickup(request_id):
    """
    Ambulance confirms arrival at pickup location and patient on board.
    Transitions request and ambulance status to 'PATIENT PICKED UP'.
    """
    user = g.current_user
    ambulance = user.ambulance_profile
    req_record = EmergencyRequest.query.filter_by(request_id=request_id).first()
    if not req_record:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    if req_record.ambulance_id != ambulance.ambulance_id:
        return jsonify({'success': False, 'message': 'Forbidden: You do not own this request.'}), 403

    if req_record.status not in [RequestStatus.ACCEPTED, RequestStatus.BOOKED]:
        return jsonify({
            'success': False, 
            'message': f"Cannot confirm pickup: Request status is '{req_record.status}' (must be BOOKED/ACCEPTED)."
        }), 400

    try:
        req_record.transition_to(RequestStatus.PATIENT_PICKED_UP)
        ambulance.status = AmbulanceStatus.PATIENT_PICKED_UP
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

    payload = req_record.to_dict(include_sensitive=True)
    payload['ambulance_details'] = ambulance.to_dict()

    log_audit(
        ambulance.ambulance_id,
        Role.AMBULANCE,
        'PATIENT_PICKED_UP',
        'REQUEST',
        req_record.request_id,
        f"Paramedic confirmed patient {req_record.patient_name} on board. Preparing route selection."
    )

    notify_hospital_new_request(req_record.hospital_id, payload)

    return jsonify({
        'success': True,
        'message': 'Patient pickup confirmed. Please compare routes and select your destination corridor.',
        'request': payload
    }), 200

@requests_bp.route('/requests/<request_id>/destination', methods=['PUT'])
@roles_required(Role.AMBULANCE)
def update_request_destination(request_id):
    """
    Ambulance updates/confirms destination hospital before starting transit.
    """
    user = g.current_user
    ambulance = user.ambulance_profile
    req_record = EmergencyRequest.query.filter_by(request_id=request_id).first()
    if not req_record:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    if req_record.ambulance_id != ambulance.ambulance_id:
        return jsonify({'success': False, 'message': 'Forbidden.'}), 403

    data = request.get_json(silent=True) or {}
    hospital_id = data.get('hospital_id')
    selected_route = data.get('selected_route')

    if hospital_id:
        hospital = Hospital.query.filter_by(hospital_id=hospital_id).first()
        if not hospital:
            return jsonify({'success': False, 'message': 'Hospital not found.'}), 404
        req_record.hospital_id = hospital.hospital_id
        req_record.destination_hospital_name = hospital.hospital_name

    if selected_route:
        req_record.selected_route = selected_route

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Destination and route corridor updated.',
        'request': req_record.to_dict(include_sensitive=True)
    }), 200

@requests_bp.route('/requests/<request_id>/cancel', methods=['POST'])
@jwt_required
def cancel_request(request_id):
    """
    Allows ambulance or hospital to cancel an active/pending request.
    Restores ambulance availability to AVAILABLE.
    """
    user = g.current_user
    req_record = EmergencyRequest.query.filter_by(request_id=request_id).first()
    if not req_record:
        return jsonify({'success': False, 'message': 'Request not found.'}), 404

    # Check permission
    is_owner_ambulance = (user.role == Role.AMBULANCE and req_record.ambulance_id == user.user_id)
    is_owner_hospital = (user.role == Role.HOSPITAL and req_record.hospital_id == user.user_id)
    is_admin = (user.role in [Role.ADMIN, Role.SUPERADMIN])

    if not (is_owner_ambulance or is_owner_hospital or is_admin):
        return jsonify({'success': False, 'message': 'Forbidden.'}), 403

    data = request.get_json(silent=True) or {}
    reason = data.get('reason', 'Cancelled by coordinator/user')

    try:
        req_record.transition_to(RequestStatus.CANCELLED, reason)
        if req_record.journey and req_record.journey.status in ['ACTIVE', 'ON JOURNEY']:
            req_record.journey.status = 'ABORTED'
        if req_record.ambulance:
            req_record.ambulance.status = AmbulanceStatus.AVAILABLE
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

    log_audit(user.user_id, user.role, 'REQUEST_CANCELLED', 'REQUEST', req_record.request_id, reason)

    return jsonify({'success': True, 'message': 'Request cancelled.', 'request': req_record.to_dict()}), 200
