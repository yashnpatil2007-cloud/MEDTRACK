import json
from flask import request
from flask_socketio import join_room, leave_room, emit
from app.extensions import socketio, db
from app.utils.auth_helpers import decode_token
from app.models.notification import Notification

@socketio.on('connect')
def handle_connect():
    # Allow connection, client will authenticate and join room via 'authenticate' event
    emit('connected', {'message': 'Connected to MEDTRACK Real-time Coordination Engine'})

@socketio.on('authenticate')
def handle_authenticate(data):
    token = data.get('token')
    if not token:
        emit('error', {'message': 'Authentication token missing.'})
        return
    try:
        payload = decode_token(token)
        user_id = payload.get('sub')
        role = payload.get('role')
        
        # Automatically join user-specific and role-specific rooms
        join_room(f"user_{user_id}")
        if role == 'AMBULANCE':
            join_room(f"ambulance_{user_id}")
        elif role == 'HOSPITAL':
            join_room(f"hospital_{user_id}")
        elif role in ['ADMIN', 'SUPERADMIN']:
            join_room("admin_room")
            
        emit('authenticated', {
            'user_id': user_id,
            'role': role,
            'status': 'Joined coordinated broadcast channels'
        })
    except Exception as e:
        emit('error', {'message': f'Authentication failed: {str(e)}'})

@socketio.on('subscribe_journey')
def handle_subscribe_journey(data):
    journey_id = data.get('journey_id')
    if journey_id:
        join_room(f"journey_{journey_id}")
        emit('subscribed', {'journey_id': journey_id})

def notify_hospital_new_request(hospital_id: str, request_data: dict):
    # Save persistent notification
    notif = Notification(
        user_id=hospital_id,
        role='HOSPITAL',
        title='Incoming Emergency Request',
        message=f"Ambulance {request_data.get('ambulance_id')} initiated {request_data.get('emergency_level')} request for {request_data.get('patient_name')}.",
        category='REQUEST',
        metadata_json=json.dumps(request_data)
    )
    db.session.add(notif)
    db.session.commit()

    socketio.emit('new_emergency_request', request_data, room=f"hospital_{hospital_id}")
    socketio.emit('new_emergency_request', request_data, room="admin_room")

def notify_ambulance_request_decision(ambulance_id: str, decision_data: dict):
    status = decision_data.get('status')
    hospital_name = decision_data.get('hospital_name', 'Hospital')
    title = f"Request {status.capitalize()}"
    msg = f"{hospital_name} has {status.lower()} your emergency transfer request."
    if decision_data.get('rejection_reason'):
        msg += f" Reason: {decision_data.get('rejection_reason')}"
        
    notif = Notification(
        user_id=ambulance_id,
        role='AMBULANCE',
        title=title,
        message=msg,
        category='REQUEST',
        metadata_json=json.dumps(decision_data)
    )
    db.session.add(notif)
    db.session.commit()

    socketio.emit('request_decision', decision_data, room=f"ambulance_{ambulance_id}")
    socketio.emit('request_decision', decision_data, room="admin_room")

def notify_journey_status(journey_data: dict):
    hospital_id = journey_data.get('hospital_id')
    ambulance_id = journey_data.get('ambulance_id')
    status = journey_data.get('status')
    
    # Broadcast to both parties
    socketio.emit('journey_status_changed', journey_data, room=f"hospital_{hospital_id}")
    socketio.emit('journey_status_changed', journey_data, room=f"ambulance_{ambulance_id}")
    socketio.emit('journey_status_changed', journey_data, room=f"journey_{journey_data.get('journey_id')}")
    socketio.emit('journey_status_changed', journey_data, room="admin_room")

def broadcast_location_update(location_data: dict):
    journey_id = location_data.get('journey_id')
    hospital_id = location_data.get('hospital_id')
    ambulance_id = location_data.get('ambulance_id')
    
    # Emits live telemetry to the hospital and journey room
    socketio.emit('ambulance_location_update', location_data, room=f"journey_{journey_id}")
    if hospital_id:
        socketio.emit('ambulance_location_update', location_data, room=f"hospital_{hospital_id}")
    if ambulance_id:
        socketio.emit('ambulance_location_update', location_data, room=f"ambulance_{ambulance_id}")

def broadcast_bed_update(hospital_data: dict):
    # Broadcast to all connected ambulance users and admin room
    socketio.emit('bed_availability_updated', hospital_data)
