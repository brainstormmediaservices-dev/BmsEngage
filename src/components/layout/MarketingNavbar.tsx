import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';
import { Sun, Moon, LayoutDashboard } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export const MarketingNavbar = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Features', path: '/features' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Case Studies', path: '/case-studies' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo size="md" />
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path}
              className={cn('text-sm font-medium transition-colors',
                location.pathname === link.path ? 'text-primary' : 'text-text-muted hover:text-text'
              )}>
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={toggleTheme}
            className="p-2 text-text-muted hover:text-text hover:bg-primary/5 rounded-xl transition-all">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Show auth-aware buttons only after auth state is resolved */}
          {!isLoading && (
            isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="sm" className="font-bold shadow-lg shadow-primary/30">
                  <LayoutDashboard size={15} className="mr-2" /> Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
};
