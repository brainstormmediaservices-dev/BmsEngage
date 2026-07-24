import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, Copy, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { presentationService, Presentation } from '../../services/presentationService';
import { mediaService } from '../../services/mediaService';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';

interface PresentationViewerProps {
  presentationId: string;
  onClose: () => void;
}

export const PresentationViewer = ({ presentationId, onClose }: PresentationViewerProps) => {
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [assetMap, setAssetMap] = useState<Record<string, MediaAsset>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    presentationService.getOne(presentationId).then(async p => {
      setPresentation(p);
      // Fetch assets for all slides
      const assetIds = [...new Set(p.slides.map(s => s.assetId))];
      const map: Record<string, MediaAsset> = {};
      await Promise.all(assetIds.map(async id => {
        try {
          const res = await mediaService.getMedia();
          const found = (Array.isArray(res) ? res : []).find((a: any) => a.id === id || a._id === id);
          if (found) map[id] = found;
        } catch {}
      }));
      setAssetMap(map);
      setLoading(false);
    });
  }, [presentationId]);

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
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCopy = () => {
    if (currentSlide) {
      navigator.clipboard.writeText(currentSlide.notes || '');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white/50">Loading presentation...</div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white/50">
          <p className="font-semibold">Presentation not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white">{presentation.title}</h3>
            {presentation.client && (
              <p className="text-[10px] text-white/50">{presentation.client}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/50 font-medium mr-2">
            {currentIndex + 1} / {slides.length}
          </span>
          <button onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={handleCopy}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <AnimatePresence mode="wait">
          {currentSlide ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-4xl mx-auto"
            >
              <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-white/10">
                {/* Render the asset image/video */}
                {assetMap[currentSlide.assetId] && (
                  (assetMap[currentSlide.assetId] as any).metadata?.mimeType?.startsWith('video/') ? (
                    <video
                      src={assetMap[currentSlide.assetId].url}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                    />
                  ) : (
                    <img
                      src={assetMap[currentSlide.assetId].url}
                      alt={assetMap[currentSlide.assetId].title || ''}
                      className="w-full h-full object-contain"
                    />
                  )
                )}
                {!assetMap[currentSlide.assetId] && (
                  <div className="w-full h-full flex items-center justify-center text-white/30">
                    <p className="text-sm">Asset not loaded</p>
                  </div>
                )}
              </div>
              {currentSlide.notes && (
                <div className="mt-3 px-4 py-2 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/60">{currentSlide.notes}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-white/30 text-center">
              <p className="text-lg font-semibold mb-2">No slides</p>
              <p className="text-sm">Add slides to this presentation to view them here</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      {slides.length > 0 && (
        <div className="flex items-center justify-center gap-4 py-4 bg-black/80 backdrop-blur-sm border-t border-white/10 shrink-0">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentIndex ? "bg-primary w-6" : "bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>
          <button onClick={goNext} disabled={currentIndex === slides.length - 1}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
