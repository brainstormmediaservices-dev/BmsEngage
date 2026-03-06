import * as React from 'react';
import { MOCK_MEDIA } from '../../lib/mock-data';
import { MediaAsset, MediaCategory } from '../../types/media';
import { Search, Filter, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MiniGallerySelectorProps {
  selectedAssets: MediaAsset[];
  onSelect: (asset: MediaAsset) => void;
  onRemove: (assetId: string) => void;
  multiple?: boolean;
}

export const MiniGallerySelector = ({ selectedAssets, onSelect, onRemove, multiple = true }: MiniGallerySelectorProps) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<MediaCategory | 'All'>('All');

  const filteredMedia = React.useMemo(() => {
    return MOCK_MEDIA.filter(asset => {
      const matchesSearch = 
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || asset.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const isSelected = (id: string) => selectedAssets.some(a => a.id === id);

  const handleToggle = (asset: MediaAsset) => {
    if (isSelected(asset.id)) {
      onRemove(asset.id);
    } else {
      if (!multiple && selectedAssets.length > 0) {
        onRemove(selectedAssets[0].id);
      }
      onSelect(asset);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input 
            type="text"
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <select 
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="All">All Categories</option>
          <option value="Flyer">Flyer</option>
          <option value="Image">Image</option>
          <option value="Video">Video</option>
          <option value="Graphics">Graphics</option>
        </select>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredMedia.map((asset) => (
            <motion.button
              layout
              key={asset.id}
              onClick={() => handleToggle(asset)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                isSelected(asset.id) ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-white/20"
              )}
            >
              <img 
                src={asset.url} 
                alt={asset.title} 
                className={cn("w-full h-full object-cover transition-transform duration-500", isSelected(asset.id) ? "scale-110" : "group-hover:scale-110")}
                referrerPolicy="no-referrer"
              />
              {isSelected(asset.id) && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-white drop-shadow-lg" />
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] font-bold text-white truncate">{asset.title}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
