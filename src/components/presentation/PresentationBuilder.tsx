import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, GripVertical, Trash2, Plus, Upload, FolderOpen, 
  EyeOff, Eye, Copy, ArrowUpDown, Presentation 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  presentationService, Presentation as PresentationType, PresentationSlide, 
  SlideElement, createBlankSlide, createImageElement 
} from '../../services/presentationService';
import { mediaService } from '../../services/mediaService';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import SlideEditor from './SlideEditor';

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
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('Presentation & Documents');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [slideWidth, setSlideWidth] = useState(1920);
  const [slideHeight, setSlideHeight] = useState(1080);
  const [pickerTab, setPickerTab] = useState<'gallery' | 'upload'>('gallery');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 20;

  // Drag-to-reorder state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Load existing presentation
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

  // Auto-open asset picker for new presentations
  useEffect(() => {
    if (!presentationId && !loading) {
      loadAssets();
      setShowAssetPicker(true);
    }
  }, [presentationId, loading]);

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
    setEditMode('thumbnails');
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
      setEditMode('thumbnails');
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
    dup.elements = dup.elements.map((el: SlideElement) => ({
      ...el,
      _id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }));
    setSlides(prev => [...prev, dup]);
  };

  // Drag-to-reorder handlers
  const handleDragStart = useCallback((idx: number) => {
    dragItem.current = idx;
    setDraggingIdx(idx);
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    dragOverItem.current = idx;
    setDragOverIdx(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) {
      setDraggingIdx(null);
      setDragOverIdx(null);
      return;
    }
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== to) {
      setSlides(prev => {
        const updated = [...prev];
        const [removed] = updated.splice(from, 1);
        updated.splice(to, 0, removed);
        return updated.map((s, i) => ({ ...s, order: i }));
      });
      if (activeSlideIndex === from) setActiveSlideIndex(to);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  }, [activeSlideIndex]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let p: PresentationType;
      if (presentationId) {
        p = await presentationService.update(presentationId, { 
          title, description, client, industry, tags, slideWidth, slideHeight 
        } as any);
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

  // Thumbnail preview for a slide
  const SlideThumb = ({ slide }: { slide: PresentationSlide }) => {
    if (slide.elements && slide.elements.length > 0) {
      const el = slide.elements[0];
      if (el.type === 'image' || el.type === 'gif') return <img src={el.src} alt="" className="w-full h-full object-cover" />;
      if (el.type === 'video') return <video src={el.src} className="w-full h-full object-cover" muted />;
      if (el.type === 'shape') return <div className="w-full h-full" style={{ backgroundColor: el.fill }} />;
      if (el.type === 'text') return <div className="w-full h-full flex items-center justify-center p-2"><p className="text-xs text-white truncate">{el.content}</p></div>;
    }
    if (slide.asset) return <img src={slide.asset.url} alt="" className="w-full h-full object-cover" />;
    return <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">Blank</div>;
  };

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
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-black text-text bg-transparent border-none focus:outline-none focus:ring-0 w-64"
            placeholder="Presentation Title"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setEditMode('thumbnails')}
              className={cn("px-3 py-1.5 text-[10px] font-bold transition-colors", editMode === 'thumbnails' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}
            >
              Slides ({slides.length})
            </button>
            <button
              onClick={() => { setEditMode('editor'); if (!activeSlide && slides.length) setActiveSlideIndex(0); }}
              className={cn("px-3 py-1.5 text-[10px] font-bold transition-colors", editMode === 'editor' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}
            >
              Editor
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input type="number" value={slideWidth} onChange={e => setSlideWidth(parseInt(e.target.value) || 1920)}
              className="w-16 px-1.5 py-1.5 bg-background border border-border rounded-lg text-[10px] text-text text-center" title="Width" />
            <span className="text-text-muted text-[10px]">×</span>
            <input type="number" value={slideHeight} onChange={e => setSlideHeight(parseInt(e.target.value) || 1080)}
              className="w-16 px-1.5 py-1.5 bg-background border border-border rounded-lg text-[10px] text-text text-center" title="Height" />
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
        <div className="w-48 bg-card border-r border-border overflow-y-auto shrink-0 p-2 space-y-2">
          {slides.map((slide, idx) => (
            <div
              key={slide._id || idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onClick={() => { setActiveSlideIndex(idx); setEditMode('editor'); }}
              className={cn(
                "relative group rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                activeSlideIndex === idx ? 'border-primary' : 'border-transparent hover:border-white/20',
                slide.hidden && 'opacity-40',
                draggingIdx === idx && 'opacity-50 scale-95',
                dragOverIdx === idx && dragOverIdx !== draggingIdx && 'border-t-2 border-t-primary',
              )}
            >
              <div className="aspect-video bg-[#1a1a2e] relative">
                <SlideThumb slide={slide} />
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-bold">
                  {idx + 1}
                </div>
                {slide.hidden && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <EyeOff size={14} className="text-white/50" />
                  </div>
                )}
              </div>
              {/* Actions on hover */}
              <div className="absolute bottom-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); toggleHidden(idx); }}
                  className="p-0.5 rounded bg-black/60 text-white/60 hover:text-white" title="Toggle visibility">
                  {slide.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                  className="p-0.5 rounded bg-black/60 text-white/60 hover:text-white" title="Duplicate">
                  <Copy size={10} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}
                  className="p-0.5 rounded bg-black/60 text-white/60 hover:text-red-400" title="Delete">
                  <Trash2 size={10} />
                </button>
              </div>
              {/* Drag handle */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical size={12} className="text-white/40" />
              </div>
            </div>
          ))}

          {/* Add buttons */}
          <button
            onClick={() => { loadAssets(); setPickerTab('gallery'); setShowAssetPicker(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 text-primary rounded-lg text-[10px] font-semibold hover:bg-primary/20 transition-colors"
          >
            <FolderOpen size={12} /> Gallery
          </button>
          <button
            onClick={() => { setPickerTab('upload'); setShowAssetPicker(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors"
          >
            <Upload size={12} /> Upload
          </button>
          <button
            onClick={() => {
              const blank = createBlankSlide(slides.length);
              const slide = { ...blank, _id: `new-${Date.now()}` } as PresentationSlide;
              setSlides(prev => [...prev, slide]);
              setActiveSlideIndex(slides.length);
              setEditMode('editor');
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white/5 text-text-muted rounded-lg text-[10px] font-semibold hover:bg-white/10 transition-colors"
          >
            <Plus size={12} /> Blank Slide
          </button>
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
            <div className="flex-1 overflow-auto p-6">
              {slides.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                    <Presentation size={32} className="opacity-30" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-text">No slides yet</p>
                    <p className="text-sm mt-1">Upload images/videos or select from gallery to start</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { loadAssets(); setPickerTab('gallery'); setShowAssetPicker(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                      <FolderOpen size={16} /> From Gallery
                    </button>
                    <button onClick={() => { setPickerTab('upload'); setShowAssetPicker(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors">
                      <Upload size={16} /> Upload Files
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {slides.map((slide, idx) => (
                    <div
                      key={slide._id || idx}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onClick={() => { setActiveSlideIndex(idx); setEditMode('editor'); }}
                      className={cn(
                        "group relative aspect-video bg-[#1a1a2e] rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02]",
                        activeSlideIndex === idx ? 'border-primary' : 'border-border hover:border-primary/30',
                        slide.hidden && 'opacity-40',
                        draggingIdx === idx && 'opacity-50 scale-95',
                      )}
                    >
                      <SlideThumb slide={slide} />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-bold">
                        {idx + 1}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical size={14} className="text-white/40" />
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); toggleHidden(idx); }}
                          className="p-1 rounded bg-black/60 text-white/60 hover:text-white">
                          {slide.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); duplicateSlide(idx); }}
                          className="p-1 rounded bg-black/60 text-white/60 hover:text-white">
                          <Copy size={12} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}
                          className="p-1 rounded bg-black/60 text-white/60 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Add more card */}
                  <div
                    onClick={() => { loadAssets(); setPickerTab('gallery'); setShowAssetPicker(true); }}
                    className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus size={20} className="text-text-muted" />
                    <span className="text-[10px] text-text-muted font-semibold">Add Slides</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Metadata drawer */}
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

      {/* Asset picker modal — Gallery + Upload tabs */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssetPicker(false)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header with tabs */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-bold text-text">Add Slides</h3>
                <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setPickerTab('gallery')}
                    className={cn("flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition-colors", pickerTab === 'gallery' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}>
                    <FolderOpen size={11} /> From Gallery
                  </button>
                  <button onClick={() => setPickerTab('upload')}
                    className={cn("flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition-colors", pickerTab === 'upload' ? 'bg-emerald-500/20 text-emerald-500' : 'text-text-muted hover:text-text')}>
                    <Upload size={11} /> Upload Files
                  </button>
                </div>
              </div>
              <button onClick={() => setShowAssetPicker(false)} className="p-1.5 text-text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {pickerTab === 'gallery' ? (
                <>
                  <input value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm text-text mb-3"
                    placeholder="Search assets by name or category..." />
                  
                  {filteredAssets.length === 0 ? (
                    <div className="text-center py-12 text-text-muted">
                      <FolderOpen size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">No assets found</p>
                      <p className="text-xs mt-1">Upload files or check back later</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {filteredAssets.map(a => (
                        <label key={a.id}
                          className="group relative aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-primary/50 cursor-pointer transition-all">
                          <input type="checkbox" className="sr-only peer" data-asset-id={a.id} />
                          {a.metadata?.mimeType?.startsWith('video/') ? (
                            <video src={a.url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={a.url} alt={a.title} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/0 peer-checked:bg-primary/20 transition-colors" />
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-md border-2 border-white/40 bg-black/30 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[9px] font-semibold text-white truncate">{a.title}</p>
                          </div>
                          {a.metadata?.mimeType?.startsWith('video/') && (
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 rounded text-[8px] text-white font-bold">VIDEO</div>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Upload tab */
                <div className="space-y-4">
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
                    className={`w-full py-12 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Upload size={32} className={dragOver ? 'text-primary' : 'text-text-muted'} />
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${dragOver ? 'text-primary' : 'text-text-muted'}`}>
                        {dragOver ? 'Drop files here' : 'Drag & drop or click to browse'}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">Images & videos — up to {MAX_FILES} files at once</p>
                    </div>
                  </div>

                  {uploadFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          {uploadFiles.length} / {MAX_FILES} files
                        </span>
                        <button onClick={() => setUploadFiles([])} className="text-[10px] text-text-muted hover:text-red-500">Clear all</button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5">
                        {uploadFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 p-2 bg-background border border-border rounded-xl group">
                            {f.type.startsWith('video/') ? (
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Upload size={14} className="text-emerald-500" />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-text truncate">{f.name}</p>
                              <p className="text-[10px] text-text-muted">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            <button onClick={() => setUploadFiles(prev => prev.filter((_, j) => j !== i))}
                              className="p-1 rounded text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Category</label>
                        <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-text">
                          {['Graphics Design', 'Social Media Content', 'Branding', 'Printing Design', 'Web & Digital Design', 'Marketing & Advertising Creatives', 'Presentation & Documents'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {uploading && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="text-[10px] text-text-muted text-center">Uploading... {uploadProgress}%</p>
                        </div>
                      )}

                      <button onClick={handleUploadAndAdd} disabled={uploading || !uploadFiles.length}
                        className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors">
                        {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} File${uploadFiles.length > 1 ? 's' : ''} & Add as Slides`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer for gallery tab */}
            {pickerTab === 'gallery' && filteredAssets.length > 0 && (
              <div className="px-5 py-3 border-t border-border shrink-0">
                <button
                  onClick={() => {
                    const checked = document.querySelectorAll<HTMLInputElement>('.sr-only:checked');
                    const ids = Array.from(checked).map(cb => 
                      cb.closest('label')?.querySelector('[data-asset-id]')?.getAttribute('data-asset-id') || ''
                    ).filter(Boolean);
                    const selected = assets.filter(a => ids.includes(a.id));
                    if (selected.length) addSlidesFromAssets(selected);
                  }}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Add Selected as Slides
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

