import * as React from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Plus, Eye, Edit2, Trash2, FileText, Image as ImageIcon, Film, Layers, Calendar, Share2, AlertCircle, Clock, Reply, Building2 } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';

interface MediaAssetCardProps {
  asset: MediaAsset;
  currentUserId?: string;
  onView: (asset: MediaAsset) => void;
  onEdit: (asset: MediaAsset) => void;
  onAddVariant: (asset: MediaAsset) => void;
  onAddVariantForCorrection: (asset: MediaAsset, correctionId: string) => void;
  onDelete: (asset: MediaAsset) => void;
  onShare: (asset: MediaAsset) => void;
  onAcceptDelete: (asset: MediaAsset) => void;
  key?: any;
  startup?: { id: string; name: string; logo: string | null } | null;
}

export const MediaAssetCard = ({
  asset, currentUserId, onView, onEdit, onAddVariant, onAddVariantForCorrection,
  onDelete, onShare, onAcceptDelete, startup,
}: MediaAssetCardProps) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 0 });
  const navigate = useNavigate();
  const { canUploadAsset, canDeleteAsset } = usePermissions();
  const { user } = useAuth();

  // Uploader = the person who uploaded this asset
  const isUploader = !!currentUserId && asset.ownerId === currentUserId;
  // Shared recipient = in sharedWith but not the uploader
  const isSharedRecipient = !isUploader && (asset.sharedWith?.includes(currentUserId ?? ''));

  const openCorrections = (asset.corrections || []).filter(c => c.status === 'open');
  const hasDeleteRequest = !!asset.deleteRequest;
  const allAccepted = hasDeleteRequest &&
    asset.sharedWith.every(uid => asset.deleteRequest!.acceptances.includes(uid));

  // Delete rules:
  // - Agency context: only agency owner (agencyRole === 'owner') can delete
  // - Personal context: only uploader, and if shared all must accept first
  const isAgencyOwner = user?.activeContext === 'agency' && user?.agencyRole === 'owner';
  const canDelete = asset.context === 'agency'
    ? isAgencyOwner
    : isUploader && (asset.sharedWith.length === 0 || allAccepted);
  const canRequestDelete = asset.context !== 'agency' && isUploader && asset.sharedWith.length > 0 && !allAccepted;

  // Edit: only the uploader can edit in both contexts
  const canEdit = isUploader;

  const latestVariant = React.useMemo(() => {
    if (asset.variants.length === 0) return null;
    return [...asset.variants].sort((a, b) =>
      new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
    )[0];
  }, [asset.variants]);

  const displayAsset = latestVariant || asset;

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setShowMenu(false);
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowMenu(false); };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMenu]);

  const openMenu = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      right: window.innerWidth - rect.right,
    });
    setShowMenu(v => !v);
  };

  const getCategoryIcon = () => {
    switch (asset.category) {
      case 'Flyer': return <FileText size={14} />;
      case 'Image': return <ImageIcon size={14} />;
      case 'Video': return <Film size={14} />;
      case 'Graphics': return <Layers size={14} />;
      default: return <ImageIcon size={14} />;
    }
  };

  const getStatusColor = () => {
    switch (asset.status) {
      case 'In Development':    return 'text-blue-400 bg-blue-500/10';
      case 'Sent for Correction': return 'text-orange-400 bg-orange-500/10';
      case 'Corrected':         return 'text-cyan-400 bg-cyan-500/10';
      case 'Approved':          return 'text-emerald-500 bg-emerald-500/10';
      case 'Archived':          return 'text-text-muted bg-white/5';
      default:                  return 'text-text-muted bg-white/5';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative bg-card border border-border rounded-2xl transition-all hover:border-primary/50 hover:shadow-[0_20px_40px_-15px_rgba(65,1,121,0.3)] overflow-visible"
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] rounded-t-2xl overflow-hidden relative">
        {displayAsset.metadata?.mimeType?.startsWith('video/') || asset.category === 'Video' ? (
          <video src={displayAsset.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" muted />
        ) : (
          <img src={displayAsset.url} alt={asset.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
          <button onClick={() => onView(asset)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110" title="View">
            <Eye size={20} />
          </button>
          {canUploadAsset && isUploader && (
            <button onClick={() => onAddVariant(asset)} className="p-2.5 bg-primary hover:bg-primary-light rounded-xl text-white transition-all hover:scale-110 shadow-lg shadow-primary/40" title="Add Variant">
              <Plus size={20} />
            </button>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
            {getCategoryIcon()} {asset.category}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-primary/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
            {displayAsset.metadata.fileType}
          </div>
        </div>

        {latestVariant && (
          <div className="absolute top-3 right-12 px-2 py-0.5 rounded-full bg-primary text-[8px] font-bold uppercase tracking-widest text-white shadow-[0_0_10px_rgba(65,1,121,0.5)] animate-pulse">
            Latest
          </div>
        )}

        <div className={cn("absolute top-3 right-3 px-2 py-1 rounded-lg backdrop-blur-md text-[9px] font-bold uppercase tracking-wider border border-white/5 max-w-[90px] truncate", getStatusColor())}>
          {asset.status === 'Sent for Correction' ? 'For Correction' :
           asset.status === 'In Development' ? 'In Dev' :
           asset.status}
        </div>

        {/* Startup badge — bottom left of thumbnail */}
        {startup && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 max-w-[70%]">
            {startup.logo
              ? <img src={startup.logo} alt={startup.name} className="w-4 h-4 rounded-sm object-cover shrink-0" />
              : <Building2 size={11} className="text-white/70 shrink-0" />
            }
            <span className="text-[9px] font-bold text-white/80 truncate">{startup.name}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-bold text-text truncate group-hover:text-primary transition-colors flex-1">{asset.title}</h4>
          <div className="shrink-0">
            <button ref={btnRef} onClick={openMenu}
              className="p-1.5 text-text-muted hover:text-text hover:bg-white/5 rounded-lg transition-all">
              <MoreVertical size={16} />
            </button>

            {/* Portal dropdown — renders at document.body level, always on top */}
            {showMenu && createPortal(
              <AnimatePresence>
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
                  className="w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-1.5"
                >
                  <button onClick={() => { onView(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
                    <Eye size={14} /> View Asset
                  </button>
                  {canEdit && (
                    <button onClick={() => { onEdit(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
                      <Edit2 size={14} /> Edit Asset
                    </button>
                  )}
                  <button onClick={() => { navigate('/composer', { state: { asset, date: asset.targetDate ? asset.targetDate.split('T')[0] : undefined } }); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-primary hover:bg-primary/5 rounded-xl transition-colors font-bold">
                    <Calendar size={14} /> Schedule
                  </button>
                  {isUploader && (
                    <button onClick={() => { onShare(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
                      <Share2 size={14} /> Share Asset
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => { onDelete(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 size={14} /> Delete Asset
                    </button>
                  )}
                  {canRequestDelete && (
                    <button onClick={() => { onDelete(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                      <Trash2 size={14} /> {hasDeleteRequest ? 'Awaiting Acceptance' : 'Request Delete'}
                    </button>
                  )}
                </motion.div>
              </AnimatePresence>,
              document.body
            )}
          </div>
        </div>

        {/* Uploader tag for shared recipients */}
        {isSharedRecipient && (
          <p className="text-[9px] text-text-muted mb-2">by {asset.uploadedBy}</p>
        )}

        <div className="flex items-center justify-between text-[10px] text-text-muted font-medium mb-3">
          <span>{displayAsset.metadata.fileSize}</span>
          <div className="flex items-center gap-1">
            <Layers size={11} className="text-primary" />
            <span>{asset.variants.length + 1} Versions</span>
          </div>
        </div>

        {/* Latest variant — show uploader name if it's a correction reply */}
        {latestVariant && latestVariant.correctionReplyTo && (
          <div className="mb-2 px-2 py-1 bg-green-500/5 border border-green-500/15 rounded-xl flex items-center gap-1.5">
            <Reply size={10} className="text-green-400 shrink-0" />
            <p className="text-[9px] text-green-400 truncate">
              {latestVariant.uploadedBy || 'Creative'} replied to revision
            </p>
          </div>
        )}

        {/* Open corrections — shown to uploader (creative) */}
        {openCorrections.length > 0 && isUploader && canUploadAsset && (
          <div className="space-y-1.5 pt-3 border-t border-border">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1">
              <AlertCircle size={10} /> {openCorrections.length} Open Revision{openCorrections.length > 1 ? 's' : ''}
            </p>
            {openCorrections.slice(0, 2).map(c => (
              <div key={c.id} className="flex items-start justify-between gap-2 p-2 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-orange-400 mb-0.5">{c.authorName}</p>
                  <p className="text-[10px] text-text-muted leading-relaxed truncate">{c.text}</p>
                </div>
                <button
                  onClick={() => onAddVariantForCorrection(asset, c.id)}
                  title="Upload corrected version as reply"
                  className="shrink-0 p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
            ))}
            {openCorrections.length > 2 && (
              <p className="text-[9px] text-text-muted">+{openCorrections.length - 2} more</p>
            )}
          </div>
        )}

        {/* Open corrections — shown to the person who requested them (shared recipient) */}
        {openCorrections.length > 0 && isSharedRecipient && (
          <div className="space-y-1.5 pt-3 border-t border-border">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-1">
              <AlertCircle size={10} /> {openCorrections.length} Pending Revision{openCorrections.length > 1 ? 's' : ''}
            </p>
            {openCorrections.slice(0, 2).map(c => (
              <div key={c.id} className="p-2 bg-orange-500/5 border border-orange-500/15 rounded-xl">
                <p className="text-[9px] font-bold text-orange-400 mb-0.5">{c.authorName}</p>
                <p className="text-[10px] text-text-muted leading-relaxed truncate">{c.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Delete request — shown to shared recipients */}
        {isSharedRecipient && hasDeleteRequest && !asset.deleteRequest!.acceptances.includes(currentUserId ?? '') && (
          <div className="pt-3 border-t border-border">
            <div className="p-2.5 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Trash2 size={12} className="text-red-400 shrink-0" />
                <p className="text-[10px] text-red-300 truncate">Owner wants to delete</p>
              </div>
              <button onClick={() => onAcceptDelete(asset)}
                className="shrink-0 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[10px] font-bold transition-all">
                Accept
              </button>
            </div>
          </div>
        )}

        {/* Delete request pending — shown to uploader */}
        {isUploader && hasDeleteRequest && !allAccepted && (
          <div className="pt-3 border-t border-border">
            <div className="p-2 bg-orange-500/5 border border-orange-500/15 rounded-xl flex items-center gap-2">
              <Clock size={11} className="text-orange-400 shrink-0" />
              <p className="text-[10px] text-orange-300">
                Waiting: {asset.sharedWith.length - asset.deleteRequest!.acceptances.length}/{asset.sharedWith.length} to accept
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
