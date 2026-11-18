from app.models.user import Role
from app.models.emergency_request import RequestStatus

def test_emergency_request_submission_and_hospital_assignment(client, seed_test_data, auth_headers):
    ambulance_headers = auth_headers('AMB-001', Role.AMBULANCE)
    
    # Ambulance submits emergency request to HOSP-001
    res = client.post('/api/requests', json={
        'patient_name': 'Clara Oswald',
        'patient_age': 26,
        'emergency_level': 'CRITICAL',
        'current_lat': 12.9750,
        'current_lng': 77.5890,
        'location_address': 'Downtown Metro Plaza',
        'is_manual_location': False,
        'hospital_id': 'HOSP-001',
        'selected_route': 'Fastest Primary Corridor'
    }, headers=ambulance_headers)
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    req = data['request']
    assert req['status'] == RequestStatus.PENDING
    assert req['hospital_id'] == 'HOSP-001'
    assert req['ambulance_id'] == 'AMB-001'
    request_id = req['request_id']

    # Hospital fetches incoming queue and sees the request
    hospital_headers = auth_headers('HOSP-001', Role.HOSPITAL)
    h_res = client.get('/api/hospital/requests', headers=hospital_headers)
    assert h_res.status_code == 200
    h_data = h_res.get_json()
    found = any(r['request_id'] == request_id for r in h_data['requests'])
    assert found is True

    # Hospital accepts the request
    dec_res = client.post(f'/api/requests/{request_id}/decision', json={
        'decision': 'ACCEPTED'
    }, headers=hospital_headers)
    assert dec_res.status_code == 200
    assert dec_res.get_json()['request']['status'] == RequestStatus.ACCEPTED

    # Duplicate decision on already accepted request must be blocked
    dup_res = client.post(f'/api/requests/{request_id}/decision', json={
        'decision': 'REJECTED',
        'reason': 'Changed mind'
    }, headers=hospital_headers)
    assert dup_res.status_code == 400

def test_request_to_unverified_hospital_rejected(client, seed_test_data, auth_headers):
    ambulance_headers = auth_headers('AMB-001', Role.AMBULANCE)
    
    # Trying to send request to HOSP-PENDING (unapproved by admin)
    res = client.post('/api/requests', json={
        'patient_name': 'Test Patient',
        'patient_age': 50,
        'emergency_level': 'HIGH',
        'current_lat': 12.9750,
        'current_lng': 77.5890,
        'hospital_id': 'HOSP-PENDING'
    }, headers=ambulance_headers)
    assert res.status_code == 400
    assert 'not verified' in res.get_json()['message'].lower()

def test_cross_hospital_decision_tampering_blocked(client, seed_test_data, auth_headers):
    # Register a second hospital HOSP-002 and approve it
    client.post('/api/register/hospital', json={
        'hospital_name': 'Second Approved Center',
        'hospital_id': 'HOSP-002',
        'password': 'Password123'
    })
    admin_headers = auth_headers('admin_test', Role.ADMIN)
    client.post('/api/admin/hospitals/HOSP-002/approve', headers=admin_headers)

    # Ambulance submits to HOSP-001
    amb_headers = auth_headers('AMB-001', Role.AMBULANCE)
    req_res = client.post('/api/requests', json={
        'patient_name': 'Target Patient',
        'patient_age': 40,
        'emergency_level': 'HIGH',
        'current_lat': 12.9700,
        'current_lng': 77.5900,
        'hospital_id': 'HOSP-001'
    }, headers=amb_headers)
    req_id = req_res.get_json()['request']['request_id']

    # HOSP-002 attempts to accept a request sent to HOSP-001
    hosp2_headers = auth_headers('HOSP-002', Role.HOSPITAL)
    tamper_res = client.post(f'/api/requests/{req_id}/decision', json={
        'decision': 'ACCEPTED'
    }, headers=hosp2_headers)
    assert tamper_res.status_code == 403
