import { Calendar, Eye, Edit2, Trash2, Plus, Share2 } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../contexts/AuthContext';

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
  const { canUploadAsset, canDeleteAsset } = usePermissions();
  const { user } = useAuth();

  const isUploader = !!user?.id && asset.ownerId === user.id;
  const isAgencyOwner = user?.activeContext === 'agency' && user?.agencyRole === 'owner';

  const canEdit = isUploader;
  const canDelete = asset.context === 'agency' ? isAgencyOwner : isUploader;
  const canVariant = canUploadAsset && isUploader;

  const displayUrl = asset.variants.length > 0
    ? [...asset.variants].sort((a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime())[0].url
    : asset.url;

  return (
    <div className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-[0_0_20px_-5px_rgba(124,58,237,0.2)] transition-all">
      <div className="aspect-square overflow-hidden">
        {asset.metadata?.mimeType?.startsWith('video/') || asset.category === 'Video' ? (
          <video src={displayUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" muted />
        ) : (
          <img src={displayUrl} alt={asset.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
        )}
      </div>

      {/* Hover overlay — actions based on role */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
        <button onClick={() => onView(asset)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110" title="View">
          <Eye size={18} />
        </button>
        {onSchedule && (
          <button onClick={() => onSchedule(asset)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110" title="Schedule">
            <Calendar size={18} />
          </button>
        )}
        {canEdit && onEdit && (
          <button onClick={() => onEdit(asset)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110" title="Edit">
            <Edit2 size={18} />
          </button>
        )}
        {canVariant && onAddVariant && (
          <button onClick={() => onAddVariant(asset)} className="p-2 bg-primary hover:bg-primary/80 rounded-xl text-white transition-all hover:scale-110" title="Add Variant">
            <Plus size={18} />
          </button>
        )}
        {isUploader && onShare && (
          <button onClick={() => onShare(asset)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110" title="Share">
            <Share2 size={18} />
          </button>
        )}
        {canDelete && onDelete && (
          <button onClick={() => onDelete(asset)} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl text-red-500 transition-all hover:scale-110" title="Delete">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="p-4">
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
    </div>
  );
};
