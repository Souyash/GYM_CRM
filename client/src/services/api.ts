import { getOrCreateDeviceId } from './device';

export function getApiBase(): string {
  const customUrl = localStorage.getItem('ironvault_backend_url');
  if (customUrl && customUrl.trim()) {
    const clean = customUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  const rawEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (rawEnv) {
    const clean = rawEnv.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
}

export function setCustomBackendUrl(url: string): void {
  if (!url || !url.trim()) {
    localStorage.removeItem('ironvault_backend_url');
  } else {
    let clean = url.trim().replace(/\/+$/, '');
    if (clean.endsWith('/api')) clean = clean.slice(0, -4);
    localStorage.setItem('ironvault_backend_url', clean);
  }
}

export function getCustomBackendUrl(): string {
  return localStorage.getItem('ironvault_backend_url') || (import.meta.env.VITE_API_URL as string) || '';
}

export async function testBackendConnection(url?: string): Promise<{ success: boolean; message: string }> {
  const custom = url !== undefined ? url.trim() : (localStorage.getItem('ironvault_backend_url') || (import.meta.env.VITE_API_URL as string) || '');
  if (!custom && window.location.hostname.includes('vercel.app')) {
    return { success: false, message: 'Please enter your Render backend URL below to connect.' };
  }

  const base = url
    ? (url.trim().replace(/\/+$/, '').endsWith('/api') ? url.trim().replace(/\/+$/, '') : `${url.trim().replace(/\/+$/, '')}/api`)
    : getApiBase();

  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      return { success: true, message: 'Backend connected and responding!' };
    }
    return { success: false, message: `Server returned HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Unable to reach backend URL' };
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('ironvault_jwt_token');
  const deviceId = getOrCreateDeviceId();
  const apiBase = getApiBase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    const error: any = new Error(
      `Unable to connect to backend server (${apiBase}). Please check your Render backend URL.`
    );
    error.status = 0;
    throw error;
  }

  // Safe parsing to avoid WebKit / Safari "The string did not match the expected pattern" error
  let data: any = {};
  const rawText = await response.text().catch(() => '');
  if (rawText && rawText.trim()) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText };
    }
  }

  if (!response.ok) {
    const errorMsg =
      data.error ||
      data.message ||
      (response.status === 405
        ? `Backend not connected at ${apiBase}. On Vercel, please enter your Render backend URL below.`
        : `Request failed with status ${response.status}`);
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// API methods
export const api = {
  // Auth
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),

  // Facilities
  getFacilities: () => apiRequest('/facilities'),
  getFacility: (id: string) => apiRequest(`/facilities/${id}`),
  updateGeofence: (id: string, payload: any) => apiRequest(`/facilities/${id}/geofence`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Entry & Exit Sessions (Arrival, In-Gym Workout, Departure)
  getActiveSession: () => apiRequest('/entry/active-session'),
  scanEntry: (payload: { gym_id: string; latitude: number; longitude: number; device_id?: string; action?: string }) =>
    apiRequest('/entry/scan', { method: 'POST', body: JSON.stringify(payload) }),
  exitGymSession: (payload?: { gym_id?: string; latitude?: number; longitude?: number; device_id?: string }) =>
    apiRequest('/entry/exit', { method: 'POST', body: JSON.stringify(payload || {}) }),
  scanAndLogin: (payload: { identifier?: string; email?: string; phone?: string; password?: string; gym_id: string; latitude: number; longitude: number; device_id?: string; action?: string }) =>
    apiRequest('/entry/scan-login', { method: 'POST', body: JSON.stringify(payload) }),

  // Live Attendance & Floor Management
  getLiveAttendance: () => apiRequest('/attendance/live'),
  deskCheckoutMember: (entryId: string) => apiRequest(`/attendance/${entryId}/checkout`, { method: 'POST' }),
  getMyAttendanceHistory: () => apiRequest('/attendance/my-history'),

  // Membership & Desk Billing
  getMembers: (search?: string) => apiRequest(`/memberships${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getPlans: () => apiRequest('/memberships/plans'),
  onboardMember: (payload: any) => apiRequest('/memberships/onboard', { method: 'POST', body: JSON.stringify(payload) }),
  deskBilling: (payload: any) => apiRequest('/memberships/bill', { method: 'POST', body: JSON.stringify(payload) }),

  // Threat Monitoring & Failed Logs
  getFailedLogs: (params?: { attemptType?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.attemptType) query.append('attemptType', params.attemptType);
    if (params?.page) query.append('page', String(params.page));
    return apiRequest(`/failed-logs?${query.toString()}`);
  },
  getThreatStats: () => apiRequest('/failed-logs/stats'),
  dismissAlert: (id: string) => apiRequest(`/failed-logs/${id}/dismiss`, { method: 'PATCH' }),

  // Multi-Device Management
  getDeviceRequests: (status = 'PENDING') => apiRequest(`/device-management/requests?status=${status}`),
  approveDeviceRequest: (id: string, adminNotes?: string) =>
    apiRequest(`/device-management/requests/${id}/approve`, { method: 'POST', body: JSON.stringify({ adminNotes }) }),
  rejectDeviceRequest: (id: string, adminNotes?: string) =>
    apiRequest(`/device-management/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ adminNotes }) })
};

