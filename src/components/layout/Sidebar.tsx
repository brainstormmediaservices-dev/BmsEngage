import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Share2, 
  PenTool, 
  Calendar, 
  BarChart3, 
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ImageIcon, label: 'Gallery', path: '/gallery' },
  { icon: Share2, label: 'Social Accounts', path: '/social-accounts' },
  { icon: PenTool, label: 'Posts', path: '/posts' },
  { icon: Calendar, label: 'Scheduler', path: '/scheduler' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: true },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn("p-6 flex items-center", isCollapsed ? "flex-col gap-4" : "justify-between")}>
          {!isCollapsed ? (
            <Logo size="sm" />
          ) : (
            <Logo size="sm" showText={false} className="mx-auto" />
          )}
          <button
            onClick={toggleTheme}
            className={cn(
              "p-2 rounded-xl hover:bg-primary/5 text-text-muted hover:text-text transition-all",
              isCollapsed && "mx-auto"
            )}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/40 scale-[1.02]" 
                  : "text-text-muted hover:text-text hover:bg-primary/5"
              )}
            >
              <div className="relative shrink-0">
                <item.icon size={20} className={cn(isCollapsed && "mx-auto")} />
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-primary/5 text-text-muted transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
