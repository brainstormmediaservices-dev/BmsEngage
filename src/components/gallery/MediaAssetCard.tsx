import * as React from 'react';
import { MoreVertical, Plus, Eye, Edit2, Trash2, FileText, Image as ImageIcon, Film, Layers, Calendar, Share2 } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface MediaAssetCardProps {
  asset: MediaAsset;
  onView: (asset: MediaAsset) => void;
  onEdit: (asset: MediaAsset) => void;
  onAddVariant: (asset: MediaAsset) => void;
  onDelete: (asset: MediaAsset) => void;
  onShare: (asset: MediaAsset) => void;
  key?: any;
}

export const MediaAssetCard = ({ asset, onView, onEdit, onAddVariant, onDelete, onShare }: MediaAssetCardProps) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const latestVariant = React.useMemo(() => {
    if (asset.variants.length === 0) return null;
    return [...asset.variants].sort((a, b) => 
      new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
    )[0];
  }, [asset.variants]);

  const displayAsset = latestVariant || asset;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false);
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMenu]);

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
      case 'Published': return 'text-emerald-500 bg-emerald-500/10';
      case 'Draft': return 'text-amber-500 bg-amber-500/10';
      case 'Archived': return 'text-text-muted bg-white/5';
      default: return 'text-text-muted bg-white/5';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      className="group relative bg-card border border-border rounded-2xl transition-all hover:border-primary/50 hover:shadow-[0_20px_40px_-15px_rgba(65,1,121,0.3)] focus-within:ring-2 focus-within:ring-primary/50 overflow-visible"
    >
      {/* Thumbnail Container */}
      <div className="aspect-[4/3] rounded-t-2xl overflow-hidden relative">
        <img 
          src={displayAsset.url} 
          alt={asset.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
          <button 
            onClick={() => onView(asset)}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all hover:scale-110"
            title="View Details"
          >
            <Eye size={20} />
          </button>
          <button 
            onClick={() => onAddVariant(asset)}
            className="p-2.5 bg-primary hover:bg-primary-light rounded-xl text-white transition-all hover:scale-110 shadow-lg shadow-primary/40"
            title="Add Variant"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
            {getCategoryIcon()}
            {asset.category}
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-primary/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white">
            {displayAsset.metadata.fileType}
          </div>
        </div>

        {/* Latest Badge */}
        {latestVariant && (
          <div className="absolute top-3 right-12 px-2 py-0.5 rounded-full bg-primary text-[8px] font-bold uppercase tracking-widest text-white shadow-[0_0_10px_rgba(65,1,121,0.5)] animate-pulse">
            Latest
          </div>
        )}

        {/* Status Badge */}
        <div className={cn(
          "absolute top-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-bold uppercase tracking-wider border border-white/5",
          getStatusColor()
        )}>
          {asset.status}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-base font-bold text-text truncate group-hover:text-primary transition-colors">
            {asset.title}
          </h4>
          <div className="static" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="absolute top-4 right-4 z-50 p-1.5 bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-black/40 rounded-lg transition-all"
            >
              <MoreVertical size={18} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-14 right-4 w-48 glass rounded-2xl shadow-2xl z-[60] overflow-hidden p-1.5"
                >
                  <button 
                    onClick={() => { onEdit(asset); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Edit2 size={16} /> Edit Asset
                  </button>
                  <button 
                    onClick={() => { 
                      navigate('/composer', { state: { asset } });
                      setShowMenu(false); 
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-primary/5 rounded-xl transition-colors font-bold"
                  >
                    <Calendar size={16} /> Schedule
                  </button>
                  <button 
                    onClick={() => { onShare(asset); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Share2 size={16} /> Share Asset
                  </button>
                  <button 
                    onClick={() => { onDelete(asset); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} /> Delete Asset
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
          <div className="flex items-center gap-3">
            <span>{displayAsset.metadata.fileSize}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{displayAsset.metadata.resolution || `${displayAsset.metadata.width}x${displayAsset.metadata.height}`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-primary" />
            <span>{asset.variants.length + 1} Versions</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
