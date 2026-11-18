const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('medtrack_token');
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

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        // Token expired or invalid
        localStorage.removeItem('medtrack_token');
        localStorage.removeItem('medtrack_user');
        window.dispatchEvent(new Event('medtrack_auth_expired'));
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
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
