import api from './api';
import { User, NotificationPrefs } from './authService';

export const getProfile = async (): Promise<User> => {
  const res = await api.get('/settings/profile');
  return res.data.user;
};

export const updateProfile = async (data: Partial<Pick<User, 'name' | 'phone' | 'bio' | 'country' | 'city' | 'timezone'>>): Promise<User> => {
  const res = await api.patch('/settings/profile', data);
  return res.data.user;
};

export const uploadAvatar = async (file: File): Promise<User> => {
  const form = new FormData();
  form.append('avatar', file);
  const res = await api.post('/settings/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.user;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await api.patch('/settings/password', { currentPassword, newPassword });
};

export const updateNotificationPrefs = async (prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs> => {
  const res = await api.patch('/settings/notifications', prefs);
  return res.data.notificationPrefs;
};

export const setup2FAApp = async (): Promise<{ secret: string; qrCode: string }> => {
  const res = await api.post('/settings/2fa/setup-app');
  return res.data;
};

export const verify2FAApp = async (token: string): Promise<void> => {
  await api.post('/settings/2fa/verify-app', { token });
};

export const setup2FASMS = async (phone: string): Promise<void> => {
  await api.post('/settings/2fa/setup-sms', { phone });
};

export const verify2FASMS = async (code: string): Promise<void> => {
  await api.post('/settings/2fa/verify-sms', { code });
};

export const disable2FA = async (): Promise<void> => {
  await api.delete('/settings/2fa');
};

export const updateAgency = async (data: User['agency']): Promise<User['agency']> => {
  const res = await api.patch('/settings/agency', data);
  return res.data.agency;
};

export const uploadAgencyLogo = async (file: File): Promise<User> => {
  const form = new FormData();
  form.append('logo', file);
  const res = await api.post('/settings/agency/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.user;
};

export const switchContext = async (context: 'personal' | 'agency'): Promise<void> => {
  await api.patch('/settings/context', { context });
};

// ─── Team Invite API ─────────────────────────────────────────────────────────

export interface TeamMember {
  inviteId: string;
  status: 'pending' | 'accepted' | 'rejected';
  respondedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar?: string | null; roles: string[]; agencyRole?: string } | null;
}

export interface TeamInvitation {
  inviteId: string;
  status: 'pending' | 'accepted' | 'rejected';
  agencyName: string;
  respondedAt: string | null;
  createdAt: string;
  invitedBy: { id: string; name: string; email: string; avatar?: string | null } | null;
}

export interface UserSearchResult {
  user: { id: string; name: string; email: string; avatar?: string | null; roles: string[] };
  inviteStatus: 'pending' | 'accepted' | 'rejected' | null;
}

export const searchUserByEmail = async (email: string): Promise<UserSearchResult> => {
  const res = await api.get(`/settings/team/search?email=${encodeURIComponent(email)}`);
  return res.data;
};

export const sendTeamInvite = async (userId: string, agencyRole: AgencyRole): Promise<void> => {
  await api.post('/settings/team/invite', { userId, agencyRole });
};

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const res = await api.get('/settings/team/members');
  return res.data.members;
};

export const removeTeamMember = async (inviteId: string): Promise<void> => {
  await api.delete(`/settings/team/members/${inviteId}`);
};

export const getMyInvitations = async (): Promise<TeamInvitation[]> => {
  const res = await api.get('/settings/team/invitations');
  return res.data.invitations;
};

export const respondToInvitation = async (inviteId: string, action: 'accept' | 'reject'): Promise<void> => {
  await api.patch(`/settings/team/invitations/${inviteId}`, { action });
};

export interface MyAgencyInfo {
  agency: { name?: string; website?: string; industry?: string; teamSize?: string; description?: string; logo?: string } | null;
  agencyOwnerId?: string;
  isOwner?: boolean;
}

export const getMyAgency = async (): Promise<MyAgencyInfo> => {
  const res = await api.get('/settings/team/my-agency');
  return res.data;
};

export const AGENCY_ROLES = [
  'graphic_designer', 'photographer', 'videographer', 'editor',
  'producer', 'director', 'production_manager',
  'social_media_manager', 'content_strategist', 'brand_manager',
  'ceo', 'coo', 'creative_director', 'head_of_production',
] as const;

export type AgencyRole = typeof AGENCY_ROLES[number];

export const updateMemberRole = async (inviteId: string, agencyRole: AgencyRole): Promise<void> => {
  await api.patch(`/settings/team/members/${inviteId}/role`, { agencyRole });
};
