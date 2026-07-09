import api from './api';

export interface PlatformResult {
  platform: string;
  success: boolean;
  postId: string | null;
  error?: string;
}

export interface ScheduledPost {
  id: string;
  content: string;
  mediaUrls: string[];
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledTime: string | null;
  publishedAt: string | null;
  createdAt: string;
  platformResults?: PlatformResult[];
  error?: string;
}

export const postService = {
  create: async (data: {
    content: string;
    platforms: string[];
    scheduledTime?: string;
    mediaUrls?: string[];
  }): Promise<ScheduledPost> => {
    const res = await api.post('/posts', data);
    return res.data.post;
  },

  getAll: async (status?: string): Promise<ScheduledPost[]> => {
    const params = status ? `?status=${status}` : '';
    const res = await api.get(`/posts${params}`);
    return res.data.posts;
  },

  getOne: async (id: string): Promise<ScheduledPost> => {
    const res = await api.get(`/posts/${id}`);
    return res.data.post;
  },

  update: async (id: string, data: {
    content?: string;
    platforms?: string[];
    scheduledTime?: string | null;
    mediaUrls?: string[];
  }): Promise<ScheduledPost> => {
    const res = await api.patch(`/posts/${id}`, data);
    return res.data.post;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  publishNow: async (id: string): Promise<{ message: string; post: ScheduledPost }> => {
    const res = await api.post(`/posts/${id}/publish`);
    return res.data;
  },

  retry: async (id: string): Promise<{ message: string; post: ScheduledPost }> => {
    const res = await api.post(`/posts/${id}/retry`);
    return res.data;
  },
};
