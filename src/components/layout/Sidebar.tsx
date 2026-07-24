import { NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Image as ImageIcon, Share2, PenTool,
  Calendar, BarChart3, Settings, Bell, MessageSquare,
  ChevronLeft, ChevronRight, Building2, X, Flag, LogOut, Presentation,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { motion, AnimatePresence } from 'motion/react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard',      featureKey: null,             executiveOnly: false, agencyOnly: false },
  { icon: ImageIcon,       label: 'Gallery',         path: '/gallery',         featureKey: 'gallery',        executiveOnly: false, agencyOnly: false },
  { icon: Share2,          label: 'Social Accounts', path: '/social-accounts', featureKey: 'socialAccounts', executiveOnly: true,  agencyOnly: false },
  { icon: PenTool,         label: 'Posts',           path: '/posts',           featureKey: 'posts',          executiveOnly: true,  agencyOnly: false },
  { icon: Calendar,        label: 'Scheduler',       path: '/scheduler',       featureKey: 'scheduler',      executiveOnly: false, agencyOnly: false },
  { icon: BarChart3,       label: 'Analytics',       path: '/analytics',       featureKey: 'analytics',      executiveOnly: false, agencyOnly: false },
  { icon: Bell,            label: 'Notifications',   path: '/notifications',   featureKey: 'notifications',  executiveOnly: false, agencyOnly: false, badge: true },
  { icon: MessageSquare,   label: 'Messages',        path: '/messages',        featureKey: null,             executiveOnly: true,  agencyOnly: true  },
  { icon: Flag,            label: 'Campaigns',       path: '/campaigns',       featureKey: null,             executiveOnly: true,  agencyOnly: true  },
  { icon: Building2,       label: 'Startups',        path: '/startups',        featureKey: null,             executiveOnly: true,  agencyOnly: true,  agencyFlag: 'enableStartups' },
  { icon: Presentation,    label: 'Presentations',   path: '/presentations',   featureKey: null,             executiveOnly: true,  agencyOnly: false },
  { icon: Settings,        label: 'Settings',        path: '/settings',        featureKey: 'settings',       executiveOnly: false, agencyOnly: false },
] as const;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { unreadCount } = useNotifications();
  const { user, logout } = useAuth();
  const { isExecutive } = usePermissions();
  const location = useLocation();

  const features = user?.enabledFeatures;
  const isAgency = user?.activeContext === 'agency';

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.agencyOnly && !isAgency) return false;
    if ('agencyFlag' in item && item.agencyFlag) {
      if (!user?.agency?.[item.agencyFlag as keyof typeof user.agency]) return false;
    }
    if (item.executiveOnly && !isExecutive) return false;
    if (item.featureKey && features) {
      if (features[item.featureKey as keyof typeof features] === false) return false;
    }
    return true;
  });

  useEffect(() => { onMobileClose(); }, [location.pathname]);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const roleLabel = user?.agencyRole?.replace(/_/g, ' ') || user?.roles?.[0]?.replace(/_/g, ' ') || 'Member';

  // ── Nav content shared between desktop + mobile ───────────────────────────
  const NavContent = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex flex-col h-full relative overflow-hidden">

      {/* Background glow orbs */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-primary/20 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none sidebar-glow" />
      <div className="absolute bottom-20 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] translate-x-1/2 pointer-events-none sidebar-glow" style={{ animationDelay: '2s' }} />

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className={cn(
        'relative z-10 flex items-center border-b border-white/5 shrink-0',
        collapsed ? 'justify-center h-16 px-2' : 'h-16 px-4'
      )}>
        {collapsed
          ? <Logo size="sm" className="opacity-90" />
          : <Logo size="md" className="opacity-90" />
        }
      </div>

      {/* ── Nav links ────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-none">
        {visibleItems.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) => cn(
              'relative flex items-center rounded-xl transition-all duration-200 group overflow-hidden',
              collapsed ? 'justify-center p-3 mx-1' : 'gap-3 px-3 py-2.5',
              isActive
                ? [
                    'text-white',
                    // Active: gradient background + glow
                    'bg-gradient-to-r from-primary via-primary-light to-primary',
                    'shadow-lg shadow-primary/40',
                    'before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:to-transparent before:rounded-xl',
                  ].join(' ')
                : 'text-text-muted hover:text-text hover:bg-white/5'
            )}
          >
            {/* Active left accent bar */}
            {({ isActive }: { isActive: boolean }) => (
              <>
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/60 rounded-full" />
                )}

                {/* Icon */}
                <div className="relative shrink-0">
                  <item.icon size={18} />
                  {'badge' in item && (item as any).badge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 leading-none ring-1 ring-background">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                {!collapsed && (
                  <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-semibold text-text whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 translate-x-1 group-hover:translate-x-0">
                    {item.label}
                    {/* Arrow */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-border" />
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User card ────────────────────────────────────────────────── */}
      <div className="relative z-10 border-t border-white/5 shrink-0">
        {!collapsed ? (
          <div className="p-3">
            <Link
              to="/settings"
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/30 to-primary-dark/50 flex items-center justify-center">
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    : <span className="text-xs font-black text-white">{initials}</span>
                  }
                </div>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text truncate leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-text-muted truncate capitalize leading-tight mt-0.5">{roleLabel}</p>
              </div>

              <Settings size={13} className="text-text-muted group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        ) : (
          <div className="p-2 flex justify-center">
            <Link to="/settings" title={user?.name || 'Settings'}>
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/30 to-primary-dark/50 flex items-center justify-center">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  : <span className="text-xs font-black text-white">{initials}</span>
                }
              </div>
            </Link>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:block px-2 pb-3">
          <button
            onClick={() => setIsCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 transition-all text-xs font-medium group"
          >
            {collapsed
              ? <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              : <>
                  <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Collapse</span>
                </>
            }
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40',
        'bg-[#0c0c10] border-r border-white/5',
        'transition-[width] duration-300 ease-in-out',
        isCollapsed ? 'w-[68px]' : 'w-60'
      )}>
        <NavContent collapsed={isCollapsed} />
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-[#0c0c10] border-r border-white/5 z-50 flex flex-col"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text hover:bg-white/5 transition-all z-10"
              >
                <X size={18} />
              </button>
              <NavContent collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
