import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, RefreshCw, ArrowRight, Flag, Image as ImageIcon, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';
import { respondToInvitation } from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';

// ─── Icon + color per type ────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  login:                { icon: '🔐', color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  account_connected:    { icon: '🔗', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  account_disconnected: { icon: '⚠️', color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  media_updated:        { icon: '🖼️', color: 'text-purple-400',  bg: 'bg-purple-500/10' },
  media_comment:        { icon: '💬', color: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  media_correction:     { icon: '✏️', color: 'text-orange-400',  bg: 'bg-orange-500/10' },
  media_variant:        { icon: '🔄', color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
  post_published:       { icon: '📱', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  post_scheduled:       { icon: '📅', color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  post_failed:          { icon: '❌', color: 'text-red-400',     bg: 'bg-red-500/10' },
  system:               { icon: '🎉', color: 'text-primary',     bg: 'bg-primary/10' },
  team_invite:          { icon: '🏢', color: 'text-primary',     bg: 'bg-primary/10' },
  campaign_created:     { icon: '📅', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  campaign_updated:     { icon: '✏️', color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  campaign_deleted:     { icon: '🗑️', color: 'text-red-400',    bg: 'bg-red-500/10' },
};

const cfg = (type: string) => TYPE_CONFIG[type] ?? { icon: '📢', color: 'text-primary', bg: 'bg-primary/10' };

type ReadFilter = 'all' | 'unread' | 'read';
type CatFilter  = 'all' | 'campaigns' | 'gallery' | 'posts' | 'system';

const CAT_MAP: Record<CatFilter, string[]> = {
  all:       [],
  campaigns: ['campaign_created', 'campaign_updated', 'campaign_deleted'],
  gallery:   ['media_updated', 'media_comment', 'media_correction', 'media_variant'],
  posts:     ['post_published', 'post_scheduled', 'post_failed'],
  system:    ['system', 'login', 'account_connected', 'account_disconnected', 'team_invite'],
};

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [catFilter, setCatFilter]   = useState<CatFilter>('all');
  const [selected, setSelected]     = useState<Notification | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Auto-select from URL param
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && notifications.length > 0) {
      const found = notifications.find(n => n._id === id);
      if (found) {
        setSelected(found);
        const isPendingInvite = found.type === 'team_invite' && found.data?.inviteId;
        if (!found.read && !isPendingInvite) markAsRead(found._id);
      }
    }
  }, [searchParams, notifications]);

  const handleSelect = (n: Notification) => {
    setSelected(n);
    setSearchParams({ id: n._id }, { replace: true });
    const isPendingInvite = n.type === 'team_invite' && n.data?.inviteId;
    if (!n.read && !isPendingInvite) markAsRead(n._id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    if (selected?._id === id) { setSelected(null); setSearchParams({}, { replace: true }); }
  };

  const handleInviteResponse = async (n: Notification, action: 'accept' | 'reject') => {
    const inviteId = n.data?.inviteId;
    if (!inviteId) return;
    setRespondingId(inviteId);
    try {
      await respondToInvitation(inviteId, action);
      await markAsRead(n._id);
      await fetchNotifications();
      if (action === 'accept') await refreshUser();
    } catch { /* ignore */ }
    finally { setRespondingId(null); }
  };

  const filtered = notifications.filter(n => {
    if (readFilter === 'unread' && n.read) return false;
    if (readFilter === 'read' && !n.read) return false;
    if (catFilter !== 'all' && !CAT_MAP[catFilter].includes(n.type)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text mb-1">Notifications</h1>
          <p className="text-sm text-text-muted">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} className="p-2 text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-semibold transition-colors">
              <CheckCheck size={15} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {(['all', 'unread', 'read'] as ReadFilter[]).map(f => (
            <button key={f} onClick={() => setReadFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                readFilter === f ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 flex-wrap">
          {([
            { key: 'all',       label: 'All' },
            { key: 'campaigns', label: '📅 Campaigns' },
            { key: 'gallery',   label: '🖼️ Gallery' },
            { key: 'posts',     label: '📱 Posts' },
            { key: 'system',    label: '🔐 System' },
          ] as { key: CatFilter; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setCatFilter(f.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                catFilter === f.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: list */}
        <div className="lg:col-span-2 space-y-2">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Bell size={26} className="text-primary opacity-50" />
              </div>
              <p className="text-sm font-semibold text-text-muted">No notifications found</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map(n => {
                const c = cfg(n.type);
                const isActive = selected?._id === n._id;
                return (
                  <motion.button
                    key={n._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => handleSelect(n)}
                    className={cn(
                      'w-full text-left p-4 rounded-2xl border transition-all group',
                      isActive
                        ? 'bg-primary/10 border-primary/30'
                        : n.read
                          ? 'bg-card border-border hover:border-primary/20'
                          : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base', c.bg)}>
                        {c.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm font-semibold truncate', n.read ? 'text-text-muted' : 'text-text')}>
                            {n.title}
                          </p>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-text-muted mt-1">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Right: detail */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected._id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 space-y-5 sticky top-6"
              >
                {/* Detail header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0', cfg(selected.type).bg)}>
                      {cfg(selected.type).icon}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-text">{selected.title}</h2>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest mt-0.5">
                        {selected.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setSelected(null); setSearchParams({}, { replace: true }); }}
                    className="p-1.5 text-text-muted hover:text-text hover:bg-white/5 rounded-lg transition-colors shrink-0">
                    <X size={16} />
                  </button>
                </div>

                {/* Message */}
                <p className="text-sm text-text leading-relaxed">{selected.message}</p>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>{format(new Date(selected.createdAt), 'MMM d, yyyy · h:mm a')}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}</span>
                </div>

                {/* Type badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', cfg(selected.type).bg, cfg(selected.type).color, 'border-current/20')}>
                    {selected.type.replace(/_/g, ' ')}
                  </span>
                  {!selected.read && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      Unread
                    </span>
                  )}
                </div>

                {/* Contextual action */}
                {selected.link && (
                  <button
                    onClick={() => navigate(selected.link!)}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/25 hover:scale-[1.01] transition-all"
                  >
                    {selected.entityType === 'campaign' && <><Flag size={15} /> View Campaign</>}
                    {selected.entityType === 'asset'    && <><ImageIcon size={15} /> Open Asset</>}
                    {selected.entityType === 'post'     && <><FileText size={15} /> View Post</>}
                    {!selected.entityType               && <>Go to page <ArrowRight size={15} /></>}
                  </button>
                )}

                {/* Team invite actions */}
                {selected.type === 'team_invite' && selected.data?.inviteId && (
                  <div className="flex gap-3">
                    <button onClick={() => handleInviteResponse(selected, 'accept')}
                      disabled={respondingId === selected.data.inviteId}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors">
                      <Check size={14} /> Accept
                    </button>
                    <button onClick={() => handleInviteResponse(selected, 'reject')}
                      disabled={respondingId === selected.data.inviteId}
                      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors">
                      <X size={14} /> Decline
                    </button>
                  </div>
                )}

                {/* Delete */}
                <button onClick={() => handleDelete(selected._id)}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-border hover:border-red-500/20 transition-all">
                  <Trash2 size={14} /> Delete notification
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-card border border-border rounded-2xl"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bell size={26} className="text-primary opacity-40" />
                </div>
                <p className="text-sm font-semibold text-text-muted">Select a notification</p>
                <p className="text-xs text-text-muted mt-1">Click any notification to see the full details.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
