from datetime import datetime
from app.extensions import db

class LocationUpdate(db.Model):
    __tablename__ = 'location_updates'

    id = db.Column(db.Integer, primary_key=True)
    journey_id = db.Column(db.String(50), db.ForeignKey('journeys.journey_id', ondelete='CASCADE'), nullable=False, index=True)
    ambulance_id = db.Column(db.String(80), db.ForeignKey('ambulance_profiles.ambulance_id'), nullable=False, index=True)
    
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float, nullable=True) # in meters
    speed = db.Column(db.Float, nullable=True) # in km/h or m/s
    heading = db.Column(db.Float, nullable=True) # heading in degrees
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship
    journey = db.relationship('Journey', back_populates='location_updates')

    @staticmethod
    def validate_coordinates(lat: float, lng: float):
        if lat is None or lng is None:
            raise ValueError("Coordinates cannot be empty")
        if not (-90.0 <= float(lat) <= 90.0):
            raise ValueError(f"Latitude must be between -90 and 90. Provided: {lat}")
        if not (-180.0 <= float(lng) <= 180.0):
            raise ValueError(f"Longitude must be between -180 and 180. Provided: {lng}")

    def to_dict(self):
        return {
            'id': self.id,
            'journey_id': self.journey_id,
            'ambulance_id': self.ambulance_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'accuracy': self.accuracy,
            'speed': self.speed,
            'heading': self.heading,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
