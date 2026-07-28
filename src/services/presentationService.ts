import api from './api';
import { MediaAsset } from '../types/media';

export interface SlideElement {
  _id?: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'icon' | 'chart' | 'embed' | 'audio' | 'gif' | 'lottie' | 'svg' | 'button';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  // Text
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  textAlign: string;
  lineHeight: number;
  letterSpacing: number;
  // Media
  src: string;
  objectFit: string;
  // Video/Audio
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  startTime: number;
  endTime: number;
  playbackSpeed: number;
  poster: string;
  // Shape
  shapeType: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
  // Shadow
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;
  // Border
  borderWidth: number;
  borderStyle: string;
  borderColor: string;
  // Animation
  animationType: string;
  animationDelay: number;
  animationDuration: number;
  animationTrigger: 'enter' | 'click' | 'auto';
  // Chart
  chartType: string;
  chartData: any;
  // Embed
  embedUrl: string;
  // Button
  buttonLabel: string;
  buttonUrl: string;
  buttonBg: string;
  buttonColor: string;
  buttonRadius: number;
}

export interface SlideBackground {
  type: 'color' | 'image' | 'video' | 'gradient' | 'none';
  value: string;
  opacity: number;
  blur: number;
  brightness: number;
  videoAutoplay: boolean;
  videoLoop: boolean;
  videoMuted: boolean;
}

export interface PresentationSlide {
  _id: string;
  assetId: string | null;
  bundleItemId: string | null;
  elements: SlideElement[];
  background: SlideBackground;
  transition: 'fade' | 'slide' | 'push' | 'zoom' | 'none';
  order: number;
  notes: string;
  hidden: boolean;
  label: string;
  asset?: MediaAsset | null;
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
  imageBundleId: string | null;
  videoBundleId: string | null;
  imageBundle?: MediaAsset | null;
  videoBundle?: MediaAsset | null;
  slideWidth: number;
  slideHeight: number;
  shareToken?: string;
  sharedWith?: string[];
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
  addRichSlides: async (id: string, slides: Partial<PresentationSlide>[]): Promise<Presentation> => {
    const res = await api.post(`/presentations/${id}/slides`, { slides });
    return res.data.presentation;
  },
  updateSlide: async (id: string, slideId: string, data: Partial<PresentationSlide>): Promise<Presentation> => {
    const res = await api.put(`/presentations/${id}/slides/${slideId}`, data);
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
  generateShareLink: async (id: string, email?: string): Promise<{ shareToken: string; shareUrl: string }> => {
    const res = await api.post(`/presentations/${id}/share`, { email });
    return res.data;
  },
  toggleSlideHidden: async (id: string, slideId: string): Promise<Presentation> => {
    const res = await api.patch(`/presentations/${id}/slides/${slideId}/toggle-hidden`);
    return res.data.presentation;
  },
  setBundles: async (id: string, imageBundleId?: string | null, videoBundleId?: string | null): Promise<Presentation> => {
    const res = await api.post(`/presentations/${id}/bundle`, { imageBundleId, videoBundleId });
    return res.data.presentation;
  },
};

// Helper to create a default blank slide
export function createBlankSlide(order: number): Partial<PresentationSlide> {
  return {
    elements: [],
    background: { type: 'color', value: '#1a1a2e', opacity: 1, blur: 0, brightness: 100, videoAutoplay: true, videoLoop: true, videoMuted: true },
    transition: 'fade',
    order,
    notes: '',
    hidden: false,
    label: '',
  };
}

// Helper to create a text element
export function createTextElement(overrides?: Partial<SlideElement>): SlideElement {
  return {
    type: 'text',
    x: 100,
    y: 100,
    width: 400,
    height: 60,
    rotation: 0,
    opacity: 1,
    zIndex: 0,
    locked: false,
    visible: true,
    content: 'Text',
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 1.4,
    letterSpacing: 0,
    src: '',
    objectFit: 'cover',
    autoplay: false,
    loop: false,
    muted: true,
    startTime: 0,
    endTime: 0,
    playbackSpeed: 1,
    poster: '',
    shapeType: 'rectangle',
    fill: '#6366f1',
    stroke: 'transparent',
    strokeWidth: 0,
    borderRadius: 0,
    shadowX: 0,
    shadowY: 4,
    shadowBlur: 12,
    shadowColor: 'rgba(0,0,0,0.25)',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: '#000000',
    animationType: 'none',
    animationDelay: 0,
    animationDuration: 500,
    animationTrigger: 'enter',
    chartType: 'bar',
    chartData: null,
    embedUrl: '',
    buttonLabel: '',
    buttonUrl: '',
    buttonBg: '#6366f1',
    buttonColor: '#ffffff',
    buttonRadius: 8,
    ...overrides,
  };
}

// Helper to create an image element
export function createImageElement(src: string, overrides?: Partial<SlideElement>): SlideElement {
  return createTextElement({
    type: 'image',
    src,
    width: 600,
    height: 400,
    ...overrides,
  });
}

// Helper to create a shape element
export function createShapeElement(shapeType: string, overrides?: Partial<SlideElement>): SlideElement {
  return createTextElement({
    type: 'shape',
    shapeType,
    fill: '#6366f1',
    width: 200,
    height: 200,
    ...overrides,
  });
}

// Helper to create a video element
export function createVideoElement(src: string, overrides?: Partial<SlideElement>): SlideElement {
  return createTextElement({
    type: 'video',
    src,
    width: 800,
    height: 450,
    autoplay: true,
    muted: true,
    loop: false,
    ...overrides,
  });
}
