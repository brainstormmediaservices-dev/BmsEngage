import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Image as ImageIcon, Share2, PenTool,
  Calendar, BarChart3, Settings, Bell,
  ChevronLeft, ChevronRight, Sun, Moon, Building2, X, Menu,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

const ALL_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard',      featureKey: null },
  { icon: ImageIcon,       label: 'Gallery',         path: '/gallery',         featureKey: 'gallery' },
  { icon: Share2,          label: 'Social Accounts', path: '/social-accounts', featureKey: 'socialAccounts' },
  { icon: PenTool,         label: 'Posts',           path: '/posts',           featureKey: 'posts' },
  { icon: Calendar,        label: 'Scheduler',       path: '/scheduler',       featureKey: 'scheduler' },
  { icon: BarChart3,       label: 'Analytics',       path: '/analytics',       featureKey: 'analytics' },
  { icon: Bell,            label: 'Notifications',   path: '/notifications',   featureKey: 'notifications', badge: true },
  { icon: Settings,        label: 'Settings',        path: '/settings',        featureKey: 'settings' },
] as const;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const location = useLocation();

  const features = user?.enabledFeatures;
  const isAgency = user?.activeContext === 'agency';

  const navItems = ALL_NAV_ITEMS.filter(item => {
    if (!item.featureKey) return true;
    if (!features) return true;
    return features[item.featureKey as keyof typeof features] !== false;
  });

  const startupsItem = isAgency && user?.agency?.enableStartups
    ? { icon: Building2, label: 'Startups', path: '/startups' }
    : null;

  const allItems = startupsItem ? [...navItems, startupsItem] : [...navItems];

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname]);

  const NavContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo + theme toggle */}
      <div className={cn('p-4 flex items-center border-b border-border', collapsed ? 'flex-col gap-3 py-5' : 'justify-between')}>
        {!collapsed
          ? <Logo size="md" />
          : <Logo size="sm" className="mx-auto" />
        }
        <button
          onClick={toggleTheme}
          className={cn('p-2 rounded-xl hover:bg-primary/5 text-text-muted hover:text-text transition-all', collapsed && 'mx-auto')}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {allItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative',
              isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/40'
                : 'text-text-muted hover:text-text hover:bg-primary/5'
            )}
          >
            <div className="relative shrink-0">
              <item.icon size={19} />
              {'badge' in item && (item as any).badge && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span className="font-medium text-sm truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="p-3 border-t border-border hidden lg:block">
        <button
          onClick={() => setIsCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-primary/5 text-text-muted transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40',
        isCollapsed ? 'w-[72px]' : 'w-60'
      )}>
        <NavContent collapsed={isCollapsed} />
      </aside>

      {/* ── Mobile drawer overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-card border-r border-border z-50 flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 transition-all"
              >
                <X size={20} />
              </button>
              <NavContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Hamburger button — rendered in the Header on mobile
export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text hover:bg-primary/5 transition-all"
    aria-label="Open menu"
  >
    <Menu size={22} />
  </button>
);
