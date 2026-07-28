import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PresentationSlide } from '../services/presentationService';
import PresentationStage from '../components/presentation/PresentationStage';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

interface SlideData {
  _id: string;
  assetId: string | null;
  bundleItemId: string | null;
  elements: any[];
  background: any;
  transition: string;
  order: number;
  notes: string;
  label: string;
  asset: {
    _id: string;
    title: string;
    url: string;
    metadata: { mimeType: string; fileType: string; width?: number; height?: number };
    category: string;
  } | null;
}

interface PresentationData {
  _id: string;
  title: string;
  description: string;
  client: string;
  industry: string;
  tags: string[];
  slides: SlideData[];
  slideWidth: number;
  slideHeight: number;
  createdAt: string;
}

export default function SharedPresentMode() {
  const { token } = useParams<{ token: string }>();
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/presentations/public/${token}`)
      .then(r => {
        if (!r.ok) throw new Error('Presentation not found');
        return r.json();
      })
      .then(data => setPresentation(data.presentation))
      .catch(e => setError(e.message || 'Failed to load presentation'))
      .finally(() => setLoading(false));
  }, [token]);

  // Convert shared data to PresentationSlide format, resolving legacy slides
  const slides: PresentationSlide[] = useMemo(() => {
    if (!presentation) return [];
    return presentation.slides.map(s => {
      // If slide has elements, use them directly
      if (s.elements && s.elements.length > 0) {
        return {
          _id: s._id,
          assetId: s.assetId,
          bundleItemId: s.bundleItemId,
          elements: s.elements,
          background: s.background || { type: 'color', value: '#1a1a2e', opacity: 1, blur: 0, brightness: 100, videoAutoplay: true, videoLoop: true, videoMuted: true },
          transition: (s.transition as any) || 'fade',
          order: s.order,
          notes: s.notes,
          hidden: false,
          label: s.label || '',
        };
      }
      // Legacy slide — create full-screen media element
      if (s.asset) {
        const isVideo = s.asset.metadata?.mimeType?.startsWith('video/');
        return {
          _id: s._id,
          assetId: s.assetId,
          bundleItemId: s.bundleItemId,
          elements: [{
            _id: `legacy-${s._id}`,
            type: isVideo ? 'video' : 'image',
            x: 0,
            y: 0,
            width: presentation.slideWidth || 1920,
            height: presentation.slideHeight || 1080,
            rotation: 0,
            opacity: 1,
            zIndex: 0,
            locked: false,
            visible: true,
            content: '',
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#ffffff',
            textAlign: 'left',
            lineHeight: 1.4,
            letterSpacing: 0,
            src: s.asset.url,
            objectFit: 'contain',
            autoplay: isVideo,
            loop: isVideo,
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
          }],
          background: s.background || { type: 'color', value: '#1a1a2e', opacity: 1, blur: 0, brightness: 100, videoAutoplay: true, videoLoop: true, videoMuted: true },
          transition: (s.transition as any) || 'fade',
          order: s.order,
          notes: s.notes,
          hidden: false,
          label: s.label || '',
        };
      }
      // Empty slide
      return {
        _id: s._id,
        assetId: null,
        bundleItemId: null,
        elements: [],
        background: { type: 'color', value: '#1a1a2e', opacity: 1, blur: 0, brightness: 100, videoAutoplay: true, videoLoop: true, videoMuted: true },
        transition: 'fade' as const,
        order: s.order,
        notes: s.notes,
        hidden: false,
        label: '',
      };
    }).sort((a, b) => a.order - b.order);
  }, [presentation]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white/50 space-y-3">
          <p className="text-lg font-bold">Presentation not found</p>
          <p className="text-sm">{error || 'This link may have expired or been revoked.'}</p>
        </div>
      </div>
    );
  }

  return (
    <PresentationStage
      slides={slides}
      slideWidth={presentation.slideWidth || 1920}
      slideHeight={presentation.slideHeight || 1080}
      title={presentation.title}
      isShared={true}
    />
  );
}
