import { MOCK_STATS, MOCK_MEDIA, MOCK_ACCOUNTS } from '../lib/mock-data';
import { StatCard } from '../components/cards/StatCard';
import { MediaCard } from '../components/cards/MediaCard';
import { Button } from '../components/ui/Button';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Share2,
  Zap,
  Clock,
  Layout,
  ExternalLink,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music2 as TikTok
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const platformIcons: Record<string, any> = {
  Instagram,
  Facebook,
  Twitter,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  TikTok,
};

export default function DashboardOverview() {
  const navigate = useNavigate();
  const connectedPlatforms = MOCK_ACCOUNTS.filter(a => a.status === 'connected');

  const handleNewCalendarEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate('/composer', { state: { date: today } });
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Dashboard</h1>
          <p className="text-text-muted font-medium">Welcome back, Alex. Here's your agency's performance at a glance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleNewCalendarEntry} className="h-12 px-6 rounded-xl font-bold bg-white/5 border-white/10">
            <CalendarIcon size={18} className="mr-2" /> New Calendar Entry
          </Button>
          <Link to="/composer">
            <Button className="h-12 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
              <Plus size={18} className="mr-2" /> New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Posts', value: '1,284', change: '+12%', trend: 'up', icon: Layout },
          { label: 'Scheduled', value: '42', change: '+5', trend: 'up', icon: Clock },
          { label: 'Connected Accounts', value: connectedPlatforms.length.toString(), change: '0', trend: 'neutral', icon: Users },
          { label: 'Avg. Engagement', value: '4.8%', change: '+0.4%', trend: 'up', icon: Zap },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className="glass border border-white/10 p-6 rounded-[24px] space-y-4 cursor-pointer group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <stat.icon size={20} />
              </div>
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded-full",
                stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : 
                stat.trend === 'down' ? "bg-red-500/10 text-red-500" : "bg-white/10 text-text-muted"
              )}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-text">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity / Gallery Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-text">Recent Content</h2>
            <Link to="/gallery" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
              View Gallery <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MOCK_MEDIA.slice(0, 6).map((media) => (
              <MediaCard 
                key={media.id} 
                id={media.id} 
                type={media.category} 
                title={media.title} 
                url={media.url} 
                date={new Date(media.metadata.createdDate).toLocaleDateString()} 
              />
            ))}
          </div>
        </div>

        {/* Upcoming Queue */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-text">Upcoming</h2>
            <Link to="/scheduler" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5">
              Full Schedule <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="glass border border-white/10 rounded-[32px] p-8 space-y-6">
            {[
              { time: '10:00 AM', platform: 'Instagram', title: 'Summer Campaign Launch', status: 'Ready' },
              { time: '02:30 PM', platform: 'Twitter', title: 'Product Update Thread', status: 'Draft' },
              { time: '05:00 PM', platform: 'LinkedIn', title: 'Hiring Announcement', status: 'Ready' },
            ].map((post, i) => {
              const Icon = platformIcons[post.platform] || ExternalLink;
              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-tighter shrink-0">
                    <span className="text-primary">{post.time.split(' ')[1]}</span>
                    <span className="text-text">{post.time.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon size={12} className="text-text-muted" />
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{post.platform}</p>
                    </div>
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors text-text">{post.title}</p>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0",
                    post.status === 'Ready' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {post.status}
                  </span>
                </div>
              );
            })}
            
            <div className="pt-4">
              <Link to="/scheduler">
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold bg-white/5 border-white/10">
                  Open Scheduler
                </Button>
              </Link>
            </div>
          </div>

          {/* Upgrade Card */}
          <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-black text-xl text-text">Upgrade to Pro</h3>
                <p className="text-sm text-text-muted leading-relaxed">Unlock advanced analytics, unlimited accounts, and AI-powered caption generation.</p>
              </div>
              <Button className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-xl h-11">Upgrade Now</Button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
