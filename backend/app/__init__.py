import os
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import config_by_name
from app.extensions import db, socketio

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name['default']))

    # Initialize extensions
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.requests import requests_bp
    from app.routes.hospitals import hospitals_bp
    from app.routes.journeys import journeys_bp
    from app.routes.ambulances import ambulances_bp
    from app.routes.admin import admin_bp
    from app.routes.superadmin import superadmin_bp
    from app.routes.notifications import notifications_bp
    from app.routes.contact import contact_bp
    from app.routes.routing_proxy import routing_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(requests_bp)
    app.register_blueprint(hospitals_bp)
    app.register_blueprint(journeys_bp)
    app.register_blueprint(ambulances_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(superadmin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(routing_bp)

    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'product': 'MEDTRACK Emergency Coordination Platform',
            'version': '1.0.0',
            'timestamp': '2026-11-18'
        }), 200

    # Centralized JSON error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'success': False, 'message': str(e.description or 'Bad Request'), 'error_code': 400}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'success': False, 'message': str(e.description or 'Unauthorized access'), 'error_code': 401}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'success': False, 'message': str(e.description or 'Permission denied'), 'error_code': 403}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Requested resource was not found on MEDTRACK server.', 'error_code': 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'success': False, 'message': 'HTTP method not allowed for this endpoint.', 'error_code': 405}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'success': False, 'message': 'Internal coordination server error. Please retry or contact technical dispatch.', 'error_code': 500}), 500

    # Auto bootstrap superadmin if database is initialized
    with app.app_context():
        db.create_all()
        _bootstrap_superadmin(app)

    return app

def _bootstrap_superadmin(app):
    from app.models.user import User, Role
    from app.models.system_setting import SystemSetting
    
    superadmin_id = app.config.get('SUPERADMIN_ID', 'superadmin')
    superadmin_pass = app.config.get('SUPERADMIN_PASSWORD', 'SuperAdmin@MedTrack2026')
    
    admin_user = User.query.filter_by(user_id=superadmin_id).first()
    if not admin_user:
        admin_user = User(
            user_id=superadmin_id,
            role=Role.SUPERADMIN,
            is_active=True,
            is_verified=True
        )
        admin_user.set_password(superadmin_pass)
        db.session.add(admin_user)
        
        # Add basic system setting
        setting = SystemSetting(
            key='SYSTEM_EMERGENCY_DISPATCH_MODE',
            value='HIGH_AVAILABILITY_AUTONOMOUS',
            description='Default coordination dispatch mode for metropolitan hospitals'
        )
        db.session.add(setting)
        db.session.commit()
