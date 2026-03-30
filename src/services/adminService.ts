import api from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  verified: boolean;
  accountStatus: 'pending' | 'active' | 'rejected' | 'suspended';
  enabledFeatures: {
    gallery: boolean; socialAccounts: boolean; posts: boolean;
    scheduler: boolean; analytics: boolean; notifications: boolean; settings: boolean;
  };
  createdAt: string;
  avatar?: string | null;
  phone?: string;
  bio?: string;
  country?: string;
  city?: string;
}

export interface AdminStats {
  total: number; active: number; pending: number; rejected: number; suspended: number;
}

export const getStats = async (): Promise<AdminStats> => {
  const res = await api.get('/admin/stats');
  return res.data.stats;
};

export const listUsers = async (params?: { status?: string; search?: string }): Promise<AdminUser[]> => {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const res = await api.get(`/admin/users?${q.toString()}`);
  return res.data.users;
};

export const getUser = async (id: string): Promise<AdminUser> => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data.user;
};

export const updateUserStatus = async (id: string, status: AdminUser['accountStatus']): Promise<AdminUser> => {
  const res = await api.patch(`/admin/users/${id}/status`, { status });
  return res.data.user;
};

export const updateUserFeatures = async (id: string, enabledFeatures: Partial<AdminUser['enabledFeatures']>): Promise<AdminUser> => {
  const res = await api.patch(`/admin/users/${id}/features`, { enabledFeatures });
  return res.data.user;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

export type NavFeatures = AdminUser['enabledFeatures'];

export const getDefaults = async (): Promise<NavFeatures> => {
  const res = await api.get('/admin/defaults');
  return res.data.defaults;
};

export const setDefaults = async (enabledFeatures: Partial<NavFeatures>, applyToAll: boolean): Promise<NavFeatures> => {
  const res = await api.patch('/admin/defaults', { enabledFeatures, applyToAll });
  return res.data.defaults;
};
