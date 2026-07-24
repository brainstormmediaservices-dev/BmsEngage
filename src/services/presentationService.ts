import api from './api';
import { MediaAsset } from '../types/media';

export interface PresentationSlide {
  _id: string;
  assetId: string;
  bundleItemId: string | null;
  order: number;
  notes: string;
}

export interface Presentation {
  _id: string;
  title: string;
  description: string;
  context: 'personal' | 'agency';
  agencyId: string | null;
  createdBy: string;
  client: string;
  industry: string;
  tags: string[];
  slides: PresentationSlide[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetStar {
  _id: string;
  assetId: string | MediaAsset;
  starredBy: string;
  context: 'personal' | 'agency';
  agencyId: string | null;
  createdAt: string;
}

export const assetStarService = {
  list: async (context?: string): Promise<AssetStar[]> => {
    const res = await api.get('/asset-stars', { params: { context } });
    return res.data.stars;
  },
  star: async (assetId: string): Promise<{ starred: boolean }> => {
    const res = await api.post(`/asset-stars/${assetId}`);
    return res.data;
  },
  unstar: async (assetId: string): Promise<{ starred: boolean }> => {
    const res = await api.delete(`/asset-stars/${assetId}`);
    return res.data;
  },
  check: async (assetId: string): Promise<{ starred: boolean }> => {
    const res = await api.get(`/asset-stars/check/${assetId}`);
    return res.data;
  },
  stats: async (): Promise<{ totalStars: number; recentStars: any[] }> => {
    const res = await api.get('/asset-stars/stats');
    return res.data;
  },
};

export const presentationService = {
  list: async (context?: string): Promise<Presentation[]> => {
    const res = await api.get('/presentations', { params: { context } });
    return res.data.presentations;
  },
  getOne: async (id: string): Promise<Presentation> => {
    const res = await api.get(`/presentations/${id}`);
    return res.data.presentation;
  },
  create: async (data: Partial<Presentation>): Promise<Presentation> => {
    const res = await api.post('/presentations', data);
    return res.data.presentation;
  },
  update: async (id: string, data: Partial<Presentation>): Promise<Presentation> => {
    const res = await api.patch(`/presentations/${id}`, data);
    return res.data.presentation;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/presentations/${id}`);
  },
  addSlides: async (id: string, assetIds: string[], bundleItemId?: string): Promise<Presentation> => {
    const res = await api.post(`/presentations/${id}/slides`, { assetIds, bundleItemId });
    return res.data.presentation;
  },
  reorderSlides: async (id: string, slideOrders: { slideId: string; order: number }[]): Promise<Presentation> => {
    const res = await api.patch(`/presentations/${id}/slides/reorder`, { slideOrders });
    return res.data.presentation;
  },
  removeSlide: async (id: string, slideId: string): Promise<Presentation> => {
    const res = await api.delete(`/presentations/${id}/slides/${slideId}`);
    return res.data.presentation;
  },
  duplicateSlide: async (id: string, slideId: string): Promise<Presentation> => {
    const res = await api.post(`/presentations/${id}/slides/${slideId}/duplicate`);
    return res.data.presentation;
  },
  recommendations: async (): Promise<{ recommended: MediaAsset[] }> => {
    const res = await api.get('/presentations/recommendations/assets');
    return res.data;
  },
};
