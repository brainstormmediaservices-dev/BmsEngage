import api from './api';

export interface ScheduledPost {
  id: string;
  content: string;
  mediaUrls: string[];
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledTime: string | null;
  publishedAt: string | null;
  createdAt: string;
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

  delete: async (id: string): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },

  publishNow: async (id: string): Promise<void> => {
    await api.post(`/posts/${id}/publish`);
  },
};
