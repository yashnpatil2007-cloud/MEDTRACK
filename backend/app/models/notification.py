import json
from datetime import datetime
from app.extensions import db

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), nullable=False, index=True) # Target user ID or 'ALL_ADMINS'
    role = db.Column(db.String(20), nullable=True) # AMBULANCE, HOSPITAL, ADMIN
    
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='GENERAL', nullable=False) # REQUEST, JOURNEY, BED, SYSTEM
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    metadata_json = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    def to_dict(self):
        meta = {}
        if self.metadata_json:
            try:
                meta = json.loads(self.metadata_json)
            except Exception:
                meta = {}
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'title': self.title,
            'message': self.message,
            'category': self.category,
            'is_read': self.is_read,
            'metadata': meta,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
