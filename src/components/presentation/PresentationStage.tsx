import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PresentationSlide } from '../../services/presentationService';
import SlideRenderer from './SlideRenderer';
import { cn } from '../../lib/utils';

interface PresentationStageProps {
  slides: PresentationSlide[];
  slideWidth: number;
  slideHeight: number;
  title: string;
  startSlide?: number;
  isShared?: boolean;
  onExit?: () => void;
}

export default function PresentationStage({
  slides,
  slideWidth,
  slideHeight,
  title,
  startSlide = 0,
  isShared = false,
  onExit,
}: PresentationStageProps) {
  const [currentIndex, setCurrentIndex] = useState(startSlide);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const visibleSlides = useMemo(() => slides.filter(s => !s.hidden), [slides]);
  const currentSlide = visibleSlides[currentIndex];

  // Scale computation
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const computeScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / slideWidth;
      const scaleY = vh / slideHeight;
      setScale(Math.min(scaleX, scaleY));
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, [slideWidth, slideHeight]);

  // Navigation
  const goNext = useCallback(() => {
    if (isTransitioning || currentIndex >= visibleSlides.length - 1) return;
    setDirection('next');
    setIsTransitioning(true);
    setCurrentIndex(i => i + 1);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [currentIndex, visibleSlides.length, isTransitioning]);

  const goPrev = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    setDirection('prev');
    setIsTransitioning(true);
    setCurrentIndex(i => i - 1);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [currentIndex, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setDirection(index > currentIndex ? 'next' : 'prev');
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [currentIndex, isTransitioning]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case 'ArrowRight': case ' ': case 'Enter': e.preventDefault(); goNext(); break;
        case 'ArrowLeft': e.preventDefault(); goPrev(); break;
        case 'Escape': e.preventDefault(); onExit?.(); break;
        case 'Home': e.preventDefault(); goToSlide(0); break;
        case 'End': e.preventDefault(); goToSlide(visibleSlides.length - 1); break;
        case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      }
      resetHideTimer();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, goToSlide, onExit, visibleSlides.length]);

  // Touch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      dx < 0 ? goNext() : goPrev();
    }
    resetHideTimer();
  }, [goNext, goPrev]);

  // Mouse click navigation
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const x = e.clientX;
    const vw = window.innerWidth;
    if (x > vw * 0.6) goNext();
    else if (x < vw * 0.4) goPrev();
    resetHideTimer();
  }, [goNext, goPrev]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resetHideTimer);
    resetHideTimer();
    return () => {
      window.removeEventListener('mousemove', resetHideTimer);
      clearTimeout(hideTimer.current);
    };
  }, [resetHideTimer]);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try { await document.documentElement.requestFullscreen(); } catch {}
    } else {
      try { await document.exitFullscreen(); } catch {}
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Enter fullscreen on mount
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // Slide transition variants
  const getVariants = () => {
    const transition = currentSlide?.transition || 'fade';
    switch (transition) {
      case 'slide':
        return {
          enter: (d: string) => ({ x: d === 'next' ? '100%' : '-100%', opacity: 0 }),
          center: { x: 0, opacity: 1 },
          exit: (d: string) => ({ x: d === 'next' ? '-100%' : '100%', opacity: 0 }),
        };
      case 'push':
        return {
          enter: (d: string) => ({ x: d === 'next' ? '100%' : '-100%' }),
          center: { x: 0 },
          exit: (d: string) => ({ x: d === 'next' ? '-100%' : '100%' }),
        };
      case 'zoom':
        return {
          enter: { scale: 0.8, opacity: 0 },
          center: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 },
        };
      case 'none':
        return {
          enter: {},
          center: {},
          exit: {},
        };
      case 'fade':
      default:
        return {
          enter: { opacity: 0 },
          center: { opacity: 1 },
          exit: { opacity: 0 },
        };
    }
  };

  const variants = getVariants();

  if (!visibleSlides.length) {
    return (
      <div ref={containerRef} className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white/50">
          <p className="text-lg font-semibold mb-2">No slides</p>
          <p className="text-sm">This presentation has no visible slides</p>
          {!isShared && onExit && (
            <button onClick={onExit} className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white text-sm">
              Back to Editor
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 select-none"
      style={{ cursor: controlsVisible ? 'default' : 'none' }}
      onClick={handleCanvasClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide content */}
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="shadow-2xl"
            style={{
              width: slideWidth,
              height: slideHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <SlideRenderer
              slide={currentSlide}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              isPresentMode={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Presenter controls */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10">
          {/* Previous */}
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Slide counter */}
          <span className="text-xs text-white/70 font-medium min-w-[60px] text-center tabular-nums">
            {currentIndex + 1} / {visibleSlides.length}
          </span>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={currentIndex === visibleSlides.length - 1}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>

          <div className="w-px h-5 bg-white/10" />

          {/* Fullscreen */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Exit */}
          {!isShared && onExit && (
            <button
              onClick={(e) => { e.stopPropagation(); onExit(); }}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Exit (Esc)"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Title bar (top) */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <h1 className="text-sm font-bold text-white/80">{title}</h1>
          {currentSlide?.label && (
            <span className="text-xs text-white/50">{currentSlide.label}</span>
          )}
        </div>
      </div>

      {/* Slide dots (mini navigation) */}
      <div
        className={cn(
          "fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-500",
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1.5 px-3 py-2 bg-black/50 backdrop-blur-xl rounded-full">
          {visibleSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentIndex ? "bg-white w-5" : "bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
