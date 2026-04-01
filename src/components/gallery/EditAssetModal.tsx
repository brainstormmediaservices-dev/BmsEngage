import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Trash2, AlertCircle, Save, History, FileText, Image as ImageIcon,
  Film, Layers, ChevronDown, Loader2, Building2, Calendar,
} from 'lucide-react';
import { MediaAsset, MediaVisibility, MediaCategory } from '../../types/media';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { mediaService, deleteVariant } from '../../services/mediaService';
import { startupService, Startup } from '../../services/startupService';
import { useAuth } from '../../contexts/AuthContext';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  onSave: (updatedAsset: MediaAsset) => void;
}

export const EditAssetModal = ({ isOpen, onClose, asset, onSave }: EditAssetModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingVariantId, setDeletingVariantId] = React.useState<string | null>(null);
  const [localAsset, setLocalAsset] = React.useState<MediaAsset | null>(null);
  const [startups, setStartups] = React.useState<Startup[]>([]);
  const wasOpenRef = React.useRef(false);

  const isAgency = user?.activeContext === 'agency';
  const hasStartups = isAgency && startups.length > 0 && user?.agency?.enableStartups;

  // Load startups for agency context
  React.useEffect(() => {
    if (isAgency) startupService.list().then(setStartups).catch(() => {});
  }, [isAgency]);

  React.useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (justOpened && asset) {
      setLocalAsset(asset);
      setFormData({
        title: asset.title,
        category: asset.category,
        description: asset.description,
        tags: asset.tags.join(', '),
        visibility: asset.visibility,
        startupId: asset.startupId || '',
        targetDate: asset.targetDate ? asset.targetDate.split('T')[0] : '',
      });
    }
  }, [asset, isOpen]);

  if (!localAsset || !formData) return null;

  const handleDeleteVariant = async (variantId: string) => {
    setDeletingVariantId(variantId);
    try {
      const updated = await deleteVariant(localAsset.id, variantId);
      setLocalAsset(updated);
      onSave(updated);
      toast('Variant deleted', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to delete variant', 'error');
    } finally { setDeletingVariantId(null); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    if (!formData.title.trim()) { toast('Title is required', 'error'); return; }
    if (!formData.tags.trim()) { toast('At least one tag is required', 'error'); return; }
    if (!formData.targetDate) { toast('Target date is required', 'error'); return; }
    if (hasStartups && !formData.startupId) { toast('Please select a startup / organisation', 'error'); return; }

    setIsSaving(true);
    try {
      const updated = await mediaService.updateMedia(localAsset.id, {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description,
        tags: formData.tags,
        visibility: formData.visibility,
        startupId: formData.startupId || null,
        targetDate: formData.targetDate || null,
      } as any);
      const merged = { ...updated, variants: localAsset.variants };
      onSave(merged);
      toast('Asset updated', 'success');
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to save changes', 'error');
    } finally { setIsSaving(false); }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Flyer': return <FileText size={16} />;
      case 'Image': return <ImageIcon size={16} />;
      case 'Video': return <Film size={16} />;
      case 'Graphics': return <Layers size={16} />;
      default: return <ImageIcon size={16} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit: ${localAsset.title}`} maxWidth="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

          {/* Left: Preview + Variants */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Preview</h4>
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-white/5">
                {localAsset.category === 'Video'
                  ? <video src={localAsset.url} className="w-full h-full object-cover" muted />
                  : <img src={localAsset.url} alt={localAsset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                }
              </div>
            </div>

            {localAsset.variants.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                  <History size={13} /> Variants ({localAsset.variants.length})
                </h4>
                <div className="space-y-2">
                  <AnimatePresence>
                    {localAsset.variants.map((v, i) => (
                      <motion.div key={v.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8, height: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:border-primary/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/20">
                            {v.metadata?.mimeType?.startsWith('video/')
                              ? <video src={v.url} className="w-full h-full object-cover" muted />
                              : <img src={v.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            }
                          </div>
                          <div>
                            <p className="text-xs font-bold text-text truncate max-w-[100px]">{v.title}</p>
                            <p className="text-[10px] text-text-muted">v{v.version}.0 · {v.metadata?.fileSize || ''}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => handleDeleteVariant(v.id!)} disabled={deletingVariantId === v.id}
                          className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50">
                          {deletingVariantId === v.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-8 space-y-5">
            {/* Title — required */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">
                Title <span className="text-red-400">*</span>
              </label>
              <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required spellCheck
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                placeholder="Asset title..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest">Category</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">{getCategoryIcon(formData.category)}</div>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as MediaCategory })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-9 pr-9 text-sm font-bold text-text outline-none focus:border-primary/50 appearance-none transition-all">
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Flyer">Flyer</option>
                    <option value="Graphics">Graphics</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest">Visibility</label>
                <div className="relative">
                  <select value={formData.visibility} onChange={e => setFormData({ ...formData, visibility: e.target.value as MediaVisibility })}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pr-9 text-sm font-bold text-text outline-none focus:border-primary/50 appearance-none transition-all">
                    <option value="Public">Public</option>
                    <option value="Team">Team</option>
                    <option value="Private">Private</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
                </div>
              </div>
            </div>

            {/* Tags — required */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">
                Tags <span className="text-red-400">*</span> <span className="text-text-muted font-normal normal-case">(comma separated)</span>
              </label>
              <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} required spellCheck
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                placeholder="marketing, summer, social..." />
            </div>

            {/* Startup — required for agency with enableStartups */}
            {hasStartups && (
              <div className="space-y-1.5">
                <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={11} /> Startup / Organisation <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select value={formData.startupId} onChange={e => setFormData({ ...formData, startupId: e.target.value })} required
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 pr-9 text-sm font-bold text-text outline-none focus:border-primary/50 appearance-none transition-all">
                    <option value="">— Select a startup —</option>
                    {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
                </div>
              </div>
            )}

            {/* Target Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={11} /> Target Date <span className="text-red-400">*</span> <span className="text-text-muted font-normal normal-case">(week this asset is for)</span>
              </label>
              <input type="date" value={formData.targetDate} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} required
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-text-muted uppercase tracking-widest">Description</label>
              <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} spellCheck
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[100px] resize-none transition-all"
                placeholder="Add a description..." />
            </div>

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
              <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted leading-relaxed">
                Saving changes will notify team members who have this asset in active projects.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button type="submit" className="shadow-xl shadow-primary/30" disabled={isSaving}>
            {isSaving ? <><Loader2 size={15} className="animate-spin mr-2" /> Saving...</> : <><Save size={15} className="mr-2" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
