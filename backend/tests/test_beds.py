from app.models.user import Role

def test_bed_availability_calculation_and_update(client, seed_test_data, auth_headers):
    headers = auth_headers('HOSP-001', Role.HOSPITAL)
    
    # Valid update: Total 60, Occupied 35 -> Available 25
    res = client.put('/api/hospital/beds', json={
        'total_beds': 60,
        'occupied_beds': 35
    }, headers=headers)
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['hospital']['total_beds'] == 60
    assert data['hospital']['occupied_beds'] == 35
    assert data['hospital']['available_beds'] == 25

def test_negative_bed_rejection(client, seed_test_data, auth_headers):
    headers = auth_headers('HOSP-001', Role.HOSPITAL)
    
    res = client.put('/api/hospital/beds', json={
        'total_beds': -10,
        'occupied_beds': 5
    }, headers=headers)
    assert res.status_code == 400
    assert 'negative' in res.get_json()['message'].lower()

def test_occupied_exceeding_total_beds_rejection(client, seed_test_data, auth_headers):
    headers = auth_headers('HOSP-001', Role.HOSPITAL)
    
    res = client.put('/api/hospital/beds', json={
        'total_beds': 40,
        'occupied_beds': 45
    }, headers=headers)
    assert res.status_code == 400
    assert 'exceed' in res.get_json()['message'].lower()

def test_unauthorized_bed_update_by_ambulance_blocked(client, seed_test_data, auth_headers):
    ambulance_headers = auth_headers('AMB-001', Role.AMBULANCE)
    
    res = client.put('/api/hospital/beds', json={
        'total_beds': 100,
        'occupied_beds': 20
    }, headers=ambulance_headers)
    assert res.status_code == 403
    assert res.get_json()['success'] is False
