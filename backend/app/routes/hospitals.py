from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.hospital import Hospital, HospitalVerificationStatus
from app.models.user import Role
from app.utils.auth_helpers import jwt_required, roles_required, hospital_approved_required
from app.utils.validators import validate_beds, validate_coordinates
from app.services.socket_service import broadcast_bed_update
from app.services.audit_service import log_audit

hospitals_bp = Blueprint('hospitals', __name__, url_prefix='/api')

@hospitals_bp.route('/hospitals', methods=['GET'])
def get_hospitals():
    """
    Returns verified active hospitals for ambulances and coordinators.
    Includes current bed counts and update timestamps.
    """
    # Only return approved and active hospitals
    query = Hospital.query.filter_by(
        verification_status=HospitalVerificationStatus.APPROVED,
        is_active=True
    ).order_by(Hospital.available_beds.desc())
    
    hospitals = [h.to_dict() for h in query.all()]
    return jsonify({
        'success': True,
        'count': len(hospitals),
        'hospitals': hospitals
    }), 200

@hospitals_bp.route('/hospitals/<hospital_id>', methods=['GET'])
def get_hospital_detail(hospital_id):
    hospital = Hospital.query.filter_by(hospital_id=hospital_id).first()
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404
        
    return jsonify({
        'success': True,
        'hospital': hospital.to_dict()
    }), 200

@hospitals_bp.route('/hospital/beds', methods=['PUT'])
@roles_required(Role.HOSPITAL)
def update_bed_availability():
    """
    Hospital Bed Availability Management
    - Editable fields: Total Beds, Occupied Beds
    - Automatically calculates: Available Beds = Total - Occupied
    - Enforces constraints: Total >= 0, Occupied >= 0, Occupied <= Total
    - Enforces ownership: only authenticated hospital owning the record may update
    """
    user = g.current_user
    hospital = user.hospital_profile
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital profile not found for this account.'}), 404

    data = request.get_json() or {}
    total_beds = data.get('total_beds')
    occupied_beds = data.get('occupied_beds')

    if total_beds is None or occupied_beds is None:
        return jsonify({'success': False, 'message': 'Both total_beds and occupied_beds are required.'}), 400

    try:
        total, occupied = validate_beds(total_beds, occupied_beds)
        hospital.update_beds(total, occupied)
        db.session.commit()
    except ValueError as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400

    hospital_dict = hospital.to_dict()

    # Log audit
    log_audit(
        user.user_id,
        Role.HOSPITAL,
        'BEDS_UPDATED',
        'HOSPITAL',
        hospital.hospital_id,
        f"Updated beds: Total={total}, Occupied={occupied}, Available={hospital.available_beds}"
    )

    # Real-time WebSocket broadcast to all connected ambulances and coordination desks
    broadcast_bed_update(hospital_dict)

    return jsonify({
        'success': True,
        'message': 'Bed availability updated successfully.',
        'hospital': hospital_dict
    }), 200

@hospitals_bp.route('/hospital/location', methods=['PUT'])
@roles_required(Role.HOSPITAL)
def update_hospital_location():
    """
    Allows hospital to configure its address and map coordinates.
    """
    user = g.current_user
    hospital = user.hospital_profile
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital profile not found.'}), 404

    data = request.get_json() or {}
    lat = data.get('latitude')
    lng = data.get('longitude')
    address = data.get('address')

    try:
        lat, lng = validate_coordinates(lat, lng)
        hospital.latitude = lat
        hospital.longitude = lng
        if address:
            hospital.address = str(address).strip()
        db.session.commit()
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    log_audit(user.user_id, Role.HOSPITAL, 'LOCATION_UPDATED', 'HOSPITAL', hospital.hospital_id, f"Coordinates updated to ({lat}, {lng})")
    
    return jsonify({
        'success': True,
        'message': 'Hospital location updated successfully.',
        'hospital': hospital.to_dict()
    }), 200
