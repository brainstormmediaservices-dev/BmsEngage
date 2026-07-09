import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ImageIcon, CheckCircle2, Calendar, ArrowRight, Upload,
  Loader2, Clock, Flag, Eye, Edit2, Plus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../components/ui/Toast';
import { mediaService } from '../../services/mediaService';
import { campaignEventService, CampaignEvent } from '../../services/campaignEventService';
import { MediaAsset } from '../../types/media';
import { AssetDetailModal } from '../../components/gallery/AssetDetailModal';
import { EditAssetModal } from '../../components/gallery/EditAssetModal';
import { UploadMediaModal } from '../../components/gallery/UploadMediaModal';
import { cn } from '../../lib/utils';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isThisWeek,
} from 'date-fns';

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  label, value, icon: Icon, loading, color = 'text-primary', bg = 'bg-primary/10',
}: { label: string; value: string | number; icon: any; loading?: boolean; color?: string; bg?: string }) => (
  <motion.div whileHover={{ y: -3 }}
    className="glass border border-white/10 p-4 sm:p-5 rounded-2xl space-y-3 hover:border-primary/30 transition-all">
    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
      <Icon size={18} className={color} />
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

// ─── Campaign status badge ────────────────────────────────────────────────────
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const campaignStatus = (date: string) => {
  const d = new Date(date); d.setHours(0,0,0,0);
  const t = today();
  if (d < t) return { label: 'Past', cls: 'bg-white/10 text-text-muted' };
  if (d.getTime() === t.getTime()) return { label: 'Today', cls: 'bg-blue-500/15 text-blue-400' };
  return { label: 'Upcoming', cls: 'bg-emerald-500/15 text-emerald-400' };
};

export default function CreativeDashboard() {
  const { user } = useAuth();
  const { canUploadAsset, canViewAsset } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [allMedia, setAllMedia] = useState<MediaAsset[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignEvent[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);

  // Modals
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [parentForVariant, setParentForVariant] = useState<MediaAsset | undefined>();

  useEffect(() => {
    if (canViewAsset) {
      mediaService.getMedia()
        .then(setAllMedia)
        .catch(() => {})
        .finally(() => setMediaLoading(false));
    } else {
      setMediaLoading(false);
    }

    // This week's campaigns
    const now = new Date();
    const from = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const to   = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    campaignEventService.list({ from, to })
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setCampaignsLoading(false));
  }, [canViewAsset]);

  // Filter to current user's assets
  const myAssets = useMemo(() => {
    if (!user) return [];
    return allMedia.filter(a => a.ownerId === user.id || a.uploadedBy === user.name);
  }, [allMedia, user]);

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const assetsThisWeek  = myAssets.filter(a => { const d = new Date(a.metadata.createdDate); return d >= weekStart && d <= weekEnd; });
  const assetsThisMonth = myAssets.filter(a => { const d = new Date(a.metadata.createdDate); return d >= monthStart && d <= monthEnd; });
  const approvedAssets  = myAssets.filter(a => a.approvalStatus === 'approved');
  const recentAssets    = myAssets.slice(0, 6);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text mb-1">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-sm text-text-muted">Here's your creative activity at a glance.</p>
        </div>
        {canUploadAsset && (
          <button
            onClick={() => { setParentForVariant(undefined); setIsUploadOpen(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
          >
            <Upload size={16} /> Upload New Asset
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard label="My Total Assets"   value={mediaLoading ? '—' : myAssets.length}        icon={ImageIcon}     loading={mediaLoading} />
        <StatCard label="This Week"         value={mediaLoading ? '—' : assetsThisWeek.length}   icon={Clock}         loading={mediaLoading} color="text-cyan-400"    bg="bg-cyan-500/10" />
        <StatCard label="This Month"        value={mediaLoading ? '—' : assetsThisMonth.length}  icon={Calendar}      loading={mediaLoading} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard label="Approved"          value={mediaLoading ? '—' : approvedAssets.length}   icon={CheckCircle2}  loading={mediaLoading} color="text-amber-400"   bg="bg-amber-500/10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* My Recent Assets */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-text">My Recent Assets</h2>
            <Link to="/gallery" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <ArrowRight size={13} />
            </Link>
          </div>

          {mediaLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-video bg-card rounded-2xl animate-pulse" />)}
            </div>
          ) : recentAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-card border border-border rounded-2xl gap-3">
              <ImageIcon size={28} className="text-text-muted opacity-40" />
              <p className="text-sm font-semibold text-text">No assets uploaded yet</p>
              <p className="text-xs text-text-muted">Upload your first asset to get started.</p>
              {canUploadAsset && (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-light transition-all"
                >
                  <Plus size={13} /> Upload Asset
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence>
                {recentAssets.map(asset => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer"
                    onClick={() => { setSelectedAsset(asset); setIsDetailOpen(true); }}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      {asset.metadata?.mimeType?.startsWith('video/')
                        ? <video src={asset.url} className="w-full h-full object-cover" muted />
                        : <img src={asset.url} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                      }
                      {/* Approval badge */}
                      <span className={cn(
                        'absolute top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                        asset.approvalStatus === 'approved' ? 'bg-emerald-500/80 text-white' :
                        asset.approvalStatus === 'rejected' ? 'bg-red-500/80 text-white' :
                        'bg-black/50 text-white/70'
                      )}>
                        {asset.approvalStatus}
                      </span>
                      {/* Hover actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={e => { e.stopPropagation(); setSelectedAsset(asset); setIsDetailOpen(true); }}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all">
                          <Eye size={15} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setSelectedAsset(asset); setIsEditOpen(true); }}
                          className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all">
                          <Edit2 size={15} />
                        </button>
                        {canUploadAsset && (
                          <button onClick={e => { e.stopPropagation(); setParentForVariant(asset); setIsUploadOpen(true); }}
                            className="p-2 bg-primary/80 hover:bg-primary rounded-xl text-white transition-all">
                            <Plus size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-text truncate">{asset.title}</p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {format(new Date(asset.metadata.createdDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* This Week's Campaigns */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-text">This Week's Campaigns</h2>
            <Link to="/campaigns" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
              All <ArrowRight size={13} />
            </Link>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            {campaignsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <Flag size={24} className="text-text-muted opacity-40" />
                <p className="text-sm font-semibold text-text">No campaigns this week</p>
                <p className="text-xs text-text-muted">Check back next week or view all campaigns.</p>
              </div>
            ) : (
              campaigns.slice(0, 5).map(c => {
                const { label, cls } = campaignStatus(c.date);
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Flag size={15} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{c.title}</p>
                      <p className="text-[10px] text-text-muted">
                        {format(new Date(c.date), 'EEE, MMM d')}
                      </p>
                    </div>
                    <span className={cn('text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0', cls)}>
                      {label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssetDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        asset={selectedAsset}
        onEdit={a => { setIsDetailOpen(false); setSelectedAsset(a); setIsEditOpen(true); }}
        onDownload={a => toast(`Downloading ${a.title}...`, 'success')}
        onShare={() => {}}
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
