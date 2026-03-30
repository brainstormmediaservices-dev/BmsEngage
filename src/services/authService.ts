import api from './api';

export type UserRole =
  | 'graphic_designer' | 'photographer' | 'videographer' | 'editor'
  | 'producer' | 'director' | 'production_manager'
  | 'social_media_manager' | 'content_strategist' | 'brand_manager'
  | 'ceo' | 'coo' | 'creative_director' | 'head_of_production';

export const ROLE_GROUPS: Record<string, UserRole[]> = {
  creative: ['graphic_designer', 'photographer', 'videographer', 'editor'],
  production: ['producer', 'director', 'production_manager'],
  marketing: ['social_media_manager', 'content_strategist', 'brand_manager'],
  executive: ['ceo', 'coo', 'creative_director', 'head_of_production'],
};

export const PERMISSIONS: Record<string, string[]> = {
  upload_asset:       ['creative'],
  view_asset:         ['creative', 'production', 'marketing', 'executive'],
  comment:            ['creative', 'production', 'marketing', 'executive'],
  request_correction: ['production', 'marketing', 'executive'],
  approve_asset:      ['production', 'marketing', 'executive'],
  upload_version:     ['creative'],
  delete_asset:       ['executive'],
};

export const getRoleGroups = (roles: UserRole[] = []): string[] => {
  const groups = new Set<string>();
  for (const [group, members] of Object.entries(ROLE_GROUPS)) {
    if (roles.some(r => members.includes(r))) groups.add(group);
  }
  return [...groups];
};

export const checkPermission = (roles: UserRole[] = [], permission: string): boolean => {
  const allowed = PERMISSIONS[permission] ?? [];
  return getRoleGroups(roles).some(g => allowed.includes(g));
};

export interface NotificationPrefs {
  accountSecurity: boolean;
  galleryAssets: boolean;
  postSchedule: boolean;
  systemUpdates: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  verified?: boolean;
  roles: UserRole[];
  avatar?: string | null;
  phone?: string;
  bio?: string;
  country?: string;
  city?: string;
  timezone?: string;
  notificationPrefs?: NotificationPrefs;
  twoFA?: { enabled: boolean; method: 'app' | 'sms' | null };
  loginHistory?: { ip: string; userAgent: string; device: string; loginAt: string }[];
  agency?: { name?: string; website?: string; industry?: string; teamSize?: string; description?: string; logo?: string } | null;
  activeContext?: 'personal' | 'agency';
  // Effective role in agency context — 'owner' or an assigned agencyRole from TeamInvite
  agencyRole?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
  requires2FA?: boolean;
  method?: 'app' | 'sms';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

class AuthService {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async login(credentials: LoginCredentials & { twoFACode?: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    // If 2FA required, don't store token yet — return the challenge signal
    if (response.data.requires2FA) return response.data;
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async send2FALoginSMS(email: string): Promise<void> {
    await api.post('/auth/2fa/send-sms', { email });
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/verify-email', { token });
    return response.data;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/resend-verification', { email });
    return response.data;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();
