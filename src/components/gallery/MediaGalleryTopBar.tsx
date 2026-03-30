import * as React from 'react';
import { Search, Filter, Plus, ChevronDown, LayoutGrid, List as ListIcon, Calendar, ArrowUpDown, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { MediaCategory } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface MediaGalleryTopBarProps {
  onSearch: (query: string) => void;
  onCategoryChange: (category: string) => void;
  onFileTypeChange: (fileType: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
  onUploadClick: () => void;
  activeCategory: string;
  activeFileType: string;
  activeSort: string;
  searchQuery: string;
  canUpload?: boolean;
}

export const MediaGalleryTopBar = ({
  onSearch, onCategoryChange, onFileTypeChange, onSortChange,
  onClearFilters, onUploadClick, activeCategory, activeFileType,
  activeSort, searchQuery, canUpload = true,
}: MediaGalleryTopBarProps) => {
  const categories: (MediaCategory | 'All')[] = ['All', 'Flyer', 'Image', 'Video', 'Graphics'];
  const fileTypes = ['All', 'JPG', 'PNG', 'SVG', 'MP4', 'MOV', 'PDF', 'WEBP'];
  const sorts = ['Newest', 'Oldest', 'A–Z'];

  const hasActiveFilters = searchQuery !== '' || activeCategory !== 'All' || activeFileType !== 'All' || activeSort !== 'Newest';

  return (
    <div className="flex flex-col gap-6 mb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Media Gallery</h1>
          <p className="text-text-muted font-medium">Manage and organize your agency's creative assets.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onClearFilters}
                  className="h-12 px-4 rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all"
                >
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <select 
            value={activeCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text appearance-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat} Category</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
        </div>

        {/* File Type Filter */}
        <div className="relative group">
          <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <select 
            value={activeFileType}
            onChange={(e) => onFileTypeChange(e.target.value)}
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text appearance-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            {fileTypes.map(type => (
              <option key={type} value={type}>{type} Format</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
        </div>

        {/* Sort Dropdown */}
        <div className="relative group">
          <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
          <select 
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full h-12 bg-card border border-border rounded-xl pl-12 pr-10 text-sm text-text appearance-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
          >
            {sorts.map(sort => (
              <option key={sort} value={sort}>Sort by {sort}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
        </div>
      </div>
    </div>
  );
};
