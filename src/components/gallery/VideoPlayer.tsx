import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Volume1,
  Maximize, Minimize, SkipBack, SkipForward,
  Settings, PictureInPicture, Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface VideoPlayerProps {
  src: string;
  autoPlay?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  onLoadedMetadata?: (duration: number) => void;
  className?: string;
  seekTo?: number | null;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const VideoPlayer = ({
  src, autoPlay = false, onTimeUpdate, onEnded, onLoadedMetadata,
  className, seekTo,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [hasAutoplayFailed, setHasAutoplayFailed] = useState(false);

  const v = videoRef.current;

  // Auto-play with fallback to muted
  useEffect(() => {
    if (!v || !autoPlay) return;
    const tryPlay = async () => {
      try {
        await v.play();
        setPlaying(true);
      } catch {
        setHasAutoplayFailed(true);
        v.muted = true;
        setMuted(true);
        try {
          await v.play();
          setPlaying(true);
        } catch { /* give up */ }
      }
    };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('loadeddata', tryPlay, { once: true });
  }, [autoPlay, src]);

  // Seek externally
  useEffect(() => {
    if (v && seekTo != null && seekTo >= 0) {
      v.currentTime = seekTo;
      setCurrentTime(seekTo);
    }
  }, [seekTo]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // PiP event listeners
  useEffect(() => {
    if (!v) return;
    v.addEventListener('enterpictureinpicture', onPiPEnter);
    v.addEventListener('leavepictureinpicture', onPiPLeave);
    return () => {
      v.removeEventListener('enterpictureinpicture', onPiPEnter);
      v.removeEventListener('leavepictureinpicture', onPiPLeave);
    };
  }, [v]);

  // Keyboard shortcuts (only when container is focused or fullscreen)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!v) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => {
            const nv = Math.min(1, prev + 0.1);
            if (v) { v.volume = nv; v.muted = false; }
            setMuted(false);
            return nv;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => {
            const nv = Math.max(0, prev - 0.1);
            if (v) { v.volume = nv; }
            return nv;
          });
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'j':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case 'l':
          e.preventDefault();
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
          break;
        case ',':
          e.preventDefault();
          cycleSpeed(-1);
          break;
        case '.':
          e.preventDefault();
          cycleSpeed(1);
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [v, volume]);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) setShowControls(true);
    else resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [playing, resetHideTimer]);

  const togglePlay = useCallback(() => {
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, [v]);

  const toggleMute = useCallback(() => {
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, [v]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      try { await el.requestFullscreen(); } catch {}
    } else {
      try { await document.exitFullscreen(); } catch {}
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {}
  }, [v]);

  const cycleSpeed = useCallback((dir: number) => {
    if (!v) return;
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, idx + dir))];
    v.playbackRate = next;
    setSpeed(next);
  }, [v, speed]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!v || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * (v.duration || 0);
  }, [v]);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !v) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setSeekPreview(pct * (v.duration || 0));
  }, [v]);

  // Video events
  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onTime = () => {
    if (!v) return;
    setCurrentTime(v.currentTime);
    onTimeUpdate?.(v.currentTime);
  };
  const onDurationChange = () => {
    if (v) setDuration(v.duration);
  };
  const onProgress = () => {
    if (!v || !v.buffered.length) return;
    setBuffered(v.buffered.end(v.buffered.length - 1));
  };
  const onWaiting = () => setBuffering(true);
  const onCanPlay = () => { setLoading(false); setBuffering(false); };
  const onLoadStart = () => setLoading(true);
  const onLoadedData = () => {
    setLoading(false);
    if (v) {
      setDuration(v.duration);
      onLoadedMetadata?.(v.duration);
    }
  };
  const onVolumeChange = () => {
    if (v) { setVolume(v.volume); setMuted(v.muted); }
  };
  const onEndedInternal = () => {
    setPlaying(false);
    onEnded?.();
  };
  const onPiPEnter = () => setIsPiP(true);
  const onPiPLeave = () => setIsPiP(false);

  const volumeIcon = muted || volume === 0
    ? <VolumeX size={18} />
    : volume < 0.5
      ? <Volume1 size={18} />
      : <Volume2 size={18} />;

  return (
    <div
      ref={containerRef}
      className={cn('relative group bg-black select-none overflow-hidden', className)}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
      onDoubleClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
      style={{ touchAction: 'manipulation' }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTime}
        onDurationChange={onDurationChange}
        onProgress={onProgress}
        onWaiting={onWaiting}
        onCanPlay={onCanPlay}
        onLoadStart={onLoadStart}
        onLoadedData={onLoadedData}
        onVolumeChange={onVolumeChange}
        onEnded={onEndedInternal}
      />

      {/* Loading spinner */}
      {(loading || buffering) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Big center play button (shown when paused and controls visible) */}
      {!playing && !loading && showControls && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
            <Play size={36} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient background */}
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-2 px-3 sm:px-4">

          {/* Progress bar */}
          <div
            ref={progressRef}
            className="relative w-full h-2 sm:h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-3 sm:hover:h-2.5 transition-all mb-3"
            onClick={handleProgressClick}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setSeekPreview(null)}
          >
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/20 rounded-full pointer-events-none"
              style={{ width: duration ? `${(buffered / duration) * 100}%` : '0%' }}
            />
            {/* Played */}
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full pointer-events-none"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            {/* Seek preview */}
            {seekPreview != null && (
              <div
                className="absolute top-0 h-full bg-white/30 rounded-full pointer-events-none"
                style={{ width: duration ? `${(seekPreview / duration) * 100}%` : '0%' }}
              />
            )}
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-3 sm:h-3 bg-primary rounded-full shadow-lg shadow-primary/50 pointer-events-none opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: duration ? `calc(${(currentTime / duration) * 100}% - 6px)` : '0' }}
            />
            {/* Seek tooltip */}
            {seekPreview != null && (
              <div
                className="absolute -top-8 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded pointer-events-none -translate-x-1/2"
                style={{ left: duration ? `${(seekPreview / duration) * 100}%` : '0' }}
              >
                {formatTime(seekPreview)}
              </div>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay}
              className="p-2 text-white hover:text-primary transition-colors rounded-xl hover:bg-white/10">
              {playing ? <Pause size={20} /> : <Play size={20} fill="white" />}
            </button>

            {/* Skip back 10s */}
            <button onClick={() => { if (v) v.currentTime = Math.max(0, v.currentTime - 10); }}
              className="hidden sm:flex p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/10"
              title="Rewind 10s (J)">
              <SkipBack size={16} />
            </button>

            {/* Skip forward 10s */}
            <button onClick={() => { if (v) v.currentTime = Math.min(duration, v.currentTime + 10); }}
              className="hidden sm:flex p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/10"
              title="Forward 10s (L)">
              <SkipForward size={16} />
            </button>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-1 group/vol">
              <button onClick={toggleMute}
                className="p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/10">
                {volumeIcon}
              </button>
              <div className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-200">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (v) { v.volume = val; v.muted = val === 0; }
                    setVolume(val);
                    setMuted(val === 0);
                  }}
                  className="w-full h-1 accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Mobile volume toggle */}
            <button onClick={toggleMute}
              className="sm:hidden p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/10">
              {volumeIcon}
            </button>

            {/* Time */}
            <div className="flex-1 text-center">
              <span className="text-[11px] sm:text-xs text-white/80 font-mono font-bold tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Speed */}
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 text-[11px] sm:text-xs text-white/70 hover:text-white font-bold rounded-lg hover:bg-white/10 transition-all">
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a22] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-30">
                  {SPEEDS.map(s => (
                    <button key={s} onClick={() => {
                      if (v) v.playbackRate = s;
                      setSpeed(s);
                      setShowSpeedMenu(false);
                    }}
                      className={cn('block w-full px-4 py-2 text-xs font-bold text-left transition-all whitespace-nowrap',
                        s === speed ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}>
                      {s === 1 ? 'Normal' : `${s}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP */}
            <button onClick={togglePiP}
              className="hidden sm:flex p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/10"
              title="Picture in Picture">
              <PictureInPicture size={16} />
            </button>

            {/* Fullscreen */}
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-xl hover:bg-white/10"
              title="Fullscreen (F)">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
