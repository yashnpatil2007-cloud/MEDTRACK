from datetime import datetime
from app.extensions import db

class RequestStatus:
    PENDING = 'PENDING'
    ACCEPTED = 'ACCEPTED'
    BOOKED = 'BOOKED'
    PATIENT_PICKED_UP = 'PATIENT PICKED UP'
    JOURNEY_ACTIVE = 'JOURNEY_ACTIVE'
    ON_JOURNEY = 'ON JOURNEY'
    COMPLETED = 'COMPLETED'
    CANCELLED = 'CANCELLED'
    REJECTED = 'REJECTED'

    VALID_TRANSITIONS = {
        PENDING: [ACCEPTED, BOOKED, REJECTED, CANCELLED],
        ACCEPTED: [BOOKED, PATIENT_PICKED_UP, JOURNEY_ACTIVE, ON_JOURNEY, CANCELLED],
        BOOKED: [PATIENT_PICKED_UP, CANCELLED],
        PATIENT_PICKED_UP: [ON_JOURNEY, JOURNEY_ACTIVE, CANCELLED],
        JOURNEY_ACTIVE: [COMPLETED, CANCELLED],
        ON_JOURNEY: [COMPLETED, CANCELLED],
        REJECTED: [],
        COMPLETED: [],
        CANCELLED: []
    }

class EmergencyLevel:
    CRITICAL = 'CRITICAL'
    HIGH = 'HIGH'
    MEDIUM = 'MEDIUM'
    LOW = 'LOW'
    ALL = [CRITICAL, HIGH, MEDIUM, LOW]

class EmergencyRequest(db.Model):
    __tablename__ = 'emergency_requests'

    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    ambulance_id = db.Column(db.String(80), db.ForeignKey('ambulance_profiles.ambulance_id'), nullable=False, index=True)
    hospital_id = db.Column(db.String(80), db.ForeignKey('hospitals.hospital_id'), nullable=False, index=True)
    
    # Patient info
    patient_name = db.Column(db.String(120), nullable=False)
    patient_age = db.Column(db.Integer, nullable=False)
    emergency_level = db.Column(db.String(20), nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    
    # Location acquisition
    current_lat = db.Column(db.Float, nullable=False)
    current_lng = db.Column(db.Float, nullable=False)
    location_address = db.Column(db.String(255), nullable=True)
    is_manual_location = db.Column(db.Boolean, default=False, nullable=False)
    
    # Route info
    destination_hospital_name = db.Column(db.String(150), nullable=False)
    selected_route = db.Column(db.String(100), default='Fastest Primary Route')
    
    # Lifecycle status
    status = db.Column(db.String(30), default=RequestStatus.PENDING, nullable=False, index=True)
    rejection_reason = db.Column(db.String(255), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    accepted_at = db.Column(db.DateTime, nullable=True)
    patient_picked_up_at = db.Column(db.DateTime, nullable=True)
    rejected_at = db.Column(db.DateTime, nullable=True)
    journey_started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    ambulance = db.relationship('AmbulanceProfile', back_populates='requests')
    hospital = db.relationship('Hospital', back_populates='requests')
    journey = db.relationship('Journey', back_populates='request', uselist=False, cascade="all, delete-orphan")

    def can_transition_to(self, new_status: str) -> bool:
        allowed = RequestStatus.VALID_TRANSITIONS.get(self.status, [])
        return new_status in allowed

    def transition_to(self, new_status: str, reason: str = None):
        if not self.can_transition_to(new_status):
            raise ValueError(f"Invalid state transition from {self.status} to {new_status}")
        
        self.status = new_status
        now = datetime.utcnow()
        if new_status in [RequestStatus.ACCEPTED, RequestStatus.BOOKED]:
            self.accepted_at = now
        elif new_status == RequestStatus.PATIENT_PICKED_UP:
            self.patient_picked_up_at = now
        elif new_status == RequestStatus.REJECTED:
            self.rejected_at = now
            self.rejection_reason = reason
        elif new_status in [RequestStatus.JOURNEY_ACTIVE, RequestStatus.ON_JOURNEY]:
            self.journey_started_at = now
        elif new_status == RequestStatus.COMPLETED:
            self.completed_at = now
        elif new_status == RequestStatus.CANCELLED:
            self.cancelled_at = now
            self.rejection_reason = reason

    def to_dict(self, include_sensitive: bool = True):
        data = {
            'id': self.id,
            'request_id': self.request_id,
            'ambulance_id': self.ambulance_id,
            'hospital_id': self.hospital_id,
            'emergency_level': self.emergency_level,
            'current_lat': self.current_lat,
            'current_lng': self.current_lng,
            'location_address': self.location_address,
            'is_manual_location': self.is_manual_location,
            'destination_hospital_name': self.destination_hospital_name,
            'selected_route': self.selected_route,
            'status': self.status,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'patient_picked_up_at': self.patient_picked_up_at.isoformat() if self.patient_picked_up_at else None,
            'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
            'journey_started_at': self.journey_started_at.isoformat() if self.journey_started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'has_active_journey': bool(self.journey and self.journey.status in ['ACTIVE', 'ON JOURNEY'])
        }
        if include_sensitive:
            data['patient_name'] = self.patient_name
            data['patient_age'] = self.patient_age
        else:
            # Privacy safe representation for broad admin overview
            data['patient_identifier'] = f"PAT-{self.id:04d}"
            data['patient_age_group'] = f"{(self.patient_age // 10) * 10}s"
            
        return data
