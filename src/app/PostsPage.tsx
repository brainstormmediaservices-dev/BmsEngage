import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  BarChart3, 
  MessageSquare, 
  Heart, 
  Share2, 
  Eye,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music2 as TikTok,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Calendar,
  Globe,
  Users,
  Zap,
  ArrowUpRight,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MOCK_POSTS, MOCK_ACCOUNTS } from '../lib/mock-data';
import { SocialPost, SocialPlatform } from '../types/social';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const platformIcons: Record<string, any> = {
  Instagram,
  Facebook,
  Twitter,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  TikTok,
};

const FEED_URLS: Record<string, string> = {
  Facebook: 'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook&tabs=timeline&width=500&height=800&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId',
  Instagram: 'https://www.instagram.com/p/C4K_8r_r_r_/', // Placeholder for IG embed
  Twitter: 'https://twitter.com/X',
  LinkedIn: 'https://www.linkedin.com/company/linkedin/',
};

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<string>(MOCK_ACCOUNTS[0]?.platform || '');
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  const connectedPlatforms = MOCK_ACCOUNTS.filter(a => a.status === 'connected');

  useEffect(() => {
    if (activeTab) {
      setIsLoadingFeed(true);
      const timer = setTimeout(() => setIsLoadingFeed(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  if (connectedPlatforms.length === 0) {
    return (
      <div className="max-w-7xl mx-auto h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-muted">
          <Globe size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text">No Social Accounts Connected</h2>
          <p className="text-text-muted max-w-md">Connect your accounts to view live feeds, monitor engagement, and publish content across platforms.</p>
        </div>
        <Link to="/settings/accounts">
          <Button className="h-12 px-8 rounded-xl font-bold shadow-xl shadow-primary/30">
            Connect Account
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Social Command Center</h1>
          <p className="text-text-muted font-medium">Monitor live feeds and manage your cross-platform presence.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-text">Live Monitoring</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-muted">Active Platforms:</span>
              <span className="text-xs font-black text-text">{connectedPlatforms.length}</span>
            </div>
          </div>
          <Link to="/composer">
            <Button className="h-12 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
              <Plus size={20} className="mr-2" /> Create Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Platform Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
        {connectedPlatforms.map(account => {
          const Icon = platformIcons[account.platform] || Globe;
          return (
            <button
              key={account.id}
              onClick={() => setActiveTab(account.platform)}
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all font-bold text-sm",
                activeTab === account.platform 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-text-muted hover:text-text hover:bg-white/5"
              )}
            >
              <Icon size={16} />
              {account.platform}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Live Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass border border-white/10 rounded-[32px] overflow-hidden min-h-[800px] relative bg-black/20">
            <AnimatePresence mode="wait">
              {isLoadingFeed ? (
                <motion.div 
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
                >
                  <Loader2 size={40} className="text-primary animate-spin" />
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Loading {activeTab} Feed...</p>
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full"
                >
                  {/* In a real app, we'd use official SDKs or specific embed codes. 
                      Here we use a placeholder iframe or a simulated feed view. */}
                  <div className="p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                          {React.createElement(platformIcons[activeTab] || Globe, { size: 24 })}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-text">{activeTab} Timeline</h3>
                          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Live Monitoring Active</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        <ExternalLink size={14} className="mr-2" /> View on {activeTab}
                      </Button>
                    </div>
                    
                    {/* Simulated Feed Content */}
                    <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative">
                      <iframe 
                        src={FEED_URLS[activeTab] || 'https://www.wikipedia.org'} 
                        className="w-full h-full border-none grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        title={`${activeTab} Feed`}
                      />
                      <div className="absolute inset-0 pointer-events-none border-[20px] border-transparent shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Analytics Summary Panel */}
        <div className="space-y-6">
          <div className="glass border border-white/10 p-8 rounded-[32px] space-y-8 sticky top-24">
            <div>
              <h3 className="text-2xl font-black text-text mb-1">Insights</h3>
              <p className="text-sm text-text-muted font-medium">Performance for {activeTab}</p>
            </div>

            {/* Account Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Followers</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black text-text">12.4K</p>
                  <span className="text-[10px] text-emerald-500 font-bold">+2.4%</span>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Engagement</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black text-text">8.2%</p>
                  <span className="text-[10px] text-emerald-500 font-bold">+0.8%</span>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Reach</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black text-text">45.2K</p>
                  <span className="text-[10px] text-red-500 font-bold">-1.2%</span>
                </div>
              </div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Posts</p>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-black text-text">12</p>
                  <span className="text-[10px] text-text-muted font-bold">This week</span>
                </div>
              </div>
            </div>

            {/* Recent Post Performance */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-primary" /> Recent Performance
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Avg. Likes', value: '1,240', icon: Heart, color: 'text-pink-500' },
                  { label: 'Avg. Comments', value: '84', icon: MessageSquare, color: 'text-blue-500' },
                  { label: 'Avg. Shares', value: '32', icon: Share2, color: 'text-emerald-500' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-xs font-bold text-text-muted">{stat.label}</span>
                    </div>
                    <span className="text-sm font-black text-text">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Post */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-500" /> Top Performing
              </h4>
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src="https://picsum.photos/seed/top/200/200" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text font-bold line-clamp-2 leading-snug">
                      Our summer campaign launch was a massive success! ☀️
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">Published 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-pink-500"><Heart size={10} /> 2.4K</span>
                    <span className="flex items-center gap-1 text-blue-500"><MessageSquare size={10} /> 142</span>
                  </div>
                  <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                    View Details <ArrowUpRight size={10} />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10">
              <Link to="/analytics">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold bg-white/5 border-white/10">
                  <BarChart3 size={16} className="mr-2" /> Full Analytics Report
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
