export type Role = 'AMBULANCE' | 'HOSPITAL' | 'ADMIN' | 'SUPERADMIN';

export type EmergencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AmbulanceAvailabilityStatus = 
  | 'AVAILABLE' 
  | 'BOOKED' 
  | 'PATIENT PICKED UP' 
  | 'ON JOURNEY' 
  | 'COMPLETED';

export type RequestStatus = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'BOOKED'
  | 'PATIENT PICKED UP'
  | 'ON JOURNEY'
  | 'REJECTED' 
  | 'JOURNEY_ACTIVE' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type HospitalVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AmbulanceProfile {
  id: number;
  ambulance_id: string;
  full_name: string;
  age: number;
  phone_number: string;
  current_lat?: number | null;
  current_lng?: number | null;
  last_location_update?: string | null;
  status: AmbulanceAvailabilityStatus | string;
  active_request_id?: string | null;
  is_available?: boolean;
}

export interface Hospital {
  id: number;
  hospital_id: string;
  hospital_name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  beds_last_updated?: string | null;
  verification_status: HospitalVerificationStatus;
  rejection_reason?: string | null;
  is_active: boolean;
  created_at?: string | null;
}

export interface User {
  id: number;
  user_id: string;
  role: Role;
  is_active: boolean;
  is_verified: boolean;
  created_at?: string;
  profile?: AmbulanceProfile | Hospital | null;
}

export interface EmergencyRequest {
  id: number;
  request_id: string;
  ambulance_id: string;
  hospital_id: string;
  patient_name?: string;
  patient_age?: number;
  patient_identifier?: string;
  patient_age_group?: string;
  emergency_level: EmergencyLevel;
  current_lat: number;
  current_lng: number;
  location_address?: string;
  is_manual_location: boolean;
  destination_hospital_name: string;
  selected_route: string;
  status: RequestStatus;
  rejection_reason?: string | null;
  created_at: string;
  accepted_at?: string | null;
  patient_picked_up_at?: string | null;
  rejected_at?: string | null;
  journey_started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  has_active_journey?: boolean;
  journey?: any;
  ambulance_phone?: string;
  ambulance_driver?: string;
  ambulance_details?: AmbulanceProfile;
  hospital_details?: Hospital;
}

export interface LocationTelemetry {
  journey_id: string;
  request_id?: string;
  ambulance_id: string;
  hospital_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string;
}

export interface RouteChangeItem {
  id: number;
  journey_id: string;
  ambulance_id: string;
  old_route: string;
  new_route: string;
  reason?: string;
  changed_at: string;
}

export interface Journey {
  id: number;
  journey_id: string;
  request_id: string;
  ambulance_id: string;
  hospital_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABORTED';
  started_at: string;
  completed_at?: string | null;
  start_lat: number;
  start_lng: number;
  dest_lat: number;
  dest_lng: number;
  route_name: string;
  route_geometry?: string | null;
  estimated_duration_mins: number;
  estimated_distance_km: number;
  latest_lat?: number | null;
  latest_lng?: number | null;
  latest_accuracy?: number | null;
  latest_telemetry_time?: string | null;
  recent_breadcrumbs?: LocationTelemetry[];
  route_changes?: RouteChangeItem[];
  emergency_level?: EmergencyLevel;
  patient_name?: string;
  ambulance_phone?: string;
  ambulance_driver?: string;
}

export interface RouteOption {
  route_id: string;
  name: string;
  distance_km: number;
  duration_mins: number;
  traffic_condition: 'LOW' | 'MODERATE' | 'HIGH' | 'HEAVY';
  traffic_color: 'green' | 'yellow' | 'orange' | 'red';
  estimated_arrival_time: string;
  is_recommended: boolean;
  recommendation_reason?: string;
  coordinates: [number, number][];
  provider: string;
  traffic_notice: string;
}

export interface CommunicationMessage {
  id: string;
  sender_id: string;
  sender_role: 'AMBULANCE' | 'HOSPITAL';
  recipient_id: string;
  text: string;
  timestamp: string;
  emergency_level?: EmergencyLevel;
  quick_tag?: string;
}

export interface NotificationItem {
  id: number;
  user_id: string;
  role?: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  metadata?: any;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface SystemStats {
  total_users: number;
  total_hospitals: number;
  total_ambulances: number;
  pending_hospital_approvals: number;
  active_requests: number;
  active_journeys: number;
  completed_journeys: number;
  aggregate_total_beds: number;
  aggregate_occupied_beds: number;
  aggregate_available_beds: number;
}
