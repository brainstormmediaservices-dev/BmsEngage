import * as React from 'react';
import { Search, Plus, ChevronDown, LayoutGrid, ArrowUpDown, X, Building2, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { MediaCategory } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Startup } from '../../services/startupService';
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
  const categories: (MediaCategory | 'All')[] = ['All', 'Flyer', 'Image', 'Video', 'Graphics'];
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
          <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <select value={activeStartup} onChange={(e) => onStartupChange(e.target.value)}
              className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text appearance-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer">
              <option value="All">All Startups</option>
              <option value="none">No Startup</option>
              {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
          </div>
        )}
      </div>
    </div>
  );
};
