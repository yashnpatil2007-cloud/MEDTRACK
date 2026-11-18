from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.notification import Notification
from app.utils.auth_helpers import jwt_required

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api')

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required
def get_user_notifications():
    user = g.current_user
    # Fetch notifications targeted to user or role
    query = Notification.query.filter(
        (Notification.user_id == user.user_id) | 
        (Notification.role == user.role)
    ).order_by(Notification.created_at.desc()).limit(50)

    notifs = query.all()
    unread_count = sum(1 for n in notifs if not n.is_read)

    return jsonify({
        'success': True,
        'unread_count': unread_count,
        'notifications': [n.to_dict() for n in notifs]
    }), 200

@notifications_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@jwt_required
def mark_notification_read(notif_id):
    user = g.current_user
    notif = Notification.query.filter_by(id=notif_id).first()
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found.'}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True, 'message': 'Notification marked as read.'}), 200

@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required
def mark_all_read():
    user = g.current_user
    Notification.query.filter(
        (Notification.user_id == user.user_id) | 
        (Notification.role == user.role)
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.session.commit()
    return jsonify({'success': True, 'message': 'All notifications marked as read.'}), 200
