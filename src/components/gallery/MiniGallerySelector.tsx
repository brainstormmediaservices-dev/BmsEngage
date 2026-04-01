import * as React from 'react';
import { MediaAsset, MediaCategory } from '../../types/media';
import { mediaService } from '../../services/mediaService';
import { startupService, Startup } from '../../services/startupService';
import { Search, CheckCircle2, Loader2, Building2, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';

interface MiniGallerySelectorProps {
  selectedAssets: MediaAsset[];
  onSelect: (asset: MediaAsset) => void;
  onRemove: (assetId: string) => void;
  multiple?: boolean;
}

export const MiniGallerySelector = ({ selectedAssets, onSelect, onRemove, multiple = true }: MiniGallerySelectorProps) => {
  const [allMedia, setAllMedia] = React.useState<MediaAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState<MediaCategory | 'All'>('All');
  const [weekFilter, setWeekFilter] = React.useState<'all' | 'this_week' | 'next_week'>('all');
  const [startupFilter, setStartupFilter] = React.useState('All');
  const [startups, setStartups] = React.useState<Startup[]>([]);
  const { user } = useAuth();
  const isAgency = user?.activeContext === 'agency';

  React.useEffect(() => {
    mediaService.getMedia().then(setAllMedia).catch(() => {}).finally(() => setLoading(false));
    if (isAgency) startupService.list().then(setStartups).catch(() => {});
  }, [isAgency]);

  const filtered = React.useMemo(() => {
    const now = new Date();
    const thisStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisEnd = endOfWeek(now, { weekStartsOn: 1 });
    const nextStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const nextEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

    return allMedia.filter(asset => {
      const matchSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = activeCategory === 'All' || asset.category === activeCategory;
      const matchStartup = startupFilter === 'All' || asset.startupId === startupFilter;

      let matchWeek = true;
      if (weekFilter !== 'all' && asset.targetDate) {
        const td = new Date(asset.targetDate);
        matchWeek = weekFilter === 'this_week'
          ? td >= thisStart && td <= thisEnd
          : td >= nextStart && td <= nextEnd;
      } else if (weekFilter !== 'all') {
        matchWeek = false;
      }

      return matchSearch && matchCat && matchStartup && matchWeek;
    });
  }, [allMedia, searchQuery, activeCategory, weekFilter, startupFilter]);

  const isSelected = (id: string) => selectedAssets.some(a => a.id === id);

  const handleToggle = (asset: MediaAsset) => {
    if (isSelected(asset.id)) {
      onRemove(asset.id);
    } else {
      if (!multiple && selectedAssets.length > 0) onRemove(selectedAssets[0].id);
      onSelect(asset);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search + filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
          <input type="text" placeholder="Search gallery..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} spellCheck
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
        </div>
        <select value={activeCategory} onChange={e => setActiveCategory(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50">
          <option value="All">All</option>
          <option value="Flyer">Flyer</option>
          <option value="Image">Image</option>
          <option value="Video">Video</option>
          <option value="Graphics">Graphics</option>
        </select>
        <select value={weekFilter} onChange={e => setWeekFilter(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50">
          <option value="all">All Weeks</option>
          <option value="this_week">This Week</option>
          <option value="next_week">Next Week</option>
        </select>
        {isAgency && startups.length > 0 && (
          <select value={startupFilter} onChange={e => setStartupFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50">
            <option value="All">All Startups</option>
            {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-muted">No assets found</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filtered.map(asset => {
              const displayUrl = asset.variants.length > 0
                ? [...asset.variants].sort((a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime())[0].url
                : asset.url;
              const sel = isSelected(asset.id);
              return (
                <motion.button layout key={asset.id} onClick={() => handleToggle(asset)}
                  className={cn('relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                    sel ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent hover:border-white/20'
                  )}>
                  {asset.category === 'Video'
                    ? <video src={displayUrl} className="w-full h-full object-cover" muted />
                    : <img src={displayUrl} alt={asset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  }
                  {sel && (
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                      <CheckCircle2 size={22} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-1 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-bold text-white truncate">{asset.title}</p>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {selectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedAssets.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary">
              {a.title}
              <button onClick={() => onRemove(a.id)} className="hover:text-red-400 transition-colors">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
