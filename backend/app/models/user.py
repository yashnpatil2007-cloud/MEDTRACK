from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class Role:
    AMBULANCE = 'AMBULANCE'
    HOSPITAL = 'HOSPITAL'
    ADMIN = 'ADMIN'
    SUPERADMIN = 'SUPERADMIN'
    
    ALL = [AMBULANCE, HOSPITAL, ADMIN, SUPERADMIN]

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), unique=True, nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ambulance_profile = db.relationship('AmbulanceProfile', back_populates='user', uselist=False, cascade="all, delete-orphan")
    hospital_profile = db.relationship('Hospital', back_populates='user', uselist=False, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256:600000')

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if self.role == Role.AMBULANCE and self.ambulance_profile:
            data['profile'] = self.ambulance_profile.to_dict()
        elif self.role == Role.HOSPITAL and self.hospital_profile:
            data['profile'] = self.hospital_profile.to_dict()
        return data
