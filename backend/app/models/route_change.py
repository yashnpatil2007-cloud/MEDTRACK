from datetime import datetime
from app.extensions import db

class RouteChange(db.Model):
    __tablename__ = 'route_changes'

    id = db.Column(db.Integer, primary_key=True)
    journey_id = db.Column(db.String(50), db.ForeignKey('journeys.journey_id', ondelete='CASCADE'), nullable=False, index=True)
    ambulance_id = db.Column(db.String(80), nullable=False)
    
    old_route = db.Column(db.String(150), nullable=False)
    new_route = db.Column(db.String(150), nullable=False)
    reason = db.Column(db.String(255), nullable=True) # e.g. "Traffic congestion reported", "Obstruction on primary corridor"
    changed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    journey = db.relationship('Journey', back_populates='route_changes')

    def to_dict(self):
        return {
            'id': self.id,
            'journey_id': self.journey_id,
            'ambulance_id': self.ambulance_id,
            'old_route': self.old_route,
            'new_route': self.new_route,
            'reason': self.reason,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None
        }
