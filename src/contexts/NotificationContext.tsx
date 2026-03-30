import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  // unread only (filtered by prefs) — used by panel
  unreadNotifications: Notification[];
  // all notifications (filtered by prefs) — used by full page
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Map notification type to pref category
  const isAllowed = useCallback((type: string): boolean => {
    const prefs = user?.notificationPrefs;
    if (!prefs) return false;
    if (['login', 'account_connected', 'account_disconnected'].includes(type)) return !!prefs.accountSecurity;
    if (['media_updated', 'media_comment', 'media_correction', 'media_variant'].includes(type)) return !!prefs.galleryAssets;
    if (['post_published', 'post_scheduled', 'post_failed'].includes(type)) return !!prefs.postSchedule;
    if (type === 'system') return !!prefs.systemUpdates;
    if (type === 'team_invite') return true; // always show invite notifications regardless of prefs
    return false;
  }, [user?.notificationPrefs]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=100');
      const all: Notification[] = response.data.notifications;
      // Sort newest first, filter by prefs
      const filtered = all
        .filter(n => isAllowed(n.type))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllNotifications(filtered);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAllowed]);

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
      setAllNotifications(prev => prev.map(n => ({ ...n, read: true })));
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications]);

  const notifications = allNotifications; // all (read + unread), sorted newest first
  const unreadNotifications = allNotifications.filter(n => !n.read);
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
