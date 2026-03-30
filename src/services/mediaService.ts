import api from './api';
import { MediaAsset } from '../types/media';

export interface MediaFilters {
  category?: string;
  status?: string;
  visibility?: string;
  search?: string;
}

export const mediaService = {
  getMedia: async (filters: MediaFilters = {}): Promise<MediaAsset[]> => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.status && filters.status !== 'All') params.set('status', filters.status);
    if (filters.visibility && filters.visibility !== 'All') params.set('visibility', filters.visibility);
    if (filters.search) params.set('search', filters.search);
    const res = await api.get(`/media?${params.toString()}`);
    return res.data.media;
  },

  uploadSingle: async (file: File, formData: {
    title: string;
    category: string;
    description: string;
    tags: string;
    status: string;
    visibility: string;
  }, onProgress?: (pct: number) => void): Promise<MediaAsset> => {
    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title || file.name.split('.')[0]);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('tags', formData.tags);
    data.append('status', formData.status);
    data.append('visibility', formData.visibility);

    const res = await api.post('/media/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data.media;
  },

  uploadMultiple: async (files: File[], options: { category?: string; status?: string; visibility?: string } = {}): Promise<MediaAsset[]> => {
    const data = new FormData();
    files.forEach(f => data.append('files', f));
    if (options.category) data.append('category', options.category);
    if (options.status) data.append('status', options.status);
    if (options.visibility) data.append('visibility', options.visibility);
    const res = await api.post('/media/upload-multiple', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.media;
  },

  getMediaById: async (id: string, via?: string): Promise<MediaAsset> => {
    const res = await api.get(`/media/${id}${via ? `?via=${via}` : ''}`);
    return res.data.media;
  },

  addVariant: async (parentId: string, file: File, title?: string, correctionReplyTo?: string): Promise<MediaAsset> => {
    const data = new FormData();
    data.append('file', file);
    if (title) data.append('title', title);
    if (correctionReplyTo) data.append('correctionReplyTo', correctionReplyTo);
    const res = await api.post(`/media/${parentId}/variant`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.media;
  },

  updateMedia: async (id: string, updates: Partial<MediaAsset & { tags: string }>): Promise<MediaAsset> => {
    const res = await api.patch(`/media/${id}`, updates);
    return res.data.media;
  },

  deleteMedia: async (id: string): Promise<void> => {
    await api.delete(`/media/${id}`);
  },
};

export const shareMedia = async (
  id: string,
  method: 'email' | 'whatsapp' | 'link',
  payload: { email?: string; phone?: string; message?: string }
): Promise<{ shareUrl?: string }> => {
  const res = await api.post(`/media/${id}/share`, { method, ...payload });
  return res.data;
};

export const deleteVariant = async (mediaId: string, variantId: string): Promise<MediaAsset> => {
  const res = await api.delete(`/media/${mediaId}/variant/${variantId}`);
  return res.data.media;
};

export const addComment = async (mediaId: string, text: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/comments`, { text });
  return res.data.media;
};

export const deleteComment = async (mediaId: string, commentId: string): Promise<MediaAsset> => {
  const res = await api.delete(`/media/${mediaId}/comments/${commentId}`);
  return res.data.media;
};

export const replyToComment = async (mediaId: string, commentId: string, text: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/comments/${commentId}/reply`, { text });
  return res.data.media;
};

export const reactToComment = async (mediaId: string, commentId: string, emoji: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/comments/${commentId}/react`, { emoji });
  return res.data.media;
};

export const addCorrection = async (mediaId: string, text: string, timestamp?: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/corrections`, { text, timestamp });
  return res.data.media;
};

export const resolveCorrection = async (mediaId: string, correctionId: string): Promise<MediaAsset> => {
  const res = await api.patch(`/media/${mediaId}/corrections/${correctionId}/resolve`);
  return res.data.media;
};

export const deleteCorrection = async (mediaId: string, correctionId: string): Promise<MediaAsset> => {
  const res = await api.delete(`/media/${mediaId}/corrections/${correctionId}`);
  return res.data.media;
};

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export const getTeamUsers = async (): Promise<TeamUser[]> => {
  const res = await api.get('/users');
  return res.data.users;
};

export const shareWithUsers = async (
  mediaId: string,
  payload: { userIds?: string[]; email?: string }
): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/share-with`, payload);
  return res.data.media;
};

export const revokeShare = async (mediaId: string, userId: string): Promise<MediaAsset> => {
  const res = await api.delete(`/media/${mediaId}/share-with/${userId}`);
  return res.data.media;
};

export const requestDeleteMedia = async (mediaId: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/delete-request`);
  return res.data.media;
};

export const acceptDeleteRequest = async (mediaId: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/delete-request/accept`);
  return res.data.media;
};

export const clearViewLog = async (mediaId: string): Promise<MediaAsset> => {
  const res = await api.delete(`/media/${mediaId}/view-log`);
  return res.data.media;
};

export const acceptShare = async (mediaId: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/accept-share`);
  return res.data.media;
};

export const declineShare = async (mediaId: string): Promise<MediaAsset> => {
  const res = await api.post(`/media/${mediaId}/decline-share`);
  return res.data.media;
};

export const getAgencyTeamMembers = async (): Promise<TeamUser[]> => {
  const res = await api.get('/settings/team/agency-members');
  return (res.data.members || []).map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    roles: m.roles,
    avatar: m.avatar,
  }));
};

export const approveAsset = async (mediaId: string, status: 'approved' | 'rejected'): Promise<MediaAsset> => {
  const res = await api.patch(`/media/${mediaId}/approve`, { status });
  return res.data.media;
};
