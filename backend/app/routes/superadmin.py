from flask import Blueprint, request, jsonify, g, current_app
from app.extensions import db
from app.models.user import User, Role
from app.models.system_setting import SystemSetting
from app.utils.auth_helpers import roles_required
from app.utils.validators import validate_user_id, validate_password
from app.services.audit_service import log_audit

superadmin_bp = Blueprint('superadmin', __name__, url_prefix='/api/superadmin')

@superadmin_bp.route('/health', methods=['GET'])
@roles_required(Role.SUPERADMIN)
def get_system_health():
    """
    Super Admin platform health overview
    """
    db_ok = True
    try:
        db.session.execute(db.text("SELECT 1"))
    except Exception:
        db_ok = False

    return jsonify({
        'success': True,
        'health': {
            'status': 'OPERATIONAL' if db_ok else 'DEGRADED',
            'database_connected': db_ok,
            'api_version': '1.0.0-enterprise',
            'realtime_engine': 'Flask-SocketIO Active',
            'osm_routing_proxy': 'OSRM Project-OSRM Active / Fallback Ready',
            'security_mode': 'JWT HS256 Role-Enforced'
        }
    }), 200

@superadmin_bp.route('/admins', methods=['POST'])
@roles_required(Role.SUPERADMIN)
def create_admin_user():
    """
    Super Admin creates a new Administrator account securely.
    """
    data = request.get_json() or {}
    admin_id = data.get('admin_id')
    password = data.get('password')
    
    if not admin_id or not password:
        return jsonify({'success': False, 'message': 'admin_id and password are required.'}), 400

    try:
        admin_id = validate_user_id(admin_id)
        password = validate_password(password)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    if User.query.filter_by(user_id=admin_id).first():
        return jsonify({'success': False, 'message': f"User '{admin_id}' already exists."}), 409

    new_admin = User(
        user_id=admin_id,
        role=Role.ADMIN,
        is_active=True,
        is_verified=True
    )
    new_admin.set_password(password)
    db.session.add(new_admin)
    db.session.commit()

    log_audit(
        g.current_user.user_id,
        Role.SUPERADMIN,
        'CREATE_ADMIN',
        'USER',
        admin_id,
        f"Created new Administrator account {admin_id}"
    )

    return jsonify({
        'success': True,
        'message': f"Administrator account '{admin_id}' created successfully.",
        'admin': new_admin.to_dict()
    }), 201

@superadmin_bp.route('/settings', methods=['GET'])
@roles_required(Role.SUPERADMIN)
def get_settings():
    settings = SystemSetting.query.all()
    return jsonify({
        'success': True,
        'settings': [s.to_dict() for s in settings]
    }), 200

@superadmin_bp.route('/settings', methods=['PUT'])
@roles_required(Role.SUPERADMIN)
def update_setting():
    data = request.get_json() or {}
    key = data.get('key')
    value = data.get('value')
    description = data.get('description')

    if not key or value is None:
        return jsonify({'success': False, 'message': 'key and value are required.'}), 400

    setting = SystemSetting.query.filter_by(key=key).first()
    if not setting:
        setting = SystemSetting(key=key, value=str(value), description=description)
        db.session.add(setting)
    else:
        setting.value = str(value)
        if description:
            setting.description = description

    db.session.commit()
    log_audit(g.current_user.user_id, Role.SUPERADMIN, 'SETTING_UPDATE', 'SYSTEM', key, f"Updated setting {key}={value}")

    return jsonify({'success': True, 'message': f"Setting '{key}' saved.", 'setting': setting.to_dict()}), 200
