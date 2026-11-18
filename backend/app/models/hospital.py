from datetime import datetime
from app.extensions import db

class HospitalVerificationStatus:
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class Hospital(db.Model):
    __tablename__ = 'hospitals'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    hospital_id = db.Column(db.String(80), unique=True, nullable=False, index=True)
    hospital_name = db.Column(db.String(150), nullable=False)
    
    # Location
    address = db.Column(db.String(255), default='Central Medical District')
    latitude = db.Column(db.Float, nullable=False, default=12.9716)
    longitude = db.Column(db.Float, nullable=False, default=77.5946)
    
    # Bed Availability
    total_beds = db.Column(db.Integer, default=50, nullable=False)
    occupied_beds = db.Column(db.Integer, default=30, nullable=False)
    available_beds = db.Column(db.Integer, default=20, nullable=False)
    beds_last_updated = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Admin verification
    verification_status = db.Column(db.String(20), default=HospitalVerificationStatus.PENDING, nullable=False)
    rejection_reason = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', back_populates='hospital_profile')
    requests = db.relationship('EmergencyRequest', back_populates='hospital', lazy='dynamic')
    journeys = db.relationship('Journey', back_populates='hospital', lazy='dynamic')

    def update_beds(self, total: int, occupied: int):
        if total < 0:
            raise ValueError("Total beds cannot be negative")
        if occupied < 0:
            raise ValueError("Occupied beds cannot be negative")
        if occupied > total:
            raise ValueError("Occupied beds cannot exceed total beds")
        
        self.total_beds = total
        self.occupied_beds = occupied
        self.available_beds = total - occupied
        self.beds_last_updated = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'hospital_id': self.hospital_id,
            'hospital_name': self.hospital_name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'total_beds': self.total_beds,
            'occupied_beds': self.occupied_beds,
            'available_beds': self.available_beds,
            'beds_last_updated': self.beds_last_updated.isoformat() if self.beds_last_updated else None,
            'verification_status': self.verification_status,
            'rejection_reason': self.rejection_reason,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
