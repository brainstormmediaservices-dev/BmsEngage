import * as React from 'react';
import { Search, Plus, ChevronDown, LayoutGrid, ArrowUpDown, X, Building2, Calendar, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { MediaCategory } from '../../types/media';
import { MAIN_CATEGORIES, type MainCategory } from '../../constants/mediaCategories';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Startup } from '../../services/startupService';
import { StartupAvatar } from './StartupSelect';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';

interface MediaGalleryTopBarProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onFileTypeChange: (fileType: string) => void;
  onSortChange: (sort: string) => void;
  onWeekRangeChange: (range: string) => void;
  onDateRangeChange: (from: string, to: string) => void;
  onStartupChange: (startupId: string) => void;
  onClearFilters: () => void;
  onUploadClick: () => void;
  activeCategory: string;
  activeFileType: string;
  activeSort: string;
  activeWeekRange: string;
  activeDateFrom: string;
  activeDateTo: string;
  activeStartup: string;
  searchQuery: string;
  canUpload?: boolean;
  startups?: Startup[];
  isAgencyContext?: boolean;
}

const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });

const WEEK_RANGES = [
  { label: 'All', value: 'all' },
  { label: 'This Week', value: 'this_week' },
  { label: 'Next Week', value: 'next_week' },
];

export const MediaGalleryTopBar = ({
  onSearch, onCategoryChange, onFileTypeChange, onSortChange,
  onWeekRangeChange, onDateRangeChange, onStartupChange, onClearFilters, onUploadClick,
  activeCategory, activeFileType, activeSort, activeWeekRange, activeDateFrom, activeDateTo,
  activeStartup, searchQuery, canUpload = true, startups = [], isAgencyContext = false,
}: MediaGalleryTopBarProps) => {
  const categories: (MediaCategory | 'All')[] = ['All', ...MAIN_CATEGORIES];
  const fileTypes = ['All', 'JPG', 'PNG', 'SVG', 'MP4', 'MOV', 'PDF', 'WEBP', 'PSD', 'AI'];
  const sorts = ['Newest', 'Oldest', 'A–Z'];

  const hasActiveFilters =
    searchQuery !== '' ||
    activeCategory !== 'All' ||
    activeFileType !== 'All' ||
    activeSort !== 'Newest' ||
    activeWeekRange !== 'all' ||
    activeDateFrom !== '' ||
    activeDateTo !== '' ||
    activeStartup !== 'All';

  return (
    <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-text mb-1 sm:mb-2">Media Gallery</h1>
          <p className="text-sm text-text-muted font-medium">Manage and organize your agency's creative assets.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Button variant="outline" size="sm" onClick={onClearFilters}
                  className="h-12 px-4 rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all">
                  <X size={16} className="mr-2" /> Clear Filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          {canUpload && (
            <Button onClick={onUploadClick} className="h-12 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
              <Plus size={20} className="mr-2" /> Upload Media
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {categories.map((cat) => (
          <button key={cat} onClick={() => onCategoryChange(cat)}
            className={cn('shrink-0 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all',
              activeCategory === cat
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-card border border-border text-text-muted hover:text-text hover:border-primary/30'
            )}>
            {cat}
          </button>
        ))}
      </div>

      {/* Week Range Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <span className="shrink-0 text-[10px] font-black text-text-muted uppercase tracking-widest mr-1 flex items-center gap-1">
          <Calendar size={11} /> Target:
        </span>
        {WEEK_RANGES.map((r) => (
          <button key={r.value} onClick={() => onWeekRangeChange(r.value)}
            className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
              activeWeekRange === r.value
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-card border border-border text-text-muted hover:text-text hover:border-primary/20'
            )}>
            {r.label}
          </button>
        ))}
        {/* Date range pickers */}
        <div className="flex items-center gap-1.5 ml-2">
          <input type="date" value={activeDateFrom} onChange={e => onDateRangeChange(e.target.value, activeDateTo)}
            className="h-8 bg-card border border-border rounded-lg px-2 text-xs text-text outline-none focus:border-primary/50 transition-all"
            title="From date" />
          <span className="text-text-muted text-xs">–</span>
          <input type="date" value={activeDateTo} onChange={e => onDateRangeChange(activeDateFrom, e.target.value)}
            className="h-8 bg-card border border-border rounded-lg px-2 text-xs text-text outline-none focus:border-primary/50 transition-all"
            title="To date" />
        </div>
      </div>

      {/* Filter Row */}
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3', isAgencyContext && startups.length > 0 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input type="text" placeholder="Search by title or tags..." value={searchQuery}
            onChange={(e) => onSearch(e.target.value)} spellCheck
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all" />
          {searchQuery && (
            <button onClick={() => onSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* File Type */}
        <div className="relative group">
          <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <select value={activeFileType} onChange={(e) => onFileTypeChange(e.target.value)}
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text appearance-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer">
            {fileTypes.map((type) => <option key={type} value={type}>{type} Format</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
        </div>

        {/* Sort */}
        <div className="relative group">
          <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <select value={activeSort} onChange={(e) => onSortChange(e.target.value)}
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text appearance-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer">
            {sorts.map((sort) => <option key={sort} value={sort}>Sort by {sort}</option>)}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
        </div>

        {/* Startup Filter */}
        {isAgencyContext && startups.length > 0 && (
          <GalleryStartupFilter
            startups={startups}
            value={activeStartup}
            onChange={onStartupChange}
          />
        )}
      </div>
    </div>
  );
};

// ─── Gallery startup filter — portal-based, shows logo + name ────────────────
// value: 'All' | 'none' | startupId
function GalleryStartupFilter({
  startups,
  value,
  onChange,
}: {
  startups: Startup[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [panelStyle, setPanelStyle] = React.useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  const selectedStartup = startups.find(s => s.id === value) ?? null;

  const filtered = React.useMemo(() => {
    if (!search.trim()) return startups;
    const q = search.toLowerCase();
    return startups.filter(s => s.name.toLowerCase().includes(q));
  }, [startups, search]);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const panelHeight = Math.min(320, startups.length * 52 + 100);
    const openUpward = spaceBelow < panelHeight && spaceAbove > spaceBelow;
    setPanelStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, [startups.length]);

  const handleOpen = () => { updatePosition(); setOpen(true); };

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (document.getElementById('gallery-startup-panel')?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handler = () => updatePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('scroll', handler, true); window.removeEventListener('resize', handler); };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
    else setSearch('');
  }, [open]);

  const handleSelect = (v: string) => { onChange(v); setOpen(false); };

  const SPECIAL = [
    { value: 'All',  label: 'All Startups' },
    { value: 'none', label: 'No Startup' },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : handleOpen}
        className={cn(
          'w-full h-12 flex items-center gap-3 px-4 rounded-xl border text-sm transition-all duration-200 text-left',
          'bg-card border-border hover:border-primary/40',
          open && 'border-primary/50 ring-2 ring-primary/10'
        )}
      >
        {selectedStartup ? (
          <>
            <StartupAvatar startup={selectedStartup} size={24} />
            <span className="flex-1 truncate text-text font-medium">{selectedStartup.name}</span>
          </>
        ) : (
          <>
            <Building2 size={18} className="text-text-muted shrink-0" />
            <span className="flex-1 text-text-muted text-sm">
              {value === 'none' ? 'No Startup' : 'All Startups'}
            </span>
          </>
        )}
        <ChevronDown size={15} className={cn('text-text-muted shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              id="gallery-startup-panel"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              style={panelStyle}
              className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
            >
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search startups…"
                    className="w-full h-9 pl-8 pr-8 rounded-lg bg-white/5 border border-border text-sm text-text placeholder:text-text-muted/60 outline-none focus:border-primary/50 transition-all"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {/* All / None special options */}
                {!search && SPECIAL.map(opt => (
                  <button key={opt.value} type="button" onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-white/5',
                      value === opt.value ? 'text-primary' : 'text-text-muted'
                    )}>
                    <div className="w-6 h-6 rounded-lg bg-white/8 border border-border flex items-center justify-center shrink-0">
                      <Building2 size={12} className="text-text-muted" />
                    </div>
                    <span className="flex-1 text-left">{opt.label}</span>
                    {value === opt.value && <Check size={13} className="text-primary shrink-0" />}
                  </button>
                ))}

                {!search && <div className="mx-3 border-t border-border/50" />}

                {/* Startup options */}
                {filtered.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-text-muted">No startups match "{search}"</p>
                  </div>
                ) : (
                  filtered.map(s => {
                    const isSelected = value === s.id;
                    return (
                      <button key={s.id} type="button" onClick={() => handleSelect(s.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-all hover:bg-white/5',
                          isSelected && 'bg-primary/10 border-l-2 border-primary'
                        )}>
                        <StartupAvatar startup={s} size={28} />
                        <span className={cn('flex-1 truncate font-medium', isSelected ? 'text-primary' : 'text-text')}>
                          {s.name}
                        </span>
                        {isSelected && <Check size={13} className="text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
