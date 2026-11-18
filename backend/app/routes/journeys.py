import uuid
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import Role
from app.models.emergency_request import EmergencyRequest, RequestStatus
from app.models.journey import Journey, JourneyStatus
from app.models.location_update import LocationUpdate
from app.models.route_change import RouteChange
from app.models.hospital import Hospital
from app.models.ambulance import AmbulanceProfile
from app.utils.auth_helpers import jwt_required, roles_required
from app.utils.validators import validate_coordinates
from app.services.routing_service import fetch_osrm_routes
from app.services.socket_service import notify_journey_status, broadcast_location_update
from app.services.audit_service import log_audit

journeys_bp = Blueprint('journeys', __name__, url_prefix='/api')

@journeys_bp.route('/journeys/<request_id>/start', methods=['POST'])
@roles_required(Role.AMBULANCE)
def start_journey(request_id):
    """
    Ambulance Starts Journey for an ACCEPTED Emergency Request.
    Validates request status and assigns initial route polyline.
    """
    user = g.current_user
    ambulance = user.ambulance_profile

    req_record = EmergencyRequest.query.filter_by(request_id=request_id).first()
    if not req_record:
        return jsonify({'success': False, 'message': 'Emergency request not found.'}), 404

    if req_record.ambulance_id != ambulance.ambulance_id:
        return jsonify({'success': False, 'message': 'Forbidden: You did not initiate this request.'}), 403

    if req_record.status != RequestStatus.ACCEPTED:
        return jsonify({
            'success': False,
            'message': f"Cannot start journey: Request is currently in status '{req_record.status}'. It must be ACCEPTED first."
        }), 400

    hospital = Hospital.query.filter_by(hospital_id=req_record.hospital_id).first()
    if not hospital:
        return jsonify({'success': False, 'message': 'Target hospital not found.'}), 404

    # Fetch real route coordinates from routing engine
    routes = fetch_osrm_routes(req_record.current_lat, req_record.current_lng, hospital.latitude, hospital.longitude)
    selected_route_obj = routes[0] if routes else None
    
    route_geom = json.dumps(selected_route_obj['coordinates']) if selected_route_obj else "[]"
    est_duration = selected_route_obj['duration_mins'] if selected_route_obj else 15.0
    est_distance = selected_route_obj['distance_km'] if selected_route_obj else 8.0

    # Transition state
    try:
        req_record.transition_to(RequestStatus.JOURNEY_ACTIVE)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    journey_id = f"JRN-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    journey = Journey(
        journey_id=journey_id,
        request_id=req_record.request_id,
        ambulance_id=ambulance.ambulance_id,
        hospital_id=hospital.hospital_id,
        status=JourneyStatus.ACTIVE,
        started_at=datetime.utcnow(),
        start_lat=req_record.current_lat,
        start_lng=req_record.current_lng,
        dest_lat=hospital.latitude,
        dest_lng=hospital.longitude,
        route_name=req_record.selected_route,
        route_geometry=route_geom,
        estimated_duration_mins=est_duration,
        estimated_distance_km=est_distance,
        latest_lat=req_record.current_lat,
        latest_lng=req_record.current_lng,
        latest_telemetry_time=datetime.utcnow()
    )

    ambulance.status = 'EN_ROUTE'
    ambulance.current_lat = req_record.current_lat
    ambulance.current_lng = req_record.current_lng
    ambulance.last_location_update = datetime.utcnow()

    # Initial Location Update
    first_loc = LocationUpdate(
        journey_id=journey_id,
        ambulance_id=ambulance.ambulance_id,
        latitude=req_record.current_lat,
        longitude=req_record.current_lng,
        accuracy=10.0,
        speed=0.0,
        heading=0.0
    )

    db.session.add(journey)
    db.session.add(first_loc)
    db.session.commit()

    j_dict = journey.to_dict()
    j_dict['request_details'] = req_record.to_dict(include_sensitive=True)

    log_audit(
        ambulance.ambulance_id,
        Role.AMBULANCE,
        'JOURNEY_STARTED',
        'JOURNEY',
        journey_id,
        f"Journey started from ({req_record.current_lat}, {req_record.current_lng}) to {hospital.hospital_name}"
    )

    notify_journey_status(j_dict)

    return jsonify({
        'success': True,
        'message': 'Emergency journey started. Live tracking telemetry active.',
        'journey': j_dict
    }), 201

@journeys_bp.route('/journeys/<journey_id>/location', methods=['POST'])
@roles_required(Role.AMBULANCE)
def post_location_update(journey_id):
    """
    Submits authorized live GPS coordinate update.
    Validates range and active journey status.
    Broadcasts real-time position to the hospital coordination desk.
    """
    user = g.current_user
    ambulance = user.ambulance_profile

    journey = Journey.query.filter_by(journey_id=journey_id).first()
    if not journey:
        return jsonify({'success': False, 'message': 'Journey not found.'}), 404

    if journey.ambulance_id != ambulance.ambulance_id:
        return jsonify({'success': False, 'message': 'Forbidden: You do not own this journey.'}), 403

    if journey.status != JourneyStatus.ACTIVE:
        return jsonify({'success': False, 'message': f"Cannot update location: Journey is '{journey.status}'."}), 400

    data = request.get_json() or {}
    lat = data.get('latitude')
    lng = data.get('longitude')
    accuracy = data.get('accuracy', 12.0)
    speed = data.get('speed', 45.0)
    heading = data.get('heading', 0.0)

    try:
        lat, lng = validate_coordinates(lat, lng)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    now = datetime.utcnow()
    loc_record = LocationUpdate(
        journey_id=journey.journey_id,
        ambulance_id=ambulance.ambulance_id,
        latitude=lat,
        longitude=lng,
        accuracy=float(accuracy) if accuracy is not None else None,
        speed=float(speed) if speed is not None else None,
        heading=float(heading) if heading is not None else None,
        timestamp=now
    )

    # Update journey latest telemetry
    journey.latest_lat = lat
    journey.latest_lng = lng
    journey.latest_accuracy = float(accuracy) if accuracy else 10.0
    journey.latest_telemetry_time = now

    # Update ambulance profile
    ambulance.current_lat = lat
    ambulance.current_lng = lng
    ambulance.last_location_update = now

    db.session.add(loc_record)
    db.session.commit()

    telemetry_payload = {
        'journey_id': journey.journey_id,
        'request_id': journey.request_id,
        'ambulance_id': ambulance.ambulance_id,
        'hospital_id': journey.hospital_id,
        'latitude': lat,
        'longitude': lng,
        'accuracy': journey.latest_accuracy,
        'speed': speed,
        'heading': heading,
        'timestamp': now.isoformat()
    }

    # Stream over WebSockets
    broadcast_location_update(telemetry_payload)

    return jsonify({
        'success': True,
        'message': 'Telemetry location recorded.',
        'telemetry': telemetry_payload
    }), 200

@journeys_bp.route('/journeys/<journey_id>/route', methods=['POST'])
@roles_required(Role.AMBULANCE)
def update_journey_route(journey_id):
    """
    Records an authorized route alteration during transit.
    """
    user = g.current_user
    ambulance = user.ambulance_profile

    journey = Journey.query.filter_by(journey_id=journey_id).first()
    if not journey or journey.ambulance_id != ambulance.ambulance_id:
        return jsonify({'success': False, 'message': 'Journey not found or unauthorized.'}), 404

    data = request.get_json() or {}
    new_route_name = data.get('new_route')
    reason = data.get('reason', 'Driver detour for traffic clearance')
    new_geometry = data.get('geometry') # Optional updated polyline

    if not new_route_name:
        return jsonify({'success': False, 'message': 'New route name is required.'}), 400

    old_route = journey.route_name
    journey.route_name = new_route_name
    if new_geometry:
        journey.route_geometry = json.dumps(new_geometry) if isinstance(new_geometry, (list, dict)) else str(new_geometry)

    change = RouteChange(
        journey_id=journey.journey_id,
        ambulance_id=ambulance.ambulance_id,
        old_route=old_route,
        new_route=new_route_name,
        reason=reason,
        changed_at=datetime.utcnow()
    )
    db.session.add(change)
    db.session.commit()

    log_audit(
        ambulance.ambulance_id,
        Role.AMBULANCE,
        'ROUTE_CHANGED',
        'JOURNEY',
        journey.journey_id,
        f"Route modified from '{old_route}' to '{new_route_name}'. Reason: {reason}"
    )

    notify_journey_status(journey.to_dict())

    return jsonify({
        'success': True,
        'message': 'Route alteration saved and shared with hospital.',
        'journey': journey.to_dict()
    }), 200

@journeys_bp.route('/journeys/<journey_id>/end', methods=['POST'])
@roles_required(Role.AMBULANCE)
def end_journey(journey_id):
    """
    Ambulance marks journey as COMPLETED upon arrival at hospital.
    """
    user = g.current_user
    ambulance = user.ambulance_profile

    journey = Journey.query.filter_by(journey_id=journey_id).first()
    if not journey or journey.ambulance_id != ambulance.ambulance_id:
        return jsonify({'success': False, 'message': 'Journey not found or unauthorized.'}), 404

    if journey.status != JourneyStatus.ACTIVE:
        return jsonify({'success': False, 'message': f"Journey is already in status '{journey.status}'."}), 400

    now = datetime.utcnow()
    journey.complete()

    # Complete parent emergency request
    req_record = EmergencyRequest.query.filter_by(request_id=journey.request_id).first()
    if req_record:
        req_record.status = RequestStatus.COMPLETED
        req_record.completed_at = now

    ambulance.status = 'AVAILABLE'
    db.session.commit()

    j_dict = journey.to_dict()
    log_audit(
        ambulance.ambulance_id,
        Role.AMBULANCE,
        'JOURNEY_COMPLETED',
        'JOURNEY',
        journey.journey_id,
        f"Patient transfer completed at hospital {journey.hospital_id}."
    )

    notify_journey_status(j_dict)

    return jsonify({
        'success': True,
        'message': 'Journey completed successfully. Patient handed over to trauma center.',
        'journey': j_dict
    }), 200

@journeys_bp.route('/journeys/active', methods=['GET'])
@jwt_required
def get_active_journeys():
    """
    Returns active journeys for the caller.
    """
    user = g.current_user
    if user.role == Role.AMBULANCE:
        journeys = Journey.query.filter_by(ambulance_id=user.user_id, status=JourneyStatus.ACTIVE).all()
    elif user.role == Role.HOSPITAL:
        journeys = Journey.query.filter_by(hospital_id=user.user_id, status=JourneyStatus.ACTIVE).all()
    else:
        journeys = Journey.query.filter_by(status=JourneyStatus.ACTIVE).all()

    res = []
    for j in journeys:
        jd = j.to_dict()
        if j.request:
            jd['emergency_level'] = j.request.emergency_level
            jd['patient_name'] = j.request.patient_name if user.role != Role.ADMIN else f"PAT-{j.request.id}"
            jd['patient_age'] = j.request.patient_age
        if j.ambulance:
            jd['ambulance_phone'] = j.ambulance.phone_number
            jd['ambulance_driver'] = j.ambulance.full_name
        res.append(jd)

    return jsonify({'success': True, 'count': len(res), 'active_journeys': res}), 200

@journeys_bp.route('/journeys/<journey_id>', methods=['GET'])
@jwt_required
def get_journey_detail(journey_id):
    journey = Journey.query.filter_by(journey_id=journey_id).first()
    if not journey:
        return jsonify({'success': False, 'message': 'Journey not found.'}), 404

    jd = journey.to_dict()
    # Include recent telemetry history
    recent_updates = LocationUpdate.query.filter_by(journey_id=journey_id).order_by(LocationUpdate.timestamp.desc()).limit(50).all()
    jd['recent_breadcrumbs'] = [u.to_dict() for u in reversed(recent_updates)]
    
    # Include route changes
    changes = RouteChange.query.filter_by(journey_id=journey_id).order_by(RouteChange.changed_at.asc()).all()
    jd['route_changes'] = [c.to_dict() for c in changes]

    return jsonify({'success': True, 'journey': jd}), 200
