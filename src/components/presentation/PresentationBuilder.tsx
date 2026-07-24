import { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Trash2, Plus, Search, ChevronDown, ChevronUp, LayoutGrid, List, Upload, FolderOpen, Film, EyeOff, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { presentationService, Presentation } from '../../services/presentationService';
import { mediaService } from '../../services/mediaService';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';

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
  const [slides, setSlides] = useState<{ assetId: string; asset?: MediaAsset; order: number; notes: string; id?: string; hidden?: boolean }[]>([]);
  const [loading, setLoading] = useState(!!presentationId);
  const [saving, setSaving] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetViewMode, setAssetViewMode] = useState<'list' | 'grid'>('grid');
  const [pickerTab, setPickerTab] = useState<'gallery' | 'upload'>('gallery');
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCategory, setUploadCategory] = useState('Graphics Design');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 10;
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (presentationId) {
      presentationService.getOne(presentationId).then(p => {
        setTitle(p.title);
        setDescription(p.description);
        setClient(p.client);
        setIndustry(p.industry);
        setTags(p.tags);
        setSlides(p.slides.map(s => ({ assetId: s.assetId, order: s.order, notes: s.notes, id: s._id, hidden: s.hidden })));
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

  const addAssets = (ids: string[]) => {
    const newSlides = ids.map((id, i) => ({
      assetId: id,
      order: slides.length + i,
      notes: '',
    }));
    setSlides(prev => [...prev, ...newSlides]);
    setShowAssetPicker(false);
  };

  const addFilesToQueue = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const filtered = arr.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    setUploadFiles(prev => {
      const combined = [...prev, ...filtered];
      return combined.slice(0, MAX_FILES);
    });
  };

  const removeUploadFile = (idx: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== idx));
  };

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
        setSlides(prev => [...prev, { assetId: asset.id, order: prev.length, notes: '' }]);
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }
      setUploadFiles([]);
      setShowAssetPicker(false);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeSlide = (idx: number) => {
    setSlides(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
  };

  const toggleHidden = (idx: number) => {
    setSlides(prev => prev.map((s, i) => i === idx ? { ...s, hidden: !s.hidden } : s));
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const updated = [...slides];
    const [removed] = updated.splice(dragItem.current, 1);
    updated.splice(dragOverItem.current, 0, removed);
    setSlides(updated.map((s, i) => ({ ...s, order: i })));
    dragItem.current = null;
    dragOverItem.current = null;
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
        p = await presentationService.update(presentationId, { title, description, client, industry, tags } as any);
        // Sync slides
        await Promise.all(slides.filter(s => !s.id).map(s =>
          presentationService.addSlides(p._id, [s.assetId])
        ));
        // Remove deleted slides
        const orig = await presentationService.getOne(presentationId);
        const toRemove = orig.slides.filter(s => !slides.find(ns => ns.id === s._id));
        await Promise.all(toRemove.map(s => presentationService.removeSlide(p._id, s._id)));
      } else {
        p = await presentationService.create({ title, description, client, industry, tags } as any);
        if (slides.length) {
          await presentationService.addSlides(p._id, slides.map(s => s.assetId));
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
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-4xl p-6 space-y-5">

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-text">
            {presentationId ? 'Edit Presentation' : 'New Presentation'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
              placeholder="e.g. Q1 Campaign Overview" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text resize-none focus:outline-none focus:border-primary/50"
              placeholder="Brief description..." />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Client</label>
            <input value={client} onChange={e => setClient(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
              placeholder="Client name" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
              placeholder="e.g. Technology" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="ml-0.5 hover:text-red-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
                placeholder="Add tag..." />
              <button onClick={addTag} className="px-3 py-2 bg-white/5 rounded-xl text-sm text-text-muted hover:text-text">
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Slides */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text">Slides ({slides.length})</h3>
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(prev => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus size={14} /> Add Assets
              </button>
              {showAddMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                  <button onClick={() => { setShowAddMenu(false); loadAssets(); setShowAssetPicker(true); setPickerTab('gallery'); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                    <FolderOpen size={14} className="text-primary" /> From Gallery
                  </button>
                  <button onClick={() => { setShowAddMenu(false); setPickerTab('upload'); setShowAssetPicker(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                    <Upload size={14} className="text-emerald-500" /> From Computer
                  </button>
                </div>
              )}
            </div>
          </div>

          {slides.length === 0 ? (
            <div className="text-center py-10 text-text-muted border border-dashed border-border rounded-xl">
              <p className="text-sm">No slides yet. Click "Add Assets" to start.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {slides.map((slide, idx) => (
                <div key={idx}
                  draggable
                  onDragStart={() => { dragItem.current = idx; }}
                  onDragEnter={() => { dragOverItem.current = idx; }}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={cn(
                    "flex items-center gap-3 p-3 bg-background border border-border rounded-xl group cursor-grab active:cursor-grabbing transition-all",
                    slide.hidden && "opacity-40"
                  )}>
                  <GripVertical size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold text-text-muted w-5 text-center">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0">
                    {slide.asset?.url && (
                      <img src={slide.asset.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{slide.asset?.title || slide.assetId}</p>
                    {slide.hidden && (
                      <span className="text-[9px] font-bold text-amber-500">Hidden from viewers</span>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleHidden(idx); }}
                    className="p-1 rounded-lg text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-all"
                    title={slide.hidden ? 'Show to viewers' : 'Hide from viewers'}>
                    {slide.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button onClick={() => removeSlide(idx)}
                    className="p-1 rounded-lg text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Asset picker modal */}
        {showAssetPicker && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAssetPicker(false)}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-text">
                    {pickerTab === 'gallery' ? 'Select from Gallery' : 'Upload from Computer'}
                  </h3>
                  <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                    <button onClick={() => setPickerTab('gallery')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-colors ${pickerTab === 'gallery' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'}`}>
                      <FolderOpen size={11} /> Gallery
                    </button>
                    <button onClick={() => setPickerTab('upload')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-colors ${pickerTab === 'upload' ? 'bg-emerald-500/20 text-emerald-500' : 'text-text-muted hover:text-text'}`}>
                      <Upload size={11} /> Upload
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pickerTab === 'gallery' && (
                    <div className="flex bg-background border border-border rounded-lg overflow-hidden">
                      <button onClick={() => setAssetViewMode('grid')}
                        className={`p-1.5 transition-colors ${assetViewMode === 'grid' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'}`}>
                        <LayoutGrid size={14} />
                      </button>
                      <button onClick={() => setAssetViewMode('list')}
                        className={`p-1.5 transition-colors ${assetViewMode === 'list' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text'}`}>
                        <List size={14} />
                      </button>
                    </div>
                  )}
                  <button onClick={() => setShowAssetPicker(false)} className="p-1.5 text-text-muted hover:text-text">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {pickerTab === 'gallery' ? (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
                      placeholder="Search assets..." />
                  </div>

                  {assetViewMode === 'grid' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pr-1">
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
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded border border-white/40 bg-black/30 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-semibold text-white truncate">{a.title}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                      {filteredAssets.map(a => (
                        <label key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                          <input type="checkbox" className="accent-primary" data-asset-id={a.id} />
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0">
                            {a.metadata?.mimeType?.startsWith('video/') ? (
                              <video src={a.url} className="w-full h-full object-cover" muted />
                            ) : (
                              <img src={a.url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-text truncate">{a.title}</span>
                          <span className="text-[10px] text-text-muted ml-auto shrink-0">{a.category}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const checked = document.querySelectorAll<HTMLInputElement>(
                        assetViewMode === 'grid' ? '.sr-only:checked' : '.accent-primary:checked'
                      );
                      const ids = Array.from(checked).map(cb => {
                        return cb.closest('label')?.querySelector('[data-asset-id]')?.getAttribute('data-asset-id')
                          || cb.getAttribute('data-asset-id')
                          || '';
                      }).filter(Boolean);
                      if (ids.length) addAssets(ids);
                    }}
                    className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Add Selected
                  </button>
                </>
              ) : (
                /* Upload tab */
                <div className="space-y-4">
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden"
                    onChange={e => { if (e.target.files) addFilesToQueue(e.target.files); e.target.value = ''; }} />

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-10 border-2 border-dashed rounded-2xl flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <Upload size={28} className={dragOver ? 'text-primary' : 'text-text-muted'} />
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${dragOver ? 'text-primary' : 'text-text-muted'}`}>
                        {dragOver ? 'Drop files here' : 'Drag & drop or click to browse'}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Images &amp; videos — up to {MAX_FILES} files at once
                      </p>
                    </div>
                  </div>

                  {/* File list */}
                  {uploadFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          {uploadFiles.length} / {MAX_FILES} files
                        </p>
                        <button onClick={() => setUploadFiles([])} className="text-[10px] text-text-muted hover:text-red-500 transition-colors">
                          Clear all
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {uploadFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2.5 p-2 bg-background border border-border rounded-xl group">
                            {file.type.startsWith('video/') ? (
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <Film size={14} className="text-emerald-500" />
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 shrink-0">
                                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-text truncate">{file.name}</p>
                              <p className="text-[10px] text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                            </div>
                            <button onClick={() => removeUploadFile(idx)}
                              className="p-1 rounded text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Category (for all)</label>
                        <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                          className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50">
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
                        {uploading ? 'Uploading...' : `Upload ${uploadFiles.length} Asset${uploadFiles.length > 1 ? 's' : ''} & Add to Slides`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 text-text-muted rounded-xl text-sm font-semibold hover:text-text transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !title.trim()}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : presentationId ? 'Save Changes' : 'Create Presentation'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
