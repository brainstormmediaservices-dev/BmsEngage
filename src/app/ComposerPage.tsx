import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ImageIcon, Calendar, Send, Hash, Smile, MapPin,
  Globe, Sparkles, Check, ChevronLeft, Layout, Loader2, Search, X,
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { MiniGallerySelector } from '../components/gallery/MiniGallerySelector';
import { BestTimeModal } from '../components/scheduler/BestTimeModal';
import { socialService, ConnectedAccount } from '../services/socialService';
import { postService } from '../services/postService';
import { MediaAsset } from '../types/media';
import { useTheme } from '../lib/ThemeContext';
import api from '../services/api';

const PLATFORM_MAP: Record<string, { label: string; dot: string; charLimit: number }> = {
  meta:     { label: 'Facebook',  dot: 'bg-blue-500',  charLimit: 63206 },
  twitter:  { label: 'Twitter/X', dot: 'bg-sky-400',   charLimit: 280 },
  linkedin: { label: 'LinkedIn',  dot: 'bg-blue-700',  charLimit: 3000 },
  tiktok:   { label: 'TikTok',    dot: 'bg-pink-500',  charLimit: 2200 },
};

interface PlatformCaption { caption: string; location: string; hashtags: string[] }
const blank = (): PlatformCaption => ({ caption: '', location: '', hashtags: [] });

// Nominatim geocoder for location search (free, no key)
async function searchLocations(q: string): Promise<{ display_name: string; lat: string; lon: string }[]> {
  if (!q.trim()) return [];
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`, {
    headers: { 'Accept-Language': 'en' },
  });
  return res.json();
}

export default function ComposerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const captionRef = useRef<HTMLTextAreaElement>(null);

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [differentiate, setDifferentiate] = useState(false);
  const [platformCaptions, setPlatformCaptions] = useState<Record<string, PlatformCaption>>({});
  const [sharedCaption, setSharedCaption] = useState('');
  const [activePlatform, setActivePlatform] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<MediaAsset[]>([]);
  const [isScheduled, setIsScheduled] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [activePreview, setActivePreview] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isBestTimeOpen, setIsBestTimeOpen] = useState(false);

  // Emoji picker
  const [showEmoji, setShowEmoji] = useState(false);

  // Location picker
  const [showLocation, setShowLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Hashtag picker
  const [showHashtag, setShowHashtag] = useState(false);
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [assetTags, setAssetTags] = useState<string[]>([]);

  // Load connected accounts
  useEffect(() => {
    socialService.getAccounts().then(accs => {
      const active = accs.filter(a => a.isActive);
      setAccounts(active);
      if (active.length > 0) {
        const first = active[0].platform;
        setSelectedPlatforms([first]);
        setActivePreview(first);
        setActivePlatform(first);
        const caps: Record<string, PlatformCaption> = {};
        active.forEach(a => { caps[a.platform] = blank(); });
        setPlatformCaptions(caps);
      }
    }).catch(() => {}).finally(() => setLoadingAccounts(false));
  }, []);

  // Handle navigation state
  useEffect(() => {
    if (!location.state) {
      const t = new Date(); t.setDate(t.getDate() + 1);
      setScheduledDateTime(`${t.toISOString().split('T')[0]}T10:30`);
      return;
    }
    const { asset, date, post } = location.state as any;
    if (asset) {
      setSelectedAssets([asset]);
      setAssetTags(asset.tags || []);
      // Default scheduled date = asset's targetDate if no explicit date passed
      if (!date && asset.targetDate) {
        const td = asset.targetDate.split('T')[0];
        const n = new Date();
        setScheduledDateTime(`${td}T${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`);
        setIsScheduled(true);
      }
    }
    if (date) {
      const n = new Date();
      setScheduledDateTime(`${date}T${n.getHours().toString().padStart(2,'0')}:${n.getMinutes().toString().padStart(2,'0')}`);
      setIsScheduled(true);
    }
    if (post) { setSharedCaption(post.content || ''); if (post.scheduledDate) setScheduledDateTime(post.scheduledDate.substring(0,16)); }
  }, [location.state]);

  // When asset selected, update tags
  useEffect(() => {
    if (selectedAssets[0]) setAssetTags(selectedAssets[0].tags || []);
  }, [selectedAssets]);

  // Location search debounce
  useEffect(() => {
    if (!locationSearch.trim()) { setLocationResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingLocation(true);
      try { setLocationResults(await searchLocations(locationSearch)); }
      catch { setLocationResults([]); }
      finally { setSearchingLocation(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [locationSearch]);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => {
      const next = prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p];
      if (next.length > 0 && !next.includes(activePreview)) setActivePreview(next[0]);
      if (next.length > 0 && !next.includes(activePlatform)) setActivePlatform(next[0]);
      return next;
    });
  };

  const getCaption = (p?: string) => {
    if (!differentiate) return sharedCaption;
    return platformCaptions[p || activePlatform]?.caption || '';
  };

  const setCaption = (val: string, p?: string) => {
    if (!differentiate) { setSharedCaption(val); return; }
    const key = p || activePlatform;
    setPlatformCaptions(prev => ({ ...prev, [key]: { ...prev[key], caption: val } }));
  };

  const insertAtCursor = (text: string) => {
    const ta = captionRef.current;
    if (!ta) { setCaption(getCaption() + text); return; }
    const s = ta.selectionStart ?? getCaption().length;
    const e = ta.selectionEnd ?? s;
    const cur = getCaption();
    setCaption(cur.slice(0, s) + text + cur.slice(e));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + text.length, s + text.length); }, 0);
  };

  const addHashtag = (tag: string) => {
    const ht = tag.startsWith('#') ? tag : `#${tag}`;
    insertAtCursor(` ${ht}`);
    setShowHashtag(false);
    setHashtagSearch('');
  };

  const addLocation = (name: string) => {
    insertAtCursor(` 📍 ${name}`);
    setShowLocation(false);
    setLocationSearch('');
    setLocationResults([]);
  };

  const onEmojiClick = (data: EmojiClickData) => {
    insertAtCursor(data.emoji);
    setShowEmoji(false);
  };

  const generateAI = async () => {
    const asset = selectedAssets[0];
    const existingCaption = getCaption();

    // Case 1: no asset selected AND no caption typed → require one or the other
    if (!asset && !existingCaption.trim()) {
      toast('Please select an asset from the gallery first, or type a caption to rewrite with AI.', 'error');
      return;
    }

    setIsGeneratingAI(true);
    try {
      let payload: { title?: string; tags?: string[]; existingCaption?: string; platform: string };

      if (asset) {
        // Asset selected → use its name + tags to generate fresh caption
        payload = { title: asset.title, tags: asset.tags || [], platform: activePlatform };
      } else {
        // No asset but user typed something → rewrite existing caption for social media
        payload = { existingCaption: existingCaption.trim(), platform: activePlatform };
      }

      const { data } = await api.post('/ai/caption', payload);
      const caption = data.caption || '';
      if (!caption) { toast('AI returned empty caption', 'error'); return; }
      if (differentiate) {
        selectedPlatforms.forEach(p => setPlatformCaptions(prev => ({ ...prev, [p]: { ...prev[p], caption } })));
      } else {
        setSharedCaption(caption);
      }
      toast('Caption generated!', 'success');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error;
      if (status === 400) {
        toast(msg || 'Please provide more context before generating a caption.', 'error');
      } else if (status === 422) {
        toast(msg || 'The AI could not generate a meaningful caption. Try adding more descriptive tags to your asset.', 'error');
      } else if (status === 503) {
        toast('AI service unavailable. Add an OPENAI_API_KEY or HUGGINGFACE_API_KEY to your backend .env and restart.', 'error');
      } else {
        toast(msg || 'AI generation failed. Please try again.', 'error');
      }
    } finally { setIsGeneratingAI(false); }
  };

  const handleSchedule = async () => {
    if (!selectedPlatforms.length) { toast('Select at least one platform', 'error'); return; }
    const caption = getCaption();
    if (!caption && !selectedAssets.length) { toast('Add content or media', 'error'); return; }
    if (isScheduled && !scheduledDateTime) { toast('Select a date and time', 'error'); return; }
    setIsScheduling(true);
    try {
      await postService.create({
        content: caption,
        platforms: selectedPlatforms,
        scheduledTime: isScheduled ? new Date(scheduledDateTime).toISOString() : undefined,
        mediaUrls: selectedAssets.map(a => a.url),
      });
      toast(isScheduled ? 'Post scheduled!' : 'Saved as draft!', 'success');
      navigate('/scheduler');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to schedule', 'error');
    } finally { setIsScheduling(false); }
  };

  const currentCaption = getCaption();
  const charLimit = PLATFORM_MAP[activePlatform]?.charLimit || 2200;
  const filteredHashtags = [...new Set([...assetTags, 'Creative', 'Marketing', 'BrandStrategy', 'ContentCreator', 'DigitalMarketing', 'SocialMedia', 'Agency', 'Design'])]
    .filter(t => !hashtagSearch || t.toLowerCase().includes(hashtagSearch.toLowerCase()));

  // ── Preview ──────────────────────────────────────────────────────────────
  const renderPreview = (p: string) => {
    const asset = selectedAssets[0];
    const mediaUrl = asset?.url;
    const cap = getCaption(p);
    const acc = accounts.find(a => a.platform === p);
    const name = acc?.displayName || acc?.username || 'Your Account';

    if (p === 'meta') return (
      <div className="bg-card rounded-2xl border border-white/10 overflow-hidden max-w-[340px] mx-auto">
        <div className="p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{name[0]}</div>
          <div><p className="text-xs font-bold text-text">{name}</p><p className="text-[9px] text-text-muted">Just now · <Globe size={9} className="inline" /></p></div>
        </div>
        <div className="px-3 pb-2 text-xs text-text">{cap || <span className="text-text-muted italic">Caption will appear here…</span>}</div>
        {mediaUrl && <div className="aspect-video"><img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>}
        <div className="p-2 border-t border-white/5 flex justify-around text-[10px] font-bold text-text-muted">
          <span>👍 Like</span><span>💬 Comment</span><span>↗️ Share</span>
        </div>
      </div>
    );
    if (p === 'twitter') return (
      <div className="bg-card rounded-2xl border border-white/10 p-4 max-w-[340px] mx-auto">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-400/20 flex items-center justify-center text-sky-400 font-black text-sm">{name[0]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text">{name} <span className="text-text-muted font-normal">· now</span></p>
            <p className="text-xs text-text mt-1 leading-relaxed">{cap || <span className="text-text-muted italic">Tweet will appear here…</span>}</p>
            {mediaUrl && <div className="mt-2 rounded-xl overflow-hidden aspect-video border border-white/10"><img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>}
          </div>
        </div>
      </div>
    );
    if (p === 'linkedin') return (
      <div className="bg-card rounded-xl border border-white/10 max-w-[360px] mx-auto overflow-hidden">
        <div className="p-3 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-blue-700/20 flex items-center justify-center text-blue-400 font-bold">{name[0]}</div>
          <div><p className="text-xs font-bold text-text">{name}</p><p className="text-[9px] text-text-muted">Now · <Globe size={9} className="inline" /></p></div>
        </div>
        <div className="px-3 pb-2 text-xs text-text">{cap || <span className="text-text-muted italic">Post will appear here…</span>}</div>
        {mediaUrl && <div className="border-y border-white/5"><img src={mediaUrl} alt="" className="w-full object-cover" referrerPolicy="no-referrer" /></div>}
      </div>
    );
    if (p === 'tiktok') return (
      <div className="bg-black rounded-2xl border border-white/10 max-w-[200px] mx-auto overflow-hidden" style={{ aspectRatio: '9/16' }}>
        <div className="relative w-full h-full flex items-center justify-center">
          {mediaUrl ? <img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="text-white/20 text-xs">Video</div>}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-[9px] font-bold">@{acc?.username || 'you'}</p>
            <p className="text-white/80 text-[8px] line-clamp-2">{cap || <span className="italic">Caption…</span>}</p>
          </div>
        </div>
      </div>
    );
    return <div className="text-center text-text-muted text-xs py-8">Select a platform to preview</div>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-text mb-1">Post Composer</h1>
          <p className="text-sm text-text-muted">Create, preview, and schedule content across all your social channels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 px-4 rounded-xl font-bold" onClick={() => navigate(-1)}>
            <ChevronLeft size={15} className="mr-1" /> Back
          </Button>
          <Button onClick={handleSchedule} isLoading={isScheduling} className="h-10 px-5 rounded-xl font-bold shadow-xl shadow-primary/30">
            <Send size={14} className="mr-2" /> {isScheduled ? 'Schedule' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left ─────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass border border-border rounded-[24px] p-5 sm:p-7 space-y-6">

            {/* Media */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-text flex items-center gap-2"><ImageIcon size={16} className="text-primary" /> Media Content</h3>
              <MiniGallerySelector selectedAssets={selectedAssets} onSelect={a => setSelectedAssets([a])} onRemove={() => setSelectedAssets([])} multiple={false} />
            </div>

            {/* Platforms */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-text flex items-center gap-2">
                <Globe size={16} className="text-primary" /> Target Platforms
                {loadingAccounts && <Loader2 size={13} className="animate-spin text-text-muted" />}
              </h3>
              {!loadingAccounts && accounts.length === 0 ? (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                  No connected accounts. <button onClick={() => navigate('/social-accounts')} className="underline font-bold">Connect →</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map(acc => {
                    const cfg = PLATFORM_MAP[acc.platform];
                    const sel = selectedPlatforms.includes(acc.platform);
                    return (
                      <button key={acc.id} onClick={() => togglePlatform(acc.platform)}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all text-xs font-bold',
                          sel ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20')}>
                        <span className={cn('w-2 h-2 rounded-full', cfg?.dot || 'bg-gray-400')} />
                        {cfg?.label || acc.platform}
                        {sel && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Differentiate toggle */}
            {selectedPlatforms.length > 1 && (
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-text">Differentiate per platform</p>
                  <p className="text-[10px] text-text-muted">Custom caption, location, hashtags per platform</p>
                </div>
                <button onClick={() => setDifferentiate(d => !d)}
                  className={cn('w-11 h-6 rounded-full relative transition-all', differentiate ? 'bg-primary' : 'bg-white/10')}>
                  <motion.div animate={{ x: differentiate ? 20 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
                </button>
              </div>
            )}

            {/* Platform tabs when differentiate */}
            {differentiate && selectedPlatforms.length > 1 && (
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
                {selectedPlatforms.map(p => (
                  <button key={p} onClick={() => setActivePlatform(p)}
                    className={cn('shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      activePlatform === p ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
                    {PLATFORM_MAP[p]?.label || p}
                  </button>
                ))}
              </div>
            )}

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-text">Caption</h3>
                <span className={cn('text-xs font-bold px-2 py-0.5 rounded-lg', currentCaption.length > charLimit ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-text-muted')}>
                  {currentCaption.length}/{charLimit}
                </span>
              </div>
              <div className="relative">
                <textarea ref={captionRef} value={currentCaption} onChange={e => setCaption(e.target.value)}
                  placeholder="Your caption will appear here after selecting an asset and generating with AI, or type manually…"
                  spellCheck lang="en"
                  className="w-full bg-white/5 border border-white/10 rounded-[20px] px-5 py-4 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[160px] resize-none leading-relaxed transition-all" />

                {/* AI button */}
                <div className="absolute bottom-3 left-4">
                  <Button variant="outline" size="sm" onClick={generateAI} isLoading={isGeneratingAI}
                    className="bg-white/5 border-white/10 text-xs font-bold h-8">
                    <Sparkles size={12} className="mr-1.5 text-primary" />
                    {selectedAssets[0] ? 'AI Caption' : currentCaption.trim() ? 'Rewrite with AI' : 'AI Caption'}
                  </Button>
                </div>

                {/* Tool buttons */}
                <div className="absolute bottom-3 right-4 flex items-center gap-1">
                  {/* Location */}
                  <div className="relative">
                    <button onClick={() => { setShowLocation(v => !v); setShowEmoji(false); setShowHashtag(false); }}
                      className={cn('p-1.5 rounded-lg transition-colors', showLocation ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-white/5')}>
                      <MapPin size={16} />
                    </button>
                    <AnimatePresence>
                      {showLocation && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 glass border border-white/10 rounded-2xl shadow-2xl z-50 w-64 overflow-hidden">
                          <div className="p-2 border-b border-white/10">
                            <div className="relative">
                              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                              <input autoFocus value={locationSearch} onChange={e => setLocationSearch(e.target.value)}
                                placeholder="Search location…" spellCheck
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {searchingLocation && <div className="p-3 text-center"><Loader2 size={14} className="animate-spin text-primary mx-auto" /></div>}
                            {!searchingLocation && locationResults.length === 0 && locationSearch && (
                              <p className="p-3 text-xs text-text-muted text-center">No results. Try a different search.</p>
                            )}
                            {locationResults.map((r, i) => (
                              <button key={i} onClick={() => addLocation(r.display_name.split(',').slice(0,2).join(',').trim())}
                                className="w-full text-left px-3 py-2 text-xs text-text hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                📍 {r.display_name.split(',').slice(0,3).join(', ')}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Emoji */}
                  <div className="relative">
                    <button onClick={() => { setShowEmoji(v => !v); setShowLocation(false); setShowHashtag(false); }}
                      className={cn('p-1.5 rounded-lg transition-colors', showEmoji ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-white/5')}>
                      <Smile size={16} />
                    </button>
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 z-50">
                          <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                            width={300} height={380} searchPlaceholder="Search emoji…" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Hashtags */}
                  <div className="relative">
                    <button onClick={() => { setShowHashtag(v => !v); setShowLocation(false); setShowEmoji(false); }}
                      className={cn('p-1.5 rounded-lg transition-colors', showHashtag ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary hover:bg-white/5')}>
                      <Hash size={16} />
                    </button>
                    <AnimatePresence>
                      {showHashtag && (
                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 glass border border-white/10 rounded-2xl shadow-2xl z-50 w-52 overflow-hidden">
                          <div className="p-2 border-b border-white/10">
                            <div className="relative">
                              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                              <input autoFocus value={hashtagSearch} onChange={e => setHashtagSearch(e.target.value)}
                                placeholder="Search hashtags…" spellCheck
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50" />
                            </div>
                          </div>
                          <div className="max-h-44 overflow-y-auto p-1">
                            {assetTags.length > 0 && (
                              <p className="px-2 py-1 text-[9px] font-black text-primary uppercase tracking-widest">From Asset</p>
                            )}
                            {filteredHashtags.map(tag => (
                              <button key={tag} onClick={() => addHashtag(tag)}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsScheduled(v => !v)}
                    className={cn('w-11 h-6 rounded-full p-1 transition-colors', isScheduled ? 'bg-primary' : 'bg-white/10')}>
                    <motion.div animate={{ x: isScheduled ? 20 : 0 }} className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                  <span className="text-sm font-bold text-text">Schedule for later</span>
                </div>
                {isScheduled && (
                  <Button variant="outline" size="sm" onClick={() => setIsBestTimeOpen(true)} className="text-[10px] h-8">
                    <Sparkles size={11} className="mr-1 text-primary" /> Best Time
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {isScheduled && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-2">Date & Time</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={15} />
                        <input type="datetime-local" value={scheduledDateTime} onChange={e => setScheduledDateTime(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Right: Preview ────────────────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="glass border border-border rounded-[24px] p-5 sm:p-7 space-y-4 sticky top-20">
            <h3 className="font-bold text-sm text-text">Live Preview</h3>
            {selectedPlatforms.length === 0 ? (
              <div className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/10 rounded-[20px] flex flex-col items-center justify-center text-center p-8">
                <Layout size={22} className="text-text-muted/20 mb-3" />
                <p className="text-xs font-bold text-text-muted">Select a platform to see preview</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPlatforms.length > 1 && (
                  <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
                    {selectedPlatforms.map(p => (
                      <button key={p} onClick={() => setActivePreview(p)}
                        className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                          activePreview === p ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
                        {PLATFORM_MAP[p]?.label || p}
                      </button>
                    ))}
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div key={activePreview + currentCaption.slice(0, 20)}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
                    {renderPreview(activePreview || selectedPlatforms[0])}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <BestTimeModal isOpen={isBestTimeOpen} onClose={() => setIsBestTimeOpen(false)}
        onSelect={time => { const [d] = scheduledDateTime.split('T'); setScheduledDateTime(`${d}T${time}`); toast(`Scheduled for ${time}`, 'success'); }}
        selectedDate={scheduledDateTime ? new Date(scheduledDateTime) : new Date()} />
    </div>
  );
}
