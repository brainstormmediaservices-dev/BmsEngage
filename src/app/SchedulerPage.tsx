import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, List, Loader2, Image as ImageIcon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays, isPast, startOfDay,
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PostDetailsModal } from '../components/scheduler/PostDetailsModal';
import { DeleteConfirmationModal } from '../components/scheduler/DeleteConfirmationModal';
import { AssetDetailModal } from '../components/gallery/AssetDetailModal';
import { useToast } from '../components/ui/Toast';
import { mediaService } from '../services/mediaService';
import { postService, ScheduledPost } from '../services/postService';
import { MediaAsset } from '../types/media';
import { SocialPost } from '../types/social';
import { usePermissions } from '../hooks/usePermissions';

type ViewType = 'Monthly' | 'Weekly';
type SchedulerTab = 'assets' | 'posts';

// Mini asset card shown inside a calendar cell
function AssetCellItem({ assets, onOpen }: { assets: MediaAsset[]; onOpen: (a: MediaAsset) => void }) {
  const [idx, setIdx] = useState(0);
  if (!assets.length) return null;
  const asset = assets[idx];
  const displayUrl = asset.variants.length > 0
    ? [...asset.variants].sort((a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime())[0].url
    : asset.url;

  return (
    <div className="space-y-0.5">
      <div onClick={e => { e.stopPropagation(); onOpen(asset); }}
        className="relative rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-primary/50 transition-all group/ac"
        style={{ aspectRatio: '4/3' }}>
        {asset.category === 'Video'
          ? <video src={displayUrl} className="w-full h-full object-cover" muted />
          : <img src={displayUrl} alt={asset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        }
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/ac:opacity-100 transition-opacity flex items-end p-1">
          <p className="text-[7px] font-bold text-white truncate w-full">{asset.title}</p>
        </div>
        <div className={cn('absolute top-1 right-1 w-1.5 h-1.5 rounded-full',
          asset.status === 'Approved' ? 'bg-emerald-500' :
          asset.status === 'Corrected' ? 'bg-cyan-400' :
          asset.status === 'Sent for Correction' ? 'bg-orange-400' : 'bg-blue-400'
        )} />
      </div>
      {assets.length > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); }}
            disabled={idx === 0} className="text-[9px] text-text-muted hover:text-primary disabled:opacity-30">‹</button>
          <span className="text-[8px] text-text-muted">{idx + 1}/{assets.length}</span>
          <button onClick={e => { e.stopPropagation(); setIdx(i => Math.min(assets.length - 1, i + 1)); }}
            disabled={idx === assets.length - 1} className="text-[9px] text-text-muted hover:text-primary disabled:opacity-30">›</button>
        </div>
      )}
    </div>
  );
}

export default function SchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('Monthly');
  const [tab, setTab] = useState<SchedulerTab>('assets');
  const [isLoading, setIsLoading] = useState(true);
  const [allAssets, setAllAssets] = useState<MediaAsset[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isAssetDetailOpen, setIsAssetDetailOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewAsset } = usePermissions();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      if (tab === 'assets' && canViewAsset) {
        setAllAssets(await mediaService.getMedia());
      } else if (tab === 'posts') {
        setPosts(await postService.getAll());
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [tab, canViewAsset]);

  useEffect(() => { load(); }, [load]);

  const assetsByDate = useMemo(() => {
    const m: Record<string, MediaAsset[]> = {};
    allAssets.forEach(a => {
      if (a.targetDate) {
        const k = format(new Date(a.targetDate), 'yyyy-MM-dd');
        if (!m[k]) m[k] = [];
        m[k].push(a);
      }
    });
    return m;
  }, [allAssets]);

  const postsByDate = useMemo(() => {
    const m: Record<string, ScheduledPost[]> = {};
    posts.forEach(p => {
      if (p.scheduledTime) {
        const k = format(new Date(p.scheduledTime), 'yyyy-MM-dd');
        if (!m[k]) m[k] = [];
        m[k].push(p);
      }
    });
    return m;
  }, [posts]);

  const nav = (dir: 'prev' | 'next') => {
    if (view === 'Monthly') setCurrentDate(d => dir === 'next' ? addMonths(d, 1) : subMonths(d, 1));
    else setCurrentDate(d => dir === 'next' ? addWeeks(d, 1) : subWeeks(d, 1));
  };

  const goCompose = (date: Date) => {
    navigate('/composer', { state: { date: format(date, 'yyyy-MM-dd'), isPast: isPast(startOfDay(date)) && !isSameDay(date, new Date()) } });
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      await postService.delete(selectedPost.id);
      setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
      toast('Post deleted', 'success');
    } catch { toast('Failed to delete', 'error'); }
    setIsDeleteModalOpen(false); setIsDetailModalOpen(false);
  };

  const renderMonthly = () => {
    const ms = startOfMonth(currentDate);
    const days = eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(endOfMonth(ms)) });
    return (
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const k = format(day, 'yyyy-MM-dd');
          const da = assetsByDate[k] || [];
          const dp = postsByDate[k] || [];
          const inMonth = isSameMonth(day, ms);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={i} onClick={() => tab === 'posts' && goCompose(day)}
              className={cn('min-h-[110px] p-1.5 border-r border-b border-white/5 group relative',
                !inMonth && 'opacity-20', inMonth && tab === 'posts' && 'cursor-pointer hover:bg-white/[0.02]')}>
              <div className="flex justify-between items-start mb-1">
                <span className={cn('text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-md',
                  isToday ? 'bg-primary text-white' : 'text-text-muted')}>{format(day, 'd')}</span>
                {tab === 'posts' && (
                  <button onClick={e => { e.stopPropagation(); goCompose(day); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-primary/20 rounded text-primary transition-all">
                    <Plus size={11} />
                  </button>
                )}
              </div>
              {tab === 'assets' && da.length > 0 && <AssetCellItem assets={da} onOpen={a => { setSelectedAsset(a); setIsAssetDetailOpen(true); }} />}
              {tab === 'posts' && dp.slice(0, 2).map(p => (
                <div key={p.id} onClick={e => { e.stopPropagation(); setSelectedPost(p as any); setIsDetailModalOpen(true); }}
                  className="p-1 mb-0.5 rounded bg-primary/10 border border-primary/20 cursor-pointer hover:border-primary/50 transition-all">
                  <p className="text-[7px] font-bold text-text truncate">{p.content}</p>
                </div>
              ))}
              {tab === 'posts' && dp.length > 2 && <p className="text-[7px] text-primary font-bold">+{dp.length - 2}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekly = () => {
    const days = eachDayOfInterval({
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    });
    return (
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((day, i) => {
          const k = format(day, 'yyyy-MM-dd');
          const da = assetsByDate[k] || [];
          const dp = postsByDate[k] || [];
          const isToday = isSameDay(day, new Date());
          return (
            <div key={i} className={cn('border-r border-white/5 p-2 space-y-2', isToday && 'bg-primary/[0.02]')}>
              <div className="flex flex-col items-center gap-0.5 mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{format(day, 'EEE')}</span>
                <span className={cn('text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl',
                  isToday ? 'bg-primary text-white' : 'text-text')}>{format(day, 'd')}</span>
              </div>
              {tab === 'assets' && da.map(asset => {
                const url = asset.variants.length > 0
                  ? [...asset.variants].sort((a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime())[0].url
                  : asset.url;
                return (
                  <div key={asset.id} onClick={() => { setSelectedAsset(asset); setIsAssetDetailOpen(true); }}
                    className="rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-primary/50 transition-all">
                    <div className="aspect-video">
                      {asset.category === 'Video'
                        ? <video src={url} className="w-full h-full object-cover" muted />
                        : <img src={url} alt={asset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      }
                    </div>
                    <div className="p-1.5">
                      <p className="text-[8px] font-bold text-text truncate">{asset.title}</p>
                      <p className={cn('text-[7px] font-bold',
                        asset.status === 'Approved' ? 'text-emerald-500' :
                        asset.status === 'Corrected' ? 'text-cyan-400' :
                        asset.status === 'Sent for Correction' ? 'text-orange-400' : 'text-blue-400'
                      )}>{asset.status}</p>
                    </div>
                  </div>
                );
              })}
              {tab === 'posts' && dp.map(p => (
                <div key={p.id} onClick={() => { setSelectedPost(p as any); setIsDetailModalOpen(true); }}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                  <p className="text-[8px] text-text line-clamp-2">{p.content}</p>
                  <p className="text-[7px] text-text-muted mt-0.5">{p.scheduledTime ? format(new Date(p.scheduledTime), 'h:mm a') : 'Draft'}</p>
                </div>
              ))}
              {tab === 'posts' && dp.length === 0 && (
                <button onClick={() => goCompose(day)}
                  className="w-full py-6 border-2 border-dashed border-white/5 rounded-xl text-text-muted/20 hover:text-primary/40 hover:border-primary/20 transition-all flex items-center justify-center">
                  <Plus size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-text mb-1">Content Scheduler</h1>
          <p className="text-sm text-text-muted">Plan and visualize your agency's content pipeline.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['Monthly', 'Weekly'] as ViewType[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn('relative px-4 py-2 rounded-lg text-xs font-bold transition-all', v === view ? 'text-white' : 'text-text-muted hover:text-text')}>
                {v === view && <motion.div layoutId="vp" className="absolute inset-0 bg-primary rounded-lg" />}
                <span className="relative z-10">{v}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/composer')} className="h-10 px-4 rounded-xl font-bold shadow-xl shadow-primary/30">
            <Plus size={15} className="mr-1.5" /> Create Post
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Assets', count: allAssets.length, icon: ImageIcon, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Scheduled', count: posts.filter(p => p.status === 'scheduled').length, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Drafts', count: posts.filter(p => p.status === 'draft').length, icon: List, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className="glass border border-white/10 p-4 rounded-2xl flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-black text-text">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="glass border border-white/10 rounded-[24px] overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl" onClick={() => nav('prev')}><ChevronLeft size={16} /></Button>
            <Button variant="outline" className="h-9 px-3 rounded-xl text-xs font-bold" onClick={() => setCurrentDate(new Date())}>Today</Button>
            <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl" onClick={() => nav('next')}><ChevronRight size={16} /></Button>
            <h2 className="text-base sm:text-xl font-black text-text ml-1">
              {view === 'Monthly' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`}
            </h2>
          </div>
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            <button onClick={() => setTab('assets')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                tab === 'assets' ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              <ImageIcon size={13} /> Assets
            </button>
            <button onClick={() => setTab('posts')}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                tab === 'posts' ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              <CalendarIcon size={13} /> Posts
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
          {(view === 'Weekly' ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map(d => (
            <div key={d} className="py-2 text-center text-[9px] font-black uppercase tracking-widest text-text-muted">{d}</div>
          ))}
        </div>

        <div className="relative min-h-[350px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={28} className="text-primary animate-spin" />
              </motion.div>
            ) : (
              <motion.div key={tab + view + currentDate.toISOString()}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}>
                {view === 'Monthly' ? renderMonthly() : renderWeekly()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AssetDetailModal
        isOpen={isAssetDetailOpen}
        onClose={() => setIsAssetDetailOpen(false)}
        asset={selectedAsset}
        onEdit={() => {}}
        onDownload={() => {}}
        onShare={() => {}}
        onAssetUpdate={u => { setAllAssets(prev => prev.map(a => a.id === u.id ? u : a)); setSelectedAsset(u); }}
      />
      <PostDetailsModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        post={selectedPost} onEdit={p => navigate('/composer', { state: { post: p } })}
        onDelete={p => { setSelectedPost(p); setIsDeleteModalOpen(true); }} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeletePost} />
    </div>
  );
}
