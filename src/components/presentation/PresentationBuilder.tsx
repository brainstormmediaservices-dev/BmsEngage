import { useState, useEffect, useRef } from 'react';
import { 
  X, GripVertical, Trash2, Plus, LayoutGrid, List, Upload, FolderOpen, 
  Film, EyeOff, Eye, Edit3, Play, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  presentationService, Presentation, PresentationSlide, 
  SlideElement, createBlankSlide, createImageElement 
} from '../../services/presentationService';
import { mediaService } from '../../services/mediaService';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import SlideEditor from './SlideEditor';
import SlideRenderer from './SlideRenderer';

interface PresentationBuilderProps {
  presentationId?: string | null;
  onClose: () => void;
}

export const PresentationBuilder = ({ presentationId, onClose }: PresentationBuilderProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [industry, setIndustry] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [loading, setLoading] = useState(!!presentationId);
  const [saving, setSaving] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editMode, setEditMode] = useState<'thumbnails' | 'editor'>('thumbnails');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetViewMode, setAssetViewMode] = useState<'list' | 'grid'>('grid');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('Presentation & Documents');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [slideWidth, setSlideWidth] = useState(1920);
  const [slideHeight, setSlideHeight] = useState(1080);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 20;

  useEffect(() => {
    if (presentationId) {
      presentationService.getOne(presentationId).then(p => {
        setTitle(p.title);
        setDescription(p.description);
        setClient(p.client);
        setIndustry(p.industry);
        setTags(p.tags);
        setSlideWidth(p.slideWidth || 1920);
        setSlideHeight(p.slideHeight || 1080);
        const resolvedSlides = p.slides.map(s => ({
          _id: s._id,
          assetId: s.assetId,
          bundleItemId: s.bundleItemId,
          elements: s.elements || [],
          background: s.background || { type: 'color' as const, value: '#1a1a2e', opacity: 1, blur: 0, brightness: 100, videoAutoplay: true, videoLoop: true, videoMuted: true },
          transition: s.transition || 'fade' as const,
          order: s.order,
          notes: s.notes || '',
          hidden: s.hidden || false,
          label: s.label || '',
          asset: s.asset || null,
        })).sort((a, b) => a.order - b.order);
        setSlides(resolvedSlides);
        setLoading(false);
      });
    }
  }, [presentationId]);

  const loadAssets = async () => {
    try {
      const data = await mediaService.getMedia({ page: 1, limit: 100 } as any);
      setAssets(Array.isArray(data) ? data : (data as any).media || []);
    } catch {}
  };

  // Add slides from gallery assets
  const addSlidesFromAssets = (selectedAssets: MediaAsset[]) => {
    const newSlides: PresentationSlide[] = selectedAssets.map((a, i) => {
      const isVideo = a.metadata?.mimeType?.startsWith('video/');
      return {
        ...createBlankSlide(slides.length + i),
        _id: `new-${Date.now()}-${i}`,
        elements: [createImageElement(a.url, {
          type: isVideo ? 'video' : 'image',
          width: slideWidth,
          height: slideHeight,
          autoplay: isVideo,
          muted: isVideo,
        })],
        asset: a,
      } as PresentationSlide;
    });
    setSlides(prev => [...prev, ...newSlides]);
    setShowAssetPicker(false);
    setActiveSlideIndex(slides.length);
  };

  // Upload files and add as slides
  const handleUploadAndAdd = async () => {
    if (!uploadFiles.length) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const total = uploadFiles.length;
      for (let i = 0; i < total; i++) {
        const file = uploadFiles[i];
        const asset = await mediaService.uploadSingle(file, {
          title: file.name.split('.')[0],
          category: uploadCategory,
          description: '',
          tags: '',
          visibility: 'Public',
        }, () => {});
        const isVideo = file.type.startsWith('video/');
        const newSlide: PresentationSlide = {
          ...createBlankSlide(slides.length + i),
          _id: `new-${Date.now()}-${i}`,
          elements: [createImageElement(asset.url, {
            type: isVideo ? 'video' : 'image',
            width: slideWidth,
            height: slideHeight,
            autoplay: isVideo,
            muted: isVideo,
          })],
          asset: asset,
        } as PresentationSlide;
        setSlides(prev => [...prev, newSlide]);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }
      setUploadFiles([]);
      setShowAssetPicker(false);
      setActiveSlideIndex(slides.length);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSlide = (idx: number) => {
    setSlides(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
    if (activeSlideIndex >= slides.length - 1) {
      setActiveSlideIndex(Math.max(0, slides.length - 2));
    }
  };

  const toggleHidden = (idx: number) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, hidden: !s.hidden } : s));
  };

  const duplicateSlide = (idx: number) => {
    const original = slides[idx];
    const dup: PresentationSlide = {
      ...JSON.parse(JSON.stringify(original)),
      _id: `dup-${Date.now()}`,
      order: slides.length,
    };
    // Re-assign element IDs
    dup.elements = dup.elements.map((el: SlideElement) => ({
      ...el,
      _id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));
    setSlides(prev => [...prev, dup]);
  };

  const addBlankSlide = () => {
    const newSlide = createBlankSlide(slides.length);
    const slide: PresentationSlide = {
      ...newSlide,
      _id: `new-${Date.now()}`,
    } as PresentationSlide;
    setSlides(prev => [...prev, slide]);
    setActiveSlideIndex(slides.length);
    setEditMode('editor');
  };

  const handleDragEnd = (dragIdx: number, overIdx: number) => {
    const updated = [...slides];
    const [removed] = updated.splice(dragIdx, 1);
    updated.splice(overIdx, 0, removed);
    setSlides(updated.map((s, i) => ({ ...s, order: i })));
    if (activeSlideIndex === dragIdx) setActiveSlideIndex(overIdx);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let p: Presentation;
      if (presentationId) {
        p = await presentationService.update(presentationId, { 
          title, description, client, industry, tags, slideWidth, slideHeight 
        } as any);
        // Sync slides — for each slide, save/update its elements
        for (const slide of slides) {
          if (slide._id && !slide._id.startsWith('new-') && !slide._id.startsWith('dup-')) {
            await presentationService.updateSlide(p._id, slide._id, {
              elements: slide.elements,
              background: slide.background,
              transition: slide.transition,
              notes: slide.notes,
              hidden: slide.hidden,
              label: slide.label,
            });
          }
        }
        // Add new slides
        const newSlides = slides.filter(s => s._id?.startsWith('new-') || s._id?.startsWith('dup-'));
        if (newSlides.length) {
          await presentationService.addRichSlides(p._id, newSlides.map(s => ({
            elements: s.elements,
            background: s.background,
            transition: s.transition,
            notes: s.notes,
            hidden: s.hidden,
            label: s.label,
          })));
        }
        // Remove deleted slides
        const orig = await presentationService.getOne(presentationId);
        const toRemove = orig.slides.filter(s => !slides.find(ns => ns._id === s._id));
        await Promise.all(toRemove.map(s => presentationService.removeSlide(p._id, s._id)));
      } else {
        p = await presentationService.create({ 
          title, description, client, industry, tags, slideWidth, slideHeight 
        } as any);
        if (slides.length) {
          await presentationService.addRichSlides(p._id, slides.map(s => ({
            elements: s.elements,
            background: s.background,
            transition: s.transition,
            notes: s.notes,
            hidden: s.hidden,
            label: s.label,
          })));
        }
      }
      onClose();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const filteredAssets = assets.filter(a =>
    a.title.toLowerCase().includes(assetSearch.toLowerCase()) ||
    a.category.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const activeSlide = slides[activeSlideIndex];

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl p-8 animate-pulse">
          <div className="h-6 w-48 bg-white/10 rounded mb-4" />
          <div className="h-4 w-64 bg-white/5 rounded" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5">
            <X size={18} />
          </button>
          <div>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-lg font-black text-text bg-transparent border-none focus:outline-none focus:ring-0"
              placeholder="Presentation Title"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setEditMode('thumbnails')}
              className={cn("px-3 py-1.5 text-[10px] font-bold transition-colors", editMode === 'thumbnails' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}
            >
              Slides
            </button>
            <button
              onClick={() => { setEditMode('editor'); if (activeSlideIndex >= slides.length) setActiveSlideIndex(0); }}
              className={cn("px-3 py-1.5 text-[10px] font-bold transition-colors", editMode === 'editor' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}
            >
              Editor
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={slideWidth}
              onChange={e => setSlideWidth(parseInt(e.target.value) || 1920)}
              className="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-text text-center"
              title="Slide width"
            />
            <span className="text-text-muted self-center text-xs">×</span>
            <input
              type="number"
              value={slideHeight}
              onChange={e => setSlideHeight(parseInt(e.target.value) || 1080)}
              className="w-20 px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-text text-center"
              title="Slide height"
            />
          </div>
          <button onClick={save} disabled={saving || !title.trim()}
            className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : presentationId ? 'Save' : 'Create'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Slide thumbnails sidebar */}
        <div className="w-44 bg-card border-r border-border overflow-y-auto shrink-0 p-2 space-y-2">
          {slides.map((slide, idx) => (
            <div
              key={slide._id || idx}
              draggable
              onDragEnd={(e) => {
                const target = e.currentTarget as HTMLElement;
                const rect = target.getBoundingClientRect();
                const overIdx = Math.round((e.clientY - rect.top) / (rect.height + 8));
                handleDragEnd(idx, Math.min(slides.length - 1, Math.max(0, idx + (e.clientY > rect.top + rect.height / 2 ? 1 : 0))));
              }}
              onClick={() => { setActiveSlideIndex(idx); setEditMode('editor'); }}
              className={cn(
                "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                activeSlideIndex === idx ? 'border-primary' : 'border-transparent hover:border-white/20',
                slide.hidden && 'opacity-40'
              )}
            >
              <div className="aspect-video bg-[#1a1a2e] relative">
                <div className="w-full h-full" style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                  {slide.elements && slide.elements.length > 0 ? (
                    <div className="w-full h-full overflow-hidden">
                      {slide.elements.slice(0, 1).map(el => (
                        el.type === 'image' || el.type === 'gif' ? (
                          <img key={el._id} src={el.src} alt="" className="w-full h-full object-cover" />
                        ) : el.type === 'video' ? (
                          <video key={el._id} src={el.src} className="w-full h-full object-cover" muted />
                        ) : el.type === 'shape' ? (
                          <div key={el._id} className="w-full h-full" style={{ backgroundColor: el.fill }} />
                        ) : null
                      ))}
                    </div>
                  ) : slide.asset ? (
                    <img src={slide.asset.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
                      Blank
                    </div>
                  )}
                </div>
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-bold">
                  {idx + 1}
                </div>
                {slide.hidden && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <EyeOff size={16} className="text-white/50" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); toggleHidden(idx); }}
                  className="p-0.5 rounded bg-black/60 text-white/60 hover:text-white" title="Toggle visibility">
                  {slide.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                  className="p-0.5 rounded bg-black/60 text-white/60 hover:text-white" title="Duplicate">
                  <Edit3 size={10} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}
                  className="p-0.5 rounded bg-black/60 text-white/60 hover:text-red-400" title="Delete">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}

          {/* Add slide button */}
          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="w-full py-3 border border-dashed border-border rounded-lg text-text-muted text-xs font-semibold hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Plus size={14} className="mx-auto" />
            </button>
            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute bottom-full left-0 mb-1 w-48 bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden"
                >
                  <button onClick={() => { addBlankSlide(); setShowAddMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-white/5">
                    <Plus size={14} className="text-primary" /> Blank Slide
                  </button>
                  <button onClick={() => { setShowAddMenu(false); loadAssets(); setShowAssetPicker(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-white/5">
                    <FolderOpen size={14} className="text-emerald-500" /> From Gallery
                  </button>
                  <button onClick={() => { setShowAddMenu(false); setShowAssetPicker(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text hover:bg-white/5">
                    <Upload size={14} className="text-blue-400" /> Upload Files
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 min-h-0">
          {editMode === 'editor' && activeSlide ? (
            <SlideEditor
              slide={activeSlide}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              onUpdateSlide={(updates) => {
                setSlides(prev => prev.map((s, i) => 
                  i === activeSlideIndex ? { ...s, ...updates } : s
                ));
              }}
            />
          ) : (
            /* Thumbnail grid view */
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {slides.map((slide, idx) => (
                  <div
                    key={slide._id || idx}
                    onClick={() => { setActiveSlideIndex(idx); setEditMode('editor'); }}
                    className={cn(
                      "group relative aspect-video bg-[#1a1a2e] rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02]",
                      activeSlideIndex === idx ? 'border-primary' : 'border-border hover:border-primary/30',
                      slide.hidden && 'opacity-40'
                    )}
                  >
                    {slide.elements && slide.elements.length > 0 ? (
                      <div className="w-full h-full">
                        {slide.elements.slice(0, 1).map(el => (
                          el.type === 'image' || el.type === 'gif' ? (
                            <img key={el._id} src={el.src} alt="" className="w-full h-full object-cover" />
                          ) : el.type === 'video' ? (
                            <video key={el._id} src={el.src} className="w-full h-full object-cover" muted />
                          ) : el.type === 'shape' ? (
                            <div key={el._id} className="w-full h-full" style={{ backgroundColor: el.fill }} />
                          ) : el.type === 'text' ? (
                            <div key={el._id} className="w-full h-full flex items-center justify-center p-2">
                              <p className="text-xs text-white truncate">{el.content}</p>
                            </div>
                          ) : null
                        ))}
                      </div>
                    ) : slide.asset ? (
                      <img src={slide.asset.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
                        Blank
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-bold">
                      {idx + 1}
                    </div>
                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); toggleHidden(idx); }}
                        className="p-1 rounded bg-black/60 text-white/60 hover:text-white">
                        {slide.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                        className="p-1 rounded bg-black/60 text-white/60 hover:text-white">
                        <Edit3 size={12} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}
                        className="p-1 rounded bg-black/60 text-white/60 hover:text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata drawer (collapsed by default) */}
      <div className="bg-card border-t border-border px-4 py-2 shrink-0">
        <details className="group">
          <summary className="text-[10px] font-bold text-text-muted uppercase tracking-widest cursor-pointer select-none">
            Presentation Details
          </summary>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Description</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text"
                placeholder="Brief description..." />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Client</label>
              <input value={client} onChange={e => setClient(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text"
                placeholder="Client name" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Industry</label>
              <input value={industry} onChange={e => setIndustry(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text"
                placeholder="e.g. Technology" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Tags</label>
              <div className="flex gap-1">
                <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text"
                  placeholder="Add tag..." />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map(t => (
                  <span key={t} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                    {t}
                    <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Asset picker modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssetPicker(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Add Slides</h3>
              <button onClick={() => setShowAssetPicker(false)} className="p-1.5 text-text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>

            {/* Gallery tab */}
            <div>
              <div className="relative mb-3">
                <input value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm text-text"
                  placeholder="Search assets..." />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                {filteredAssets.map(a => (
                  <label key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="accent-primary" data-asset-id={a.id} />
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      {a.metadata?.mimeType?.startsWith('video/') ? (
                        <video src={a.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={a.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-text truncate flex-1">{a.title}</span>
                    <span className="text-[10px] text-text-muted">{a.category}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  const checked = document.querySelectorAll<HTMLInputElement>('.accent-primary:checked');
                  const ids = Array.from(checked).map(cb => cb.getAttribute('data-asset-id') || '').filter(Boolean);
                  const selected = assets.filter(a => ids.includes(a.id));
                  if (selected.length) addSlidesFromAssets(selected);
                }}
                className="w-full mt-3 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Add Selected as Slides
              </button>
            </div>

            {/* Upload tab */}
            <div className="border-t border-border pt-4">
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    const arr = Array.from(e.target.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
                    setUploadFiles(prev => [...prev, ...arr].slice(0, MAX_FILES));
                  }
                  e.target.value = '';
                }} />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setDragOver(false);
                  if (e.dataTransfer.files) {
                    const arr = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
                    setUploadFiles(prev => [...prev, ...arr].slice(0, MAX_FILES));
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <Upload size={24} className="text-text-muted" />
                <p className="text-xs text-text-muted">Drag & drop or click to browse (images & videos)</p>
              </div>
              {uploadFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-muted">{uploadFiles.length} / {MAX_FILES} files</span>
                    <button onClick={() => setUploadFiles([])} className="text-[10px] text-text-muted hover:text-red-500">Clear</button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {uploadFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-text">
                        <span className="truncate flex-1">{f.name}</span>
                        <span className="text-text-muted">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                        <button onClick={() => setUploadFiles(prev => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                  {uploading && (
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <button onClick={handleUploadAndAdd} disabled={uploading}
                    className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                    {uploading ? `Uploading... ${uploadProgress}%` : `Upload & Add as Slides`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click away to close add menu */}
      {showAddMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)} />
      )}
    </motion.div>
  );
};
