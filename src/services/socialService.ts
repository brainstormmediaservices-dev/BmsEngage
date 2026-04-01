import api from './api';

export interface ConnectedAccount {
  id: string;
  platform: 'meta' | 'twitter' | 'linkedin' | 'tiktok';
  accountId: string;
  username: string;
  displayName: string;
  avatar: string;
  tokenExpiry: string | null;
  isActive: boolean;
  meta?: { pageId: string; pageName: string };
  tiktok?: { openId: string };
  createdAt: string;
}

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export interface PlatformInsights {
  platform: string;
  username: string;
  displayName: string;
  avatar: string;
  followers: number | null;
  following: number | null;
  posts: number | null;
  reach: number | null;
  engagement: number | null;
  impressions: number | null;
  topPosts: { id: string; content: string; likes: number; comments: number; shares: number; url: string; createdAt: string }[];
  recentActivity: { type: string; text: string; time: string }[];
  profileUrl: string | null;
  error: string | null;
}

export const socialService = {
  connectPlatform: (platform: 'meta' | 'twitter' | 'linkedin' | 'tiktok') => {
    const token = localStorage.getItem('token');
    window.location.href = `${BASE_URL}/api/social/auth/${platform}?token=${token}`;
  },

  getAccounts: async (): Promise<ConnectedAccount[]> => {
    const res = await api.get('/social/accounts');
    return res.data.accounts;
  },

  disconnect: async (id: string): Promise<void> => {
    await api.delete(`/social/accounts/${id}`);
  },

  refreshToken: async (id: string): Promise<{ tokenExpiry: string }> => {
    const res = await api.post(`/social/accounts/${id}/refresh-token`);
    return res.data;
  },

  getInsights: async (id: string): Promise<PlatformInsights> => {
    const res = await api.get(`/social/accounts/${id}/insights`);
    return res.data.insights;
  },
};
