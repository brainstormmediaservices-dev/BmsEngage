import { useState, useEffect } from 'react';
import { MediaCard } from '../components/cards/MediaCard';
import { Button } from '../components/ui/Button';
import { mediaService } from '../services/mediaService';
import { MediaAsset } from '../types/media';
import { AssetDetailModal } from '../components/gallery/AssetDetailModal';
import { EditAssetModal } from '../components/gallery/EditAssetModal';
import { DeleteAssetModal } from '../components/gallery/DeleteAssetModal';
import { ShareAssetModal } from '../components/gallery/ShareAssetModal';
import { UploadMediaModal } from '../components/gallery/UploadMediaModal';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../components/ui/Toast';
import {
  ArrowRight, Clock, ExternalLink, Instagram, Facebook, Twitter,
  Linkedin, Youtube, Music2 as TikTok, Users, Image as ImageIcon, Loader2, Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { requestDeleteMedia, acceptDeleteRequest } from '../services/mediaService';
import { socialService } from '../services/socialService';
import { postService } from '../services/postService';
import api from '../services/api';

const platformIcons: Record<string, any> = {
  Instagram, Facebook, Twitter, LinkedIn: Linkedin, YouTube: Youtube, TikTok,
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { canUploadAsset, canViewAsset } = usePermissions();
  const { user } = useAuth();
  const { toast } = useToast();

  const [allMedia, setAllMedia] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  // Real stat data
  const [connectedAccountsCount, setConnectedAccountsCount] = useState<number | null>(null);
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [avgEngagement, setAvgEngagement] = useState<string | null>(null);

  // Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [parentForVariant, setParentForVariant] = useState<MediaAsset | undefined>(undefined);

  useEffect(() => {
    // 1. Media assets
    if (canViewAsset) {
      mediaService.getMedia().then(setAllMedia).catch(() => {}).finally(() => setMediaLoading(false));
    } else {
      setMediaLoading(false);
    }

    // 2. Connected social accounts (real)
    socialService.getAccounts()
      .then(accs => setConnectedAccountsCount(accs.filter(a => a.isActive).length))
      .catch(() => setConnectedAccountsCount(0));

    // 3. Scheduled: posts with status=scheduled + assets whose targetDate has passed (due)
    Promise.all([
      postService.getAll('scheduled').catch(() => []),
      mediaService.getMedia().catch(() => []),
    ]).then(([posts, assets]) => {
      const now = new Date();
      // Assets whose targetDate is today or in the past (due for posting)
      const dueAssets = assets.filter(a => a.targetDate && new Date(a.targetDate) <= now);
      setScheduledCount(posts.length + dueAssets.length);
    }).catch(() => setScheduledCount(0));

    // 4. Avg engagement from analytics
    api.get('/analytics/social').then(({ data }) => {
      const total = data.summary?.totalPosts || 0;
      if (total > 0) {
        // Simple engagement rate: (published posts / total posts) * 100
        const rate = ((data.summary.totalPosts / Math.max(data.summary.totalPosts + data.summary.totalScheduled + data.summary.totalDrafts, 1)) * 100).toFixed(1);
        setAvgEngagement(`${rate}%`);
      } else {
        setAvgEngagement('—');
      }
    }).catch(() => setAvgEngagement('—'));
  }, [canViewAsset]);

  const recentMedia = allMedia.slice(0, 6);
  const totalAssets = allMedia.length;

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
    <div className="space-y-6 sm:space-y-10 pb-16 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-text mb-1 sm:mb-2">Dashboard</h1>
          <p className="text-sm text-text-muted font-medium">Here's your agency's performance at a glance.</p>
        </div>
        {/* <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/composer', { state: { date: new Date().toISOString().split('T')[0] } })} className="h-12 px-6 rounded-xl font-bold bg-white/5 border-white/10">
            <CalendarIcon size={18} className="mr-2" /> New Calendar Entry
          </Button>
          <Link to="/composer">
            <Button className="h-12 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
              <Plus size={18} className="mr-2" /> New Post
            </Button>
          </Link>
        </div> */}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          {
            label: 'Total Assets',
            value: mediaLoading ? '—' : totalAssets.toString(),
            change: mediaLoading ? '' : `${totalAssets} uploaded`,
            trend: 'up',
            icon: ImageIcon,
          },
          {
            label: 'Scheduled & Due',
            value: scheduledCount === null ? '—' : scheduledCount.toString(),
            change: scheduledCount === null ? '' : `${scheduledCount} items`,
            trend: 'up',
            icon: Clock,
          },
          {
            label: 'Connected Accounts',
            value: connectedAccountsCount === null ? '—' : connectedAccountsCount.toString(),
            change: connectedAccountsCount === null ? '' : `${connectedAccountsCount} active`,
            trend: 'neutral',
            icon: Users,
          },
          {
            label: 'Avg. Engagement',
            value: avgEngagement ?? '—',
            change: avgEngagement && avgEngagement !== '—' ? 'from posts' : '',
            trend: 'up',
            icon: Zap,
          },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -5 }}
            className="glass border border-white/10 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] space-y-3 sm:space-y-4 cursor-pointer group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <stat.icon size={20} />
              </div>
              {stat.change && (
                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full",
                  stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" :
                  stat.trend === 'down' ? "bg-red-500/10 text-red-500" : "bg-white/10 text-text-muted"
                )}>{stat.change}</span>
              )}
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black text-text">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Recent Content */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-text">Recent Content</h2>
            <Link to="/gallery" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
              View Gallery <ArrowRight size={14} />
            </Link>
          </div>

          {!canViewAsset ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-3xl">
              <ImageIcon size={32} className="text-text-muted mb-3 opacity-40" />
              <p className="text-sm text-text-muted">You don't have permission to view media assets.</p>
            </div>
          ) : mediaLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : recentMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-3xl gap-3">
              <ImageIcon size={32} className="text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">No media yet.</p>
              {canUploadAsset && (
                <Link to="/gallery">
                  <Button size="sm" variant="outline">Upload your first asset</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {recentMedia.map(asset => (
                <MediaCard
                  key={asset.id}
                  asset={asset}
                  onView={(a) => { setSelectedAsset(a); setIsDetailOpen(true); }}
                  onEdit={(a) => { setSelectedAsset(a); setIsEditOpen(true); }}
                  onDelete={(a) => { setSelectedAsset(a); setIsDeleteOpen(true); }}
                  onShare={(a) => { setSelectedAsset(a); setIsShareOpen(true); }}
                  onAddVariant={(a) => { setParentForVariant(a); setIsUploadOpen(true); }}
                  onSchedule={(a) => navigate('/composer', { state: { asset: a, date: a.targetDate ? a.targetDate.split('T')[0] : undefined } })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-text">Upcoming</h2>
            <Link to="/scheduler" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
              Full Schedule <ArrowRight size={14} />
            </Link>
          </div>

          <div className="glass border border-white/10 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 space-y-4 sm:space-y-6">
            {[
              { time: '10:00 AM', platform: 'Instagram', title: 'Summer Campaign Launch', status: 'Ready' },
              { time: '02:30 PM', platform: 'Twitter', title: 'Product Update Thread', status: 'Draft' },
              { time: '05:00 PM', platform: 'LinkedIn', title: 'Hiring Announcement', status: 'Ready' },
            ].map((post, i) => {
              const Icon = platformIcons[post.platform] || ExternalLink;
              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-tighter shrink-0">
                    <span className="text-primary">{post.time.split(' ')[1]}</span>
                    <span className="text-text">{post.time.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon size={12} className="text-text-muted" />
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{post.platform}</p>
                    </div>
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors text-text">{post.title}</p>
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
                    post.status === 'Ready' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>{post.status}</span>
                </div>
              );
            })}
            <div className="pt-4">
              <Link to="/scheduler">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold bg-white/5 border-white/10">Open Scheduler</Button>
              </Link>
            </div>
          </div>

          {/* Upgrade Card — commented out
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl text-text">Upgrade to Pro</h3>
                <p className="text-sm text-text-muted leading-relaxed">Unlock advanced analytics, unlimited accounts, and AI-powered caption generation.</p>
              </div>
              <Button className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-xl h-11">Upgrade Now</Button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </div>
          */}
        </div>
      </div>

      {/* Modals */}
      <AssetDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        asset={selectedAsset}
        onEdit={(a) => { setIsDetailOpen(false); setSelectedAsset(a); setIsEditOpen(true); }}
        onDownload={(a) => toast(`Downloading ${a.title}...`, 'success')}
        onShare={(a) => { setSelectedAsset(a); setIsShareOpen(true); }}
        onAssetUpdate={(updated) => {
          setAllMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
        onAddVariantForCorrection={(a, corrId) => {
          setIsDetailOpen(false);
          setParentForVariant(a);
          setIsUploadOpen(true);
        }}
      />
      <EditAssetModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        asset={selectedAsset}
        onSave={(updated) => {
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
        onAssetUpdate={(updated) => {
          setAllMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
      />
      <UploadMediaModal
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); setParentForVariant(undefined); }}
        onUpload={(newAsset) => {
          setAllMedia(prev => {
            const exists = prev.find(m => m.id === newAsset.id);
            if (exists) return prev.map(m => m.id === newAsset.id ? newAsset : m);
            return [newAsset, ...prev];
          });
          setParentForVariant(undefined);
        }}
        parentAsset={parentForVariant}
      />
    </div>
  );
}
