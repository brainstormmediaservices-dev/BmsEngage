import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  entityId?: string | null;
  entityType?: 'asset' | 'campaign' | 'post' | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  unreadNotifications: Notification[];
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─── Pref filter ──────────────────────────────────────────────────────────────
const isAllowed = (type: string, prefs: any): boolean => {
  if (!prefs) return false;
  if (['login', 'account_connected', 'account_disconnected'].includes(type)) return !!prefs.accountSecurity;
  if (['media_updated', 'media_comment', 'media_correction', 'media_variant'].includes(type)) return !!prefs.galleryAssets;
  if (['post_published', 'post_scheduled', 'post_failed'].includes(type)) return !!prefs.postSchedule;
  if (type === 'system') return !!prefs.systemUpdates;
  if (type === 'team_invite') return true; // always show
  if (['campaign_created', 'campaign_updated', 'campaign_deleted'].includes(type)) {
    // If pref not set yet (undefined), default to showing
    return prefs.campaignEvents !== false;
  }
  return false;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=100');
      const all: Notification[] = response.data.notifications;
      const prefs = user?.notificationPrefs;
      const filtered = all
        .filter(n => isAllowed(n.type, prefs))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllNotifications(filtered);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.notificationPrefs]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setAllNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setAllNotifications(prev => prev.map(n =>
        n.type === 'team_invite' && n.data?.inviteId ? n : { ...n, read: true }
      ));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setAllNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // ── WebSocket — single instance, proper cleanup ───────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    // Prevent duplicate connections
    if (socketRef.current?.connected) return;

    const apiUrl = (import.meta as any).env?.VITE_API_URL
      ?? window.location.origin.replace(':3000', ':5000');

    const socket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    const handleNotification = (data: Notification) => {
      const prefs = user?.notificationPrefs;
      if (!isAllowed(data.type, prefs)) return;
      setAllNotifications(prev => {
        if (prev.some(n => n._id === data._id)) return prev; // deduplicate
        return [data, ...prev];
      });
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]); // only reconnect when user changes

  // ── Initial fetch + 30s polling fallback ─────────────────────────────────
  useEffect(() => {
    setAllNotifications([]);
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  const notifications = allNotifications;
  const unreadNotifications = allNotifications.filter(n =>
    !n.read || (n.type === 'team_invite' && n.data?.inviteId)
  );
  const unreadCount = unreadNotifications.length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadNotifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
