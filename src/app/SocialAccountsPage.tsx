import { useState, useEffect, useCallback } from 'react';
import { ConnectAccountModal } from '../components/gallery/ConnectAccountModal';
import { Button } from '../components/ui/Button';
import {
  Plus, RefreshCw, AlertCircle, Send, TrendingUp, Eye,
  Bell, ExternalLink, Loader2, Globe, X, Users, BarChart3,
  Zap, Sparkles, ImageIcon, Clock, Heart, MessageSquare, Share2,
} from 'lucide-react';
import { socialService, ConnectedAccount, PlatformInsights } from '../services/socialService';
import { postService, ScheduledPost } from '../services/postService';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { MiniGallerySelector } from '../components/gallery/MiniGallerySelector';
import { MediaAsset } from '../types/media';
import api from '../services/api';

// ── Platform config ───────────────────────────────────────────────────────────
const PCFG: Record<string, { label: string; color: string; bg: string; charLimit: number; profileBase: string }> = {
  meta:     { label: 'Facebook',  color: 'text-blue-500',  bg: 'bg-blue-500/10',  charLimit: 63206, profileBase: 'https://facebook.com/' },
  twitter:  { label: 'Twitter/X', color: 'text-sky-400',   bg: 'bg-sky-400/10',   charLimit: 280,   profileBase: 'https://twitter.com/' },
  linkedin: { label: 'LinkedIn',  color: 'text-blue-700',  bg: 'bg-blue-700/10',  charLimit: 3000,  profileBase: 'https://linkedin.com/in/' },
  tiktok:   { label: 'TikTok',    color: 'text-pink-500',  bg: 'bg-pink-500/10',  charLimit: 2200,  profileBase: 'https://tiktok.com/@' },
};

// Platform icon as SVG letter badge (avoids deprecated lucide icons)
function PlatformBadge({ platform, size = 20, className = '' }: { platform: string; size?: number; className?: string }) {
  const cfg = PCFG[platform];
  const letter = platform === 'meta' ? 'f' : platform === 'twitter' ? 'X' : platform === 'linkedin' ? 'in' : platform === 'tiktok' ? 'tt' : platform[0];
  return (
    <div className={cn('rounded-xl flex items-center justify-center font-black text-xs shrink-0', cfg?.bg, cfg?.color, className)}
      style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {letter}
    </div>
  );
}

// ── Inline Composer ───────────────────────────────────────────────────────────
function InlineComposer({ platform, account, onClose, onPosted }: {
  platform: string; account: ConnectedAccount;
  onClose: () => void; onPosted: (p: ScheduledPost) => void;
}) {
  const { toast } = useToast();
  const cfg = PCFG[platform];
  const [caption, setCaption] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const generateAI = async () => {
    const asset = selectedAssets[0];
    if (!asset && !caption.trim()) { toast('Select an asset or type a caption first', 'error'); return; }
    setIsGeneratingAI(true);
    try {
      const { data } = await api.post('/ai/caption', {
        title: asset?.title, tags: asset?.tags || [],
        existingCaption: !asset && caption ? caption : undefined, platform,
      });
      setCaption(data.caption || '');
      toast('Caption generated!', 'success');
    } catch (err: any) { toast(err?.response?.data?.error || 'AI failed', 'error'); }
    finally { setIsGeneratingAI(false); }
  };

  const handlePost = async () => {
    if (!caption.trim() && !selectedAssets.length) { toast('Add content or media', 'error'); return; }
    if (isScheduled && !scheduledDateTime) { toast('Select a date and time', 'error'); return; }
    setIsPosting(true);
    try {
      const post = await postService.create({
        content: caption, platforms: [platform],
        scheduledTime: isScheduled ? new Date(scheduledDateTime).toISOString() : undefined,
        mediaUrls: selectedAssets.map(a => a.url),
      });
      onPosted(post);
      toast(isScheduled ? 'Post scheduled!' : 'Post created!', 'success');
      if (!isScheduled && cfg) {
        setTimeout(() => toast(`View on ${cfg.label} → ${cfg.profileBase}${account.username}`, 'info'), 900);
      }
      onClose();
    } catch (err: any) { toast(err?.response?.data?.error || 'Failed to post', 'error'); }
    finally { setIsPosting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className="glass border border-white/10 rounded-[20px] p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={platform} size={24} />
          <span className="text-sm font-bold text-text">New Post — {cfg?.label}</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-white/5"><X size={15} /></button>
      </div>

      {selectedAssets[0] && (
        <div className="relative rounded-xl overflow-hidden aspect-video bg-black/20">
          <img src={selectedAssets[0].url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <button onClick={() => setSelectedAssets([])} className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white"><X size={11} /></button>
        </div>
      )}

      <button onClick={() => setShowGallery(v => !v)} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-opacity">
        <ImageIcon size={12} /> {showGallery ? 'Hide Gallery' : 'Attach from Gallery'}
      </button>
      <AnimatePresence>
        {showGallery && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <MiniGallerySelector selectedAssets={selectedAssets} onSelect={a => { setSelectedAssets([a]); setShowGallery(false); }} onRemove={() => setSelectedAssets([])} multiple={false} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <textarea value={caption} onChange={e => setCaption(e.target.value)} spellCheck
          placeholder={`What's on your mind? (${cfg?.label})`}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[90px] resize-none transition-all" />
        <div className="flex items-center justify-between mt-1.5">
          <Button variant="outline" size="sm" onClick={generateAI} isLoading={isGeneratingAI} className="h-7 text-[10px] bg-white/5 border-white/10">
            <Sparkles size={11} className="mr-1 text-primary" /> AI Caption
          </Button>
          <span className={cn('text-[10px] font-bold', caption.length > (cfg?.charLimit || 2200) ? 'text-red-500' : 'text-text-muted')}>
            {caption.length}/{cfg?.charLimit || 2200}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setIsScheduled(v => !v)}
          className={cn('w-10 h-5 rounded-full relative transition-all shrink-0', isScheduled ? 'bg-primary' : 'bg-white/10')}>
          <motion.div animate={{ x: isScheduled ? 18 : 2 }} className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow" />
        </button>
        <span className="text-xs font-bold text-text">Schedule for later</span>
      </div>
      <AnimatePresence>
        {isScheduled && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <input type="datetime-local" value={scheduledDateTime} onChange={e => setScheduledDateTime(e.target.value)}
              className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-text outline-none focus:border-primary/50 transition-all" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl font-bold">Cancel</Button>
        <Button onClick={handlePost} isLoading={isPosting} className="flex-1 h-10 rounded-xl font-bold shadow-lg shadow-primary/30">
          <Send size={13} className="mr-2" /> {isScheduled ? 'Schedule' : 'Post Now'}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Platform Panel ────────────────────────────────────────────────────────────
function PlatformPanel({ account }: { account: ConnectedAccount }) {
  const platform = account.platform;
  const cfg = PCFG[platform];
  const [showComposer, setShowComposer] = useState(false);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [insights, setInsights] = useState<PlatformInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    socialService.getInsights(account.id)
      .then(setInsights).catch(() => setInsights(null))
      .finally(() => setLoadingInsights(false));

    postService.getAll()
      .then(all => setPosts(all.filter(p => (p.platforms || []).includes(platform))))
      .catch(() => {}).finally(() => setLoadingPosts(false));
  }, [account.id, platform]);

  const profileUrl = insights?.profileUrl || (cfg ? cfg.profileBase + account.username : '#');

  return (
    <div className="space-y-4">
      {/* Profile header */}
      <div className="glass border border-white/10 rounded-[20px] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={cn('w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0', cfg?.bg)}>
              {account.avatar
                ? <img src={account.avatar} alt="" className="w-full h-full object-cover" />
                : <PlatformBadge platform={platform} size={40} />
              }
            </div>
            <div>
              <p className="font-black text-base sm:text-lg text-text">{account.displayName || account.username}</p>
              <p className="text-xs text-text-muted">@{account.username}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Connected</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a href={profileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-text hover:border-white/20 transition-all">
              <ExternalLink size={12} /> View Profile
            </a>
            <Button onClick={() => setShowComposer(v => !v)} className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-primary/30">
              <Plus size={13} className="mr-1.5" /> New Post
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComposer && (
          <InlineComposer platform={platform} account={account} onClose={() => setShowComposer(false)}
            onPosted={p => setPosts(prev => [p, ...prev])} />
        )}
      </AnimatePresence>

      {/* Profile preview card */}
      <div className="glass border border-white/10 rounded-[20px] p-4 sm:p-6">
        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
          <Eye size={12} /> Profile Preview
          {loadingInsights && <Loader2 size={11} className="animate-spin ml-auto" />}
        </h3>
        <div className={cn('rounded-2xl overflow-hidden border border-white/10')}>
          <div className={cn('h-20 w-full flex items-center justify-center', cfg?.bg)}>
            <PlatformBadge platform={platform} size={48} />
          </div>
          <div className="px-4 pb-4 -mt-8">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl border-4 border-card overflow-hidden bg-card shrink-0">
                {account.avatar
                  ? <img src={account.avatar} alt="" className="w-full h-full object-cover" />
                  : <PlatformBadge platform={platform} size={56} />
                }
              </div>
              <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-text-muted hover:text-text hover:border-white/20 transition-all shrink-0">
                <ExternalLink size={11} /> Open on {cfg?.label}
              </a>
            </div>
            <p className="font-black text-base text-text">{insights?.displayName || account.displayName || account.username}</p>
            <p className="text-xs text-text-muted mb-3">@{account.username}</p>
            {loadingInsights ? (
              <div className="flex gap-4">{[1,2,3].map(i => <div key={i} className="h-4 w-16 bg-white/10 rounded animate-pulse" />)}</div>
            ) : (
              <div className="flex flex-wrap gap-4 text-xs">
                {insights?.followers != null && <div><span className="font-black text-text">{insights.followers.toLocaleString()}</span> <span className="text-text-muted">Followers</span></div>}
                {insights?.following != null && <div><span className="font-black text-text">{insights.following.toLocaleString()}</span> <span className="text-text-muted">Following</span></div>}
                {insights?.posts != null && <div><span className="font-black text-text">{insights.posts.toLocaleString()}</span> <span className="text-text-muted">Posts</span></div>}
                {!insights?.followers && !insights?.following && !insights?.posts && (
                  <p className="text-xs text-text-muted">Insights unavailable — connect with required permissions.</p>
                )}
              </div>
            )}
            {insights?.error && <p className="text-[10px] text-amber-400 mt-2">{insights.error}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Insights + activity */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass border border-white/10 rounded-[20px] p-4 space-y-3">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><BarChart3 size={12} /> Stats</h3>
            {loadingInsights ? (
              <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}</div>
            ) : [
              { label: 'Followers', value: insights?.followers?.toLocaleString(), icon: Users },
              { label: 'Following', value: insights?.following?.toLocaleString(), icon: Users },
              { label: 'Posts', value: insights?.posts?.toLocaleString(), icon: BarChart3 },
              { label: 'Engagement', value: insights?.engagement ? `${insights.engagement}%` : null, icon: Zap },
            ].filter(s => s.value).map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2"><s.icon size={12} className="text-text-muted" /><span className="text-xs text-text-muted">{s.label}</span></div>
                <span className="text-xs font-black text-text">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="glass border border-white/10 rounded-[20px] p-4 space-y-3">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Bell size={12} /> Activity</h3>
            {(insights?.recentActivity || []).length > 0 ? insights!.recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  a.type === 'like' ? 'bg-red-500/10 text-red-400' : a.type === 'comment' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400')}>
                  {a.type === 'like' ? <Heart size={11} /> : a.type === 'comment' ? <MessageSquare size={11} /> : <Users size={11} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-text leading-tight">{a.text}</p>
                  <p className="text-[9px] text-text-muted mt-0.5">{a.time}</p>
                </div>
              </div>
            )) : <p className="text-xs text-text-muted">No recent activity.</p>}
          </div>
        </div>

        {/* Top posts + your posts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass border border-white/10 rounded-[20px] p-4 space-y-3">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><TrendingUp size={12} /> Top Posts</h3>
            {(insights?.topPosts || []).length > 0 ? insights!.topPosts.map((p, i) => (
              <div key={p.id || i} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text line-clamp-1">{p.content || '(no text)'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                    <span className="flex items-center gap-1"><Heart size={9} className="text-red-400" /> {p.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={9} className="text-blue-400" /> {p.comments}</span>
                    <span className="flex items-center gap-1"><Share2 size={9} className="text-emerald-400" /> {p.shares}</span>
                  </div>
                </div>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-text-muted hover:text-primary transition-colors shrink-0"><ExternalLink size={12} /></a>}
              </div>
            )) : <p className="text-xs text-text-muted">No post data from this platform.</p>}
          </div>

          <div className="glass border border-white/10 rounded-[20px] p-4 space-y-3">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Posts via BMS</h3>
            {loadingPosts ? <div className="flex items-center justify-center py-6"><Loader2 size={16} className="animate-spin text-primary" /></div>
              : posts.length === 0 ? <p className="text-xs text-text-muted py-4 text-center">No posts yet.</p>
              : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {posts.map(post => (
                    <div key={post.id} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                      {post.mediaUrls?.[0] && <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10"><img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full',
                            post.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' :
                            post.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'
                          )}>{post.status}</span>
                          <span className="text-[9px] text-text-muted">
                            {post.scheduledTime ? format(new Date(post.scheduledTime), 'MMM d, h:mm a') :
                             post.publishedAt ? format(new Date(post.publishedAt), 'MMM d') :
                             format(new Date(post.createdAt), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SocialAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(null); // null = not yet decided
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await socialService.getAccounts();
      // Only show active (connected) accounts as tabs
      const active = data.filter(a => a.isActive);
      setAccounts(active);
      // Auto-select first account tab if none selected yet
      setActiveTab(prev => {
        if (prev === null && active.length > 0) return active[0].platform;
        if (prev !== null && active.find(a => a.platform === prev)) return prev;
        if (active.length > 0) return active[0].platform;
        return 'none'; // no accounts
      });
    } catch { toast('Failed to load accounts', 'error'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      toast(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected!`, 'success');
      loadAccounts();
      setSearchParams({}, { replace: true });
    } else if (error) {
      toast(`Connection failed: ${error.replace(/_/g, ' ')}`, 'error');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleDisconnect = async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!window.confirm(`Disconnect ${account?.platform}?`)) return;
    try {
      await socialService.disconnect(id);
      const remaining = accounts.filter(a => a.id !== id);
      setAccounts(remaining);
      toast(`Disconnected.`, 'info');
      setActiveTab(remaining.length > 0 ? remaining[0].platform : 'none');
    } catch { toast('Failed to disconnect.', 'error'); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16 sm:pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-text mb-1">Social Command Center</h1>
          <p className="text-sm text-text-muted">Monitor live feeds and manage your cross-platform presence.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={loadAccounts} className="p-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:border-primary/30 transition-all">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Button onClick={() => setIsModalOpen(true)} className="h-10 px-4 rounded-xl font-bold shadow-xl shadow-primary/30">
            <Plus size={15} className="mr-2" /> Connect Account
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      )}

      {/* No accounts — prominent empty state */}
      {!isLoading && accounts.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-text-muted mb-6">
            <AlertCircle size={36} />
          </div>
          <h2 className="text-xl font-black text-text mb-2">No social accounts connected</h2>
          <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
            Connect your social media accounts to see platform tabs, post content, view insights, and monitor performance.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={() => setIsModalOpen(true)} className="h-11 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
              <Plus size={16} className="mr-2" /> Connect Your First Account
            </Button>
            <Link to="/social-accounts" className="text-sm font-bold text-primary hover:underline">
              Learn about social connections →
            </Link>
          </div>
        </motion.div>
      )}

      {/* Platform tabs — only when accounts exist */}
      {!isLoading && accounts.length > 0 && (
        <>
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
            {accounts.map(acc => {
              const cfg = PCFG[acc.platform];
              return (
                <button key={acc.id} onClick={() => setActiveTab(acc.platform)}
                  className={cn('shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
                    activeTab === acc.platform ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text')}>
                  <PlatformBadge platform={acc.platform} size={18} className={activeTab === acc.platform ? 'opacity-90' : ''} />
                  {cfg?.label || acc.platform}
                </button>
              );
            })}
          </div>

          {/* Active platform panel */}
          {accounts.map(acc => (
            activeTab === acc.platform && <PlatformPanel key={acc.id} account={acc} />
          ))}
        </>
      )}

      <ConnectAccountModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConnect={() => {}} existingAccounts={[]} />
    </div>
  );
}
