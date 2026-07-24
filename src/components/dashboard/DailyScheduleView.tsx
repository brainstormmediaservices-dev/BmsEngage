import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar, Clock, Flag, Image as ImageIcon, ExternalLink, ArrowRight,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Music2 as TikTok,
  Loader2, Megaphone, ChevronRight, AlertCircle,
} from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { postService, ScheduledPost } from '../../services/postService';
import {
  campaignEventService, CampaignEvent,
  scheduledCampaignService, ScheduledCampaign,
} from '../../services/campaignEventService';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import { format, isSameDay, startOfDay, addWeeks, endOfWeek, startOfWeek, isBefore, addDays } from 'date-fns';

const platformIcons: Record<string, any> = {
  meta: Facebook, facebook: Facebook, twitter: Twitter, linkedin: Linkedin,
  tiktok: TikTok, instagram: Instagram, YouTube: Youtube, LinkedIn: Linkedin,
};

const platformColors: Record<string, string> = {
  meta: 'bg-blue-500/15 text-blue-400',
  facebook: 'bg-blue-500/15 text-blue-400',
  twitter: 'bg-sky-500/15 text-sky-400',
  linkedin: 'bg-blue-700/15 text-blue-300',
  LinkedIn: 'bg-blue-700/15 text-blue-300',
  tiktok: 'bg-pink-500/15 text-pink-400',
  instagram: 'bg-purple-500/15 text-purple-400',
  YouTube: 'bg-red-500/15 text-red-400',
};

interface ScheduleItem {
  id: string;
  type: 'asset' | 'post' | 'campaign';
  title: string;
  date: Date;
  time?: string;
  status?: string;
  platforms?: string[];
  url?: string;
}

export default function DailyScheduleView() {
  const { user } = useAuth();
  const { canViewAsset } = usePermissions();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignEvent[]>([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState<ScheduledCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      canViewAsset ? mediaService.getMedia() : Promise.resolve([]),
      postService.getAll().catch(() => []),
      campaignEventService.list({}).catch(() => []),
      scheduledCampaignService.list({}).catch(() => []),
    ])
      .then(([a, p, c, sc]) => { setAssets(a); setPosts(p); setCampaigns(c); setScheduledCampaigns(sc); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [canViewAsset]);

  const weekStart = useMemo(() => startOfWeek(today, { weekStartsOn: 1 }), [today]);
  const weekEnd = useMemo(() => endOfWeek(today, { weekStartsOn: 1 }), [today]);
  const nextWeekStart = useMemo(() => addWeeks(weekStart, 1), [weekStart]);
  const nextWeekEnd = useMemo(() => endOfWeek(nextWeekStart, { weekStartsOn: 1 }), [nextWeekStart]);

  const todayItems = useMemo(() => {
    const items: ScheduleItem[] = [];

    assets.forEach(a => {
      const d = a.targetDate ? new Date(a.targetDate) : new Date(a.metadata.createdDate);
      if (isSameDay(d, today)) {
        items.push({
          id: `asset-${a.id}`, type: 'asset', title: a.title, date: d,
          status: a.approvalStatus,
        });
      }
    });

    posts.forEach(p => {
      if (p.scheduledTime && isSameDay(new Date(p.scheduledTime), today) && (p.status === 'scheduled' || p.status === 'published')) {
        items.push({
          id: `post-${p.id}`, type: 'post', title: p.content.slice(0, 80) + (p.content.length > 80 ? '…' : ''),
          date: new Date(p.scheduledTime), time: format(new Date(p.scheduledTime), 'h:mm a'),
          status: p.status, platforms: p.platforms,
        });
      }
    });

    campaigns.forEach(c => {
      const d = new Date(c.date);
      if (isSameDay(d, today)) {
        items.push({
          id: `campaign-${c.id}`, type: 'campaign', title: c.title, date: d,
        });
      }
    });

    scheduledCampaigns.forEach(sc => {
      if (sc.scheduledDate) {
        const d = new Date(sc.scheduledDate);
        if (isSameDay(d, today) && (sc.status === 'scheduled' || sc.status === 'published')) {
          items.push({
            id: `scampaign-${sc.id}`, type: 'campaign', title: sc.caption.slice(0, 80) + (sc.caption.length > 80 ? '…' : ''),
            date: d, time: format(d, 'h:mm a'), status: sc.status, platforms: sc.platforms,
          });
        }
      }
    });

    items.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.date.getTime() - b.date.getTime();
    });

    return items;
  }, [today, assets, posts, campaigns, scheduledCampaigns]);

  const weekCampaigns = useMemo(() => {
    const items: ScheduleItem[] = [];
    const tomorrow = addDays(today, 1);

    campaigns.forEach(c => {
      const d = new Date(c.date);
      if (d >= tomorrow && d <= weekEnd) {
        items.push({ id: `campaign-${c.id}`, type: 'campaign', title: c.title, date: d });
      }
    });

    scheduledCampaigns.forEach(sc => {
      if (sc.scheduledDate) {
        const d = new Date(sc.scheduledDate);
        if (d >= tomorrow && d <= weekEnd && (sc.status === 'scheduled' || sc.status === 'published')) {
          items.push({
            id: `scampaign-${sc.id}`, type: 'campaign',
            title: sc.caption.slice(0, 80) + (sc.caption.length > 80 ? '…' : ''),
            date: d, time: format(d, 'h:mm a'), status: sc.status, platforms: sc.platforms,
          });
        }
      }
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [today, weekEnd, campaigns, scheduledCampaigns]);

  const upcomingCampaigns = useMemo(() => {
    const items: ScheduleItem[] = [];

    campaigns.forEach(c => {
      const d = new Date(c.date);
      if (d >= nextWeekStart && d <= nextWeekEnd) {
        items.push({ id: `campaign-${c.id}`, type: 'campaign', title: c.title, date: d });
      }
    });

    scheduledCampaigns.forEach(sc => {
      if (sc.scheduledDate) {
        const d = new Date(sc.scheduledDate);
        if (d >= nextWeekStart && d <= nextWeekEnd && (sc.status === 'scheduled' || sc.status === 'published')) {
          items.push({
            id: `scampaign-${sc.id}`, type: 'campaign',
            title: sc.caption.slice(0, 80) + (sc.caption.length > 80 ? '…' : ''),
            date: d, time: format(d, 'h:mm a'), status: sc.status, platforms: sc.platforms,
          });
        }
      }
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items;
  }, [nextWeekStart, nextWeekEnd, campaigns, scheduledCampaigns]);

  const typeConfig = (type: string) => {
    switch (type) {
      case 'asset': return { icon: ImageIcon, bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/20', label: 'Asset' };
      case 'post': return { icon: Megaphone, bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Post' };
      case 'campaign': return { icon: Flag, bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Campaign' };
      default: return { icon: Calendar, bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/20', label: '' };
    }
  };

  const statusBadge = (status?: string) => {
    if (!status) return null;
    const cls = status === 'approved' || status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                status === 'rejected' || status === 'failed' ? 'bg-red-500/20 text-red-400' :
                status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                'bg-white/10 text-text-muted';
    return (
      <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded', cls)}>
        {status}
      </span>
    );
  };

  const renderItemRow = (item: ScheduleItem, i: number) => {
    const cfg = typeConfig(item.type);
    const Icon = cfg.icon;
    return (
      <motion.div key={item.id} initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
        className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
          <Icon size={16} className={cfg.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-text leading-snug truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {(item.time || item.type === 'campaign') && (
                  <span className="text-[10px] text-text-muted flex items-center gap-1">
                    <Clock size={10} /> {item.time ? item.time : format(item.date, 'MMM d')}
                  </span>
                )}
                {item.platforms && item.platforms.length > 0 && (
                  <div className="flex gap-1">
                    {item.platforms.slice(0, 4).map(p => {
                      const PI = platformIcons[p] || ExternalLink;
                      return (
                        <span key={p} className={cn('w-4 h-4 rounded flex items-center justify-center',
                          platformColors[p] || 'bg-white/10 text-text-muted')}>
                          <PI size={8} />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded',
                cfg.bg.replace('15', '20'), cfg.text)}>{cfg.label}</span>
              {statusBadge(item.status)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title: string, items: ScheduleItem[], icon: any, emptyMsg: string) => {
    const Icon = icon;
    return (
      <div>
        <div className="flex items-center gap-2 px-5 pt-4 pb-1">
          <Icon size={14} className="text-text-muted" />
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted">{title}</h4>
          {items.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold">{items.length}</span>
          )}
        </div>
        {items.length === 0 ? (
          <p className="text-[12px] text-text-muted px-5 py-3 italic opacity-60">{emptyMsg}</p>
        ) : (
          <div className="divide-y divide-border/30">
            {items.map((item, i) => renderItemRow(item, i))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
            todayItems.length > 0 ? 'bg-primary/15' : 'bg-white/5')}>
            {todayItems.length > 0
              ? <Calendar size={20} className="text-primary" />
              : <Calendar size={20} className="text-text-muted" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-text">Schedule Overview</h3>
            </div>
            <p className="text-[11px] text-text-muted">{format(today, 'EEEE, MMMM d, yyyy')}</p>
          </div>
        </div>
        <Link to="/scheduler"
          className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1 shrink-0">
          Full Schedule <ChevronRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-3">
          {renderSection('Today', todayItems, Calendar,
            'No items scheduled for today')}
          {renderSection('This Week', weekCampaigns, Flag,
            'No campaigns scheduled this week')}
          {renderSection('Next Week', upcomingCampaigns, Flag,
            'No campaigns next week')}
        </div>
      )}
    </motion.div>
  );
}