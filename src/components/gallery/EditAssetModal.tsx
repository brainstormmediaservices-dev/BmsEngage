import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trash2, AlertCircle, Save, History, FileText, Image as ImageIcon, Film, Layers, ChevronDown, Loader2 } from 'lucide-react';
import { MediaAsset, MediaStatus, MediaVisibility, MediaCategory } from '../../types/media';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { mediaService, deleteVariant } from '../../services/mediaService';

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  onSave: (updatedAsset: MediaAsset) => void;
}

export const EditAssetModal = ({ isOpen, onClose, asset, onSave }: EditAssetModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = React.useState<any>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingVariantId, setDeletingVariantId] = React.useState<string | null>(null);
  const [localAsset, setLocalAsset] = React.useState<MediaAsset | null>(null);

  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    // Only reset form when the modal first opens, not on every asset prop change
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (justOpened && asset) {
      setLocalAsset(asset);
      setFormData({
        title: asset.title,
        category: asset.category,
        description: asset.description,
        tags: asset.tags.join(', '),
        status: asset.status,
        visibility: asset.visibility,
      });
    }
  }, [asset, isOpen]);

  if (!localAsset || !formData) return null;

  const handleDeleteVariant = async (variantId: string) => {
    if (!localAsset) return;
    setDeletingVariantId(variantId);
    try {
      const updated = await deleteVariant(localAsset.id, variantId);
      setLocalAsset(updated);
      onSave(updated); // sync parent immediately
      toast('Variant deleted', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to delete variant', 'error');
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localAsset) return;
    setIsSaving(true);
    try {
      const updated = await mediaService.updateMedia(localAsset.id, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        tags: formData.tags,
        status: formData.status,
        visibility: formData.visibility,
      } as any);
      // Merge variants from localAsset (may have been modified)
      const merged = { ...updated, variants: localAsset.variants };
      onSave(merged);
      toast('Asset updated — team has been notified', 'success');
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Flyer': return <FileText size={18} />;
      case 'Image': return <ImageIcon size={18} />;
      case 'Video': return <Film size={18} />;
      case 'Graphics': return <Layers size={18} />;
      default: return <ImageIcon size={18} />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Asset: ${localAsset.title}`} maxWidth="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left: Preview & Variants */}
          <div className="lg:col-span-4 space-y-8">
            {/* Preview */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">Asset Preview</h4>
              <div className="relative aspect-square rounded-[32px] overflow-hidden border border-border bg-white/5">
                {localAsset.category === 'Video' ? (
                  <video src={localAsset.url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={localAsset.url} alt={localAsset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>

            {/* Variants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted flex items-center gap-2">
                  <History size={14} /> Variants ({localAsset.variants.length})
                </h4>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {localAsset.variants.map((v, i) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/20">
                          {v.metadata?.mimeType?.startsWith('video/') ? (
                            <video src={v.url} className="w-full h-full object-cover" muted />
                          ) : (
                            <img src={v.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text truncate max-w-[110px]">{v.title}</p>
                          <p className="text-[10px] text-text-muted">v{v.version}.0 • {v.metadata?.fileSize || ''}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id!)}
                        disabled={deletingVariantId === v.id}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {deletingVariantId === v.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>


              </div>
            </div>
          </div>

          {/* Right: Form Fields */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Asset Title</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                  placeholder="Enter asset title..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Category</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MediaCategory })}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-12 text-sm font-bold text-text outline-none focus:border-primary/50 appearance-none transition-all"
                  >
                    <option value="Image">Image</option>
                    <option value="Video">Video</option>
                    <option value="Flyer">Flyer</option>
                    <option value="Graphics">Graphics</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">{getCategoryIcon(formData.category)}</div>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Tags (comma separated)</label>
                <input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                  placeholder="marketing, summer, social..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MediaStatus })}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as MediaVisibility })}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="Public">Public</option>
                    <option value="Team">Team</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-5 text-sm font-medium text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[160px] resize-none transition-all leading-relaxed"
                placeholder="Add a detailed description for this asset..."
              />
            </div>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-[24px] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-text mb-1">Team Notification</h5>
                <p className="text-xs text-text-muted leading-relaxed">
                  Saving changes will create a notification in your activity feed and notify team members who have this asset in active projects.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
          <Button variant="outline" type="button" onClick={onClose} className="h-12 px-8 rounded-xl font-bold" disabled={isSaving}>Cancel</Button>
          <Button type="submit" className="h-12 px-8 rounded-xl font-bold shadow-xl shadow-primary/30" disabled={isSaving}>
            {isSaving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : <><Save size={18} className="mr-2" /> Save Changes</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
