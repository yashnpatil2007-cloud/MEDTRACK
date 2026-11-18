const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

// Pre-seeded Demo Data for Static Hosting Previews (GitHub Pages, Netlify)
const DEFAULT_HOSPITALS = [
  {
    id: 'HOSP-METRO',
    hospital_name: 'Metro General Hospital & Trauma Centre',
    verification_status: 'VERIFIED',
    total_beds: 50,
    occupied_beds: 38,
    available_beds: 12,
    latitude: 18.5204,
    longitude: 73.8567,
    address: 'Shivajinagar, Pune, Maharashtra 411005',
    is_active: true,
  },
  {
    id: 'HOSP-CITY',
    hospital_name: 'City Care Super Specialty Hospital',
    verification_status: 'VERIFIED',
    total_beds: 35,
    occupied_beds: 25,
    available_beds: 10,
    latitude: 18.5314,
    longitude: 73.8446,
    address: 'FC Road, Pune, Maharashtra 411004',
    is_active: true,
  },
  {
    id: 'HOSP-STJUDE',
    hospital_name: 'St. Jude Emergency & Critical Care',
    verification_status: 'VERIFIED',
    total_beds: 20,
    occupied_beds: 14,
    available_beds: 6,
    latitude: 18.5089,
    longitude: 73.8652,
    address: 'Camp Area, Pune, Maharashtra 411001',
    is_active: true,
  },
];

const DEFAULT_REQUESTS = [
  {
    id: 'REQ-2026-101',
    patient_name: 'Aarav Sharma',
    patient_age: 45,
    emergency_level: 'CRITICAL',
    status: 'ACCEPTED',
    ambulance_id: 'AMB-101',
    hospital_id: 'HOSP-METRO',
    hospital_name: 'Metro General Hospital & Trauma Centre',
    current_lat: 18.5300,
    current_lng: 73.8450,
    is_manual_location: false,
    selected_route: 'Fastest Highway Transit',
    created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    journey: {
      id: 'JRN-2026-101',
      status: 'IN_TRANSIT',
      start_time: new Date(Date.now() - 10 * 60000).toISOString(),
      current_lat: 18.5250,
      current_lng: 73.8510,
      current_route: 'Fastest Highway Transit',
      speed: 48.5,
    }
  },
  {
    id: 'REQ-2026-102',
    patient_name: 'Priya Verma',
    patient_age: 29,
    emergency_level: 'HIGH',
    status: 'PENDING',
    ambulance_id: 'AMB-101',
    hospital_id: 'HOSP-METRO',
    hospital_name: 'Metro General Hospital & Trauma Centre',
    current_lat: 18.5150,
    current_lng: 73.8600,
    is_manual_location: true,
    location_address: 'Deccan Gymkhana junction',
    selected_route: 'Alternative Arterial Bypass',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
  }
];

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('medtrack_token');
  }

  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }

  private handleStaticFallback<T>(endpoint: string, options: RequestInit = {}): T {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    // Auth Fallbacks
    if (endpoint === '/login' && method === 'POST') {
      const { id, password } = body;
      if (id === 'AMB-101') {
        const user = { id: 'AMB-101', role: 'ambulance', ambulance_profile: { full_name: 'Rajesh Kumar', phone_number: '+91 98765 43210', age: 34 }, is_active: true };
        return { success: true, token: 'demo-token-amb', user, message: 'Authentication successful (Cloud Demo Mode)' } as T;
      }
      if (id === 'HOSP-METRO') {
        const user = { id: 'HOSP-METRO', role: 'hospital', hospital_profile: { hospital_name: 'Metro General Hospital', verification_status: 'VERIFIED', total_beds: 50, occupied_beds: 38, available_beds: 12, latitude: 18.5204, longitude: 73.8567 }, is_active: true };
        return { success: true, token: 'demo-token-hosp', user, message: 'Authentication successful (Cloud Demo Mode)' } as T;
      }
      if (id === 'admin1') {
        const user = { id: 'admin1', role: 'admin', full_name: 'Admin User', is_active: true };
        return { success: true, token: 'demo-token-admin', user, message: 'Authentication successful (Cloud Demo Mode)' } as T;
      }
      if (id === 'superadmin') {
        const user = { id: 'superadmin', role: 'superadmin', full_name: 'Super Administrator', is_active: true };
        return { success: true, token: 'demo-token-super', user, message: 'Authentication successful (Cloud Demo Mode)' } as T;
      }

      // Check registered users
      const users = this.getStorage<any[]>('medtrack_custom_users', []);
      const found = users.find(u => u.id === id);
      if (found) {
        return { success: true, token: `demo-token-${id}`, user: found, message: 'Authentication successful' } as T;
      }

      // Allow login with newly created IDs for seamless friend review
      if (id.startsWith('AMB-')) {
        const user = { id, role: 'ambulance', ambulance_profile: { full_name: 'Ambulance Operator', phone_number: '+91 98000 00000', age: 30 }, is_active: true };
        return { success: true, token: `demo-token-${id}`, user, message: 'Authentication successful' } as T;
      }
      if (id.startsWith('HOSP-')) {
        const user = { id, role: 'hospital', hospital_profile: { hospital_name: 'Emergency Medical Hospital', verification_status: 'VERIFIED', total_beds: 40, occupied_beds: 25, available_beds: 15, latitude: 18.5204, longitude: 73.8567 }, is_active: true };
        return { success: true, token: `demo-token-${id}`, user, message: 'Authentication successful' } as T;
      }

      throw new Error('Invalid credentials. Use demo credentials AMB-101 / HOSP-METRO / admin1 / superadmin');
    }

    if (endpoint === '/register/ambulance' && method === 'POST') {
      const user = {
        id: body.ambulance_id,
        role: 'ambulance',
        ambulance_profile: { full_name: body.full_name, phone_number: body.phone_number, age: body.age },
        is_active: true,
      };
      const users = this.getStorage<any[]>('medtrack_custom_users', []);
      users.push(user);
      this.setStorage('medtrack_custom_users', users);
      return { success: true, token: `demo-token-${user.id}`, user, message: 'Ambulance registered successfully!' } as T;
    }

    if (endpoint === '/register/hospital' && method === 'POST') {
      const user = {
        id: body.hospital_id,
        role: 'hospital',
        hospital_profile: { hospital_name: body.hospital_name, verification_status: 'VERIFIED', total_beds: 30, occupied_beds: 15, available_beds: 15, latitude: 18.5204, longitude: 73.8567 },
        is_active: true,
      };
      const users = this.getStorage<any[]>('medtrack_custom_users', []);
      users.push(user);
      this.setStorage('medtrack_custom_users', users);
      return { success: true, token: `demo-token-${user.id}`, user, message: 'Hospital registered successfully and ready!' } as T;
    }

    if (endpoint === '/me') {
      const user = this.getStorage<any>('medtrack_user', {
        id: 'AMB-101',
        role: 'ambulance',
        ambulance_profile: { full_name: 'Rajesh Kumar', phone_number: '+91 98765 43210', age: 34 }
      });
      return { success: true, user } as T;
    }

    if (endpoint.startsWith('/hospitals')) {
      const hospitals = this.getStorage<any[]>('medtrack_demo_hospitals', DEFAULT_HOSPITALS);
      return { success: true, hospitals, count: hospitals.length } as T;
    }

    if (endpoint === '/hospital/beds' && method === 'PUT') {
      const hospitals = this.getStorage<any[]>('medtrack_demo_hospitals', DEFAULT_HOSPITALS);
      const { total_beds, occupied_beds } = body;
      const updated = hospitals.map(h => h.id === 'HOSP-METRO' ? { ...h, total_beds, occupied_beds, available_beds: total_beds - occupied_beds } : h);
      this.setStorage('medtrack_demo_hospitals', updated);
      return { success: true, hospital: updated[0], message: 'Bed availability updated' } as T;
    }

    if (endpoint.startsWith('/requests') || endpoint.startsWith('/hospital/requests')) {
      let requests = this.getStorage<any[]>('medtrack_demo_requests', DEFAULT_REQUESTS);
      if (endpoint === '/requests' && method === 'POST') {
        const newReq = {
          id: `REQ-${Date.now().toString().slice(-4)}`,
          patient_name: body.patient_name,
          patient_age: body.patient_age,
          emergency_level: body.emergency_level,
          status: 'PENDING',
          ambulance_id: 'AMB-101',
          hospital_id: body.hospital_id,
          hospital_name: 'Metro General Hospital & Trauma Centre',
          current_lat: body.current_lat,
          current_lng: body.current_lng,
          is_manual_location: body.is_manual_location,
          location_address: body.location_address,
          selected_route: body.selected_route || 'Primary Direct Route',
          created_at: new Date().toISOString(),
        };
        requests = [newReq, ...requests];
        this.setStorage('medtrack_demo_requests', requests);
        return { success: true, request: newReq, message: 'Emergency coordination request submitted!' } as T;
      }
      return { success: true, requests, count: requests.length, hospital_id: 'HOSP-METRO' } as T;
    }

    if (endpoint.includes('/decision') && method === 'POST') {
      const reqId = endpoint.split('/')[2];
      const requests = this.getStorage<any[]>('medtrack_demo_requests', DEFAULT_REQUESTS);
      const updated = requests.map(r => r.id === reqId ? { ...r, status: body.decision } : r);
      this.setStorage('medtrack_demo_requests', updated);
      return { success: true, request: updated.find(r => r.id === reqId), message: `Request marked as ${body.decision}` } as T;
    }

    if (endpoint.includes('/start') && method === 'POST') {
      const journey = {
        id: `JRN-${Date.now().toString().slice(-4)}`,
        status: 'IN_TRANSIT',
        start_time: new Date().toISOString(),
        current_lat: 18.5204,
        current_lng: 73.8567,
        current_route: 'Fastest Highway Transit',
        speed: 45.0,
      };
      return { success: true, journey, message: 'Emergency journey started' } as T;
    }

    if (endpoint.includes('/end') && method === 'POST') {
      return { success: true, journey: { status: 'COMPLETED', end_time: new Date().toISOString() }, message: 'Journey completed safely' } as T;
    }

    if (endpoint.startsWith('/journeys/active')) {
      return { success: true, active_journeys: [DEFAULT_REQUESTS[0].journey], count: 1 } as T;
    }

    if (endpoint === '/notifications') {
      return {
        success: true,
        notifications: [
          { id: 1, title: 'Emergency Dispatch Active', message: 'Ambulance AMB-101 en route with Critical patient.', is_read: false, created_at: new Date().toISOString() },
          { id: 2, title: 'Bed Availability Low', message: 'ICU available beds count is currently 4.', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() }
        ],
        unread_count: 2
      } as T;
    }

    if (endpoint.startsWith('/admin/stats')) {
      return {
        success: true,
        stats: {
          total_hospitals: 3,
          verified_hospitals: 3,
          pending_hospitals: 0,
          total_ambulances: 4,
          active_ambulances: 3,
          total_requests: 12,
          pending_requests: 1,
          accepted_requests: 8,
          active_journeys: 1,
          total_beds: 105,
          available_beds: 28,
        }
      } as T;
    }

    if (endpoint.startsWith('/admin/analytics')) {
      return {
        success: true,
        analytics: {
          requests_by_level: { CRITICAL: 6, HIGH: 4, MEDIUM: 2, LOW: 0 },
          requests_by_status: { COMPLETED: 8, ACCEPTED: 3, PENDING: 1, REJECTED: 0 },
          average_response_time_minutes: 3.4,
          hospital_utilization_rate: 73.3,
        }
      } as T;
    }

    if (endpoint.startsWith('/admin/audit-logs')) {
      return {
        success: true,
        audit_logs: [
          { id: 1, user_id: 'AMB-101', role: 'ambulance', action: 'CREATE_REQUEST', details: 'Created Critical request REQ-2026-101', timestamp: new Date().toISOString() },
          { id: 2, user_id: 'HOSP-METRO', role: 'hospital', action: 'ACCEPT_REQUEST', details: 'Accepted emergency request REQ-2026-101', timestamp: new Date().toISOString() },
        ],
        count: 2
      } as T;
    }

    if (endpoint === '/contact' && method === 'POST') {
      return { success: true, message: 'Thank you! Your emergency network coordination inquiry has been logged.' } as T;
    }

    return { success: true, message: 'Action completed' } as T;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          // If on static preview (GitHub Pages/Netlify) without active proxy
          return this.handleStaticFallback<T>(endpoint, options);
        }

        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          localStorage.removeItem('medtrack_token');
          localStorage.removeItem('medtrack_user');
          window.dispatchEvent(new Event('medtrack_auth_expired'));
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      // If network failure (e.g. backend not reachable on static host)
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed'))) {
        return this.handleStaticFallback<T>(endpoint, options);
      }
      throw err;
    }
  }

  // Auth
  async registerAmbulance(payload: { full_name: string; age: number; phone_number: string; ambulance_id: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any; message: string }>('/register/ambulance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async registerHospital(payload: { hospital_name: string; hospital_id: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any; message: string; verification_notice?: string }>('/register/hospital', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(id: string, password: string) {
    return this.request<{ success: boolean; token: string; user: any; message: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ id, password }),
    });
  }

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('medtrack_token');
      localStorage.removeItem('medtrack_user');
    }
  }

  async getMe() {
    return this.request<{ success: boolean; user: any }>('/me');
  }

  async updatePassword(old_password: string, new_password: string) {
    return this.request<{ success: boolean; message: string }>('/me/password', {
      method: 'PUT',
      body: JSON.stringify({ old_password, new_password }),
    });
  }

  async updateProfile(payload: Record<string, any>) {
    return this.request<{ success: boolean; user: any; message: string }>('/me/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Hospitals & Beds
  async getHospitals() {
    return this.request<{ success: boolean; hospitals: any[]; count: number }>('/hospitals');
  }

  async getHospitalDetail(hospital_id: string) {
    return this.request<{ success: boolean; hospital: any }>(`/hospitals/${hospital_id}`);
  }

  async updateBeds(total_beds: number, occupied_beds: number) {
    return this.request<{ success: boolean; hospital: any; message: string }>('/hospital/beds', {
      method: 'PUT',
      body: JSON.stringify({ total_beds, occupied_beds }),
    });
  }

  async updateHospitalLocation(latitude: number, longitude: number, address?: string) {
    return this.request<{ success: boolean; hospital: any; message: string }>('/hospital/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude, address }),
    });
  }

  // Requests
  async createEmergencyRequest(payload: {
    patient_name: string;
    patient_age: number;
    emergency_level: string;
    current_lat: number;
    current_lng: number;
    location_address?: string;
    is_manual_location: boolean;
    hospital_id: string;
    selected_route?: string;
  }) {
    return this.request<{ success: boolean; request: any; message: string }>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getRequests(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.request<{ success: boolean; requests: any[]; count: number }>(`/requests${q}`);
  }

  async getHospitalRequests(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.request<{ success: boolean; requests: any[]; count: number; hospital_id: string }>(`/hospital/requests${q}`);
  }

  async getRequestDetail(request_id: string) {
    return this.request<{ success: boolean; request: any }>(`/requests/${request_id}`);
  }

  async makeRequestDecision(request_id: string, decision: 'ACCEPTED' | 'REJECTED', reason?: string) {
    return this.request<{ success: boolean; request: any; message: string }>(`/requests/${request_id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, reason }),
    });
  }

  async cancelRequest(request_id: string, reason?: string) {
    return this.request<{ success: boolean; request: any; message: string }>(`/requests/${request_id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Journeys & GPS Telemetry
  async startJourney(request_id: string) {
    return this.request<{ success: boolean; journey: any; message: string }>(`/journeys/${request_id}/start`, {
      method: 'POST',
    });
  }

  async postLocationUpdate(journey_id: string, payload: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }) {
    return this.request<{ success: boolean; telemetry: any; message: string }>(`/journeys/${journey_id}/location`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateJourneyRoute(journey_id: string, new_route: string, reason?: string) {
    return this.request<{ success: boolean; journey: any; message: string }>(`/journeys/${journey_id}/route`, {
      method: 'POST',
      body: JSON.stringify({ new_route, reason }),
    });
  }

  async endJourney(journey_id: string) {
    return this.request<{ success: boolean; journey: any; message: string }>(`/journeys/${journey_id}/end`, {
      method: 'POST',
    });
  }

  async getActiveJourneys() {
    return this.request<{ success: boolean; active_journeys: any[]; count: number }>('/journeys/active');
  }

  async getJourneyDetail(journey_id: string) {
    return this.request<{ success: boolean; journey: any }>(`/journeys/${journey_id}`);
  }

  // Routing Proxy
  async calculateRoutes(start_lat: number, start_lng: number, dest_lat: number, dest_lng: number) {
    return this.request<{ success: boolean; routes: any[]; disclosure: any }>(
      `/routes/calculate?start_lat=${start_lat}&start_lng=${start_lng}&dest_lat=${dest_lat}&dest_lng=${dest_lng}`
    );
  }

  // Notifications
  async getNotifications() {
    return this.request<{ success: boolean; notifications: any[]; unread_count: number }>('/notifications');
  }

  async markNotificationRead(id: number) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${id}/read`, { method: 'PUT' });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean; message: string }>('/notifications/read-all', { method: 'PUT' });
  }

  // Admin
  async getAdminStats() {
    return this.request<{ success: boolean; stats: any }>('/admin/stats');
  }

  async getAdminHospitals(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.request<{ success: boolean; hospitals: any[]; count: number }>(`/admin/hospitals${q}`);
  }

  async approveHospital(hospital_id: string) {
    return this.request<{ success: boolean; hospital: any; message: string }>(`/admin/hospitals/${hospital_id}/approve`, {
      method: 'POST',
    });
  }

  async rejectHospital(hospital_id: string, reason?: string) {
    return this.request<{ success: boolean; hospital: any; message: string }>(`/admin/hospitals/${hospital_id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async toggleHospitalStatus(hospital_id: string) {
    return this.request<{ success: boolean; hospital: any; message: string }>(`/admin/hospitals/${hospital_id}/toggle-status`, {
      method: 'POST',
    });
  }

  async getAdminAmbulances() {
    return this.request<{ success: boolean; ambulances: any[]; count: number }>('/admin/ambulances');
  }

  async toggleAmbulanceStatus(ambulance_id: string) {
    return this.request<{ success: boolean; message: string }>(`/admin/ambulances/${ambulance_id}/toggle-status`, {
      method: 'POST',
    });
  }

  async getAdminUsers(role?: string, search?: string) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    return this.request<{ success: boolean; users: any[]; count: number }>(`/admin/users?${params.toString()}`);
  }

  async toggleUserStatus(user_id: string) {
    return this.request<{ success: boolean; user: any; message: string }>(`/admin/users/${user_id}/toggle-status`, {
      method: 'POST',
    });
  }

  async getAdminRequests(status?: string) {
    const q = status ? `?status=${status}` : '';
    return this.request<{ success: boolean; requests: any[]; count: number }>(`/admin/requests${q}`);
  }

  async getAdminAnalytics() {
    return this.request<{ success: boolean; analytics: any }>('/admin/analytics');
  }

  async getAdminAuditLogs(limit: number = 100) {
    return this.request<{ success: boolean; audit_logs: any[]; count: number }>(`/admin/audit-logs?limit=${limit}`);
  }

  // Super Admin
  async getSuperAdminHealth() {
    return this.request<{ success: boolean; health: any }>('/superadmin/health');
  }

  async createAdmin(admin_id: string, password: string) {
    return this.request<{ success: boolean; admin: any; message: string }>('/superadmin/admins', {
      method: 'POST',
      body: JSON.stringify({ admin_id, password }),
    });
  }

  async getSystemSettings() {
    return this.request<{ success: boolean; settings: any[] }>('/superadmin/settings');
  }

  async updateSystemSetting(key: string, value: string, description?: string) {
    return this.request<{ success: boolean; setting: any; message: string }>('/superadmin/settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value, description }),
    });
  }

  // Public Landing Page
  async submitContact(name: string, email: string, subject: string, message: string, phone?: string) {
    return this.request<{ success: boolean; message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify({ name, email, subject, message, phone }),
    });
  }

  async getContactMessages() {
    return this.request<{ success: boolean; messages: any[] }>('/admin/contact-messages');
  }
}

export const api = new ApiClient();
