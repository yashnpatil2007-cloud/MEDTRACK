from app.models.user import Role

def test_unauthorized_admin_access_by_ambulance(client, seed_test_data, auth_headers):
    amb_headers = auth_headers('AMB-001', Role.AMBULANCE)
    
    # Ambulance trying to access admin stats
    res = client.get('/api/admin/stats', headers=amb_headers)
    assert res.status_code == 403

def test_superadmin_route_protection(client, seed_test_data, auth_headers):
    admin_headers = auth_headers('admin_test', Role.ADMIN)
    superadmin_headers = auth_headers('superadmin_test', Role.SUPERADMIN)

    # Regular admin trying to create another admin -> should fail
    admin_create = client.post('/api/superadmin/admins', json={
        'admin_id': 'admin_rogue',
        'password': 'Password123'
    }, headers=admin_headers)
    assert admin_create.status_code == 403

    # Superadmin creating admin -> succeeds
    super_create = client.post('/api/superadmin/admins', json={
        'admin_id': 'admin_legit',
        'password': 'Password123'
    }, headers=superadmin_headers)
    assert super_create.status_code == 201

def test_hospital_approval_workflow(client, seed_test_data, auth_headers):
    admin_headers = auth_headers('admin_test', Role.ADMIN)
    pending_hosp_headers = auth_headers('HOSP-PENDING', Role.HOSPITAL)

    # 1. Before approval: Pending hospital cannot access live coordination endpoints
    pre_res = client.get('/api/hospital/requests', headers=pending_hosp_headers)
    assert pre_res.status_code == 403
    assert 'awaiting administrator verification' in pre_res.get_json()['message'].lower()

    # 2. Admin approves hospital
    appr_res = client.post('/api/admin/hospitals/HOSP-PENDING/approve', headers=admin_headers)
    assert appr_res.status_code == 200
    assert appr_res.get_json()['hospital']['verification_status'] == 'APPROVED'

    # 3. After approval: Hospital can now access incoming requests queue
    post_res = client.get('/api/hospital/requests', headers=pending_hosp_headers)
    assert post_res.status_code == 200
