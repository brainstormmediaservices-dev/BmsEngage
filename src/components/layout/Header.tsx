import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, User, Image as ImageIcon, Calendar, BarChart3, Link2, X, Sun, Moon, LogOut, Building2, ChevronDown, RefreshCw } from 'lucide-react';
import { MOCK_MEDIA, MOCK_ACCOUNTS } from '../../lib/mock-data';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { switchContext } from '../../services/settingsService';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [switchingContext, setSwitchingContext] = useState(false);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const activeContext = user?.activeContext || 'personal';

  // Resolve agency name — from own agency or from accepted invite
  useEffect(() => {
    if (!user) { setAgencyName(null); return; }
    if (user.agency?.name) {
      setAgencyName(user.agency.name);
      return;
    }
    // Fetch from server in case they're a team member whose agency wasn't copied yet
    import('../../services/settingsService').then(m => m.getMyAgency()).then(info => {
      if (info.agency?.name) setAgencyName(info.agency.name);
      else setAgencyName(null);
    }).catch(() => setAgencyName(null));
  }, [user?.id, user?.agency?.name]);

  const hasAgency = !!agencyName;
  const displayAgencyName = agencyName || user?.agency?.name || 'Agency';

  const handleContextSwitch = async (ctx: 'personal' | 'agency') => {
    if (ctx === activeContext || switchingContext) return;
    setSwitchingContext(true);
    try {
      await switchContext(ctx);
      // Full reload so all data (gallery, dashboard, etc.) re-fetches in the new context
      window.location.reload();
    } catch { setSwitchingContext(false); }
  };

  const filteredMedia = MOCK_MEDIA.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAccounts = MOCK_ACCOUNTS.filter(item => 
    item.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = searchQuery.length > 0 && (filteredMedia.length > 0 || filteredAccounts.length > 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="w-96 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search media, accounts, analytics..." 
            className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-10 py-2 text-sm outline-none focus:border-primary/50 transition-all text-text"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isSearchOpen && searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto"
            >
              {!hasResults ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-text-muted italic">No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-2 space-y-4">
                  {filteredMedia.length > 0 && (
                    <div>
                      <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">Media Assets</h4>
                      <div className="space-y-1">
                        {filteredMedia.map(item => (
                          <Link 
                            key={item.id} 
                            to="/gallery" 
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border">
                              <img src={item.url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors text-text">{item.title}</p>
                              <p className="text-[10px] text-text-muted uppercase tracking-tighter">{item.category} • {new Date(item.metadata.createdDate).toLocaleDateString()}</p>
                            </div>
                            <ImageIcon size={14} className="text-text-muted" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredAccounts.length > 0 && (
                    <div>
                      <h4 className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">Social Accounts</h4>
                      <div className="space-y-1">
                        {filteredAccounts.map(item => (
                          <Link 
                            key={item.id} 
                            to="/social-accounts" 
                            onClick={() => setIsSearchOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors group"
                          >
                            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                              <Link2 size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors text-text">{item.platform}</p>
                              <p className="text-[10px] text-text-muted">{item.username}</p>
                            </div>
                            <div className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                              item.status === 'connected' ? "bg-emerald-500/10 text-emerald-500" : "bg-white/5 text-text-muted"
                            )}>
                              {item.status}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2 border-t border-border">
                    <button className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-text-muted hover:text-text transition-colors">
                      <BarChart3 size={14} /> View Advanced Search
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        {/* Agency / Personal context switcher */}
        {hasAgency && (
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => handleContextSwitch('personal')}
              disabled={switchingContext}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                activeContext === 'personal' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'
              )}
            >
              <User size={13} /> Personal
            </button>
            <button
              onClick={() => handleContextSwitch('agency')}
              disabled={switchingContext}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                activeContext === 'agency' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'
              )}
            >
              {switchingContext ? <RefreshCw size={13} className="animate-spin" /> : <Building2 size={13} />}
              {displayAgencyName}
            </button>
          </div>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 text-text-muted hover:text-text hover:bg-primary/5 rounded-xl transition-all"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          onClick={() => setShowNotifications(true)}
          className="p-2 text-text-muted hover:text-text hover:bg-primary/5 rounded-xl transition-all relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border relative" ref={userMenuRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-text">{user?.name || 'User'}</p>
            <p className="text-xs text-text-muted uppercase tracking-tighter">
              {activeContext === 'agency' && displayAgencyName
                ? (user?.agencyRole ? user.agencyRole.replace(/_/g, ' ') : displayAgencyName)
                : (user?.verified ? 'Verified' : 'Unverified')}
            </p>
          </div>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-black text-text-muted">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || <User size={18} />}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-semibold text-text">{user?.name}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
                <div className="p-2">
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 transition-colors text-text"
                  >
                    <User size={16} />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 transition-colors text-red-500"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Notification Panel — portaled to body to escape header stacking context */}
      {createPortal(
        <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />,
        document.body
      )}
    </header>
  );
};
