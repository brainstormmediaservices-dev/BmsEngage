import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, LogOut, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../ui/Logo';

const adminNav = [
  { icon: Shield, label: 'Admin Dashboard', path: '/admin' },
];

export const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 z-40 flex flex-col',
        isCollapsed ? 'w-20' : 'w-64'
      )}>
        <div className={cn('p-6 flex items-center', isCollapsed ? 'flex-col gap-4' : 'justify-between')}>
          {!isCollapsed ? <Logo size="sm" /> : <Logo size="sm" showText={false} className="mx-auto" />}
          <button onClick={toggleTheme}
            className={cn('p-2 rounded-xl hover:bg-primary/5 text-text-muted hover:text-text transition-all', isCollapsed && 'mx-auto')}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Superadmin badge */}
        {!isCollapsed && (
          <div className="mx-3 mb-4 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Superadmin</p>
            <p className="text-xs font-semibold text-text truncate">{user?.name}</p>
            <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-1">
          {adminNav.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/40 scale-[1.02]' : 'text-text-muted hover:text-text hover:bg-primary/5'
              )}>
              <item.icon size={20} className="shrink-0" />
              {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 space-y-1">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Log Out</span>}
          </button>
          <button onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-primary/5 text-text-muted transition-colors">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn('flex-1 overflow-y-auto transition-all duration-300', isCollapsed ? 'ml-20' : 'ml-64')}>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
