import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, ExternalLink, Play, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

interface SlideData {
  _id: string;
  assetId: string;
  bundleItemId: string | null;
  order: number;
  notes: string;
  asset: {
    _id: string;
    title: string;
    url: string;
    metadata: { mimeType: string; fileType: string; width?: number; height?: number; duration?: string };
    category: string;
    variants?: { _id: string; url: string; title: string; metadata: any }[];
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
  createdAt: string;
}

export default function SharedPresentationPage() {
  const { token } = useParams<{ token: string }>();
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const slides = presentation?.slides || [];
  const currentSlide = slides[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < slides.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, slides.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (!currentSlide?.asset) return;
    const a = document.createElement('a');
    a.href = currentSlide.asset.url;
    a.download = currentSlide.asset.title || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-text-muted">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-text">Presentation not found</p>
          <p className="text-sm text-text-muted">{error || 'This link may have expired or been revoked.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-black text-text">{presentation.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {presentation.client && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {presentation.client}
                </span>
              )}
              {presentation.industry && (
                <span className="text-[10px] text-text-muted">{presentation.industry}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {slides.length > 0 && (
              <span className="text-[10px] text-text-muted font-medium">
                {currentIndex + 1} / {slides.length}
              </span>
            )}
            <button onClick={toggleFullscreen}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 transition-colors">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button onClick={handleDownload}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 transition-colors">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main slide area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {currentSlide ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-border shadow-2xl">
                {currentSlide.asset ? (
                  currentSlide.asset.metadata?.mimeType?.startsWith('video/') ? (
                    <video
                      src={currentSlide.asset.url}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={currentSlide.asset.url}
                      alt={currentSlide.asset.title || ''}
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <p className="text-sm">Asset not available</p>
                  </div>
                )}
              </div>

              {/* Slide info */}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text">{currentSlide.asset?.title || `Slide ${currentIndex + 1}`}</h3>
                  {currentSlide.asset?.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary mt-1 inline-block">
                      {currentSlide.asset.category}
                    </span>
                  )}
                  {currentSlide.notes && (
                    <p className="text-xs text-text-muted mt-2">{currentSlide.notes}</p>
                  )}
                </div>
                {currentSlide.asset?.url && (
                  <a href={currentSlide.asset.url} target="_blank" rel="noopener noreferrer"
                    className="p-2 rounded-xl text-text-muted hover:text-primary transition-colors shrink-0">
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {/* Variants */}
              {currentSlide.asset?.variants && currentSlide.asset.variants.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Versions</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary shrink-0">
                      <img src={currentSlide.asset.url} alt="Original" className="w-full h-full object-cover" />
                    </div>
                    {currentSlide.asset.variants.map(v => (
                      <a key={v._id} href={v.url} target="_blank" rel="noopener noreferrer"
                        className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 shrink-0 transition-colors">
                        <img src={v.url} alt={v.title} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-20 text-text-muted">
              <p className="text-lg font-semibold">No slides in this presentation</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      {slides.length > 0 && (
        <div className="sticky bottom-0 z-30 bg-card/80 backdrop-blur-xl border-t border-border px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-center gap-4">
            <button onClick={goPrev} disabled={currentIndex === 0}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    i === currentIndex ? "bg-primary w-6" : "bg-border hover:bg-text-muted"
                  )}
                />
              ))}
            </div>
            <button onClick={goNext} disabled={currentIndex === slides.length - 1}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Tags */}
      {presentation.tags.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
          <div className="flex flex-wrap gap-2">
            {presentation.tags.map(t => (
              <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
