import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import Role
from app.utils.auth_helpers import jwt_required
from app.services.audit_service import log_audit

communication_bp = Blueprint('communication', __name__, url_prefix='/api')

# In-memory ephemeral radio messages for rapid dispatch (persisted per session)
COMM_MESSAGES = [
    {
        'id': 'MSG-101',
        'sender_id': 'AMB-101',
        'sender_role': 'AMBULANCE',
        'recipient_id': 'HOSP-METRO',
        'text': 'Priority siren dispatch active. Patient vitals: BP 118/76, SpO2 96%, HR 88.',
        'quick_tag': 'VITALS_STABLE',
        'timestamp': datetime.utcnow().strftime('%I:%M %p')
    },
    {
        'id': 'MSG-102',
        'sender_id': 'HOSP-METRO',
        'sender_role': 'HOSPITAL',
        'recipient_id': 'AMB-101',
        'text': 'Trauma Bay 1 cleared and prepared. Attending emergency physician on standby.',
        'quick_tag': 'TRAUMA_BAY_READY',
        'timestamp': datetime.utcnow().strftime('%I:%M %p')
    }
]

@communication_bp.route('/communications', methods=['GET'])
@jwt_required
def get_communications():
    """
    Returns emergency radio communications between ambulance and hospital.
    """
    user = g.current_user
    recipient_filter = request.args.get('recipient_id')

    # Filter messages involving current user or open broadcast
    filtered = []
    for msg in COMM_MESSAGES:
        if user.role in [Role.ADMIN, Role.SUPERADMIN]:
            filtered.append(msg)
        elif msg['sender_id'] == user.user_id or msg['recipient_id'] == user.user_id:
            filtered.append(msg)
        elif not recipient_filter:
            filtered.append(msg)

    return jsonify({
        'success': True,
        'count': len(filtered),
        'messages': filtered,
        'communications': filtered
    }), 200

@communication_bp.route('/communications', methods=['POST'])
@jwt_required
def send_communication():
    """
    Transmits an emergency radio communication message.
    """
    user = g.current_user
    data = request.get_json(silent=True) or {}
    text = (data.get('text') or data.get('message') or '').strip()
    recipient_id = data.get('recipient_id', 'HOSP-METRO' if user.role == Role.AMBULANCE else 'AMB-101')
    quick_tag = data.get('quick_tag')

    if not text and not quick_tag:
        return jsonify({'success': False, 'message': 'Message text or quick tag is required.'}), 400

    msg_body = text or f"Emergency Dispatch: {quick_tag.replace('_', ' ').title()}"

    new_msg = {
        'id': f"MSG-{uuid.uuid4().hex[:6].upper()}",
        'sender_id': user.user_id,
        'sender_role': user.role,
        'recipient_id': recipient_id,
        'text': msg_body,
        'message': msg_body,
        'quick_tag': quick_tag,
        'timestamp': datetime.utcnow().strftime('%I:%M %p')
    }

    COMM_MESSAGES.append(new_msg)

    log_audit(
        user.user_id,
        user.role,
        'COMMUNICATION_DISPATCH',
        'MESSAGE',
        new_msg['id'],
        f"Radio transmission to {recipient_id}: {msg_body[:50]}"
    )

    return jsonify({
        'success': True,
        'message': 'Emergency communication transmitted successfully.',
        'communication': new_msg
    }), 201
