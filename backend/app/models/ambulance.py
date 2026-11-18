from datetime import datetime
from app.extensions import db

class AmbulanceProfile(db.Model):
    __tablename__ = 'ambulance_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    ambulance_id = db.Column(db.String(80), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(120), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    phone_number = db.Column(db.String(30), nullable=False)
    
    current_lat = db.Column(db.Float, nullable=True)
    current_lng = db.Column(db.Float, nullable=True)
    last_location_update = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(30), default='AVAILABLE', nullable=False) # AVAILABLE, EN_ROUTE, BUSY, OFFLINE

    # Back ref
    user = db.relationship('User', back_populates='ambulance_profile')
    requests = db.relationship('EmergencyRequest', back_populates='ambulance', lazy='dynamic')
    journeys = db.relationship('Journey', back_populates='ambulance', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'ambulance_id': self.ambulance_id,
            'full_name': self.full_name,
            'age': self.age,
            'phone_number': self.phone_number,
            'current_lat': self.current_lat,
            'current_lng': self.current_lng,
            'last_location_update': self.last_location_update.isoformat() if self.last_location_update else None,
            'status': self.status
        }
