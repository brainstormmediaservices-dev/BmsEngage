import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Eye, Edit2, Trash2, Plus, Share2, MoreVertical } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface MediaCardProps {
  asset: MediaAsset;
  onView: (a: MediaAsset) => void;
  onEdit?: (a: MediaAsset) => void;
  onDelete?: (a: MediaAsset) => void;
  onShare?: (a: MediaAsset) => void;
  onAddVariant?: (a: MediaAsset) => void;
  onSchedule?: (a: MediaAsset) => void;
}

export const MediaCard = ({ asset, onView, onEdit, onDelete, onShare, onAddVariant, onSchedule }: MediaCardProps) => {
  const { canUploadAsset } = usePermissions();
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const isUploader = !!user?.id && asset.ownerId === user.id;
  const isAgencyOwner = user?.activeContext === 'agency' && user?.agencyRole === 'owner';
  const canEdit = isUploader;
  const canDelete = asset.context === 'agency' ? isAgencyOwner : isUploader;
  const canVariant = canUploadAsset && isUploader;

  const displayUrl = asset.variants.length > 0
    ? [...asset.variants].sort((a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime())[0].url
    : asset.url;

  const openMenuAt = (x: number, y: number) => {
    setMenuPos({ top: y + window.scrollY + 8, right: Math.max(8, window.innerWidth - x - 104) });
    setShowMenu(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    didLongPress.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      openMenuAt(touch.clientX, touch.clientY);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (menuRef.current?.contains(e.target as Node)) return;
    if ((e.target as HTMLElement).closest('button')) return;
    if (didLongPress.current) { didLongPress.current = false; return; }
    onView(asset);
  };

  // Close menu on outside click
  const handleMenuOutside = (e: MouseEvent) => {
    if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
  };
  if (showMenu) document.addEventListener('mousedown', handleMenuOutside, { once: true });

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-[0_0_20px_-5px_rgba(124,58,237,0.2)] transition-all cursor-pointer select-none"
    >
      <div className="aspect-square overflow-hidden">
        {asset.metadata?.mimeType?.startsWith('video/') || asset.category === 'Video' ? (
          <video src={displayUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" muted />
        ) : (
          <img src={displayUrl} alt={asset.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
        )}
      </div>

      {/* Hover overlay — shows Eye icon as hint */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
        <div className="p-3 bg-white/20 rounded-2xl text-white">
          <Eye size={22} />
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {asset.category}
          </span>
          <span className="text-[10px] text-text-muted font-medium">
            {new Date(asset.metadata.createdDate).toLocaleDateString()}
          </span>
        </div>
        <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors text-text">{asset.title}</h4>
      </div>

      {/* Portaled context menu */}
      {showMenu && createPortal(
        <AnimatePresence>
          <motion.div ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999 }}
            className="w-52 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-1.5">
            <button onClick={() => { onView(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
              <Eye size={14} /> View Asset
            </button>
            {onSchedule && (
              <button onClick={() => { onSchedule(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-primary hover:bg-primary/5 rounded-xl transition-colors font-bold">
                <Calendar size={14} /> Schedule
              </button>
            )}
            {canEdit && onEdit && (
              <button onClick={() => { onEdit(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
                <Edit2 size={14} /> Edit Asset
              </button>
            )}
            {canVariant && onAddVariant && (
              <button onClick={() => { onAddVariant(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
                <Plus size={14} /> Add Variant
              </button>
            )}
            {isUploader && onShare && (
              <button onClick={() => { onShare(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors">
                <Share2 size={14} /> Share Asset
              </button>
            )}
            {canDelete && onDelete && (
              <button onClick={() => { onDelete(asset); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                <Trash2 size={14} /> Delete Asset
              </button>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
