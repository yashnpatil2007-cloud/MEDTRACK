from flask import Blueprint, jsonify, request, g
from app.extensions import db
from app.models.user import Role
from app.models.ambulance import AmbulanceProfile, AmbulanceStatus
from app.utils.auth_helpers import jwt_required, roles_required

ambulances_bp = Blueprint('ambulances', __name__, url_prefix='/api')

@ambulances_bp.route('/ambulances', methods=['GET'])
@jwt_required
def get_ambulances():
    """
    Returns ambulances. Active journeys or coordinator overview.
    """
    user = g.current_user
    if user.role not in [Role.ADMIN, Role.SUPERADMIN, Role.HOSPITAL]:
        return jsonify({'success': False, 'message': 'Forbidden.'}), 403

    ambulances = AmbulanceProfile.query.all()
    return jsonify({
        'success': True,
        'count': len(ambulances),
        'ambulances': [a.to_dict() for a in ambulances]
    }), 200

@ambulances_bp.route('/ambulances/status', methods=['POST'])
@jwt_required
def update_ambulance_status():
    """
    Ambulance or Admin updates unit availability status.
    """
    user = g.current_user
    data = request.get_json(silent=True) or {}
    status_str = data.get('status', AmbulanceStatus.AVAILABLE)

    if user.role == Role.AMBULANCE:
        amb = user.ambulance_profile
    elif user.role in [Role.ADMIN, Role.SUPERADMIN]:
        amb_id = data.get('ambulance_id')
        amb = AmbulanceProfile.query.filter_by(ambulance_id=amb_id).first() if amb_id else None
    else:
        return jsonify({'success': False, 'message': 'Unauthorized to change ambulance status.'}), 403

    if not amb:
        return jsonify({'success': False, 'message': 'Ambulance profile not found.'}), 404

    amb.status = status_str
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f"Ambulance status updated to '{status_str}'.",
        'ambulance': amb.to_dict()
    }), 200

@ambulances_bp.route('/ambulances/<ambulance_id>', methods=['GET'])
@jwt_required
def get_ambulance_detail(ambulance_id):
    ambulance = AmbulanceProfile.query.filter_by(ambulance_id=ambulance_id).first()
    if not ambulance:
        return jsonify({'success': False, 'message': 'Ambulance not found.'}), 404
        
    return jsonify({'success': True, 'ambulance': ambulance.to_dict()}), 200
