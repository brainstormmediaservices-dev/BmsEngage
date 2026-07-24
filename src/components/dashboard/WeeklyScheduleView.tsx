import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar, Clock, Flag, Image as ImageIcon, ExternalLink, ArrowRight,
  Instagram, Facebook, Twitter, Linkedin, Youtube, Music2 as TikTok,
  Loader2, ChevronLeft, ChevronRight, Megaphone,
} from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { postService, ScheduledPost } from '../../services/postService';
import { campaignEventService, CampaignEvent, scheduledCampaignService, ScheduledCampaign } from '../../services/campaignEventService';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { MediaAsset } from '../../types/media';
import { cn } from '../../lib/utils';
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks, format, isSameDay,
  isToday, isBefore, startOfDay, addDays,
} from 'date-fns';

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

export default function WeeklyScheduleView() {
  const { user } = useAuth();
  const { canViewAsset } = usePermissions();

  const [weekOffset, setWeekOffset] = useState(0);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignEvent[]>([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState<ScheduledCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = useMemo(() => {
    const base = addWeeks(new Date(), weekOffset);
    return startOfWeek(base, { weekStartsOn: 1 });
  }, [weekOffset]);
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  useEffect(() => {
    setLoading(true);
    const from = format(weekStart, 'yyyy-MM-dd');
    const to = format(weekEnd, 'yyyy-MM-dd');

    Promise.all([
      canViewAsset ? mediaService.getMedia() : Promise.resolve([]),
      postService.getAll().catch(() => []),
      campaignEventService.list({ from, to }).catch(() => []),
      scheduledCampaignService.list({ status: 'scheduled' }).catch(() => []),
    ])
      .then(([a, p, c, sc]) => { setAssets(a); setPosts(p); setCampaigns(c); setScheduledCampaigns(sc); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekStart, weekEnd, canViewAsset]);

  const days = useMemo(() => {
    const result: { date: Date; dayName: string; dayNum: number; items: ScheduleItem[]; isToday: boolean; isPast: boolean }[] = [];
    const now = startOfDay(new Date());

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayStart = startOfDay(date);
      const items: ScheduleItem[] = [];

      // Only show future items (today and beyond) — no past
      if (isBefore(dayStart, now) && !isSameDay(dayStart, now)) {
        result.push({
          date, dayName: format(date, 'EEE'), dayNum: date.getDate(),
          items: [], isToday: false, isPast: true,
        });
        continue;
      }

      assets.forEach(a => {
        const d = a.targetDate ? new Date(a.targetDate) : new Date(a.metadata.createdDate);
        if (isSameDay(d, date)) {
          items.push({
            id: `asset-${a.id}`, type: 'asset', title: a.title, date: d,
            status: a.approvalStatus, url: undefined,
          });
        }
      });

      posts.forEach(p => {
        if (p.scheduledTime && isSameDay(new Date(p.scheduledTime), date)) {
          items.push({
            id: `post-${p.id}`, type: 'post',
            title: p.content.slice(0, 80) + (p.content.length > 80 ? '…' : ''),
            date: new Date(p.scheduledTime), time: format(new Date(p.scheduledTime), 'h:mm a'),
            status: p.status === 'scheduled' || p.status === 'published' ? p.status : undefined,
            platforms: p.platforms,
          });
        }
      });

      campaigns.forEach(c => {
        if (isSameDay(new Date(c.date), date)) {
          items.push({
            id: `campaign-${c.id}`, type: 'campaign', title: c.title, date: new Date(c.date),
            status: undefined,
          });
        }
      });

      scheduledCampaigns.forEach(sc => {
        if (sc.scheduledDate) {
          const d = new Date(sc.scheduledDate);
          if (isSameDay(d, date) && (sc.status === 'scheduled' || sc.status === 'published')) {
            items.push({
              id: `scampaign-${sc.id}`, type: 'campaign',
              title: sc.caption.slice(0, 80) + (sc.caption.length > 80 ? '…' : ''),
              date: d, time: format(d, 'h:mm a'), status: sc.status, platforms: sc.platforms,
            });
          }
        }
      });

      items.sort((a, b) => a.date.getTime() - b.date.getTime());

      result.push({
        date, dayName: format(date, 'EEE'), dayNum: date.getDate(),
        items, isToday: isSameDay(date, now), isPast: false,
      });
    }
    return result;
  }, [weekStart, assets, posts, campaigns, scheduledCampaigns]);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <ImageIcon size={11} />;
      case 'post': return <Megaphone size={11} />;
      case 'campaign': return <Flag size={11} />;
      default: return <Calendar size={11} />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'bg-purple-500/15 text-purple-400 border-purple-500/20';
      case 'post': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'campaign': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      default: return 'bg-primary/15 text-primary border-primary/20';
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-text">Weekly Schedule</h3>
            <p className="text-[10px] text-text-muted">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text transition-colors">
            <ChevronLeft size={16} />
          </button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors">
              Today
            </button>
          )}
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-text transition-colors">
            <ChevronRight size={16} />
          </button>
          <Link to="/scheduler"
            className="ml-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
            Full Calendar <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Days grid */}
      {loading ? (
        <div className="grid grid-cols-7 divide-x divide-border">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="p-3 space-y-2 min-h-[160px]">
              <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-12 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 divide-x divide-border">
          {days.map((day, i) => (
            <div key={i} className={cn(
              'flex flex-col min-h-[180px] transition-all',
              day.isToday && 'bg-primary/8',
              day.isPast && 'opacity-30 bg-white/[0.01]',
            )}>
              {/* Day header */}
              <div className={cn(
                'px-3 py-3 text-center border-b border-border',
                day.isToday ? 'bg-primary/15' : day.isPast ? 'bg-white/[0.02]' : '',
              )}>
                <p className={cn(
                  'text-[11px] font-extrabold uppercase tracking-widest',
                  day.isToday ? 'text-primary' : 'text-text-muted',
                )}>{day.dayName}</p>
                <p className={cn(
                  'text-xl font-black mt-0.5',
                  day.isToday ? 'text-primary' : day.isPast ? 'text-text-muted/50' : 'text-text',
                )}>{day.dayNum}</p>
                {day.isToday && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary text-[9px] font-bold text-white uppercase tracking-wider mt-1">
                    Today
                  </span>
                )}
              </div>

              {/* Items */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                {day.isPast ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-text-muted/40 italic">Past</p>
                  </div>
                ) : day.items.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[10px] text-text-muted text-center opacity-50">Nothing scheduled</p>
                  </div>
                ) : (
                  day.items.map(item => (
                    <div key={item.id}
                      className={cn(
                        'p-2.5 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10 cursor-default',
                        typeColor(item.type),
                      )}>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">{typeIcon(item.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-text leading-snug truncate">{item.title}</p>
                          {item.time && (
                            <p className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1">
                              <Clock size={9} /> {item.time}
                            </p>
                          )}
                          {item.platforms && item.platforms.length > 0 && (
                            <div className="flex gap-0.5 mt-1.5">
                              {item.platforms.slice(0, 4).map(p => {
                                const Icon = platformIcons[p] || ExternalLink;
                                return (
                                  <span key={p} className={cn('w-4 h-4 rounded flex items-center justify-center', platformColors[p] || 'bg-white/10 text-text-muted')}>
                                    <Icon size={8} />
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {item.status && (
                            <span className={cn(
                              'inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-1',
                              item.status === 'approved' || item.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                              item.status === 'rejected' || item.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              item.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-white/10 text-text-muted'
                            )}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
