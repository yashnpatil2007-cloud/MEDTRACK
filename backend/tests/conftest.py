import pytest
from app import create_app
from app.extensions import db
from app.models.user import User, Role
from app.models.ambulance import AmbulanceProfile
from app.models.hospital import Hospital, HospitalVerificationStatus
from app.utils.auth_helpers import generate_token

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def seed_test_data(app):
    # Seed one superadmin, one admin, one verified hospital, one pending hospital, one ambulance
    with app.app_context():
        # Superadmin
        sa = User(user_id='superadmin_test', role=Role.SUPERADMIN, is_active=True, is_verified=True)
        sa.set_password('TestPass123')
        db.session.add(sa)

        # Admin
        ad = User(user_id='admin_test', role=Role.ADMIN, is_active=True, is_verified=True)
        ad.set_password('TestPass123')
        db.session.add(ad)

        # Verified Hospital
        h_user = User(user_id='HOSP-001', role=Role.HOSPITAL, is_active=True, is_verified=True)
        h_user.set_password('HospitalPass123')
        db.session.add(h_user)
        db.session.flush()

        h_profile = Hospital(
            user_id=h_user.id,
            hospital_id='HOSP-001',
            hospital_name='Apex Emergency Hospital',
            latitude=12.9716,
            longitude=77.5946,
            total_beds=50,
            occupied_beds=25,
            available_beds=25,
            verification_status=HospitalVerificationStatus.APPROVED
        )
        db.session.add(h_profile)

        # Pending Hospital
        h2_user = User(user_id='HOSP-PENDING', role=Role.HOSPITAL, is_active=True, is_verified=False)
        h2_user.set_password('HospitalPass123')
        db.session.add(h2_user)
        db.session.flush()

        h2_profile = Hospital(
            user_id=h2_user.id,
            hospital_id='HOSP-PENDING',
            hospital_name='Unverified Care Center',
            latitude=12.9800,
            longitude=77.6000,
            total_beds=20,
            occupied_beds=10,
            available_beds=10,
            verification_status=HospitalVerificationStatus.PENDING
        )
        db.session.add(h2_profile)

        # Ambulance
        a_user = User(user_id='AMB-001', role=Role.AMBULANCE, is_active=True, is_verified=True)
        a_user.set_password('AmbulancePass123')
        db.session.add(a_user)
        db.session.flush()

        a_profile = AmbulanceProfile(
            user_id=a_user.id,
            ambulance_id='AMB-001',
            full_name='Officer John Miller',
            age=32,
            phone_number='+1-555-010-9988',
            current_lat=12.9700,
            current_lng=77.5900,
            status='AVAILABLE'
        )
        db.session.add(a_profile)

        db.session.commit()

@pytest.fixture
def auth_headers(app):
    def _headers(user_id, role):
        token = generate_token(user_id, role)
        return {'Authorization': f'Bearer {token}'}
    return _headers
