import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Filter, 
  Clock, 
  LayoutGrid, 
  List, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Music2 as TikTok,
  ExternalLink,
  MoreVertical,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays,
  isPast,
  startOfDay,
  eachHourOfInterval,
  setHours,
  isSameHour
} from 'date-fns';
import { MOCK_POSTS } from '../lib/mock-data';
import { SocialPost } from '../types/social';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PostDetailsModal } from '../components/scheduler/PostDetailsModal';
import { DeleteConfirmationModal } from '../components/scheduler/DeleteConfirmationModal';
import { useToast } from '../components/ui/Toast';

const platformIcons: Record<string, any> = {
  Instagram,
  Facebook,
  Twitter,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  TikTok,
};

type ViewType = 'Daily' | 'Weekly' | 'Monthly';

export default function SchedulerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('Monthly');
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const scheduledPosts = useMemo(() => {
    const posts: Record<string, SocialPost[]> = {};
    MOCK_POSTS.forEach(post => {
      if (post.scheduledDate || post.publishedDate) {
        const date = format(new Date(post.scheduledDate || post.publishedDate!), 'yyyy-MM-dd');
        if (!posts[date]) posts[date] = [];
        posts[date].push(post);
      }
    });
    return posts;
  }, []);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (view === 'Monthly') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === 'Weekly') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  const handleCreatePost = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isDatePast = isPast(startOfDay(date)) && !isSameDay(date, new Date());
    
    navigate('/composer', { 
      state: { 
        date: dateStr,
        isPast: isDatePast
      } 
    });

    if (isDatePast) {
      toast('This date is in the past. The post will be published immediately if scheduled.', 'warning');
    }
  };

  const handlePostClick = (post: SocialPost) => {
    setSelectedPost(post);
    setIsDetailModalOpen(true);
  };

  const handleDeletePost = (post: SocialPost) => {
    setSelectedPost(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // In a real app, this would be an API call
    toast('Post deleted successfully', 'success');
    setIsDetailModalOpen(false);
  };

  const handleEditPost = (post: SocialPost) => {
    navigate('/composer', { state: { post } });
  };

  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const posts = scheduledPosts[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className={cn(
                "min-h-[140px] p-3 border-r border-b border-white/5 transition-all cursor-pointer group relative",
                !isCurrentMonth && "bg-white/[0.01] opacity-20",
                isCurrentMonth && "hover:bg-white/[0.03]"
              )}
              onClick={() => handleCreatePost(day)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all",
                  isToday ? "bg-primary text-white shadow-lg shadow-primary/40" : "text-text-muted group-hover:text-text"
                )}>
                  {format(day, 'd')}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCreatePost(day); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/20 rounded-lg text-primary transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
              
              <div className="space-y-1.5">
                {posts.slice(0, 3).map((post) => (
                  <motion.div 
                    key={post.id}
                    layoutId={post.id}
                    onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}
                    className={cn(
                      "p-1.5 rounded-lg border flex items-center gap-2 transition-all hover:scale-[1.02] bg-white/5 border-white/10 group/card",
                      post.status === 'Published' ? "border-emerald-500/20" : "border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-1 shrink-0">
                      {post.platforms.map(p => {
                        const Icon = platformIcons[p] || ExternalLink;
                        return <Icon key={p} size={10} className="text-text-muted group-hover/card:text-primary transition-colors" />;
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-text truncate leading-none">{post.content}</p>
                    </div>
                    {post.mediaUrls?.[0] && (
                      <img src={post.mediaUrls[0]} className="w-4 h-4 rounded-md object-cover shrink-0 border border-white/10" alt="" referrerPolicy="no-referrer" />
                    )}
                  </motion.div>
                ))}
                {posts.length > 3 && (
                  <button className="text-[9px] font-black text-primary uppercase tracking-widest pl-1 hover:underline flex items-center gap-1">
                    <Plus size={10} /> {posts.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(weekStart);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="grid grid-cols-7 h-full min-h-[600px]">
        {weekDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const posts = scheduledPosts[dateStr] || [];
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={i}
              className={cn(
                "border-r border-white/5 p-4 space-y-4 transition-all hover:bg-white/[0.02]",
                isToday && "bg-primary/[0.02]"
              )}
            >
              <div className="flex flex-col items-center gap-1 mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{format(day, 'EEE')}</span>
                <span className={cn(
                  "text-lg font-black w-10 h-10 flex items-center justify-center rounded-2xl transition-all",
                  isToday ? "bg-primary text-white shadow-xl shadow-primary/40" : "text-text"
                )}>
                  {format(day, 'd')}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full h-8 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCreatePost(day)}
                >
                  <Plus size={14} />
                </Button>
              </div>

              <div className="space-y-3">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    layoutId={post.id}
                    onClick={() => handlePostClick(post)}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-3 cursor-pointer hover:border-primary/50 transition-all group"
                  >
                    {post.mediaUrls?.[0] && (
                      <div className="aspect-video rounded-xl overflow-hidden border border-white/10">
                        <img src={post.mediaUrls[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium text-text line-clamp-2 leading-relaxed">{post.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {post.platforms.map(p => {
                            const Icon = platformIcons[p] || ExternalLink;
                            return <Icon key={p} size={10} className="text-text-muted" />;
                          })}
                        </div>
                        <span className="text-[9px] font-bold text-text-muted">{post.scheduledDate ? format(new Date(post.scheduledDate), 'h:mm a') : 'Draft'}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {posts.length === 0 && (
                  <div 
                    onClick={() => handleCreatePost(day)}
                    className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-text-muted/20 hover:text-primary/40 hover:border-primary/20 transition-all cursor-pointer"
                  >
                    <Plus size={24} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDailyView = () => {
    const hours = eachHourOfInterval({
      start: setHours(currentDate, 0),
      end: setHours(currentDate, 23)
    });

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const posts = scheduledPosts[dateStr] || [];

    return (
      <div className="p-8 space-y-4">
        {hours.map((hour, i) => {
          const hourPosts = posts.filter(post => {
            if (!post.scheduledDate) return false;
            return isSameHour(new Date(post.scheduledDate), hour);
          });

          return (
            <div key={i} className="flex gap-6 group">
              <div className="w-20 pt-1 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{format(hour, 'h:mm a')}</span>
              </div>
              <div className="flex-1 pb-8 border-l border-white/10 pl-8 relative">
                <div className="absolute left-0 top-2 w-2 h-2 rounded-full bg-white/10 -translate-x-1/2 group-hover:bg-primary transition-colors" />
                
                {hourPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hourPosts.map(post => (
                      <motion.div
                        key={post.id}
                        layoutId={post.id}
                        onClick={() => handlePostClick(post)}
                        className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-primary/50 transition-all"
                      >
                        {post.mediaUrls?.[0] && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={post.mediaUrls[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {post.platforms.map(p => {
                                const Icon = platformIcons[p] || ExternalLink;
                                return <Icon key={p} size={12} className="text-text-muted" />;
                              })}
                            </div>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                              post.status === 'Published' ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                            )}>
                              {post.status}
                            </span>
                          </div>
                          <p className="text-xs text-text font-medium line-clamp-2 leading-relaxed">{post.content}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                            <Clock size={12} />
                            {format(new Date(post.scheduledDate!), 'h:mm a')}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <button 
                    onClick={() => handleCreatePost(hour)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all"
                  >
                    + Schedule Post
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const queueStats = useMemo(() => {
    const stats = { published: 0, scheduled: 0, drafts: 0 };
    MOCK_POSTS.forEach(post => {
      if (post.status === 'Published') stats.published++;
      else if (post.status === 'Scheduled') stats.scheduled++;
      else stats.drafts++;
    });
    return stats;
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Content Scheduler</h1>
          <p className="text-text-muted font-medium">Plan and visualize your agency's content pipeline.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['Daily', 'Weekly', 'Monthly'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "relative px-5 py-2 rounded-lg text-xs font-bold transition-all",
                  view === v ? "text-white" : "text-text-muted hover:text-text"
                )}
              >
                {view === v && (
                  <motion.div 
                    layoutId="active-view"
                    className="absolute inset-0 bg-primary rounded-lg shadow-lg shadow-primary/20"
                  />
                )}
                <span className="relative z-10">{v}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => handleCreatePost(new Date())} className="h-11 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
            <Plus size={18} className="mr-2" /> Create Post
          </Button>
        </div>
      </div>

      {/* Queue Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Published', count: queueStats.published, icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Scheduled', count: queueStats.scheduled, icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Drafts', count: queueStats.drafts, icon: List, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(stat => (
          <div key={stat.label} className="glass border border-white/10 p-6 rounded-3xl flex items-center justify-between group hover:border-white/20 transition-all">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-text">{stat.count}</p>
              </div>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">View All</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Container */}
      <div className="glass border border-white/10 rounded-[32px] overflow-hidden">
        {/* Calendar Nav */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl" onClick={() => handleNavigate('prev')}><ChevronLeft size={20} /></Button>
              <Button variant="outline" className="h-10 px-6 rounded-xl text-xs font-bold" onClick={() => setCurrentDate(new Date())}>Today</Button>
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl" onClick={() => handleNavigate('next')}><ChevronRight size={20} /></Button>
            </div>
            <h2 className="text-2xl font-black text-text">
              {view === 'Monthly' && format(currentDate, 'MMMM yyyy')}
              {view === 'Weekly' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
              {view === 'Daily' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="w-11 h-11 rounded-2xl"><Filter size={20} /></Button>
            <Button variant="outline" size="icon" className="w-11 h-11 rounded-2xl"><LayoutGrid size={20} /></Button>
          </div>
        </div>

        {/* Days Header (Monthly/Weekly) */}
        {view !== 'Daily' && (
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center space-y-4"
              >
                <Loader2 size={40} className="text-primary animate-spin" />
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Loading Calendar...</p>
              </motion.div>
            ) : (
              <motion.div
                key={view + currentDate.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {view === 'Monthly' && renderMonthlyView()}
                {view === 'Weekly' && renderWeeklyView()}
                {view === 'Daily' && renderDailyView()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Empty State if no posts at all */}
      {Object.keys(scheduledPosts).length === 0 && !isLoading && (
        <div className="py-20 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-text-muted">
            <CalendarIcon size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-text">No posts scheduled yet</h3>
            <p className="text-text-muted max-w-md mx-auto">Start planning your content calendar and visualize your agency's pipeline across all channels.</p>
          </div>
          <Button onClick={() => handleCreatePost(new Date())} className="h-12 px-8 rounded-xl font-bold">
            Create Your First Post
          </Button>
        </div>
      )}

      {/* Post Details Modal */}
      <PostDetailsModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        post={selectedPost}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
