import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Image as ImageIcon, 
  Calendar, 
  Send, 
  Hash, 
  Smile, 
  MapPin, 
  ChevronDown, 
  X, 
  Clock, 
  Globe, 
  ShieldCheck, 
  Plus, 
  MoreVertical, 
  Heart, 
  MessageSquare, 
  Upload, 
  Sparkles,
  Share2,
  Check,
  ChevronRight,
  ChevronLeft,
  Layout,
  Repeat,
  Info,
  Monitor,
  Maximize2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MOCK_ACCOUNTS } from '../lib/mock-data';
import { cn } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { MiniGallerySelector } from '../components/gallery/MiniGallerySelector';
import { BestTimeModal } from '../components/scheduler/BestTimeModal';

const CONNECTED_PLATFORMS = Array.from(new Set(
  MOCK_ACCOUNTS
    .filter(acc => acc.status === 'connected')
    .map(acc => acc.platform)
));

const PLATFORMS = [
  { id: 'Instagram', icon: 'Instagram' },
  { id: 'Facebook', icon: 'Facebook' },
  { id: 'Twitter', icon: 'Twitter' },
  { id: 'LinkedIn', icon: 'LinkedIn' },
  { id: 'YouTube', icon: 'YouTube' },
  { id: 'TikTok', icon: 'TikTok' }
].filter(p => CONNECTED_PLATFORMS.includes(p.id as any));

export default function ComposerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(PLATFORMS.length > 0 ? [PLATFORMS[0].id] : []);
  const [selectedAssets, setSelectedAssets] = useState<any[]>([]);
  const [mediaSource, setMediaSource] = useState<'gallery' | 'upload'>('gallery');
  const [isScheduled, setIsScheduled] = useState(true);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [timezone, setTimezone] = useState('GMT+0 (London)');
  const [isScheduling, setIsScheduling] = useState(false);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState(PLATFORMS.length > 0 ? PLATFORMS[0].id : '');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'full'>('desktop');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showHashtagPicker, setShowHashtagPicker] = useState(false);
  const [isBestTimeModalOpen, setIsBestTimeModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          const newAsset = {
            id: Date.now().toString(),
            title: 'Uploaded Asset',
            url: 'https://picsum.photos/seed/upload/800/600',
            category: 'Image',
            metadata: { fileType: 'JPG', fileSize: '1.2MB' }
          };
          setSelectedAssets([newAsset]);
          toast('Asset uploaded and attached!', 'success');
          setMediaSource('gallery');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  useEffect(() => {
    if (location.state) {
      if (location.state.asset) {
        setSelectedAssets([location.state.asset]);
      }
      if (location.state.date) {
        const date = location.state.date;
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        setScheduledDateTime(`${date}T${time}`);
        
        if (location.state.isPast) {
          toast('Scheduling for a past date will publish the post immediately.', 'warning');
        }
      }
      if (location.state.post) {
        const post = location.state.post;
        setCaption(post.content);
        setSelectedPlatforms(post.platforms);
        if (post.mediaUrls?.[0]) {
          setSelectedAssets([{ id: 'existing', url: post.mediaUrls[0], title: 'Existing Media' }]);
        }
        if (post.scheduledDate) {
          setScheduledDateTime(post.scheduledDate.substring(0, 16));
        }
      }
    } else {
      // Default to tomorrow 10:30 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      setScheduledDateTime(`${dateStr}T10:30`);
    }
  }, [location.state]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const next = prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform];
      if (next.length > 0 && !next.includes(activePreviewPlatform)) {
        setActivePreviewPlatform(next[0]);
      }
      return next;
    });
  };

  const handleSchedule = () => {
    if (selectedPlatforms.length === 0) {
      toast('Please select at least one platform.', 'error');
      return;
    }
    if (!caption && selectedAssets.length === 0) {
      toast('Please add some content or media before scheduling.', 'error');
      return;
    }
    if (isScheduled && !scheduledDateTime) {
      toast('Please select a date and time for scheduling.', 'error');
      return;
    }
    
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      toast(isScheduled ? 'Post scheduled successfully!' : 'Post published successfully!', 'success');
      navigate('/scheduler');
    }, 1500);
  };

  const generateAICaption = () => {
    setIsGeneratingAI(true);
    setTimeout(() => {
      const suggestions = [
        "Elevate your brand with BMS. 🚀 Our creative solutions are designed to make you stand out. #BMSCreative #MarketingStrategy",
        "Behind the scenes at BMS! 🎬 See how we bring your vision to life. #CreativeAgency #BMS",
        "Ready to scale? 📈 Let's build something amazing together. #GrowthMindset #BMS"
      ];
      setCaption(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setIsGeneratingAI(false);
      toast('AI caption generated!', 'success');
    }, 1200);
  };

  const suggestBestTime = () => {
    setIsBestTimeModalOpen(true);
  };

  const handleBestTimeSelect = (time: string) => {
    const [date] = scheduledDateTime.split('T');
    setScheduledDateTime(`${date}T${time}`);
    toast(`Optimized for peak engagement at ${time}`, 'success');
  };

  const renderPreview = () => {
    const asset = selectedAssets[0];
    const mediaUrl = asset?.url || asset?.variants?.[0]?.url;

    switch (activePreviewPlatform) {
      case 'Instagram':
        return (
          <div className="bg-card rounded-[32px] border border-white/10 overflow-hidden shadow-2xl max-w-[340px] mx-auto">
            <div className="p-4 flex items-center gap-3 border-b border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-fuchsia-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-card border-2 border-card flex items-center justify-center text-[10px] font-black">B</div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-text">bms_agency</p>
                <p className="text-[10px] text-text-muted">London, UK</p>
              </div>
              <MoreVertical size={16} className="text-text-muted" />
            </div>
            <div className="aspect-square bg-white/5 flex items-center justify-center">
              {mediaUrl ? (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <ImageIcon size={48} className="opacity-10" />
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-text">
                  <Heart size={20} />
                  <MessageSquare size={20} />
                  <Send size={20} />
                </div>
                <div className="w-5 h-5 border-2 border-text rounded-sm" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-text">1,482 likes</p>
                <div className="text-xs leading-relaxed">
                  <span className="font-bold mr-2">bms_agency</span>
                  <span className="text-text-muted">{caption || "Your caption will appear here..."}</span>
                </div>
                <p className="text-[10px] text-text-muted uppercase tracking-tighter mt-2">Just now</p>
              </div>
            </div>
          </div>
        );
      case 'Facebook':
        return (
          <div className="bg-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl max-w-[380px] mx-auto">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">B</div>
              <div>
                <p className="text-sm font-bold text-text">BMS Creative Agency</p>
                <p className="text-xs text-text-muted flex items-center gap-1">Just now • <Globe size={12} /></p>
              </div>
            </div>
            <div className="px-4 pb-3 text-sm text-text">
              {caption || "What's on your mind?"}
            </div>
            <div className="aspect-video bg-white/5 flex items-center justify-center">
              {mediaUrl ? (
                <img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <ImageIcon size={48} className="opacity-10" />
              )}
            </div>
            <div className="p-3 border-t border-white/5 flex items-center justify-around text-text-muted">
              <div className="flex items-center gap-2 text-xs font-bold"><Heart size={16} /> Like</div>
              <div className="flex items-center gap-2 text-xs font-bold"><MessageSquare size={16} /> Comment</div>
              <div className="flex items-center gap-2 text-xs font-bold"><Share2 size={16} /> Share</div>
            </div>
          </div>
        );
      case 'Twitter':
        return (
          <div className="bg-card rounded-2xl border border-white/10 p-4 shadow-2xl max-w-[380px] mx-auto space-y-3">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-black">B</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-text truncate">BMS Agency</span>
                  <span className="text-text-muted text-xs">@bms_agency • now</span>
                </div>
                <p className="text-sm text-text mt-1 leading-relaxed">{caption || "Drafting a new tweet..."}</p>
                {mediaUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 aspect-video">
                    <img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 text-text-muted max-w-xs">
                  <MessageSquare size={16} />
                  <Repeat size={16} />
                  <Heart size={16} />
                  <Layout size={16} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'LinkedIn':
        return (
          <div className="bg-card rounded-xl border border-white/10 shadow-2xl max-w-[400px] mx-auto overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">BMS</div>
              <div>
                <p className="text-sm font-bold text-text">BMS Creative Agency</p>
                <p className="text-xs text-text-muted">Creative Media & Marketing Solutions</p>
                <p className="text-[10px] text-text-muted flex items-center gap-1">Now • <Globe size={10} /></p>
              </div>
            </div>
            <div className="px-4 pb-3 text-sm text-text">
              {caption || "Share professional updates..."}
            </div>
            {mediaUrl && (
              <div className="border-y border-white/5 bg-white/5">
                <img src={mediaUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="p-3 flex items-center gap-6 text-text-muted">
              <div className="flex items-center gap-2 text-xs font-bold"><Heart size={18} /> Like</div>
              <div className="flex items-center gap-2 text-xs font-bold"><MessageSquare size={18} /> Comment</div>
              <div className="flex items-center gap-2 text-xs font-bold"><Repeat size={18} /> Repost</div>
              <div className="flex items-center gap-2 text-xs font-bold"><Send size={18} /> Send</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Post Composer</h1>
          <p className="text-text-muted font-medium">Create, preview, and schedule content across all your social channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 px-6 rounded-xl font-bold">
            Save Draft
          </Button>
          <Button onClick={handleSchedule} isLoading={isScheduling} className="h-12 px-6 rounded-xl font-bold shadow-xl shadow-primary/30">
            <Send size={18} className="mr-2" /> {isScheduled ? 'Schedule Post' : 'Publish Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Editor Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass border border-border rounded-[32px] p-8 space-y-10">
            {/* Media Source Selector */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-text flex items-center gap-2">
                  <ImageIcon size={20} className="text-primary" /> Media Content
                </h3>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setMediaSource('gallery')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      mediaSource === 'gallery' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text"
                    )}
                  >
                    Gallery
                  </button>
                  <button
                    onClick={() => setMediaSource('upload')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      mediaSource === 'upload' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:text-text"
                    )}
                  >
                    Upload New
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {mediaSource === 'gallery' ? (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <MiniGallerySelector 
                      selectedAssets={selectedAssets}
                      onSelect={(a) => setSelectedAssets([a])}
                      onRemove={() => setSelectedAssets([])}
                      multiple={false}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={handleUpload}
                    className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center p-8 group hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                  >
                    {isUploading ? (
                      <div className="w-full max-w-xs space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-primary">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload size={24} />
                        </div>
                        <p className="text-base font-bold text-text">Drag & drop to upload</p>
                        <p className="text-xs text-text-muted">Supports JPG, PNG, MP4 up to 50MB</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Platform Selection */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-text flex items-center gap-2">
                <Globe size={20} className="text-primary" /> Target Platforms
              </h3>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300",
                      selectedPlatforms.includes(platform.id)
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-white/5 border-white/10 text-text-muted hover:border-white/20"
                    )}
                  >
                    <span className="text-sm font-bold">{platform.id}</span>
                    {selectedPlatforms.includes(platform.id) && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-text">Caption</h3>
                <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", caption.length > 2000 ? "bg-red-500/10 text-red-500" : "bg-white/5 text-text-muted")}>
                  {caption.length} / 2200
                </span>
              </div>
              <div className="relative group">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell your story... Add hashtags and mentions."
                  className="w-full bg-white/5 border border-white/10 rounded-[32px] px-8 py-7 text-base text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[250px] resize-none leading-relaxed transition-all"
                />
                
                {/* Caption Tools */}
                <div className="absolute bottom-6 left-8 flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateAICaption}
                    isLoading={isGeneratingAI}
                    className="bg-white/5 border-white/10 text-xs font-bold h-9"
                  >
                    <Sparkles size={14} className="mr-2 text-primary" /> Use AI to Write Caption
                  </Button>
                </div>

                <div className="absolute bottom-6 right-8 flex items-center gap-4 text-text-muted">
                  <div className="relative">
                    <button 
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="hover:text-primary transition-colors p-1.5 hover:bg-white/5 rounded-lg flex items-center gap-1.5"
                    >
                      <MapPin size={20} />
                      <span className="text-[10px] font-bold uppercase hidden md:inline">Location</span>
                    </button>
                    <AnimatePresence>
                      {showLocationPicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 p-3 glass border border-white/10 rounded-2xl shadow-2xl z-50 w-48 space-y-2"
                        >
                          {['London, UK', 'New York, USA', 'Paris, France'].map(loc => (
                            <button 
                              key={loc}
                              onClick={() => { setCaption(prev => prev + ' 📍 ' + loc); setShowLocationPicker(false); }}
                              className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-white/5 rounded-lg transition-colors"
                            >
                              {loc}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="hover:text-primary transition-colors p-1.5 hover:bg-white/5 rounded-lg flex items-center gap-1.5"
                    >
                      <Smile size={20} />
                      <span className="text-[10px] font-bold uppercase hidden md:inline">Emoji</span>
                    </button>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 p-3 glass border border-white/10 rounded-2xl shadow-2xl z-50 w-48"
                        >
                          <div className="grid grid-cols-4 gap-2">
                            {['🚀', '🔥', '✨', '💯', '🙌', '❤️', '⚡', '💡'].map(emoji => (
                              <button 
                                key={emoji}
                                onClick={() => { setCaption(prev => prev + emoji); setShowEmojiPicker(false); }}
                                className="text-xl hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative">
                    <button 
                      onClick={() => setShowHashtagPicker(!showHashtagPicker)}
                      className="hover:text-primary transition-colors p-1.5 hover:bg-white/5 rounded-lg flex items-center gap-1.5"
                    >
                      <Hash size={20} />
                      <span className="text-[10px] font-bold uppercase hidden md:inline">Hashtags</span>
                    </button>
                    <AnimatePresence>
                      {showHashtagPicker && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-full right-0 mb-2 p-3 glass border border-white/10 rounded-2xl shadow-2xl z-50 w-48 space-y-2"
                        >
                          {['#BMS', '#Creative', '#Marketing', '#Success'].map(tag => (
                            <button 
                              key={tag}
                              onClick={() => { setCaption(prev => prev + ' ' + tag); setShowHashtagPicker(false); }}
                              className="w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-white/5 rounded-lg transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling Toggle */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer",
                    isScheduled ? "bg-primary" : "bg-white/10"
                  )} onClick={() => setIsScheduled(!isScheduled)}>
                    <motion.div 
                      animate={{ x: isScheduled ? 24 : 0 }}
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </div>
                  <span className="text-sm font-bold text-text">Schedule for later</span>
                </div>
                {isScheduled && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={suggestBestTime}
                    className="text-[10px] h-8"
                  >
                    <Sparkles size={12} className="mr-1.5 text-primary" /> Suggest Best Time
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {isScheduled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Date & Time Picker</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                            <input 
                              type="datetime-local"
                              value={scheduledDateTime}
                              onChange={(e) => setScheduledDateTime(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted ml-1">Timezone</label>
                          <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                            <select 
                              value={timezone}
                              onChange={(e) => setTimezone(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all appearance-none"
                            >
                              <option value="GMT+0 (London)">GMT+0 (London)</option>
                              <option value="GMT+1 (Africa/Lagos)">GMT+1 (Africa/Lagos)</option>
                              <option value="GMT-5 (New York)">GMT-5 (New York)</option>
                              <option value="GMT+8 (Singapore)">GMT+8 (Singapore)</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <Info size={14} className="text-primary" />
                        <p className="text-[10px] font-medium text-text-muted">Timezone auto-detected based on your location.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Preview Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="glass border border-border rounded-[32px] p-8 space-y-8 sticky top-24">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-text">Live Preview</h3>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    previewMode === 'desktop' ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-text"
                  )}
                  title="Desktop View"
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setPreviewMode('full')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    previewMode === 'full' ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-text"
                  )}
                  title="Full View"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
            </div>

            {selectedPlatforms.length > 0 ? (
              <div className="space-y-8">
                {/* Platform Tabs */}
                {selectedPlatforms.length > 1 && (
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                    {selectedPlatforms.map(platform => (
                      <button
                        key={platform}
                        onClick={() => setActivePreviewPlatform(platform)}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                          activePreviewPlatform === platform ? "bg-primary text-white shadow-lg" : "text-text-muted hover:text-text"
                        )}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePreviewPlatform + previewMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "transition-all duration-500",
                      previewMode === 'desktop' ? "p-4 bg-black/20 rounded-[40px] border border-white/5 shadow-inner" : ""
                    )}
                  >
                    {previewMode === 'desktop' && (
                      <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-white/5 rounded-full border border-white/5 w-fit mx-auto">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500/50" />
                          <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                          <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                        </div>
                        <div className="h-3 w-32 bg-white/10 rounded-full" />
                      </div>
                    )}
                    {renderPreview()}
                  </motion.div>
                </AnimatePresence>

                <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                    <span>Platform Optimization</span>
                    <span>85% Score</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '85%' }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Your content is well-optimized for {activePreviewPlatform}. Consider adding 2-3 more hashtags for better reach.
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white/5 text-text-muted rounded-full flex items-center justify-center mb-4">
                  <Layout size={24} className="opacity-20" />
                </div>
                <p className="text-sm font-bold text-text-muted">Select a platform to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BestTimeModal 
        isOpen={isBestTimeModalOpen}
        onClose={() => setIsBestTimeModalOpen(false)}
        onSelect={handleBestTimeSelect}
        selectedDate={scheduledDateTime ? new Date(scheduledDateTime) : new Date()}
      />
    </div>
  );
}
