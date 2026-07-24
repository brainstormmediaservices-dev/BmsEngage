import { useState, useEffect } from 'react';
import { Plus, Presentation, Star, Trash2, Edit2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { presentationService, Presentation as PresentationType } from '../services/presentationService';
import { StarButton } from '../components/ui/StarButton';
import { PresentationBuilder } from '../components/presentation/PresentationBuilder';
import { PresentationViewer } from '../components/presentation/PresentationViewer';
import { cn } from '../lib/utils';

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<PresentationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

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

  if (viewingId) {
    return <PresentationViewer presentationId={viewingId} onClose={() => setViewingId(null)} />;
  }

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
              onClick={() => setViewingId(p._id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Presentation size={18} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
