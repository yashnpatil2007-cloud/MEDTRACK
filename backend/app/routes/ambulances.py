from flask import Blueprint, jsonify, g
from app.models.user import Role
from app.models.ambulance import AmbulanceProfile
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

@ambulances_bp.route('/ambulances/<ambulance_id>', methods=['GET'])
@jwt_required
def get_ambulance_detail(ambulance_id):
    ambulance = AmbulanceProfile.query.filter_by(ambulance_id=ambulance_id).first()
    if not ambulance:
        return jsonify({'success': False, 'message': 'Ambulance not found.'}), 404
        
    return jsonify({'success': True, 'ambulance': ambulance.to_dict()}), 200
