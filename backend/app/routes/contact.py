import re
from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models.contact import ContactMessage
from app.models.user import Role
from app.utils.auth_helpers import roles_required

contact_bp = Blueprint('contact', __name__, url_prefix='/api')

@contact_bp.route('/contact', methods=['POST'])
def submit_contact_form():
    """
    Submits public contact/inquiry form from landing page.
    """
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    subject = data.get('subject')
    message = data.get('message')

    if not all([name, email, subject, message]):
        return jsonify({'success': False, 'message': 'Name, email, subject, and message are required.'}), 400

    email = str(email).strip().lower()
    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({'success': False, 'message': 'Invalid email address format.'}), 400

    msg_obj = ContactMessage(
        name=name.strip(),
        email=email,
        phone=phone.strip() if phone else None,
        subject=subject.strip(),
        message=message.strip()
    )
    db.session.add(msg_obj)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Thank you for reaching out to MEDTRACK. Our clinical coordination advisory team has received your message.'
    }), 201

@contact_bp.route('/admin/contact-messages', methods=['GET'])
@roles_required(Role.ADMIN)
def get_contact_messages():
    messages = ContactMessage.query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify({
        'success': True,
        'count': len(messages),
        'messages': [m.to_dict() for m in messages]
    }), 200
