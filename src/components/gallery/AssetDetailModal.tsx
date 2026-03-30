import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  FileText, Image as ImageIcon, Film, Calendar, User, Info,
  Download, Share2, History, ChevronDown, ChevronUp, ExternalLink,
  Clock, Maximize2, Edit2, MessageSquare, AlertCircle, CheckCircle2,
  Trash2, Send, Loader2, Plus, Reply, Smile,
} from 'lucide-react';
import { MediaAsset, MediaVariant } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../ui/Toast';
import { addComment, deleteComment, addCorrection, resolveCorrection, deleteCorrection, replyToComment, reactToComment, approveAsset } from '../../services/mediaService';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  onEdit: (asset: MediaAsset) => void;
  onDownload: (asset: MediaAsset | MediaVariant) => void;
  onShare: (asset: MediaAsset) => void;
  onAssetUpdate?: (asset: MediaAsset) => void;
  onAddVariantForCorrection?: (asset: MediaAsset, correctionId: string) => void;
}

type RightTab = 'info' | 'comments' | 'corrections';

export const AssetDetailModal = ({ isOpen, onClose, asset, onEdit, onShare, onAssetUpdate, onAddVariantForCorrection }: AssetDetailModalProps) => {
  const [showMetadata, setShowMetadata] = React.useState(true);
  const [activeVariant, setActiveVariant] = React.useState<MediaAsset | MediaVariant | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [rightTab, setRightTab] = React.useState<RightTab>('info');
  const previewRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // local copy so we can update comments/corrections without closing modal
  const [localAsset, setLocalAsset] = React.useState<MediaAsset | null>(null);

  const [commentText, setCommentText] = React.useState('');
  const [correctionText, setCorrectionText] = React.useState('');
  const [correctionTimestamp, setCorrectionTimestamp] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [showEmojiFor, setShowEmojiFor] = React.useState<string | null>(null);
  const [approvingStatus, setApprovingStatus] = React.useState<'approved' | 'rejected' | null>(null);
  const { canComment, canRequestCorrection, canApproveAsset, canDeleteAsset, canUploadVersion } = usePermissions();
  const { user } = useAuth();

  const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

  // Uploader = person who uploaded this asset
  const isUploader = !!user?.id && localAsset?.ownerId === user.id;

  const sortedVariants = React.useMemo(() => {
    if (!localAsset) return [];
    return [...localAsset.variants].sort((a, b) =>
      new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
    );
  }, [localAsset]);

  React.useEffect(() => {
    if (asset) {
      setLocalAsset(asset);
      setActiveVariant(prev => {
        if (!prev) return asset.variants.length > 0
          ? [...asset.variants].sort((a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime())[0]
          : asset;
        return prev;
      });
    }
  }, [asset]);

  React.useEffect(() => {
    if (localAsset) {
      if (sortedVariants.length > 0) setActiveVariant(sortedVariants[0]);
      else setActiveVariant(localAsset);
    }
  }, [localAsset?.id]);

  const sync = (updated: MediaAsset) => {
    setLocalAsset(updated);
    onAssetUpdate?.(updated);
  };

  const handleFullscreen = async () => {
    const el = previewRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) { await el.requestFullscreen(); setIsFullscreen(true); }
      else { await document.exitFullscreen(); setIsFullscreen(false); }
    } catch { if (activeVariant) window.open(activeVariant.url, '_blank'); }
  };

  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleDownload = async () => {
    if (!activeVariant) return;
    setIsDownloading(true);
    try {
      const response = await fetch(activeVariant.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${activeVariant.title}.${activeVariant.metadata.fileType?.toLowerCase() || 'file'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast('Download started', 'success');
    } catch {
      window.open(activeVariant.url, '_blank');
      toast('Opened in new tab', 'info');
    } finally { setIsDownloading(false); }
  };

  const handleAddComment = async () => {
    if (!localAsset || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await addComment(localAsset.id, commentText.trim());
      sync(updated);
      setCommentText('');
      toast('Comment added', 'success');
    } catch { toast('Failed to add comment', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!localAsset) return;
    try {
      const updated = await deleteComment(localAsset.id, commentId);
      sync(updated);
      toast('Comment deleted', 'success');
    } catch { toast('Failed to delete comment', 'error'); }
  };

  const handleReplyToComment = async (commentId: string) => {
    if (!localAsset || !replyText.trim()) return;
    try {
      const updated = await replyToComment(localAsset.id, commentId, replyText.trim());
      sync(updated);
      setReplyText('');
      setReplyingTo(null);
      toast('Reply added', 'success');
    } catch { toast('Failed to add reply', 'error'); }
  };

  const handleReact = async (commentId: string, emoji: string) => {
    if (!localAsset) return;
    setShowEmojiFor(null);
    try {
      const updated = await reactToComment(localAsset.id, commentId, emoji);
      sync(updated);
    } catch { toast('Failed to react', 'error'); }
  };

  const handleAddCorrection = async () => {
    if (!localAsset || !correctionText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await addCorrection(localAsset.id, correctionText.trim(), correctionTimestamp.trim() || undefined);
      sync(updated);
      setCorrectionText('');
      setCorrectionTimestamp('');
      toast('Revision request submitted', 'success');
    } catch { toast('Failed to submit revision', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!localAsset) return;
    setApprovingStatus(status);
    try {
      const updated = await approveAsset(localAsset.id, status);
      sync(updated);
      toast(status === 'approved' ? 'Asset approved ✅' : 'Asset rejected', status === 'approved' ? 'success' : 'info');
    } catch { toast('Failed to update approval', 'error'); }
    finally { setApprovingStatus(null); }
  };

  const handleResolveCorrection = async (correctionId: string) => {
    if (!localAsset) return;
    try {
      const updated = await resolveCorrection(localAsset.id, correctionId);
      sync(updated);
    } catch { toast('Failed to update correction', 'error'); }
  };

  const handleDeleteCorrection = async (correctionId: string) => {
    if (!localAsset) return;
    try {
      const updated = await deleteCorrection(localAsset.id, correctionId);
      sync(updated);
      toast('Correction deleted', 'success');
    } catch { toast('Failed to delete correction', 'error'); }
  };

  if (!localAsset || !activeVariant) return null;
  const metadata = activeVariant.metadata;

  const tabs: { key: RightTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'info', label: 'Info', icon: <Info size={14} /> },
    { key: 'comments', label: 'Comments', icon: <MessageSquare size={14} />, count: localAsset.comments?.length },
    { key: 'corrections', label: 'Revisions', icon: <AlertCircle size={14} />, count: localAsset.corrections?.filter(c => c.status === 'open').length },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={localAsset.title} maxWidth="max-w-6xl">
      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">

        {/* Left: Preview + Version History */}
        <div className="flex-1 space-y-6">
          <div ref={previewRef} className="relative aspect-video bg-black/40 rounded-3xl overflow-hidden border border-border group flex items-center justify-center">
            {localAsset.category === 'Video' ? (
              <video src={activeVariant.url} controls className="w-full h-full object-contain" preload="metadata" />
            ) : (
              <img src={activeVariant.url} alt={activeVariant.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            )}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" onClick={handleFullscreen} className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60">
                <Maximize2 size={16} className="mr-2" /> {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <History size={16} /> Version History
              </h4>
              <span className="text-xs text-primary font-bold">{localAsset.variants.length + 1} Versions</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sortedVariants.map((variant, index) => (
                <button key={variant.id} onClick={() => setActiveVariant(variant)}
                  className={cn("p-3 rounded-xl border transition-all text-left relative",
                    activeVariant.id === variant.id ? "bg-primary/10 border-primary shadow-lg shadow-primary/20" : "bg-card border-border hover:border-primary/50"
                  )}>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", activeVariant.id === variant.id ? "text-primary" : "text-text-muted")}>
                    {variant.correctionReplyTo ? 'Fix' : 'Variant'}
                  </p>
                  <p className="text-xs font-bold text-text truncate">v{variant.version}.0 - {variant.title}</p>
                  {variant.uploadedBy && (
                    <p className="text-[9px] text-text-muted truncate mt-0.5">by {variant.uploadedBy}</p>
                  )}
                  {index === 0 && <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-primary text-[6px] font-bold uppercase text-white">Latest</div>}
                </button>
              ))}
              <button onClick={() => setActiveVariant(localAsset)}
                className={cn("p-3 rounded-xl border transition-all text-left",
                  activeVariant.id === localAsset.id ? "bg-primary/10 border-primary shadow-lg shadow-primary/20" : "bg-card border-border hover:border-primary/50"
                )}>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", activeVariant.id === localAsset.id ? "text-primary" : "text-text-muted")}>Original</p>
                <p className="text-xs font-bold text-text truncate">v1.0 - Master</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tabbed Panel */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-border">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setRightTab(tab.key)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all",
                  rightTab === tab.key ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-text-muted hover:text-text"
                )}>
                {tab.icon} {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn("ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    rightTab === tab.key ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Info Tab */}
          {rightTab === 'info' && (
            <div className="bg-card border border-border rounded-3xl p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {localAsset.category === 'Image' ? <ImageIcon size={20} /> : localAsset.category === 'Video' ? <Film size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                    <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{localAsset.category}</p>
                    <p className="text-sm font-bold text-text">{metadata.fileType} Asset</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Clock size={16} /></motion.div> : <Download size={16} />}
                    <span className="ml-2 hidden sm:inline">Download</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => localAsset && onShare(localAsset)}>
                    <Share2 size={16} /><span className="ml-2 hidden sm:inline">Share</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Description</h5>
                  <p className="text-sm text-text leading-relaxed">{localAsset.description || 'No description provided.'}</p>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {localAsset.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-4">
                <button onClick={() => setShowMetadata(!showMetadata)}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-text hover:text-primary transition-colors">
                  <span className="flex items-center gap-2"><Info size={14} /> Technical Metadata</span>
                  {showMetadata ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showMetadata && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ['File Size', metadata.fileSize],
                          ['Resolution', metadata.resolution || `${metadata.width}x${metadata.height}`],
                          ['MIME Type', metadata.mimeType],
                          ['Color Model', metadata.colorModel || 'N/A'],
                          ...(metadata.duration ? [['Duration', metadata.duration]] : []),
                          ...(metadata.frameRate ? [['Frame Rate', `${metadata.frameRate} fps`]] : []),
                        ].map(([label, value]) => (
                          <div key={label} className="space-y-1">
                            <p className="text-[10px] text-text-muted uppercase font-bold">{label}</p>
                            <p className="text-xs font-bold text-text truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                {[
                  [<Calendar size={14} />, 'Uploaded on', new Date(metadata.createdDate).toLocaleDateString()],
                  [<User size={14} />, 'Uploaded by', localAsset.uploadedBy],
                  [<Clock size={14} />, 'Last modified', new Date(metadata.modifiedDate).toLocaleDateString()],
                ].map(([icon, label, value], i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-text-muted">{icon}</span>
                    <span className="text-text-muted">{label}</span>
                    <span className="text-text font-bold ml-auto">{value as string}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                {/* Approval status badge */}
                <div className={cn('flex items-center justify-between p-3 rounded-xl border',
                  localAsset.approvalStatus === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20' :
                  localAsset.approvalStatus === 'rejected' ? 'bg-red-500/5 border-red-500/20' :
                  'bg-amber-500/5 border-amber-500/20'
                )}>
                  <div className="flex items-center gap-2">
                    {localAsset.approvalStatus === 'approved' ? <CheckCircle2 size={14} className="text-emerald-500" /> :
                     localAsset.approvalStatus === 'rejected' ? <AlertCircle size={14} className="text-red-500" /> :
                     <Clock size={14} className="text-amber-500" />}
                    <span className={cn('text-xs font-bold capitalize',
                      localAsset.approvalStatus === 'approved' ? 'text-emerald-500' :
                      localAsset.approvalStatus === 'rejected' ? 'text-red-500' : 'text-amber-500'
                    )}>
                      {localAsset.approvalStatus === 'pending' ? 'Awaiting Approval' : localAsset.approvalStatus}
                    </span>
                  </div>
                  {/* Approve/Reject buttons — Production/Marketing/Executive only */}
                  {canApproveAsset && localAsset.approvalStatus !== 'approved' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleApprove('approved')} disabled={approvingStatus !== null}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
                        <CheckCircle2 size={10} /> Approve
                      </button>
                      {localAsset.approvalStatus !== 'rejected' && (
                        <button onClick={() => handleApprove('rejected')} disabled={approvingStatus !== null}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
                          <AlertCircle size={10} /> Reject
                        </button>
                      )}
                    </div>
                  )}
                  {canApproveAsset && localAsset.approvalStatus === 'approved' && (
                    <button onClick={() => handleApprove('rejected')} disabled={approvingStatus !== null}
                      className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
                      <AlertCircle size={10} /> Reject
                    </button>
                  )}
                </div>

                {/* Edit — uploader only */}
                {isUploader && (
                  <Button onClick={() => onEdit(localAsset)} className="w-full"><Edit2 size={16} className="mr-2" /> Edit Asset Details</Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => activeVariant && window.open(activeVariant.url, '_blank')}>
                  <ExternalLink size={16} className="mr-2" /> Open in New Tab
                </Button>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {rightTab === 'comments' && (
            <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
                {(!localAsset.comments || localAsset.comments.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare size={32} className="text-text-muted mb-3 opacity-40" />
                    <p className="text-xs text-text-muted">No comments yet. Be the first!</p>
                  </div>
                )}
                <AnimatePresence>
                  {(localAsset.comments || []).map(c => {
                    // Group reactions by emoji
                    const reactionGroups: Record<string, { count: number; names: string[]; userReacted: boolean }> = {};
                    (c.reactions || []).forEach(r => {
                      if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, names: [], userReacted: false };
                      reactionGroups[r.emoji].count++;
                      reactionGroups[r.emoji].names.push(r.authorName);
                      if (r.userId === user?.id) reactionGroups[r.emoji].userReacted = true;
                    });

                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{c.authorName}</p>
                            <p className="text-xs text-text leading-relaxed">{c.text}</p>

                            {/* Reactions row */}
                            {Object.keys(reactionGroups).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(reactionGroups).map(([emoji, data]) => (
                                  <button key={emoji} onClick={() => handleReact(c.id, emoji)}
                                    title={data.names.join(', ')}
                                    className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition-all',
                                      data.userReacted ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-text-muted hover:border-primary/30'
                                    )}>
                                    {emoji} <span className="text-[10px] font-bold">{data.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Replies */}
                            {(c.replies || []).length > 0 && (
                              <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-white/10">
                                {c.replies.map(r => (
                                  <div key={r.id} className="text-[10px]">
                                    <span className="font-bold text-primary">{r.authorName}: </span>
                                    <span className="text-text-muted">{r.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[10px] text-text-muted">{new Date(c.createdAt).toLocaleString()}</p>
                              {canComment && (
                                <>
                                  <button onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                                    className="text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1">
                                    <Reply size={10} /> Reply
                                  </button>
                                  <div className="relative">
                                    <button onClick={() => setShowEmojiFor(showEmojiFor === c.id ? null : c.id)}
                                      className="text-[10px] text-text-muted hover:text-primary transition-colors flex items-center gap-1">
                                      <Smile size={10} /> React
                                    </button>
                                    <AnimatePresence>
                                      {showEmojiFor === c.id && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                          className="absolute bottom-6 left-0 flex gap-1 p-2 bg-card border border-border rounded-2xl shadow-xl z-10">
                                          {EMOJIS.map(e => (
                                            <button key={e} onClick={() => handleReact(c.id, e)}
                                              className="text-base hover:scale-125 transition-transform p-0.5">{e}</button>
                                          ))}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Reply input */}
                            {replyingTo === c.id && (
                              <div className="flex gap-2 mt-2">
                                <input
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReplyToComment(c.id); } }}
                                  placeholder={`Reply to ${c.authorName}...`}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-text placeholder:text-text-muted outline-none focus:border-primary/50"
                                  autoFocus
                                />
                                <button onClick={() => handleReplyToComment(c.id)} disabled={!replyText.trim()}
                                  className="p-1.5 bg-primary text-white rounded-lg disabled:opacity-40 transition-all">
                                  <Send size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <button onClick={() => handleDeleteComment(c.id)}
                            className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                  placeholder="Add a comment..."
                  rows={2}
                  disabled={!canComment}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50 resize-none transition-all disabled:opacity-40"
                />
                <button onClick={handleAddComment} disabled={!commentText.trim() || submitting || !canComment}
                  className="p-2 bg-primary text-white rounded-xl hover:bg-primary/80 disabled:opacity-40 transition-all self-end">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Corrections Tab */}
          {rightTab === 'corrections' && (
            <div className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
                {(!localAsset.corrections || localAsset.corrections.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle size={32} className="text-text-muted mb-3 opacity-40" />
                    <p className="text-xs text-text-muted">No revision requests yet.</p>
                  </div>
                )}
                <AnimatePresence>
                  {(localAsset.corrections || []).map(c => {
                    // Find variant that replied to this correction
                    const replyVariant = localAsset.variants.find(v => v.correctionReplyTo === c.id);
                    const isOwner = localAsset.ownerId === user?.id;
                    const isRequester = !isOwner; // simplified: non-owner who can see corrections

                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                        className={cn("border rounded-2xl group transition-all",
                          c.status === 'resolved' ? "bg-green-500/5 border-green-500/20" : "bg-orange-500/5 border-orange-500/20"
                        )}>
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{c.authorName}</p>
                                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase",
                                  c.status === 'resolved' ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                                )}>{c.status}</span>
                              </div>
                              <p className="text-xs text-text leading-relaxed">{c.text}</p>
                              {c.timestamp && (
                                <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-bold">
                                  <Clock size={9} /> {c.timestamp}
                                </span>
                              )}
                              <p className="text-[10px] text-text-muted mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                              {canApproveAsset && (
                                <button onClick={() => handleResolveCorrection(c.id)}
                                  title={c.status === 'resolved' ? 'Reopen' : 'Resolve'}
                                  className={cn("p-1.5 rounded-lg transition-all",
                                    c.status === 'resolved'
                                      ? "text-text-muted hover:text-orange-400 hover:bg-orange-500/10"
                                      : "text-text-muted hover:text-green-400 hover:bg-green-500/10"
                                  )}>
                                  <CheckCircle2 size={12} />
                                </button>
                              )}
                              {canDeleteAsset && (
                                <button onClick={() => handleDeleteCorrection(c.id)}
                                  className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reply variant — shown when creative uploaded a fix */}
                          {replyVariant && (
                            <div className="mt-2 p-2 bg-green-500/5 border border-green-500/15 rounded-xl flex items-center gap-2">
                              <Reply size={11} className="text-green-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-green-400">
                                  {replyVariant.uploadedBy || 'Creative'} uploaded v{replyVariant.version}.0
                                </p>
                                <button
                                  onClick={() => setActiveVariant(replyVariant)}
                                  className="text-[9px] text-primary hover:underline"
                                >
                                  View version →
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Actions for the correction requester */}
                          {c.status === 'open' && !replyVariant && (
                            <div className="mt-2 flex gap-2">
                              {/* Resolve — person who requested can resolve */}
                              <button
                                onClick={() => handleResolveCorrection(c.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-[10px] font-bold transition-all"
                              >
                                <CheckCircle2 size={10} /> Resolve
                              </button>
                              {/* Reply — add another correction as follow-up */}
                              {canRequestCorrection && (
                                <button
                                  onClick={() => {
                                    setCorrectionText(`@${c.authorName} `);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-[10px] font-bold transition-all"
                                >
                                  <Reply size={10} /> Reply
                                </button>
                              )}
                              {/* Upload fix — uploader (creative) */}
                              {isUploader && onAddVariantForCorrection && (
                                <button
                                  onClick={() => { onAddVariantForCorrection(localAsset, c.id); onClose(); }}
                                  className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold transition-all"
                                >
                                  <Plus size={10} /> Upload Fix
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                {/* Optional timestamp for videos */}
                {localAsset.category === 'Video' && (
                  <input
                    value={correctionTimestamp}
                    onChange={e => setCorrectionTimestamp(e.target.value)}
                    placeholder="Timestamp (e.g. 1:23) — optional"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50 transition-all"
                  />
                )}
                <div className="flex gap-2">
                  <textarea
                    value={correctionText}
                    onChange={e => setCorrectionText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCorrection(); } }}
                    placeholder="Describe the revision needed..."
                    rows={2}
                    disabled={!canRequestCorrection}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50 resize-none transition-all disabled:opacity-40"
                  />
                  <button onClick={handleAddCorrection} disabled={!correctionText.trim() || submitting || !canRequestCorrection}
                    className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-500/80 disabled:opacity-40 transition-all self-end">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
