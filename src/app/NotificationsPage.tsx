import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';

const ICONS: Record<string, string> = {
  login: '🔐',
  post_published: '📱',
  post_scheduled: '📅',
  post_failed: '❌',
  account_connected: '🔗',
  account_disconnected: '⚠️',
  media_updated: '🖼️',
  media_comment: '💬',
  media_correction: '✏️',
  media_variant: '🔄',
  system: '🎉',
  team_invite: '🏢',
};

type FilterType = 'all' | 'unread' | 'read';
type CategoryFilter = 'all' | 'security' | 'gallery' | 'posts' | 'system';

const CATEGORY_MAP: Record<CategoryFilter, string[]> = {
  all: [],
  security: ['login', 'account_connected', 'account_disconnected'],
  gallery: ['media_updated', 'media_comment', 'media_correction', 'media_variant'],
  posts: ['post_published', 'post_scheduled', 'post_failed'],
  system: ['system'],
};

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications();
  const [readFilter, setReadFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filtered = notifications.filter(n => {
    if (readFilter === 'unread' && n.read) return false;
    if (readFilter === 'read' && !n.read) return false;
    if (categoryFilter !== 'all' && !CATEGORY_MAP[categoryFilter].includes(n.type)) return false;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-1">Notifications</h1>
          <p className="text-text-muted font-medium">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} className="p-2 text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all" title="Refresh">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors text-sm font-semibold">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Read/Unread filter */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {(['all', 'unread', 'read'] as FilterType[]).map(f => (
            <button key={f} onClick={() => setReadFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                readFilter === f ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              {f}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 flex-wrap">
          {([
            { key: 'all', label: 'All' },
            { key: 'security', label: '🔐 Security' },
            { key: 'gallery', label: '🖼️ Gallery' },
            { key: 'posts', label: '📅 Posts' },
            { key: 'system', label: '🎉 System' },
          ] as { key: CategoryFilter; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setCategoryFilter(f.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                categoryFilter === f.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading && notifications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bell size={32} className="text-primary opacity-50" />
          </div>
          <p className="text-text-muted font-semibold">No notifications found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((n) => (
              <motion.div key={n._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className={cn('p-5 rounded-2xl border transition-all',
                  n.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20')}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0 mt-0.5">{ICONS[n.type] || '📢'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn('text-sm font-bold', n.read ? 'text-text-muted' : 'text-text')}>{n.title}</h3>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-text-muted mt-2">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button onClick={() => markAsRead(n._id)}
                        className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-text-muted hover:text-primary" title="Mark as read">
                        <Check size={15} />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n._id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-text-muted hover:text-red-500" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
