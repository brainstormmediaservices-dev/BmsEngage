import * as React from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  X, ChevronLeft, ChevronRight, MessageSquare, AlertCircle,
  Send, CheckCircle2, User, Building2, Layers, Clock,
  Trash2, Reply, Smile, Check, History, Play, Pause,
  Expand, Minimize, Monitor,
} from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  addComment, deleteComment, addCorrection, resolveCorrection,
  deleteCorrection, replyToComment, reactToComment, approveAsset,
} from '../../services/mediaService';

interface PresentationViewProps {
  assets: MediaAsset[];
  initialIndex?: number;
  onClose: () => void;
  onAssetUpdate: (asset: MediaAsset) => void;
  startups?: { id: string; name: string; logo: string | null }[];
  isCreativeMode?: boolean;
}

type PanelTab = 'comments' | 'revisions';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];
const SLIDESHOW_INTERVAL = 5000;

export const PresentationView = ({ assets, initialIndex = 0, onClose, onAssetUpdate, startups = [], isCreativeMode = false }: PresentationViewProps) => {
  const [index, setIndex] = useState(initialIndex);
  const [panelTab, setPanelTab] = useState<PanelTab>('comments');
  const [localAssets, setLocalAssets] = useState<MediaAsset[]>(assets);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [correctionText, setCorrectionText] = useState('');
  const [correctionTimestamp, setCorrectionTimestamp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showEmojiFor, setShowEmojiFor] = useState<string | null>(null);
  const [approvingStatus, setApprovingStatus] = useState<'approved' | 'rejected' | null>(null);
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveringPreview, setHoveringPreview] = useState(false);
  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { canComment, canRequestCorrection, canApproveAsset } = usePermissions();

  const effectiveCanComment = isCreativeMode ? true : canComment;
  const effectiveCanRequestCorrection = isCreativeMode ? false : canRequestCorrection;
  const effectiveCanApprove = isCreativeMode ? false : canApproveAsset;

  const asset = localAssets[index];

  const sortedVariants = useMemo(() => {
    if (!asset) return [];
    return [...asset.variants].sort((a, b) =>
      new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
    );
  }, [asset]);

  const displayAsset = useMemo(() => {
    if (!asset) return null;
    if (activeVariantId) {
      const v = asset.variants.find(v => v.id === activeVariantId);
      if (v) return v;
    }
    if (sortedVariants.length > 0) return sortedVariants[0];
    return asset;
  }, [asset, activeVariantId, sortedVariants]);

  useEffect(() => { setActiveVariantId(null); }, [index]);

  const goNext = useCallback(() => {
    if (index < localAssets.length - 1) setIndex(i => i + 1);
    else setSlideshowPlaying(false);
  }, [index, localAssets.length]);

  const goPrev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1));
  }, []);

  const toggleSlideshow = useCallback(() => {
    setSlideshowPlaying(p => !p);
  }, []);

  // Slideshow timer
  useEffect(() => {
    if (!slideshowPlaying || localAssets.length <= 1) {
      if (slideshowRef.current) { clearInterval(slideshowRef.current); slideshowRef.current = null; }
      return;
    }
    slideshowRef.current = setInterval(goNext, SLIDESHOW_INTERVAL);
    return () => { if (slideshowRef.current) { clearInterval(slideshowRef.current); slideshowRef.current = null; } };
  }, [slideshowPlaying, goNext, localAssets.length]);

  // Pause on hover
  useEffect(() => {
    if (hoveringPreview && slideshowPlaying) {
      if (slideshowRef.current) { clearInterval(slideshowRef.current); slideshowRef.current = null; }
    } else if (!hoveringPreview && slideshowPlaying && localAssets.length > 1) {
      slideshowRef.current = setInterval(goNext, SLIDESHOW_INTERVAL);
    }
    return () => { if (slideshowRef.current) { clearInterval(slideshowRef.current); slideshowRef.current = null; } };
  }, [hoveringPreview, slideshowPlaying, goNext, localAssets.length]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try { await document.documentElement.requestFullscreen(); setIsFullscreen(true); }
      catch {}
    } else {
      try { await document.exitFullscreen(); setIsFullscreen(false); }
      catch {}
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const startupInfo = asset?.startupId ? startups.find(s => s.id === asset.startupId) ?? null : null;
  const startupName = startupInfo?.name ?? null;

  const sync = useCallback((updated: MediaAsset) => {
    setLocalAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    onAssetUpdate(updated);
  }, [onAssetUpdate]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose();
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === ' ') { e.preventDefault(); toggleSlideshow(); }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext, toggleSlideshow]);

  const handleAddComment = async () => {
    if (!asset || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await addComment(asset.id, commentText.trim());
      sync(updated); setCommentText('');
      toast('Comment added', 'success');
    } catch { toast('Failed to add comment', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!asset) return;
    try { const u = await deleteComment(asset.id, commentId); sync(u); }
    catch { toast('Failed to delete comment', 'error'); }
  };

  const handleReply = async (commentId: string) => {
    if (!asset || !replyText.trim()) return;
    try {
      const u = await replyToComment(asset.id, commentId, replyText.trim());
      sync(u); setReplyText(''); setReplyingTo(null);
    } catch { toast('Failed to add reply', 'error'); }
  };

  const handleReact = async (commentId: string, emoji: string) => {
    if (!asset) return;
    setShowEmojiFor(null);
    try { const u = await reactToComment(asset.id, commentId, emoji); sync(u); }
    catch { toast('Failed to react', 'error'); }
  };

  const handleAddCorrection = async () => {
    if (!asset || !correctionText.trim()) return;
    setSubmitting(true);
    try {
      const u = await addCorrection(asset.id, correctionText.trim(), correctionTimestamp.trim() || undefined);
      sync(u); setCorrectionText(''); setCorrectionTimestamp('');
      toast('Revision submitted', 'success');
    } catch { toast('Failed to submit revision', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleResolveCorrection = async (corrId: string) => {
    if (!asset) return;
    try { const u = await resolveCorrection(asset.id, corrId); sync(u); }
    catch { toast('Failed to update revision', 'error'); }
  };

  const handleDeleteCorrection = async (corrId: string) => {
    if (!asset) return;
    try { const u = await deleteCorrection(asset.id, corrId); sync(u); toast('Revision deleted', 'success'); }
    catch { toast('Failed to delete revision', 'error'); }
  };

  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!asset) return;
    setApprovingStatus(status);
    try {
      const updated = await approveAsset(asset.id, status);
      sync(updated);
      toast(status === 'approved' ? 'Asset approved' : 'Asset rejected', status === 'approved' ? 'success' : 'info');
    } catch { toast('Failed to update approval', 'error'); }
    finally { setApprovingStatus(null); }
  };

  if (!asset || !displayAsset) return null;

  const openRevisions = asset.corrections.filter(c => c.status === 'open');

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col lg:flex-row">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <button onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
            <X size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold tabular-nums">
              {index + 1} / {localAssets.length}
            </div>
            {isCreativeMode && (
              <div className="px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-sm text-white text-xs font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                My Assets
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {localAssets.length > 1 && (
            <button onClick={toggleSlideshow}
              className={cn('p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold',
                slideshowPlaying
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              )}
              title={slideshowPlaying ? 'Pause slideshow (Space)' : 'Start slideshow (Space)'}>
              {slideshowPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span className="hidden sm:inline">{slideshowPlaying ? 'Pause' : 'Play'}</span>
            </button>
          )}
          <button onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <Minimize size={16} /> : <Expand size={16} />}
          </button>
        </div>
      </div>

      {/* ── Progress dots ──────────────────────────────────────────── */}
      {localAssets.length > 1 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 max-w-[80vw] overflow-hidden px-2">
          {localAssets.map((_, i) => (
            <button key={i} onClick={() => { setIndex(i); setSlideshowPlaying(false); }}
              className={cn('h-1.5 rounded-full transition-all shrink-0',
                i === index
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50 w-1.5'
              )} />
          ))}
        </div>
      )}

      {/* ── Left: full-screen asset preview ─────────────────────────── */}
      <div ref={previewRef}
        onMouseEnter={() => setHoveringPreview(true)}
        onMouseLeave={() => setHoveringPreview(false)}
        className="flex-1 relative flex items-center justify-center bg-black min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={asset.id + (activeVariantId || '')}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full h-full flex items-center justify-center p-4 lg:p-8"
          >
            {asset.metadata?.mimeType?.startsWith('video/') ? (
              <video
                src={displayAsset.url}
                controls
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            ) : (
              <img
                src={displayAsset.url}
                alt={asset.title}
                className="max-w-full max-h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Startup watermark */}
        {startupInfo && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
            {startupInfo.logo
              ? <img src={startupInfo.logo} alt={startupInfo.name} className="w-6 h-6 rounded-lg object-cover" />
              : <div className="w-6 h-6 rounded-lg bg-primary/30 flex items-center justify-center text-white font-black text-xs">
                  {startupInfo.name.charAt(0).toUpperCase()}
                </div>
            }
            <span className="text-white/80 text-xs font-bold">{startupInfo.name}</span>
          </div>
        )}

        {/* Prev / Next arrows — visible on hover or always on mobile */}
        {index > 0 && (
          <button onClick={() => { goPrev(); setSlideshowPlaying(false); }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-2xl bg-black/40 hover:bg-black/60 text-white transition-all opacity-60 hover:opacity-100">
            <ChevronLeft size={22} />
          </button>
        )}
        {index < localAssets.length - 1 && (
          <button onClick={() => { goNext(); setSlideshowPlaying(false); }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-2xl bg-black/40 hover:bg-black/60 text-white transition-all opacity-60 hover:opacity-100">
            <ChevronRight size={22} />
          </button>
        )}

        {/* ── Asset info bar at bottom ─────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 sm:px-8 pt-12 pb-4 sm:pb-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-white font-black text-lg sm:text-2xl leading-tight">{asset.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-white/60 text-xs sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <User size={13} /> {asset.uploadedBy}
                </span>
                {startupName && (
                  <span className="flex items-center gap-1.5">
                    {startupInfo?.logo
                      ? <img src={startupInfo.logo} alt={startupName} className="w-4 h-4 rounded-sm object-cover" />
                      : <Building2 size={13} />
                    }
                    {startupName}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Layers size={13} /> v{asset.variants.length + 1}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {new Date(asset.metadata.createdDate).toLocaleDateString()}
                </span>
              </div>

              {/* Variant selector */}
              {sortedVariants.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-1">
                    <History size={10} /> Versions:
                  </span>
                  <button onClick={() => setActiveVariantId(null)}
                    className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase transition-all',
                      !activeVariantId ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20')}>
                    Original
                  </button>
                  {sortedVariants.map((v, i) => (
                    <button key={v.id} onClick={() => setActiveVariantId(v.id!)}
                      className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase transition-all',
                        activeVariantId === v.id ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20')}>
                      v{v.version}.0 {i === 0 ? '(Latest)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest',
                asset.approvalStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                asset.approvalStatus === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-amber-500/20 text-amber-400'
              )}>
                {asset.approvalStatus === 'pending' ? 'Pending' : asset.approvalStatus}
              </span>

              {effectiveCanApprove && (
                <>
                  {asset.approvalStatus !== 'approved' && (
                    <button onClick={() => handleApprove('approved')} disabled={approvingStatus !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40">
                      <CheckCircle2 size={12} /> Approve
                    </button>
                  )}
                  {asset.approvalStatus !== 'rejected' && (
                    <button onClick={() => handleApprove('rejected')} disabled={approvingStatus !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40">
                      <X size={12} /> Reject
                    </button>
                  )}
                </>
              )}

              {openRevisions.length > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400">
                  {openRevisions.length} Open Revision{openRevisions.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: comments + revisions panel ───────────────────────── */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-[#0E0E11] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col max-h-[45vh] lg:max-h-none">
        <div className="flex gap-1 p-3 border-b border-white/10 shrink-0">
          {([
            { key: 'comments' as PanelTab, label: 'Comments', icon: <MessageSquare size={14} />, count: asset.comments.length },
            ...(!isCreativeMode ? [{ key: 'revisions' as PanelTab, label: 'Revisions', icon: <AlertCircle size={14} />, count: openRevisions.length }] : []),
          ]).map(tab => (
            <button key={tab.key} onClick={() => setPanelTab(tab.key)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all',
                panelTab === tab.key ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-white/50 hover:text-white hover:bg-white/5'
              )}>
              {tab.icon} {tab.label}
              {tab.count > 0 && (
                <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black',
                  panelTab === tab.key ? 'bg-white/20' : 'bg-primary/20 text-primary'
                )}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {panelTab === 'comments' && (
            <>
              {asset.comments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare size={28} className="text-white/20 mb-2" />
                  <p className="text-xs text-white/40">No comments yet.</p>
                </div>
              )}
              {asset.comments.map(c => {
                const reactionGroups: Record<string, { count: number; userReacted: boolean; names: string[] }> = {};
                c.reactions.forEach(r => {
                  if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, userReacted: false, names: [] };
                  reactionGroups[r.emoji].count++;
                  reactionGroups[r.emoji].names.push(r.authorName);
                  if (r.userId === user?.id) reactionGroups[r.emoji].userReacted = true;
                });
                return (
                  <div key={c.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{c.authorName}</p>
                        <p className="text-xs text-white/80 leading-relaxed">{c.text}</p>
                        {Object.keys(reactionGroups).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(reactionGroups).map(([emoji, data]) => (
                              <button key={emoji} onClick={() => handleReact(c.id, emoji)}
                                className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition-all',
                                  data.userReacted ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/50 hover:border-primary/30'
                                )}>
                                {emoji} <span className="text-[10px] font-bold">{data.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.replies.length > 0 && (
                          <div className="mt-2 space-y-1 pl-3 border-l-2 border-white/10">
                            {c.replies.map(r => (
                              <div key={r.id} className="text-[10px]">
                                <span className="font-bold text-primary">{r.authorName}: </span>
                                <span className="text-white/50">{r.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[10px] text-white/30">{new Date(c.createdAt).toLocaleString()}</p>
                          {effectiveCanComment && (
                            <>
                              <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                                className="text-[10px] text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                                <Reply size={10} /> Reply
                              </button>
                              <div className="relative">
                                <button onClick={() => setShowEmojiFor(showEmojiFor === c.id ? null : c.id)}
                                  className="text-[10px] text-white/40 hover:text-primary transition-colors flex items-center gap-1">
                                  <Smile size={10} /> React
                                </button>
                                <AnimatePresence>
                                  {showEmojiFor === c.id && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                      className="absolute bottom-6 left-0 flex gap-1 p-2 bg-[#1a1a22] border border-white/10 rounded-2xl shadow-xl z-10">
                                      {EMOJIS.map(e => (
                                        <button key={e} onClick={() => handleReact(c.id, e)} className="text-base hover:scale-125 transition-transform p-0.5">{e}</button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </>
                          )}
                        </div>
                        {replyingTo === c.id && (
                          <div className="flex gap-2 mt-2">
                            <input value={replyText} onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReply(c.id); } }}
                              placeholder={`Reply to ${c.authorName}...`}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-primary/50"
                              autoFocus />
                            <button onClick={() => handleReply(c.id)} disabled={!replyText.trim()}
                              className="p-1.5 bg-primary text-white rounded-lg disabled:opacity-40">
                              <Send size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteComment(c.id)}
                        className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {panelTab === 'revisions' && (
            <>
              {asset.corrections.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <AlertCircle size={28} className="text-white/20 mb-2" />
                  <p className="text-xs text-white/40">No revisions yet.</p>
                </div>
              )}
              {asset.corrections.map(c => (
                <div key={c.id} className={cn('p-3 rounded-2xl border group',
                  c.status === 'open' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10 opacity-60'
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">{c.authorName}</p>
                        {c.timestamp && <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">@ {c.timestamp}</span>}
                        <span className={cn('ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                          c.status === 'open' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'
                        )}>{c.status}</span>
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed">{c.text}</p>
                      <p className="text-[10px] text-white/30 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => handleResolveCorrection(c.id)}
                        className={cn('p-1.5 rounded-lg transition-all',
                          c.status === 'open'
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-white/20 hover:bg-white/5'
                        )} title={c.status === 'open' ? 'Mark resolved' : 'Reopen'}>
                        <Check size={12} />
                      </button>
                      <button onClick={() => handleDeleteCorrection(c.id)}
                        className="p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="p-3 border-t border-white/10 shrink-0">
          {panelTab === 'comments' && effectiveCanComment && (
            <div className="flex gap-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                placeholder="Add a comment… (Enter to send)"
                rows={2}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary/50 resize-none"
              />
              <button onClick={handleAddComment} disabled={!commentText.trim() || submitting}
                className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-40 transition-all self-end">
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}
          {panelTab === 'revisions' && effectiveCanRequestCorrection && (
            <div className="space-y-2">
              <input
                value={correctionTimestamp}
                onChange={e => setCorrectionTimestamp(e.target.value)}
                placeholder="Timestamp (optional, e.g. 1:23)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary/50"
              />
              <div className="flex gap-2">
                <textarea
                  value={correctionText}
                  onChange={e => setCorrectionText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCorrection(); } }}
                  placeholder="Describe the revision needed… (Enter to send)"
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-primary/50 resize-none"
                />
                <button onClick={handleAddCorrection} disabled={!correctionText.trim() || submitting}
                  className="p-2.5 bg-orange-500 text-white rounded-xl disabled:opacity-40 transition-all self-end">
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
