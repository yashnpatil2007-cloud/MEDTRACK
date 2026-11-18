from datetime import datetime
from app.extensions import db

class JourneyStatus:
    ACTIVE = 'ACTIVE'
    COMPLETED = 'COMPLETED'
    ABORTED = 'ABORTED'

class Journey(db.Model):
    __tablename__ = 'journeys'

    id = db.Column(db.Integer, primary_key=True)
    journey_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    request_id = db.Column(db.String(50), db.ForeignKey('emergency_requests.request_id'), nullable=False, unique=True, index=True)
    ambulance_id = db.Column(db.String(80), db.ForeignKey('ambulance_profiles.ambulance_id'), nullable=False, index=True)
    hospital_id = db.Column(db.String(80), db.ForeignKey('hospitals.hospital_id'), nullable=False, index=True)
    
    status = db.Column(db.String(30), default=JourneyStatus.ACTIVE, nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Origin & destination coordinates
    start_lat = db.Column(db.Float, nullable=False)
    start_lng = db.Column(db.Float, nullable=False)
    dest_lat = db.Column(db.Float, nullable=False)
    dest_lng = db.Column(db.Float, nullable=False)
    
    # Navigation route details
    route_name = db.Column(db.String(100), default='Primary Route')
    route_geometry = db.Column(db.Text, nullable=True) # GeoJSON or polyline coordinate list
    estimated_duration_mins = db.Column(db.Float, default=15.0)
    estimated_distance_km = db.Column(db.Float, default=8.5)
    
    # Latest telemetry
    latest_lat = db.Column(db.Float, nullable=True)
    latest_lng = db.Column(db.Float, nullable=True)
    latest_accuracy = db.Column(db.Float, nullable=True)
    latest_telemetry_time = db.Column(db.DateTime, nullable=True)

    # Relationships
    request = db.relationship('EmergencyRequest', back_populates='journey')
    ambulance = db.relationship('AmbulanceProfile', back_populates='journeys')
    hospital = db.relationship('Hospital', back_populates='journeys')
    location_updates = db.relationship('LocationUpdate', back_populates='journey', cascade="all, delete-orphan", lazy='dynamic')
    route_changes = db.relationship('RouteChange', back_populates='journey', cascade="all, delete-orphan", lazy='dynamic')

    def complete(self):
        self.status = JourneyStatus.COMPLETED
        self.completed_at = datetime.utcnow()

    def to_dict(self):
        return {
            'id': self.id,
            'journey_id': self.journey_id,
            'request_id': self.request_id,
            'ambulance_id': self.ambulance_id,
            'hospital_id': self.hospital_id,
            'status': self.status,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'start_lat': self.start_lat,
            'start_lng': self.start_lng,
            'dest_lat': self.dest_lat,
            'dest_lng': self.dest_lng,
            'route_name': self.route_name,
            'route_geometry': self.route_geometry,
            'estimated_duration_mins': self.estimated_duration_mins,
            'estimated_distance_km': self.estimated_distance_km,
            'latest_lat': self.latest_lat,
            'latest_lng': self.latest_lng,
            'latest_accuracy': self.latest_accuracy,
            'latest_telemetry_time': self.latest_telemetry_time.isoformat() if self.latest_telemetry_time else None
        }
