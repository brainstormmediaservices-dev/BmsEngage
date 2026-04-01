import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Building2, X, Check, Loader2, Camera, Phone, Mail, MessageCircle } from 'lucide-react';
import { startupService, Startup } from '../services/startupService';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', phone: '', whatsapp: '', email: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingLogoFor, setUploadingLogoFor] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const isOwner = user?.activeContext === 'agency' && user?.agencyRole === 'owner';

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setIsLoading(true);
      setStartups(await startupService.list());
    } catch { toast('Failed to load startups', 'error'); }
    finally { setIsLoading(false); }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '', phone: '', whatsapp: '', email: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setShowForm(true);
  };

  const openEdit = (s: Startup) => {
    setEditingId(s.id);
    setForm({ name: s.name, description: s.description, phone: s.phone, whatsapp: s.whatsapp, email: s.email });
    setLogoFile(null);
    setLogoPreview(s.logo);
    setShowForm(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      let saved: Startup;
      if (editingId) {
        saved = await startupService.update(editingId, form);
        setStartups(prev => prev.map(s => s.id === editingId ? saved : s));
      } else {
        saved = await startupService.create(form);
        setStartups(prev => [saved, ...prev]);
      }
      // Upload logo if selected
      if (logoFile) {
        const withLogo = await startupService.uploadLogo(saved.id, logoFile);
        setStartups(prev => prev.map(s => s.id === saved.id ? withLogo : s));
      }
      toast(editingId ? 'Startup updated' : 'Startup added', 'success');
      setShowForm(false);
      setEditingId(null);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to save', 'error');
    } finally { setSaving(false); }
  };

  const handleLogoUploadDirect = async (id: string, file: File) => {
    setUploadingLogoFor(id);
    try {
      const updated = await startupService.uploadLogo(id, file);
      setStartups(prev => prev.map(s => s.id === id ? updated : s));
      toast('Logo updated', 'success');
    } catch { toast('Failed to upload logo', 'error'); }
    finally { setUploadingLogoFor(null); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await startupService.remove(id);
      setStartups(prev => prev.filter(s => s.id !== id));
      toast('Startup removed', 'success');
    } catch { toast('Failed to delete startup', 'error'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-text mb-2">Startups</h1>
          <p className="text-text-muted font-medium text-sm">Manage the startups and organisations under your agency.</p>
        </div>
        {isOwner && (
          <Button onClick={openCreate} className="h-11 px-5 rounded-xl font-bold shadow-xl shadow-primary/30">
            <Plus size={18} className="mr-2" /> Add Startup
          </Button>
        )}
      </div>

      {/* Inline form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-text uppercase tracking-widest">
              {editingId ? 'Edit Startup' : 'New Startup'}
            </h3>

            {/* Logo picker */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-dashed border-primary/30 overflow-hidden flex items-center justify-center">
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                    : <Building2 size={24} className="text-primary/40" />
                  }
                </div>
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Camera size={13} />
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <div className="flex-1 space-y-3">
                <Input label="Name" placeholder="e.g. Acme Corp" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
              <textarea placeholder="Brief description..." value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} spellCheck
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[80px] resize-none transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={11} /> Phone
                </label>
                <input type="tel" placeholder="+1 234 567 8900" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle size={11} className="text-emerald-500" /> WhatsApp
                </label>
                <input type="tel" placeholder="+1 234 567 8900" value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={11} /> Email
                </label>
                <input type="email" placeholder="contact@startup.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                <X size={16} className="mr-1" /> Cancel
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                <Check size={16} className="mr-1" /> {editingId ? 'Save Changes' : 'Add Startup'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : startups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center text-text-muted mb-6">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-text mb-2">No startups yet</h3>
          <p className="text-text-muted text-sm">Add your first startup or organisation to get started.</p>
          {isOwner && (
            <Button onClick={openCreate} className="mt-6 rounded-xl font-bold">
              <Plus size={16} className="mr-2" /> Add Startup
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {startups.map(s => (
            <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-primary/30 transition-all">
              {/* Logo */}
              <div className="relative shrink-0 group/logo">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                  {s.logo
                    ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                    : <Building2 size={22} className="text-primary" />
                  }
                </div>
                {isOwner && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer">
                    {uploadingLogoFor === s.id
                      ? <Loader2 size={14} className="text-white animate-spin" />
                      : <Camera size={14} className="text-white" />
                    }
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUploadDirect(s.id, f); }} />
                  </label>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-text truncate">{s.name}</p>
                {s.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{s.description}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-[10px] text-text-muted hover:text-primary transition-colors">
                      <Phone size={10} /> {s.phone}
                    </a>
                  )}
                  {s.whatsapp && (
                    <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors">
                      <MessageCircle size={10} /> WhatsApp
                    </a>
                  )}
                  {s.email && (
                    <a href={`mailto:${s.email}`} className="flex items-center gap-1 text-[10px] text-text-muted hover:text-primary transition-colors">
                      <Mail size={10} /> {s.email}
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest">
                  Added {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(s)}
                    className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                    className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50">
                    {deletingId === s.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
