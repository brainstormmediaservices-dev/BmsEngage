import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, CheckCheck, Trash2, X, Settings, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { respondToInvitation } from '../../services/settingsService';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PANEL_LIMIT = 10;

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

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { unreadNotifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const panelItems = unreadNotifications.slice(0, PANEL_LIMIT);
  const hasMore = unreadCount > PANEL_LIMIT;

  const goTo = (path: string) => { onClose(); navigate(path); };

  const handleInviteResponse = async (notification: any, action: 'accept' | 'reject') => {
    const inviteId = notification.data?.inviteId;
    if (!inviteId) return;
    setRespondingId(inviteId);
    try {
      await respondToInvitation(inviteId, action);
      await markAsRead(notification._id);
      await fetchNotifications();
      // Refresh user so agency context switcher appears immediately after accepting
      if (action === 'accept') await refreshUser();
    } catch { /* ignore */ }
    finally { setRespondingId(null); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

          <motion.div
            initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bell size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text">Notifications</h2>
                    <p className="text-xs text-text-muted">
                      {unreadCount === 0 ? 'All caught up' : `${unreadCount} unread`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => goTo('/settings?tab=notification-preferences')} title="Notification Settings"
                    className="p-2 hover:bg-primary/5 rounded-lg transition-colors text-text-muted hover:text-primary">
                    <Settings size={18} />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-lg transition-colors text-text-muted hover:text-text">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {unreadCount > 0 && (
                <button onClick={markAllAsRead}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-semibold">
                  <CheckCheck size={16} /> Mark All as Read
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : panelItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bell size={32} className="text-primary opacity-50" />
                  </div>
                  <p className="text-text-muted text-sm font-semibold">No unread notifications</p>
                  <p className="text-text-muted text-xs mt-1">You're all caught up.</p>
                  <button onClick={() => goTo('/notifications')}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-semibold">
                    View all notifications <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {panelItems.map((n) => (
                    <motion.div key={n._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border bg-primary/5 border-primary/20">
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{ICONS[n.type] || '📢'}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text mb-0.5">{n.title}</h3>
                          <p className="text-xs text-text-muted line-clamp-2 mb-1">{n.message}</p>
                          <p className="text-[10px] text-text-muted">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                          {/* Inline accept/decline for team invites */}
                          {n.type === 'team_invite' && n.data?.inviteId && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleInviteResponse(n, 'accept')}
                                disabled={respondingId === n.data.inviteId}
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Check size={11} /> Accept
                              </button>
                              <button
                                onClick={() => handleInviteResponse(n, 'reject')}
                                disabled={respondingId === n.data.inviteId}
                                className="flex items-center gap-1 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors"
                              >
                                <X size={11} /> Decline
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {n.type !== 'team_invite' && (
                            <button onClick={() => markAsRead(n._id)}
                              className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-text-muted hover:text-primary" title="Mark as read">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteNotification(n._id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-text-muted hover:text-red-500" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {hasMore && (
                    <button onClick={() => goTo('/notifications')}
                      className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                      +{unreadCount - PANEL_LIMIT} more unread — View all <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <button onClick={() => goTo('/notifications')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-primary/10 text-text-muted hover:text-primary rounded-xl transition-colors text-sm font-semibold">
                View All Notifications <ArrowRight size={14} />
              </button>
              <button onClick={() => goTo('/settings?tab=notification-preferences')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-text-muted hover:text-primary transition-colors text-xs font-semibold">
                <Settings size={13} /> Notification Preferences
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
