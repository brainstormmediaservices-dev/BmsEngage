import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { presentationService, Presentation, PresentationSlide } from '../services/presentationService';
import { mediaService } from '../services/mediaService';
import { MediaAsset } from '../types/media';
import PresentationStage from '../components/presentation/PresentationStage';

export default function PresentMode() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [resolvedSlides, setResolvedSlides] = useState<PresentationSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    presentationService.getOne(id)
      .then(async (p) => {
        setPresentation(p);
        // Resolve legacy slides that reference assets
        const resolved = await resolveSlides(p);
        setResolvedSlides(resolved);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Failed to load presentation');
        setLoading(false);
      });
  }, [id]);

  const resolveSlides = async (p: Presentation): Promise<PresentationSlide[]> => {
    const slides = [...p.slides].sort((a, b) => a.order - b.order);
    // Find slides that need asset resolution (legacy slides with assetId but no elements)
    const needsResolve = slides.filter(s => s.assetId && (!s.elements || s.elements.length === 0));
    
    if (needsResolve.length === 0) return slides;

    // Fetch all needed assets
    const assetIds = [...new Set(needsResolve.map(s => s.assetId!))];
    let assetMap: Record<string, MediaAsset> = {};
    
    try {
      const allMedia = await mediaService.getMedia();
      const mediaList = Array.isArray(allMedia) ? allMedia : [];
      assetIds.forEach(aid => {
        const found = mediaList.find((m: any) => (m.id || m._id) === aid);
        if (found) assetMap[aid] = found;
      });
    } catch {}

    // Convert legacy slides to new format with full-slide media elements
    return slides.map(s => {
      if (s.assetId && (!s.elements || s.elements.length === 0)) {
        const asset = assetMap[s.assetId];
        if (asset) {
          const isVideo = asset.metadata?.mimeType?.startsWith('video/');
          const element = {
            _id: `legacy-${s._id}`,
            type: (isVideo ? 'video' : 'image') as 'image' | 'video',
            x: 0,
            y: 0,
            width: p.slideWidth || 1920,
            height: p.slideHeight || 1080,
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
            src: asset.url,
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
            animationTrigger: 'enter' as const,
            chartType: 'bar',
            chartData: null,
            embedUrl: '',
            buttonLabel: '',
            buttonUrl: '',
            buttonBg: '#6366f1',
            buttonColor: '#ffffff',
            buttonRadius: 8,
          };
          return { ...s, elements: [element], asset };
        }
      }
      return s;
    });
  };

  const handleExit = () => {
    navigate('/presentations');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-white/50">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white/50 space-y-3">
          <p className="text-lg font-bold">Presentation not found</p>
          <p className="text-sm">{error || 'This presentation may have been deleted.'}</p>
          <button onClick={handleExit} className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white text-sm">
            Back to Presentations
          </button>
        </div>
      </div>
    );
  }

  return (
    <PresentationStage
      slides={resolvedSlides}
      slideWidth={presentation.slideWidth || 1920}
      slideHeight={presentation.slideHeight || 1080}
      title={presentation.title}
      isShared={false}
      onExit={handleExit}
    />
  );
}
