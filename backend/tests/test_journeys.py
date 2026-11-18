from app.models.user import Role
from app.models.emergency_request import RequestStatus
from app.models.journey import JourneyStatus

def test_journey_lifecycle_and_gps_telemetry(client, seed_test_data, auth_headers):
    amb_headers = auth_headers('AMB-001', Role.AMBULANCE)
    hosp_headers = auth_headers('HOSP-001', Role.HOSPITAL)

    # 1. Create request
    req_res = client.post('/api/requests', json={
        'patient_name': 'Arthur Pendelton',
        'patient_age': 55,
        'emergency_level': 'CRITICAL',
        'current_lat': 12.9720,
        'current_lng': 77.5880,
        'hospital_id': 'HOSP-001'
    }, headers=amb_headers)
    req_id = req_res.get_json()['request']['request_id']

    # 2. Try to start journey before acceptance -> should fail
    fail_start = client.post(f'/api/journeys/{req_id}/start', headers=amb_headers)
    assert fail_start.status_code == 400

    # 3. Hospital accepts
    client.post(f'/api/requests/{req_id}/decision', json={'decision': 'ACCEPTED'}, headers=hosp_headers)

    # 4. Ambulance starts journey
    start_res = client.post(f'/api/journeys/{req_id}/start', headers=amb_headers)
    assert start_res.status_code == 201
    j_data = start_res.get_json()['journey']
    journey_id = j_data['journey_id']
    assert j_data['status'] == JourneyStatus.ACTIVE

    # 5. Send valid location update
    loc_res = client.post(f'/api/journeys/{journey_id}/location', json={
        'latitude': 12.9730,
        'longitude': 77.5910,
        'accuracy': 8.5,
        'speed': 48.0,
        'heading': 90.0
    }, headers=amb_headers)
    assert loc_res.status_code == 200
    assert loc_res.get_json()['success'] is True

    # 6. Send invalid latitude out of range (-90 to 90) -> must reject
    bad_loc_res = client.post(f'/api/journeys/{journey_id}/location', json={
        'latitude': 999.0,
        'longitude': 77.5910
    }, headers=amb_headers)
    assert bad_loc_res.status_code == 400

    # 7. Modify route during transit
    route_res = client.post(f'/api/journeys/{journey_id}/route', json={
        'new_route': 'Secondary Bypass Corridor',
        'reason': 'Traffic congestion reported on main artery'
    }, headers=amb_headers)
    assert route_res.status_code == 200
    assert route_res.get_json()['journey']['route_name'] == 'Secondary Bypass Corridor'

    # 8. End Journey
    end_res = client.post(f'/api/journeys/{journey_id}/end', headers=amb_headers)
    assert end_res.status_code == 200
    assert end_res.get_json()['journey']['status'] == JourneyStatus.COMPLETED

    # 9. Sending location after completion should fail
    loc_after_end = client.post(f'/api/journeys/{journey_id}/location', json={
        'latitude': 12.9716,
        'longitude': 77.5946
    }, headers=amb_headers)
    assert loc_after_end.status_code == 400
