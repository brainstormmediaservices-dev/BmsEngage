import { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Trash2, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [slides, setSlides] = useState<{ assetId: string; asset?: MediaAsset; order: number; notes: string; id?: string }[]>([]);
  const [loading, setLoading] = useState(!!presentationId);
  const [saving, setSaving] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [expandedSlide, setExpandedSlide] = useState<number | null>(null);
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
        setSlides(p.slides.map(s => ({ assetId: s.assetId, order: s.order, notes: s.notes, id: s._id })));
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

  const removeSlide = (idx: number) => {
    setSlides(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })));
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
            <button
              onClick={() => { loadAssets(); setShowAssetPicker(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} /> Add Assets
            </button>
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
                  className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl group cursor-grab active:cursor-grabbing">
                  <GripVertical size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold text-text-muted w-5 text-center">{idx + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-white/5 overflow-hidden shrink-0">
                    {slide.asset?.url && (
                      <img src={slide.asset.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{slide.asset?.title || slide.assetId}</p>
                  </div>
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
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text">Select Assets</h3>
                <button onClick={() => setShowAssetPicker(false)} className="p-1.5 text-text-muted hover:text-text">
                  <X size={16} />
                </button>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/50"
                  placeholder="Search assets..." />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredAssets.map(a => (
                  <label key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                    <input type="checkbox" className="accent-primary" data-asset-id={a.id}
                      onChange={e => {
                        const cb = e.target as HTMLInputElement;
                        // handled on submit
                      }} />
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 shrink-0">
                      <img src={a.url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-semibold text-text truncate">{a.title}</span>
                    <span className="text-[10px] text-text-muted ml-auto shrink-0">{a.category}</span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => {
                  const checked = document.querySelectorAll<HTMLInputElement>('.accent-primary:checked');
                  const ids = Array.from(checked).map(cb => cb.closest('label')?.querySelector('[data-asset-id]')?.getAttribute('data-asset-id') || '').filter(Boolean);
                  if (ids.length) addAssets(ids);
                }}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Add Selected
              </button>
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
