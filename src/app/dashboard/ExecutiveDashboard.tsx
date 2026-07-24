import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ImageIcon, Clock, Users, Zap, ArrowRight, ExternalLink,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Music2 as TikTok,
  Loader2, Flag, Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../components/ui/Toast';
import { mediaService, requestDeleteMedia } from '../../services/mediaService';
import { socialService } from '../../services/socialService';
import { postService, ScheduledPost } from '../../services/postService';
import { campaignEventService, CampaignEvent } from '../../services/campaignEventService';
import { MediaAsset } from '../../types/media';
import { MediaCard } from '../../components/cards/MediaCard';
import { AssetDetailModal } from '../../components/gallery/AssetDetailModal';
import { EditAssetModal } from '../../components/gallery/EditAssetModal';
import { DeleteAssetModal } from '../../components/gallery/DeleteAssetModal';
import { ShareAssetModal } from '../../components/gallery/ShareAssetModal';
import { UploadMediaModal } from '../../components/gallery/UploadMediaModal';
import WeeklyScheduleView from '../../components/dashboard/WeeklyScheduleView';
import DailyScheduleView from '../../components/dashboard/DailyScheduleView';
import { AIRecommendationsPanel } from '../../components/presentation/AIRecommendationsPanel';
import { cn } from '../../lib/utils';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import api from '../../services/api';

const platformIcons: Record<string, any> = {
  meta: Facebook, twitter: Twitter, linkedin: Linkedin, tiktok: TikTok,
  Instagram, Facebook, Twitter, LinkedIn: Linkedin, YouTube: Youtube,
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, sub, icon: Icon, loading,
}: { label: string; value: string; sub?: string; icon: any; loading?: boolean }) => (
  <motion.div whileHover={{ y: -4 }}
    className="glass border border-white/10 p-4 sm:p-6 rounded-2xl space-y-3 hover:border-primary/30 transition-all cursor-pointer group">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      {sub && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">{sub}</span>}
    </div>
    <div>
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
      {loading
        ? <div className="h-7 w-16 bg-white/10 rounded-lg animate-pulse mt-1" />
        : <p className="text-2xl font-black text-text">{value}</p>
      }
    </div>
  </motion.div>
);

// ─── Campaign status ──────────────────────────────────────────────────────────
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const campaignStatus = (date: string) => {
  const d = new Date(date); d.setHours(0,0,0,0);
  const t = today();
  if (d < t) return { label: 'Past', cls: 'bg-white/10 text-text-muted' };
  if (d.getTime() === t.getTime()) return { label: 'Today', cls: 'bg-blue-500/15 text-blue-400' };
  return { label: 'Upcoming', cls: 'bg-emerald-500/15 text-emerald-400' };
};

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const { canUploadAsset, canViewAsset } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [allMedia, setAllMedia] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [connectedCount, setConnectedCount] = useState<number | null>(null);
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [avgEngagement, setAvgEngagement] = useState<string | null>(null);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignEvent[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Modals
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [parentForVariant, setParentForVariant] = useState<MediaAsset | undefined>();

  useEffect(() => {
    // Media
    if (canViewAsset) {
      mediaService.getMedia().then(setAllMedia).catch(() => {}).finally(() => setMediaLoading(false));
    } else {
      setMediaLoading(false);
    }

    // Connected accounts
    socialService.getAccounts()
      .then(accs => setConnectedCount(accs.filter(a => a.isActive).length))
      .catch(() => setConnectedCount(0));

    // Scheduled posts (real API)
    postService.getAll('scheduled')
      .then(posts => {
        setScheduledPosts(posts.slice(0, 5));
        setScheduledCount(posts.length);
      })
      .catch(() => { setScheduledCount(0); setPostsLoading(false); })
      .finally(() => setPostsLoading(false));

    // Avg engagement
    api.get('/analytics/social').then(({ data }) => {
      const total = data.summary?.totalPosts || 0;
      if (total > 0) {
        const rate = ((data.summary.totalPosts / Math.max(data.summary.totalPosts + data.summary.totalScheduled + data.summary.totalDrafts, 1)) * 100).toFixed(1);
        setAvgEngagement(`${rate}%`);
      } else {
        setAvgEngagement('—');
      }
    }).catch(() => setAvgEngagement('—'));

    // This week's campaigns
    const now = new Date();
    const from = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const to   = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    campaignEventService.list({ from, to })
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setCampaignsLoading(false));
  }, [canViewAsset]);

  const recentMedia = allMedia.slice(0, 6);

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
      await mediaService.deleteMedia(selectedAsset.id);
      setAllMedia(prev => prev.filter(m => m.id !== selectedAsset.id));
      toast('Asset deleted', 'success');
      setIsDeleteOpen(false);
      setSelectedAsset(null);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.requiresRequest) {
        try {
          const updated = await requestDeleteMedia(selectedAsset.id);
          setAllMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          toast('Delete request sent', 'success');
        } catch { toast('Failed to send delete request', 'error'); }
      } else {
        toast('Failed to delete asset', 'error');
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-text mb-1">Dashboard</h1>
          <p className="text-sm text-text-muted">Here's your agency's performance at a glance.</p>
        </div>
      </div>

      {/* Daily Schedule */}
      <DailyScheduleView />

      {/* Weekly Schedule */}
      <WeeklyScheduleView />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard label="Total Assets"       value={mediaLoading ? '—' : allMedia.length.toString()}       icon={ImageIcon} loading={mediaLoading} sub={mediaLoading ? undefined : `${allMedia.length} uploaded`} />
        <StatCard label="Scheduled & Due"    value={scheduledCount === null ? '—' : scheduledCount.toString()} icon={Clock}     loading={scheduledCount === null} sub={scheduledCount !== null ? `${scheduledCount} items` : undefined} />
        <StatCard label="Connected Accounts" value={connectedCount === null ? '—' : connectedCount.toString()}  icon={Users}     loading={connectedCount === null} sub={connectedCount !== null ? `${connectedCount} active` : undefined} />
        <StatCard label="Avg. Engagement"    value={avgEngagement ?? '—'}                                       icon={Zap}       loading={avgEngagement === null} sub={avgEngagement && avgEngagement !== '—' ? 'from posts' : undefined} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">

        {/* Recent Content */}
        <div className="xl:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-text">Recent Content</h2>
            <Link to="/gallery" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
              View Gallery <ArrowRight size={14} />
            </Link>
          </div>

          {!canViewAsset ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl">
              <ImageIcon size={28} className="text-text-muted mb-3 opacity-40" />
              <p className="text-sm text-text-muted">You don't have permission to view media assets.</p>
            </div>
          ) : mediaLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : recentMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-2xl gap-3">
              <ImageIcon size={28} className="text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">No assets yet.</p>
              {canUploadAsset && (
                <button onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-light transition-all">
                  <Plus size={13} /> Upload first asset
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {recentMedia.map(asset => (
                <MediaCard
                  key={asset.id}
                  asset={asset}
                  onView={a => { setSelectedAsset(a); setIsDetailOpen(true); }}
                  onEdit={a => { setSelectedAsset(a); setIsEditOpen(true); }}
                  onDelete={a => { setSelectedAsset(a); setIsDeleteOpen(true); }}
                  onShare={a => { setSelectedAsset(a); setIsShareOpen(true); }}
                  onAddVariant={a => { setParentForVariant(a); setIsUploadOpen(true); }}
                  onSchedule={a => navigate('/composer', { state: { asset: a, date: a.targetDate ? a.targetDate.split('T')[0] : undefined } })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Upcoming Scheduled Posts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-text">Upcoming Posts</h2>
              <Link to="/scheduler" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
                Full Schedule <ArrowRight size={14} />
              </Link>
            </div>

            <div className="glass border border-white/10 rounded-2xl p-4 space-y-3">
              {postsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
                </div>
              ) : scheduledPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <Clock size={22} className="text-text-muted opacity-40" />
                  <p className="text-sm font-semibold text-text">No scheduled posts</p>
                  <Link to="/composer" className="text-xs text-primary hover:underline">Create a post →</Link>
                </div>
              ) : (
                scheduledPosts.map(post => {
                  const platform = post.platforms?.[0] ?? '';
                  const Icon = platformIcons[platform] || ExternalLink;
                  return (
                    <div key={post.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{post.content.slice(0, 50)}{post.content.length > 50 ? '…' : ''}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {post.scheduledTime ? format(new Date(post.scheduledTime), 'MMM d, h:mm a') : 'Unscheduled'}
                        </p>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {post.status}
                      </span>
                    </div>
                  );
                })
              )}
              <Link to="/scheduler">
                <button className="w-full mt-1 h-10 rounded-xl text-xs font-semibold border border-border text-text-muted hover:text-text hover:border-primary/30 transition-all">
                  Open Scheduler
                </button>
              </Link>
            </div>
          </div>

          {/* This Week's Campaigns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-text">Campaigns This Week</h2>
              <Link to="/campaigns" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                All <ArrowRight size={13} />
              </Link>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              {campaignsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <Flag size={22} className="text-text-muted opacity-40" />
                  <p className="text-sm font-semibold text-text">No campaigns this week</p>
                </div>
              ) : (
                campaigns.slice(0, 4).map(c => {
                  const { label, cls } = campaignStatus(c.date);
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Flag size={13} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{c.title}</p>
                        <p className="text-[10px] text-text-muted">{format(new Date(c.date), 'EEE, MMM d')}</p>
                      </div>
                      <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0', cls)}>
                        {label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Best Picks — AI Recommended Assets */}
          <AIRecommendationsPanel
            onAssetClick={a => { setSelectedAsset(a); setIsDetailOpen(true); }}
          />
        </div>
      </div>

      {/* Modals */}
      <AssetDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        asset={selectedAsset}
        onEdit={a => { setIsDetailOpen(false); setSelectedAsset(a); setIsEditOpen(true); }}
        onDownload={a => toast(`Downloading ${a.title}...`, 'success')}
        onShare={a => { setSelectedAsset(a); setIsShareOpen(true); }}
        onAssetUpdate={updated => {
          setAllMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
        onAddVariantForCorrection={(a, _corrId) => {
          setIsDetailOpen(false);
          setParentForVariant(a);
          setIsUploadOpen(true);
        }}
      />
      <EditAssetModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        asset={selectedAsset}
        onSave={updated => {
          setAllMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
      />
      <DeleteAssetModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedAsset(null); }}
        onConfirm={handleDelete}
        asset={selectedAsset}
        isLoading={isDeleting}
      />
      <ShareAssetModal
        isOpen={isShareOpen}
        onClose={() => { setIsShareOpen(false); setSelectedAsset(null); }}
        asset={selectedAsset}
        onAssetUpdate={updated => {
          setAllMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
      />
      <UploadMediaModal
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); setParentForVariant(undefined); }}
        onUpload={newAsset => {
          setAllMedia(prev => {
            const exists = prev.find(m => m.id === newAsset.id);
            return exists ? prev.map(m => m.id === newAsset.id ? newAsset : m) : [newAsset, ...prev];
          });
          setParentForVariant(undefined);
        }}
        parentAsset={parentForVariant}
      />
    </div>
  );
}
