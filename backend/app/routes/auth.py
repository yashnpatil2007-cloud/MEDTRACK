from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User, Role
from app.models.ambulance import AmbulanceProfile
from app.models.hospital import Hospital, HospitalVerificationStatus
from app.utils.auth_helpers import generate_token, jwt_required
from app.utils.validators import validate_user_id, validate_password, validate_phone
from app.services.audit_service import log_audit

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

@auth_bp.route('/register/ambulance', methods=['POST'])
def register_ambulance():
    """
    Ambulance Registration
    Requires EXACTLY five fields:
    1. Full Name
    2. Age
    3. Phone Number
    4. Create Ambulance ID
    5. Password
    """
    data = request.get_json() or {}
    
    # Check for unexpected fields or missing required fields
    full_name = data.get('full_name')
    age = data.get('age')
    phone_number = data.get('phone_number')
    ambulance_id = data.get('ambulance_id')
    password = data.get('password')
    
    if not all([full_name, age, phone_number, ambulance_id, password]):
        return jsonify({
            'success': False,
            'message': 'All five fields are required: Full Name, Age, Phone Number, Ambulance ID, Password.'
        }), 400
    
    try:
        ambulance_id = validate_user_id(ambulance_id)
        password = validate_password(password)
        phone_number = validate_phone(phone_number)
        age = int(age)
        if age < 18 or age > 75:
            return jsonify({'success': False, 'message': 'Age must be between 18 and 75.'}), 400
        if not full_name.strip():
            return jsonify({'success': False, 'message': 'Full name cannot be blank.'}), 400
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
        
    # Check duplicate ID
    if User.query.filter_by(user_id=ambulance_id).first():
        return jsonify({'success': False, 'message': f"Ambulance ID '{ambulance_id}' is already registered. Please choose another."}), 409

    # Create User & Profile
    user = User(
        user_id=ambulance_id,
        role=Role.AMBULANCE,
        is_active=True,
        is_verified=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    profile = AmbulanceProfile(
        user_id=user.id,
        ambulance_id=ambulance_id,
        full_name=full_name.strip(),
        age=age,
        phone_number=phone_number,
        status='AVAILABLE'
    )
    db.session.add(profile)
    db.session.commit()

    log_audit(ambulance_id, Role.AMBULANCE, 'REGISTER_AMBULANCE', 'USER', ambulance_id, f"Registered ambulance user {full_name}")

    token = generate_token(ambulance_id, Role.AMBULANCE)
    return jsonify({
        'success': True,
        'message': 'Ambulance account registered successfully.',
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/register/hospital', methods=['POST'])
def register_hospital():
    """
    Hospital Registration
    Requires EXACTLY three fields:
    1. Hospital Name
    2. Create Hospital ID
    3. Password
    """
    data = request.get_json() or {}
    
    hospital_name = data.get('hospital_name')
    hospital_id = data.get('hospital_id')
    password = data.get('password')
    
    if not all([hospital_name, hospital_id, password]):
        return jsonify({
            'success': False,
            'message': 'All three fields are required: Hospital Name, Hospital ID, Password.'
        }), 400
        
    try:
        hospital_id = validate_user_id(hospital_id)
        password = validate_password(password)
        if not hospital_name.strip():
            return jsonify({'success': False, 'message': 'Hospital name cannot be blank.'}), 400
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    if User.query.filter_by(user_id=hospital_id).first():
        return jsonify({'success': False, 'message': f"Hospital ID '{hospital_id}' is already registered. Please choose another."}), 409

    # Create Hospital account - initially PENDING admin approval
    user = User(
        user_id=hospital_id,
        role=Role.HOSPITAL,
        is_active=True,
        is_verified=False # Requires Admin approval
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Default hospital coordinates around city center
    hospital_profile = Hospital(
        user_id=user.id,
        hospital_id=hospital_id,
        hospital_name=hospital_name.strip(),
        address='Main Medical Boulevard',
        latitude=12.9716,
        longitude=77.5946,
        total_beds=40,
        occupied_beds=22,
        available_beds=18,
        verification_status=HospitalVerificationStatus.PENDING
    )
    db.session.add(hospital_profile)
    db.session.commit()

    log_audit(hospital_id, Role.HOSPITAL, 'REGISTER_HOSPITAL', 'HOSPITAL', hospital_id, f"Registered hospital {hospital_name} (Pending Verification)")

    token = generate_token(hospital_id, Role.HOSPITAL)
    return jsonify({
        'success': True,
        'message': 'Hospital registration submitted successfully. Your account is pending Administrator verification before live coordination can begin.',
        'token': token,
        'user': user.to_dict(),
        'verification_notice': 'PENDING_ADMIN_APPROVAL'
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login endpoint
    Accepts:
    - id (Ambulance ID, Hospital ID, or Admin Username)
    - password
    """
    data = request.get_json() or {}
    user_id = data.get('id') or data.get('user_id')
    password = data.get('password')
    
    if not user_id or not password:
        return jsonify({'success': False, 'message': 'User ID and Password are required.'}), 400

    user = User.query.filter_by(user_id=str(user_id).strip()).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid credentials. Please verify your ID and password.'}), 401

    if not user.is_active:
        return jsonify({'success': False, 'message': 'Your account has been suspended by an Administrator. Please contact support.'}), 403

    token = generate_token(user.user_id, user.role)
    log_audit(user.user_id, user.role, 'LOGIN', 'USER', user.user_id, 'User logged in successfully')

    return jsonify({
        'success': True,
        'message': 'Login successful.',
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout():
    log_audit(g.current_user.user_id, g.current_user.role, 'LOGOUT', 'USER', g.current_user.user_id, 'User logged out')
    return jsonify({'success': True, 'message': 'Logged out successfully.'}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required
def get_me():
    return jsonify({
        'success': True,
        'user': g.current_user.to_dict()
    }), 200

@auth_bp.route('/me/password', methods=['PUT'])
@jwt_required
def update_password():
    data = request.get_json() or {}
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not old_password or not new_password:
        return jsonify({'success': False, 'message': 'Current password and new password are required.'}), 400
        
    if not g.current_user.check_password(old_password):
        return jsonify({'success': False, 'message': 'Current password is incorrect.'}), 400
        
    try:
        new_password = validate_password(new_password)
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
        
    g.current_user.set_password(new_password)
    db.session.commit()
    
    log_audit(g.current_user.user_id, g.current_user.role, 'PASSWORD_CHANGE', 'USER', g.current_user.user_id, 'Password updated')
    return jsonify({'success': True, 'message': 'Password changed successfully.'}), 200

@auth_bp.route('/me/profile', methods=['PUT'])
@jwt_required
def update_profile():
    data = request.get_json() or {}
    user = g.current_user
    
    # Strictly disallow changing user_id (immutable identity)
    if 'user_id' in data and data['user_id'] != user.user_id:
        return jsonify({'success': False, 'message': 'User ID is immutable and cannot be changed.'}), 400

    if user.role == Role.AMBULANCE and user.ambulance_profile:
        if 'full_name' in data and data['full_name'].strip():
            user.ambulance_profile.full_name = data['full_name'].strip()
        if 'phone_number' in data and data['phone_number'].strip():
            try:
                user.ambulance_profile.phone_number = validate_phone(data['phone_number'])
            except ValueError as e:
                return jsonify({'success': False, 'message': str(e)}), 400
    elif user.role == Role.HOSPITAL and user.hospital_profile:
        if 'hospital_name' in data and data['hospital_name'].strip():
            user.hospital_profile.hospital_name = data['hospital_name'].strip()
        if 'address' in data and data['address'].strip():
            user.hospital_profile.address = data['address'].strip()

    db.session.commit()
    log_audit(user.user_id, user.role, 'PROFILE_UPDATE', 'USER', user.user_id, 'Updated profile details')
    
    return jsonify({
        'success': True,
        'message': 'Profile updated successfully.',
        'user': user.to_dict()
    }), 200
