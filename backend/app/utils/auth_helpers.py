import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask import request, jsonify, current_app, g
from app.models.user import User, Role
from app.models.hospital import Hospital, HospitalVerificationStatus

def generate_token(user_id: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_EXPIRATION_HOURS', 24))
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise ValueError("Authentication token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid authentication token.")

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'success': False, 'message': 'Authorization header is missing.'}), 401
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'success': False, 'message': 'Invalid Authorization header format. Expected Bearer <token>'}), 401
        
        token = parts[1]
        try:
            payload = decode_token(token)
        except ValueError as e:
            return jsonify({'success': False, 'message': str(e)}), 401
        
        user = User.query.filter_by(user_id=payload['sub']).first()
        if not user or not user.is_active:
            return jsonify({'success': False, 'message': 'User account not found or suspended.'}), 401
        
        g.current_user = user
        g.token_payload = payload
        return f(*args, **kwargs)
    return decorated

def roles_required(*roles):
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated(*args, **kwargs):
            user = g.current_user
            # SUPERADMIN can access ADMIN routes
            user_role = user.role
            allowed = list(roles)
            if Role.ADMIN in allowed and user_role == Role.SUPERADMIN:
                return f(*args, **kwargs)
            
            if user_role not in allowed:
                return jsonify({
                    'success': False, 
                    'message': f"Access forbidden: requires one of {allowed}, current role is '{user_role}'"
                }), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

def hospital_approved_required(f):
    @wraps(f)
    @jwt_required
    def decorated(*args, **kwargs):
        user = g.current_user
        if user.role != Role.HOSPITAL:
            return jsonify({'success': False, 'message': 'Hospital account required.'}), 403
        
        hospital = user.hospital_profile
        if not hospital or hospital.verification_status != HospitalVerificationStatus.APPROVED:
            return jsonify({
                'success': False,
                'message': 'Your hospital account is awaiting administrator verification or has not been approved yet. Live coordination features are restricted until approved.',
                'verification_status': hospital.verification_status if hospital else 'NOT_FOUND'
            }), 403
        
        g.current_hospital = hospital
        return f(*args, **kwargs)
    return decorated
