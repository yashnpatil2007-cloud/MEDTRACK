from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User, Role
from app.models.hospital import Hospital, HospitalVerificationStatus
from app.models.ambulance import AmbulanceProfile
from app.models.emergency_request import EmergencyRequest, RequestStatus
from app.models.journey import Journey, JourneyStatus
from app.models.audit import AuditLog
from app.utils.auth_helpers import roles_required
from app.services.audit_service import log_audit
from app.models.notification import Notification

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@admin_bp.route('/stats', methods=['GET'])
@roles_required(Role.ADMIN)
def get_admin_dashboard_stats():
    """
    Overview statistics for Administrator Dashboard.
    """
    total_users = User.query.count()
    total_hospitals = Hospital.query.count()
    total_ambulances = AmbulanceProfile.query.count()
    pending_hospital_approvals = Hospital.query.filter_by(verification_status=HospitalVerificationStatus.PENDING).count()
    active_requests = EmergencyRequest.query.filter(EmergencyRequest.status.in_([RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.JOURNEY_ACTIVE])).count()
    active_journeys = Journey.query.filter_by(status=JourneyStatus.ACTIVE).count()
    completed_journeys = Journey.query.filter_by(status=JourneyStatus.COMPLETED).count()

    # Bed occupancy aggregate
    all_hospitals = Hospital.query.all()
    aggregate_total_beds = sum(h.total_beds for h in all_hospitals)
    aggregate_occupied_beds = sum(h.occupied_beds for h in all_hospitals)
    aggregate_available_beds = sum(h.available_beds for h in all_hospitals)

    return jsonify({
        'success': True,
        'stats': {
            'total_users': total_users,
            'total_hospitals': total_hospitals,
            'total_ambulances': total_ambulances,
            'pending_hospital_approvals': pending_hospital_approvals,
            'active_requests': active_requests,
            'active_journeys': active_journeys,
            'completed_journeys': completed_journeys,
            'aggregate_total_beds': aggregate_total_beds,
            'aggregate_occupied_beds': aggregate_occupied_beds,
            'aggregate_available_beds': aggregate_available_beds
        }
    }), 200

@admin_bp.route('/hospitals', methods=['GET'])
@roles_required(Role.ADMIN)
def list_hospitals():
    status = request.args.get('status')
    query = Hospital.query
    if status:
        query = query.filter_by(verification_status=status.upper())
    
    hospitals = query.order_by(Hospital.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(hospitals),
        'hospitals': [h.to_dict() for h in hospitals]
    }), 200

@admin_bp.route('/hospitals/<hospital_id>/approve', methods=['POST'])
@roles_required(Role.ADMIN)
def approve_hospital(hospital_id):
    """
    Admin approves a registered hospital to participate in live coordination.
    """
    hospital = Hospital.query.filter_by(hospital_id=hospital_id).first()
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    hospital.verification_status = HospitalVerificationStatus.APPROVED
    if hospital.user:
        hospital.user.is_verified = True
    db.session.commit()

    log_audit(
        g.current_user.user_id,
        g.current_user.role,
        'HOSPITAL_APPROVED',
        'HOSPITAL',
        hospital_id,
        f"Approved hospital {hospital.hospital_name}"
    )

    # Notify hospital
    notif = Notification(
        user_id=hospital_id,
        role='HOSPITAL',
        title='Hospital Account Approved',
        message=f"Your hospital account has been verified and approved by Administrator {g.current_user.user_id}. You can now participate in emergency coordination.",
        category='SYSTEM'
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Hospital '{hospital.hospital_name}' has been verified and approved.",
        'hospital': hospital.to_dict()
    }), 200

@admin_bp.route('/hospitals/<hospital_id>/reject', methods=['POST'])
@roles_required(Role.ADMIN)
def reject_hospital(hospital_id):
    """
    Admin rejects a hospital registration.
    """
    data = request.get_json() or {}
    reason = data.get('reason', 'Verification credentials insufficient')

    hospital = Hospital.query.filter_by(hospital_id=hospital_id).first()
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    hospital.verification_status = HospitalVerificationStatus.REJECTED
    hospital.rejection_reason = reason
    if hospital.user:
        hospital.user.is_verified = False
    db.session.commit()

    log_audit(
        g.current_user.user_id,
        g.current_user.role,
        'HOSPITAL_REJECTED',
        'HOSPITAL',
        hospital_id,
        f"Rejected hospital {hospital.hospital_name}. Reason: {reason}"
    )

    # Notify hospital
    notif = Notification(
        user_id=hospital_id,
        role='HOSPITAL',
        title='Hospital Registration Rejected',
        message=f"Your hospital registration was reviewed and rejected. Reason: {reason}",
        category='SYSTEM'
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f"Hospital '{hospital.hospital_name}' application rejected.",
        'hospital': hospital.to_dict()
    }), 200

@admin_bp.route('/hospitals/<hospital_id>/toggle-status', methods=['POST'])
@roles_required(Role.ADMIN)
def toggle_hospital_status(hospital_id):
    hospital = Hospital.query.filter_by(hospital_id=hospital_id).first()
    if not hospital:
        return jsonify({'success': False, 'message': 'Hospital not found.'}), 404

    hospital.is_active = not hospital.is_active
    if hospital.user:
        hospital.user.is_active = hospital.is_active
    db.session.commit()

    state = 'Activated' if hospital.is_active else 'Suspended'
    log_audit(
        g.current_user.user_id,
        g.current_user.role,
        f"HOSPITAL_{state.upper()}",
        'HOSPITAL',
        hospital_id,
        f"{state} hospital {hospital.hospital_name}"
    )

    return jsonify({
        'success': True,
        'message': f"Hospital {state.lower()} successfully.",
        'hospital': hospital.to_dict()
    }), 200

@admin_bp.route('/ambulances', methods=['GET'])
@roles_required(Role.ADMIN)
def list_ambulances():
    ambulances = AmbulanceProfile.query.all()
    res = []
    for a in ambulances:
        d = a.to_dict()
        d['is_active'] = a.user.is_active if a.user else True
        res.append(d)
    return jsonify({'success': True, 'count': len(res), 'ambulances': res}), 200

@admin_bp.route('/ambulances/<ambulance_id>/toggle-status', methods=['POST'])
@roles_required(Role.ADMIN)
def toggle_ambulance_status(ambulance_id):
    amb = AmbulanceProfile.query.filter_by(ambulance_id=ambulance_id).first()
    if not amb:
        return jsonify({'success': False, 'message': 'Ambulance not found.'}), 404

    if amb.user:
        amb.user.is_active = not amb.user.is_active
        state = 'Activated' if amb.user.is_active else 'Suspended'
        db.session.commit()
        log_audit(g.current_user.user_id, g.current_user.role, f"AMBULANCE_{state.upper()}", 'AMBULANCE', ambulance_id, f"{state} ambulance account {ambulance_id}")
        return jsonify({'success': True, 'message': f"Ambulance {state.lower()} successfully."}), 200
        
    return jsonify({'success': False, 'message': 'User record missing for ambulance.'}), 500

@admin_bp.route('/users', methods=['GET'])
@roles_required(Role.ADMIN)
def list_users():
    role_filter = request.args.get('role')
    search = request.args.get('search')
    
    query = User.query
    if role_filter:
        query = query.filter_by(role=role_filter.upper())
    if search:
        query = query.filter(User.user_id.ilike(f"%{search}%"))

    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(users),
        'users': [u.to_dict() for u in users]
    }), 200

@admin_bp.route('/users/<user_id>/toggle-status', methods=['POST'])
@roles_required(Role.ADMIN)
def toggle_user_status(user_id):
    target = User.query.filter_by(user_id=user_id).first()
    if not target:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    if target.role == Role.SUPERADMIN and g.current_user.role != Role.SUPERADMIN:
        return jsonify({'success': False, 'message': 'Super Administrator accounts cannot be modified by regular administrators.'}), 403

    target.is_active = not target.is_active
    db.session.commit()
    
    state = 'Activated' if target.is_active else 'Suspended'
    log_audit(g.current_user.user_id, g.current_user.role, f"USER_{state.upper()}", 'USER', user_id, f"{state} user account {user_id}")

    return jsonify({'success': True, 'message': f"User account {state.lower()}.", 'user': target.to_dict()}), 200

@admin_bp.route('/requests', methods=['GET'])
@roles_required(Role.ADMIN)
def list_all_requests():
    """
    Overview of requests for administrator oversight.
    Protects patient privacy by redacting full names from non-clinical admin overview.
    """
    status = request.args.get('status')
    query = EmergencyRequest.query
    if status:
        query = query.filter_by(status=status.upper())

    requests_list = query.order_by(EmergencyRequest.created_at.desc()).limit(100).all()
    return jsonify({
        'success': True,
        'count': len(requests_list),
        'requests': [r.to_dict(include_sensitive=False) for r in requests_list]
    }), 200

@admin_bp.route('/analytics', methods=['GET'])
@roles_required(Role.ADMIN)
def get_analytics():
    """
    Structured analytical metrics for reports.
    """
    from sqlalchemy import func
    
    # Emergency levels breakdown
    level_counts = db.session.query(
        EmergencyRequest.emergency_level,
        func.count(EmergencyRequest.id)
    ).group_by(EmergencyRequest.emergency_level).all()
    
    levels_dict = {lvl: count for lvl, count in level_counts}
    
    # Request statuses breakdown
    status_counts = db.session.query(
        EmergencyRequest.status,
        func.count(EmergencyRequest.id)
    ).group_by(EmergencyRequest.status).all()
    
    statuses_dict = {st: count for st, count in status_counts}

    # Hospital bed utilization
    hospitals = Hospital.query.filter_by(verification_status=HospitalVerificationStatus.APPROVED).all()
    hospital_utilization = [
        {
            'hospital_id': h.hospital_id,
            'hospital_name': h.hospital_name,
            'total_beds': h.total_beds,
            'occupied_beds': h.occupied_beds,
            'available_beds': h.available_beds,
            'occupancy_rate': round((h.occupied_beds / h.total_beds * 100), 1) if h.total_beds > 0 else 0
        }
        for h in hospitals
    ]

    return jsonify({
        'success': True,
        'analytics': {
            'emergency_levels': levels_dict,
            'request_statuses': statuses_dict,
            'hospital_utilization': hospital_utilization
        }
    }), 200

@admin_bp.route('/audit-logs', methods=['GET'])
@roles_required(Role.ADMIN)
def get_audit_logs():
    limit = int(request.args.get('limit', 100))
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return jsonify({
        'success': True,
        'count': len(logs),
        'audit_logs': [l.to_dict() for l in logs]
    }), 200
