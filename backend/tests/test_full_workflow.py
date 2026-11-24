import json
from app.models.user import Role
from app.models.emergency_request import RequestStatus
from app.models.ambulance import AmbulanceStatus
from app.models.journey import JourneyStatus

def test_full_emergency_lifecycle_and_features(client, app, seed_test_data):
    """
    Comprehensive end-to-end test covering:
    1. Ambulance & Hospital authentication
    2. Bed availability management
    3. Emergency request creation and duplicate booking prevention
    4. Hospital acceptance
    5. Patient pickup confirmation
    6. Route calculation and alternative corridor selection
    7. Journey start, live GPS telemetry update
    8. Intercom radio dispatch communication
    9. Journey completion and restoration to AVAILABLE
    10. Journey history retrieval
    """
    # 1. Login Ambulance
    amb_login = client.post('/api/login', json={'id': 'AMB-001', 'password': 'AmbulancePass123'})
    assert amb_login.status_code == 200
    amb_token = amb_login.get_json()['token']
    amb_headers = {'Authorization': f'Bearer {amb_token}'}

    # Login Hospital
    hosp_login = client.post('/api/login', json={'id': 'HOSP-001', 'password': 'HospitalPass123'})
    assert hosp_login.status_code == 200
    hosp_token = hosp_login.get_json()['token']
    hosp_headers = {'Authorization': f'Bearer {hosp_token}'}

    # 2. Update Bed Availability
    bed_res = client.put('/api/hospital/beds', headers=hosp_headers, json={'total_beds': 40, 'occupied_beds': 25})
    assert bed_res.status_code == 200
    assert bed_res.get_json()['hospital']['available_beds'] == 15

    # 3. Create Emergency Request
    req_res = client.post('/api/requests', headers=amb_headers, json={
        'patient_name': 'Kavita Joshi',
        'patient_age': 32,
        'emergency_level': 'CRITICAL',
        'current_lat': 12.9700,
        'current_lng': 77.5900,
        'location_address': 'MG Road, Bangalore',
        'is_manual_location': False,
        'hospital_id': 'HOSP-001',
        'selected_route': 'Route A — Fastest Highway Transit'
    })
    assert req_res.status_code == 201
    request_id = req_res.get_json()['request']['request_id']

    # 4. Verify duplicate booking is blocked
    dup_res = client.post('/api/requests', headers=amb_headers, json={
        'patient_name': 'Another Patient',
        'patient_age': 50,
        'emergency_level': 'HIGH',
        'current_lat': 12.9750,
        'current_lng': 77.5950,
        'hospital_id': 'HOSP-001'
    })
    assert dup_res.status_code == 400
    assert 'cannot accept or submit new requests' in dup_res.get_json()['message']

    # 5. Hospital accepts the emergency request
    dec_res = client.post(f'/api/requests/{request_id}/decision', headers=hosp_headers, json={'decision': 'ACCEPTED'})
    assert dec_res.status_code == 200

    # 6. Confirm Patient Pickup
    pickup_res = client.post(f'/api/requests/{request_id}/pickup', headers=amb_headers)
    assert pickup_res.status_code == 200
    assert pickup_res.get_json()['request']['status'] == RequestStatus.PATIENT_PICKED_UP

    # 7. Calculate multiple routes
    routes_res = client.get('/api/routes/calculate?start_lat=12.9700&start_lng=77.5900&dest_lat=12.9716&dest_lng=77.5946')
    assert routes_res.status_code == 200
    routes_data = routes_res.get_json()
    assert routes_data['count'] == 3
    assert any(r['is_recommended'] for r in routes_data['routes'])

    # 8. Start Journey
    start_res = client.post(f'/api/journeys/{request_id}/start', headers=amb_headers, json={
        'selected_route': 'Route A — Fastest Highway Transit'
    })
    assert start_res.status_code == 201
    journey_id = start_res.get_json()['journey']['journey_id']

    # 9. Send GPS Telemetry
    loc_res = client.post(f'/api/journeys/{journey_id}/location', headers=amb_headers, json={
        'latitude': 12.9710,
        'longitude': 77.5920,
        'speed': 55.4,
        'heading': 90.0,
        'accuracy': 5.0
    })
    assert loc_res.status_code == 200

    # 10. Radio Communication Intercom
    send_comm = client.post('/api/communications', headers=amb_headers, json={
        'recipient_id': 'HOSP-001',
        'text': 'Patient vitals stable. ETA 8 minutes via Route A.',
        'quick_tag': 'TRAUMA_BAY_READY'
    })
    assert send_comm.status_code == 201

    get_comm = client.get('/api/communications', headers=hosp_headers)
    assert get_comm.status_code == 200
    assert len(get_comm.get_json()['messages']) >= 1

    # 11. End Journey upon Arrival
    end_res = client.post(f'/api/journeys/{journey_id}/end', headers=amb_headers)
    assert end_res.status_code == 200
    assert end_res.get_json()['journey']['status'] == JourneyStatus.COMPLETED

    # 12. Retrieve Journey History
    hist_res = client.get('/api/journeys/history', headers=amb_headers)
    assert hist_res.status_code == 200
    assert hist_res.get_json()['count'] >= 1

    # 13. Reset ambulance status to AVAILABLE
    reset_res = client.post('/api/ambulances/status', headers=amb_headers, json={'status': 'AVAILABLE'})
    assert reset_res.status_code == 200
    assert reset_res.get_json()['ambulance']['status'] == AmbulanceStatus.AVAILABLE
