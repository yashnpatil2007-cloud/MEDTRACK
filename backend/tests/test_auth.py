from app.models.user import Role

def test_ambulance_registration_exact_five_fields(client):
    # 1. Full Name, 2. Age, 3. Phone Number, 4. Ambulance ID, 5. Password
    res = client.post('/api/register/ambulance', json={
        'full_name': 'Officer Jack Reacher',
        'age': 35,
        'phone_number': '+1-555-432-1098',
        'ambulance_id': 'AMB-TEST-09',
        'password': 'SecurePassword123'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['user']['role'] == Role.AMBULANCE
    assert data['user']['user_id'] == 'AMB-TEST-09'

def test_ambulance_registration_missing_field(client):
    res = client.post('/api/register/ambulance', json={
        'full_name': 'Officer Jack Reacher',
        'age': 35,
        'phone_number': '+1-555-432-1098',
        'ambulance_id': 'AMB-FAIL'
        # missing password
    })
    assert res.status_code == 400
    data = res.get_json()
    assert data['success'] is False

def test_hospital_registration_exact_three_fields(client):
    # 1. Hospital Name, 2. Hospital ID, 3. Password
    res = client.post('/api/register/hospital', json={
        'hospital_name': 'St. Mary Trauma Center',
        'hospital_id': 'HOSP-ST-MARY',
        'password': 'SecureHospitalPass123'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['user']['role'] == Role.HOSPITAL
    # Hospital must be PENDING admin approval
    assert data['user']['is_verified'] is False
    assert data['verification_notice'] == 'PENDING_ADMIN_APPROVAL'

def test_duplicate_registration_prevention(client):
    payload = {
        'full_name': 'Officer John Doe',
        'age': 30,
        'phone_number': '+1-555-111-2222',
        'ambulance_id': 'AMB-DUP-01',
        'password': 'Password123'
    }
    res1 = client.post('/api/register/ambulance', json=payload)
    assert res1.status_code == 201
    
    # Second attempt with same ambulance_id
    res2 = client.post('/api/register/ambulance', json=payload)
    assert res2.status_code == 409
    assert res2.get_json()['success'] is False

def test_login_success_and_invalid_credentials(client, seed_test_data):
    # Valid login
    res = client.post('/api/login', json={
        'id': 'AMB-001',
        'password': 'AmbulancePass123'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert 'token' in data
    assert data['user']['user_id'] == 'AMB-001'

    # Invalid password
    res_bad = client.post('/api/login', json={
        'id': 'AMB-001',
        'password': 'WrongPassword'
    })
    assert res_bad.status_code == 401
    assert res_bad.get_json()['success'] is False

def test_immutable_user_id(client, seed_test_data, auth_headers):
    headers = auth_headers('AMB-001', Role.AMBULANCE)
    res = client.put('/api/me/profile', json={
        'user_id': 'AMB-CHANGED-ILLEGALLY',
        'full_name': 'New Officer Name'
    }, headers=headers)
    assert res.status_code == 400
    assert 'immutable' in res.get_json()['message'].lower()
