import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Presentation, Trash2, Edit2, Clock, Share2, Link2, Check, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { presentationService, Presentation as PresentationType } from '../services/presentationService';
import { PresentationBuilder } from '../components/presentation/PresentationBuilder';

export default function PresentationsPage() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<PresentationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const fetchPresentations = async () => {
    setLoading(true);
    try {
      const data = await presentationService.list();
      setPresentations(data);
    } catch (err) {
      console.error('Failed to load presentations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPresentations(); }, []);

  const filtered = presentations.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this presentation?')) return;
    try {
      await presentationService.remove(id);
      setPresentations(prev => prev.filter(p => p._id !== id));
    } catch {}
  };

  const handleShare = async (id: string) => {
    setSharingId(id);
    setShareLink('');
    setShareCopied(false);
    setShareLoading(true);
    try {
      const result = await presentationService.generateShareLink(id);
      setShareLink(`${window.location.origin}/present/shared/${result.shareToken}`);
    } catch {} finally {
      setShareLoading(false);
    }
  };

  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Presentation size={20} />
            </div>
            Presentations
          </h1>
          <p className="text-sm text-text-muted mt-1">Create and manage executive presentations</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowBuilder(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> New Presentation
        </button>
      </div>

      <input
        type="text"
        placeholder="Search presentations..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full sm:w-80 px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-text-muted">
          <Presentation size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-text">No presentations yet</p>
          <p className="text-sm mt-1">Create your first presentation to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-[0_0_20px_-5px_rgba(124,58,237,0.15)] transition-all cursor-pointer"
              onClick={() => navigate(`/present/${p._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Presentation size={18} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/present/${p._id}`); }}
                    className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="Present"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleShare(p._id); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Share"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingId(p._id); setShowBuilder(true); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/5 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(p._id); }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-text truncate">{p.title}</h3>
              {p.description && (
                <p className="text-xs text-text-muted mt-1 line-clamp-2">{p.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {p.client && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {p.client}
                  </span>
                )}
                {p.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
                    {t}
                  </span>
                ))}
                {p.tags.length > 2 && (
                  <span className="text-[10px] text-text-muted">+{p.tags.length - 2}</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-4 text-[10px] text-text-muted font-medium">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {new Date(p.updatedAt).toLocaleDateString()}
                </span>
                <span>{p.slides.length} slides</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showBuilder && (
          <PresentationBuilder
            presentationId={editingId}
            onClose={() => { setShowBuilder(false); setEditingId(null); fetchPresentations(); }}
          />
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {sharingId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSharingId(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Share2 size={18} className="text-primary" /> Share Presentation
              </h3>
              <button onClick={() => setSharingId(null)} className="p-1.5 text-text-muted hover:text-text">
                <X size={16} />
              </button>
            </div>

            {shareLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : shareLink ? (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Anyone with this link can view this presentation without logging in:</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs text-text truncate font-mono min-w-0">
                    {shareLink}
                  </div>
                  <button onClick={copyShareLink}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                      shareCopied ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary text-white hover:bg-primary/90'
                    }`}>
                    {shareCopied ? <><Check size={12} /> Copied</> : <><Link2 size={12} /> Copy</>}
                  </button>
                </div>
                <div className="flex gap-2">
                  <a href={shareLink} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 bg-white/5 text-text-muted rounded-xl text-xs font-semibold text-center hover:text-text transition-colors">
                    Open in new tab
                  </a>
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareLink)}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-semibold text-center hover:bg-emerald-500/20 transition-colors">
                    Share on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-4">Failed to generate link</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
