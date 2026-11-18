from datetime import datetime
from app.extensions import db

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.String(80), nullable=False, index=True)
    actor_role = db.Column(db.String(20), nullable=False)
    action = db.Column(db.String(80), nullable=False) # e.g. "HOSPITAL_APPROVED", "BEDS_UPDATED", "USER_SUSPENDED"
    target_type = db.Column(db.String(50), nullable=True) # "HOSPITAL", "AMBULANCE", "USER", "REQUEST"
    target_id = db.Column(db.String(80), nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'actor_id': self.actor_id,
            'actor_role': self.actor_role,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
