import { getOrCreateDeviceId } from './device';

export const DEFAULT_RENDER_BACKEND = 'https://gym-crm-ejgf.onrender.com';

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
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || !window.location.hostname.includes('localhost'))) {
    return `${DEFAULT_RENDER_BACKEND}/api`;
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
  return localStorage.getItem('ironvault_backend_url') || (import.meta.env.VITE_API_URL as string) || DEFAULT_RENDER_BACKEND;
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
    let errorMsg = data.error || data.message;
    if (typeof errorMsg === 'string' && (errorMsg.includes('<!DOCTYPE') || errorMsg.includes('<html'))) {
      const match = errorMsg.match(/<pre>(.*?)<\/pre>/i);
      errorMsg = match ? match[1].replace(/<[^>]+>/g, '') : `Server returned HTTP ${response.status}`;
    }
    if (!errorMsg) {
      errorMsg =
        response.status === 405
          ? `Backend not connected at ${apiBase}. On Vercel, please enter your Render backend URL below.`
          : `Request failed with status ${response.status}`;
    }
    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = data;

    if (typeof window !== 'undefined' && (data?.code === 'MEMBERSHIP_EXPIRED' || data?.code === 'ACCOUNT_DEACTIVATED')) {
      window.dispatchEvent(
        new CustomEvent('ironvault:auth_revoked', {
          detail: { code: data.code, message: errorMsg }
        })
      );
    }

    throw error;
  }

  return data;
}

// API methods
export const api = {
  // Auth & Tenants
  login: (credentials: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  registerBusiness: (payload: {
    gymName?: string;
    businessName?: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    address: string;
    city?: string;
    state?: string;
    inviteCode?: string;
    geofenceRadiusMeters?: number;
  }) => apiRequest('/auth/register-business', { method: 'POST', body: JSON.stringify(payload) }),
  sendSignupOtp: (payload: { email: string; password: string; fullName: string; phone?: string; role?: string; gymCode?: string; gymId?: string }) =>
    apiRequest('/auth/send-signup-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifySignupOtp: (payload: { email: string; otp: string; device_id?: string; gymCode?: string; gymId?: string }) =>
    apiRequest('/auth/verify-signup-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resendSignupOtp: (payload: { email: string }) =>
    apiRequest('/auth/resend-signup-otp', { method: 'POST', body: JSON.stringify(payload) }),
  sendMemberLoginOtp: (email: string) =>
    apiRequest('/auth/send-login-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyMemberLoginOtp: (payload: { email: string; otp: string; device_id?: string }) =>
    apiRequest('/auth/verify-login-otp', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),

  // Multi-Tenant Gym Management
  lookupGymCode: (code: string) => apiRequest(`/gyms/lookup/${code}`),
  getMyGym: () => apiRequest('/gyms/me'),
  getAllGyms: () => apiRequest('/gyms'),
  getGymById: (id: string) => apiRequest(`/gyms/${id}`),
  updateGym: (id: string, payload: any) => apiRequest(`/gyms/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

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

  getMembers: (search?: string, gymId?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (gymId) params.append('gymId', gymId);
    const qs = params.toString();
    return apiRequest(`/memberships${qs ? `?${qs}` : ''}`);
  },
  getPlans: () => apiRequest('/memberships/plans'),
  onboardMember: (payload: any) => apiRequest('/memberships/onboard', { method: 'POST', body: JSON.stringify(payload) }),
  sendOnboardOtp: (payload: any) => apiRequest('/memberships/onboard/send-otp', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOnboardOtp: (payload: any) => apiRequest('/memberships/onboard/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  deskBilling: (payload: any) => apiRequest('/memberships/bill', { method: 'POST', body: JSON.stringify(payload) }),
  deleteMember: (id: string) => apiRequest(`/memberships/${id}`, { method: 'DELETE' }),

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
    apiRequest(`/device-management/requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ adminNotes }) }),

  // Community Feed & Interactions
  getCommunityPosts: (tag?: string) =>
    apiRequest(`/community/posts${tag && tag !== 'All' ? `?tag=${encodeURIComponent(tag)}` : ''}`),
  createCommunityPost: (payload: { content: string; tag?: string; imageUrl?: string; isPinned?: boolean }) =>
    apiRequest('/community/posts', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCommunityPost: (id: string) =>
    apiRequest(`/community/posts/${id}`, { method: 'DELETE' }),
  togglePinPost: (id: string) =>
    apiRequest(`/community/posts/${id}/pin`, { method: 'PATCH' }),
  toggleLikePost: (id: string) =>
    apiRequest(`/community/posts/${id}/like`, { method: 'POST' }),
  addPostComment: (id: string, text: string) =>
    apiRequest(`/community/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  deletePostComment: (postId: string, commentId: string) =>
    apiRequest(`/community/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),

  // Group Classes (Front Desk / Admin schedule, Members book)
  getGroupClasses: () => apiRequest('/community/classes'),
  createGroupClass: (payload: {
    title: string;
    coach: string;
    startTime: string;
    durationMinutes?: number;
    zone?: string;
    maxSeats?: number;
    intensity?: string;
  }) => apiRequest('/community/classes', { method: 'POST', body: JSON.stringify(payload) }),
  deleteGroupClass: (id: string) => apiRequest(`/community/classes/${id}`, { method: 'DELETE' }),
  toggleBookClass: (id: string) => apiRequest(`/community/classes/${id}/book`, { method: 'POST' }),

  // Live Turnstile-driven Leaderboard
  getLiveLeaderboard: () => apiRequest('/community/leaderboard'),

  // Health Intelligence & Marketing Leads Hub
  getHealthSummary: () => apiRequest('/health-intelligence/summary'),
  getHealthMembers: (params?: { search?: string; goal?: string; referralSource?: string; city?: string; condition?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.goal) query.append('goal', params.goal);
    if (params?.referralSource) query.append('referralSource', params.referralSource);
    if (params?.city) query.append('city', params.city);
    if (params?.condition) query.append('condition', params.condition);
    const queryString = query.toString();
    return apiRequest(`/health-intelligence/members${queryString ? `?${queryString}` : ''}`);
  },
  onboardWithHealth: (payload: any) =>
    apiRequest('/health-intelligence/onboard', { method: 'POST', body: JSON.stringify(payload) }),
  getMemberHealth: (userId: string) => apiRequest(`/health-intelligence/profile/${userId}`),
  getMyHealthProfile: () => apiRequest('/health-intelligence/me'),
  updateMyHealthProfile: (payload: any) =>
    apiRequest('/health-intelligence/me', { method: 'PUT', body: JSON.stringify(payload) }),
  sendPhoneOtp: (phone: string) =>
    apiRequest('/health-intelligence/send-phone-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyPhoneOtp: (phone: string, otp: string) =>
    apiRequest('/health-intelligence/verify-phone-otp', { method: 'POST', body: JSON.stringify({ phone, otp }) }),
  downloadHealthCsv: async () => {
    const token = localStorage.getItem('ironvault_jwt_token');
    const apiBase = getApiBase();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${apiBase}/health-intelligence/export-csv`, { headers });
    if (!res.ok) throw new Error('Failed to export marketing CSV data');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IronVault_Member_Marketing_Data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
};



