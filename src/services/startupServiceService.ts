import api from './api';

export type ServiceType =
  | 'ai_motion_graphics'
  | 'video_content'
  | 'branding'
  | 'printing'
  | 'social_media_management'
  | 'content_creation'
  | 'logo_design'
  | 'flyer_design'
  | 'web_design'
  | 'other';

export type ServiceStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'delivered';
export type ServicePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ServiceAsset {
  title: string;
  url: string;
  publicId: string;
  type: 'reference' | 'deliverable' | 'revision';
  uploadedAt: string;
}

export interface ServiceRevision {
  requestedBy: string;
  notes: string;
  status: 'pending' | 'in_progress' | 'completed';
  requestedAt: string;
  completedAt?: string;
}

export interface StartupServiceItem {
  id: string;
  startupId: { id: string; name: string; logo: string | null } | string;
  agencyId: string;
  serviceType: ServiceType;
  title: string;
  description: string;
  status: ServiceStatus;
  priority: ServicePriority;
  deadline: string | null;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  quotedPrice: number | null;
  finalPrice: number | null;
  currency: string;
  assets: ServiceAsset[];
  revisions: ServiceRevision[];
  maxRevisions: number;
  internalNotes: string;
  clientNotes: string;
  createdAt: string;
  updatedAt: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ai_motion_graphics: 'AI Motion Graphics',
  video_content: 'Video Content',
  branding: 'Branding',
  printing: 'Printing',
  social_media_management: 'Social Media Management',
  content_creation: 'Content Creation',
  logo_design: 'Logo Design',
  flyer_design: 'Flyer Design',
  web_design: 'Web Design',
  other: 'Other',
};

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  ai_motion_graphics: '🎬',
  video_content: '🎥',
  branding: '🎨',
  printing: '🖨️',
  social_media_management: '📱',
  content_creation: '✍️',
  logo_design: '✏️',
  flyer_design: '📄',
  web_design: '🌐',
  other: '📦',
};

export const startupServiceService = {
  list: async (filters?: { startupId?: string; status?: string; serviceType?: string }): Promise<StartupServiceItem[]> => {
    const params = new URLSearchParams();
    if (filters?.startupId) params.set('startupId', filters.startupId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.serviceType) params.set('serviceType', filters.serviceType);
    const res = await api.get(`/startup-services?${params.toString()}`);
    return res.data.services;
  },

  create: async (data: {
    startupId: string;
    serviceType: ServiceType;
    title: string;
    description?: string;
    priority?: ServicePriority;
    deadline?: string;
    quotedPrice?: number;
    internalNotes?: string;
  }): Promise<StartupServiceItem> => {
    const res = await api.post('/startup-services', data);
    return res.data.service;
  },

  update: async (id: string, data: {
    status?: ServiceStatus;
    priority?: ServicePriority;
    deadline?: string | null;
    estimatedDelivery?: string | null;
    finalPrice?: number;
    internalNotes?: string;
    clientNotes?: string;
  }): Promise<StartupServiceItem> => {
    const res = await api.patch(`/startup-services/${id}`, data);
    return res.data.service;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/startup-services/${id}`);
  },

  uploadAsset: async (id: string, file: File, title?: string, type?: string): Promise<StartupServiceItem> => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    if (type) form.append('type', type);
    const res = await api.post(`/startup-services/${id}/assets`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.service;
  },

  requestRevision: async (id: string, notes: string): Promise<StartupServiceItem> => {
    const res = await api.post(`/startup-services/${id}/revisions`, { notes });
    return res.data.service;
  },

  updateRevision: async (id: string, revisionId: string, status: string): Promise<StartupServiceItem> => {
    const res = await api.patch(`/startup-services/${id}/revisions/${revisionId}`, { status });
    return res.data.service;
  },

  getStats: async (): Promise<{ stats: any[]; totalRevenue: number }> => {
    const res = await api.get('/startup-services/stats');
    return { stats: res.data.stats, totalRevenue: res.data.totalRevenue };
  },
};
