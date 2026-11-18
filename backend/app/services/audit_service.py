from flask import request
from app.extensions import db
from app.models.audit import AuditLog

def log_audit(actor_id: str, actor_role: str, action: str, target_type: str = None, target_id: str = None, details: str = None):
    try:
        ip = request.remote_addr if request else '127.0.0.1'
    except Exception:
        ip = '127.0.0.1'
        
    audit_entry = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip
    )
    db.session.add(audit_entry)
    db.session.commit()
