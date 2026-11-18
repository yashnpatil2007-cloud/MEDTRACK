import os
import json
from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User, Role
from app.models.ambulance import AmbulanceProfile
from app.models.hospital import Hospital, HospitalVerificationStatus
from app.models.emergency_request import EmergencyRequest, RequestStatus, EmergencyLevel
from app.models.journey import Journey, JourneyStatus
from app.models.location_update import LocationUpdate
from app.models.route_change import RouteChange
from app.models.notification import Notification
from app.models.audit import AuditLog
from app.models.system_setting import SystemSetting
from app.services.routing_service import generate_fallback_waypoints

def seed_database():
    app = create_app('development')
    with app.app_context():
        print("[*] Recreating database schema for fresh seeding...")
        db.drop_all()
        db.create_all()

        print("[*] Seeding Super Administrator and Administrator...")
        # 1. Super Admin
        superadmin = User(
            user_id='superadmin',
            role=Role.SUPERADMIN,
            is_active=True,
            is_verified=True
        )
        superadmin.set_password('SuperAdmin@MedTrack2026')
        db.session.add(superadmin)

        # 2. General Admin
        admin1 = User(
            user_id='admin1',
            role=Role.ADMIN,
            is_active=True,
            is_verified=True
        )
        admin1.set_password('Admin@MedTrack2026')
        db.session.add(admin1)

        print("[*] Seeding Hospitals...")
        hospitals_data = [
            {
                'id': 'HOSP-METRO',
                'name': 'Metro Trauma & Tertiary Care Hospital',
                'address': '804 Central Avenue, Medical District',
                'lat': 12.9716,
                'lng': 77.5946,
                'total': 60,
                'occupied': 38,
                'status': HospitalVerificationStatus.APPROVED
            },
            {
                'id': 'HOSP-CITYGEN',
                'name': 'City General Hospital & Emergency Unit',
                'address': '124 Healthcare Boulevard',
                'lat': 12.9850,
                'lng': 77.6100,
                'total': 45,
                'occupied': 30,
                'status': HospitalVerificationStatus.APPROVED
            },
            {
                'id': 'HOSP-STJUDE',
                'name': 'St. Jude Acute Care & Cardiac Center',
                'address': '55 South Park Road',
                'lat': 12.9350,
                'lng': 77.6200,
                'total': 50,
                'occupied': 42,
                'status': HospitalVerificationStatus.APPROVED
            },
            {
                'id': 'HOSP-APOLLO',
                'name': 'Apollo Emergency & Surgical Care',
                'address': '210 Eastern Ring Expressway',
                'lat': 12.9600,
                'lng': 77.6400,
                'total': 70,
                'occupied': 45,
                'status': HospitalVerificationStatus.APPROVED
            },
            {
                'id': 'HOSP-NEW',
                'name': 'Green Valley Regional Hospital',
                'address': '909 West Foothill Drive',
                'lat': 12.9200,
                'lng': 77.5600,
                'total': 35,
                'occupied': 20,
                'status': HospitalVerificationStatus.PENDING # Demonstrates admin approval workflow
            }
        ]

        for h in hospitals_data:
            user = User(
                user_id=h['id'],
                role=Role.HOSPITAL,
                is_active=True,
                is_verified=(h['status'] == HospitalVerificationStatus.APPROVED)
            )
            user.set_password('Hospital@123')
            db.session.add(user)
            db.session.flush()

            h_profile = Hospital(
                user_id=user.id,
                hospital_id=h['id'],
                hospital_name=h['name'],
                address=h['address'],
                latitude=h['lat'],
                longitude=h['lng'],
                total_beds=h['total'],
                occupied_beds=h['occupied'],
                available_beds=h['total'] - h['occupied'],
                verification_status=h['status']
            )
            db.session.add(h_profile)

        print("[*] Seeding Ambulances...")
        ambulances_data = [
            {
                'id': 'AMB-101',
                'name': 'Marcus Vance',
                'age': 34,
                'phone': '+1-555-019-2831',
                'lat': 12.9780,
                'lng': 77.5850,
                'status': 'AVAILABLE'
            },
            {
                'id': 'AMB-102',
                'name': 'Elena Rostova',
                'age': 29,
                'phone': '+1-555-019-5820',
                'lat': 12.9450,
                'lng': 77.6050,
                'status': 'DISPATCHED'
            },
            {
                'id': 'AMB-103',
                'name': 'David Kim',
                'age': 38,
                'phone': '+1-555-019-9174',
                'lat': 12.9900,
                'lng': 77.6300,
                'status': 'AVAILABLE'
            }
        ]

        for a in ambulances_data:
            user = User(
                user_id=a['id'],
                role=Role.AMBULANCE,
                is_active=True,
                is_verified=True
            )
            user.set_password('Ambulance@123')
            db.session.add(user)
            db.session.flush()

            a_profile = AmbulanceProfile(
                user_id=user.id,
                ambulance_id=a['id'],
                full_name=a['name'],
                age=a['age'],
                phone_number=a['phone'],
                current_lat=a['lat'],
                current_lng=a['lng'],
                status=a['status'],
                last_location_update=datetime.utcnow()
            )
            db.session.add(a_profile)

        print("[*] Seeding Emergency Requests and Journeys...")
        # 1. PENDING Request for HOSP-METRO from AMB-101
        req1 = EmergencyRequest(
            request_id='REQ-DEMO-001',
            ambulance_id='AMB-101',
            hospital_id='HOSP-METRO',
            patient_name='Sarah Jenkins',
            patient_age=45,
            emergency_level=EmergencyLevel.HIGH,
            current_lat=12.9780,
            current_lng=77.5850,
            location_address='Intersection of 5th Ave & Market St',
            is_manual_location=False,
            destination_hospital_name='Metro Trauma & Tertiary Care Hospital',
            selected_route='Fastest Primary Corridor',
            status=RequestStatus.PENDING,
            created_at=datetime.utcnow() - timedelta(minutes=10)
        )
        db.session.add(req1)

        # 2. ACCEPTED Request for HOSP-CITYGEN from AMB-102
        req2 = EmergencyRequest(
            request_id='REQ-DEMO-002',
            ambulance_id='AMB-102',
            hospital_id='HOSP-CITYGEN',
            patient_name='Robert Taylor',
            patient_age=62,
            emergency_level=EmergencyLevel.CRITICAL,
            current_lat=12.9450,
            current_lng=77.6050,
            location_address='South Commercial Plaza',
            is_manual_location=False,
            destination_hospital_name='City General Hospital & Emergency Unit',
            selected_route='Fastest Primary Corridor',
            status=RequestStatus.ACCEPTED,
            created_at=datetime.utcnow() - timedelta(minutes=25),
            accepted_at=datetime.utcnow() - timedelta(minutes=20)
        )
        db.session.add(req2)

        # 3. COMPLETED Request & Journey from AMB-103 to HOSP-APOLLO
        req3 = EmergencyRequest(
            request_id='REQ-DEMO-003',
            ambulance_id='AMB-103',
            hospital_id='HOSP-APOLLO',
            patient_name='Michael Chen',
            patient_age=28,
            emergency_level=EmergencyLevel.MEDIUM,
            current_lat=12.9900,
            current_lng=77.6300,
            location_address='North Industrial Estate, Gate 4',
            is_manual_location=False,
            destination_hospital_name='Apollo Emergency & Surgical Care',
            selected_route='Secondary Bypass Corridor',
            status=RequestStatus.COMPLETED,
            created_at=datetime.utcnow() - timedelta(hours=2),
            accepted_at=datetime.utcnow() - timedelta(hours=1, minutes=55),
            journey_started_at=datetime.utcnow() - timedelta(hours=1, minutes=50),
            completed_at=datetime.utcnow() - timedelta(hours=1, minutes=20)
        )
        db.session.add(req3)

        # Historical completed journey
        waypoints = generate_fallback_waypoints(12.9900, 77.6300, 12.9600, 77.6400, curve_offset=1.2)
        jrn3 = Journey(
            journey_id='JRN-DEMO-003',
            request_id='REQ-DEMO-003',
            ambulance_id='AMB-103',
            hospital_id='HOSP-APOLLO',
            status=JourneyStatus.COMPLETED,
            started_at=datetime.utcnow() - timedelta(hours=1, minutes=50),
            completed_at=datetime.utcnow() - timedelta(hours=1, minutes=20),
            start_lat=12.9900,
            start_lng=77.6300,
            dest_lat=12.9600,
            dest_lng=77.6400,
            route_name='Secondary Bypass Corridor',
            route_geometry=json.dumps(waypoints),
            estimated_duration_mins=22.0,
            estimated_distance_km=9.4,
            latest_lat=12.9600,
            latest_lng=77.6400
        )
        db.session.add(jrn3)

        # Seed initial audit logs
        log1 = AuditLog(
            actor_id='superadmin',
            actor_role=Role.SUPERADMIN,
            action='DATABASE_SEED',
            target_type='SYSTEM',
            target_id='INIT',
            details='Database initialized with standard clinical demonstration profiles'
        )
        db.session.add(log1)

        db.session.commit()
        print("[+] Seed completed successfully!")
        print("\n=== DEMONSTRATION CREDENTIALS ===")
        print("Super Administrator : ID 'superadmin'     | Password 'SuperAdmin@MedTrack2026'")
        print("Administrator       : ID 'admin1'         | Password 'Admin@MedTrack2026'")
        print("Hospital 1 (Metro)  : ID 'HOSP-METRO'     | Password 'Hospital@123'")
        print("Hospital 2 (CityGen): ID 'HOSP-CITYGEN'    | Password 'Hospital@123'")
        print("Hospital 3 (StJude) : ID 'HOSP-STJUDE'     | Password 'Hospital@123'")
        print("Hospital (Pending)  : ID 'HOSP-NEW'        | Password 'Hospital@123'")
        print("Ambulance 1         : ID 'AMB-101'        | Password 'Ambulance@123'")
        print("Ambulance 2         : ID 'AMB-102'        | Password 'Ambulance@123'")
        print("Ambulance 3         : ID 'AMB-103'        | Password 'Ambulance@123'")
        print("=================================\n")

if __name__ == '__main__':
    seed_database()
