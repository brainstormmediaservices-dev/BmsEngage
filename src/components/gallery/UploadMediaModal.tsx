import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Upload, X, FileText, Image as ImageIcon, Film, Layers, Loader2, ChevronDown, Users, Share2 } from 'lucide-react';
import { MediaCategory, MediaVisibility, MediaAsset, AudienceType } from '../../types/media';
import { CATEGORIES, MAIN_CATEGORIES, detectMainCategory, detectSubcategory, type MainCategory } from '../../constants/mediaCategories';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { mediaService } from '../../services/mediaService';
import { useAuth } from '../../contexts/AuthContext';
import { Startup, TeamMember, startupService } from '../../services/startupService';
import { StartupSelect } from './StartupSelect';
import { CampaignEventSelect } from './CampaignEventSelect';

interface UploadMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (asset: MediaAsset) => void;
  parentAsset?: MediaAsset;
  correctionReplyTo?: string;
  startups?: Startup[];
  campaignEventId?: string;
  targetDate?: string;
}

const VIDEO_MAX_BYTES = 2 * 1024 * 1024 * 1024;
const IMAGE_MAX_BYTES = 100 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'avif', 'heic', 'heif', 'ico',
  'psd', 'psb', 'ai', 'eps', 'indd', 'indt', 'xd', 'sketch', 'fig', 'afdesign', 'afphoto',
  'cdr', 'xcf', 'raw', 'cr2', 'nef', 'arw', 'dng',
  'pdf',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg', '3gp', 'flv', 'wmv', 'ogv', 'm4v', 'ts',
]);

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg', '3gp', 'flv', 'wmv', 'ogv', 'm4v', 'ts']);

const getExt = (filename: string) => filename.split('.').pop()?.toLowerCase() ?? '';

const ACCEPTED_INPUT = [
  'image/*', 'video/*', 'application/pdf',
  '.psd', '.psb', '.ai', '.eps', '.indd', '.xd', '.sketch', '.fig',
  '.afdesign', '.afphoto', '.cdr', '.xcf',
  '.raw', '.cr2', '.nef', '.arw', '.dng',
  '.tiff', '.tif', '.heic', '.heif', '.avif', '.ico',
].join(',');

export const UploadMediaModal = ({ isOpen, onClose, onUpload, parentAsset, correctionReplyTo, startups = [], campaignEventId, targetDate: propTargetDate }: UploadMediaModalProps) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAgency = user?.activeContext === 'agency';
  const startupsEnabled = isAgency && (user?.agency?.enableStartups || user?.agencyEnableStartups);
  const [campaignEvents, setCampaignEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (isAgency && isOpen && !parentAsset) {
      import('../../services/campaignEventService').then(m => m.campaignEventService.list()).then(setCampaignEvents).catch(() => {});
    }
  }, [isAgency, isOpen, parentAsset]);

  const [formData, setFormData] = React.useState({
    title: '',
    category: 'Graphics Design' as MainCategory,
    subcategory: '',
    description: '',
    tags: '',
    visibility: 'Public' as MediaVisibility,
    startupId: '',
    targetDate: '',
    campaignEventId: '',
    audienceType: 'ceo_only' as AudienceType,
    specificMemberIds: [] as string[],
    socialPlatforms: [] as string[],
    socialCaption: '',
    socialHashtags: '',
    socialCallToAction: '',
    socialScheduledDate: '',
  });

  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);

  React.useEffect(() => {
    if (formData.startupId && formData.audienceType === 'specific') {
      startupService.listTeamMembers(formData.startupId).then(setTeamMembers).catch(() => setTeamMembers([]));
    }
  }, [formData.startupId, formData.audienceType]);

  const subcategoryOptions = CATEGORIES[formData.category] || [];

  React.useEffect(() => {
    if (isOpen) {
      if (parentAsset) {
        setFormData({
          title: parentAsset.title,
          category: (parentAsset.category as MainCategory) || 'Graphics Design',
          subcategory: (parentAsset as any).subcategory || '',
          description: parentAsset.description,
          tags: parentAsset.tags.join(', '),
          visibility: parentAsset.visibility,
          startupId: '',
          targetDate: parentAsset.targetDate ? parentAsset.targetDate.split('T')[0] : '',
          campaignEventId: (parentAsset as any).campaignEventId || '',
          audienceType: 'ceo_only',
          specificMemberIds: [],
          socialPlatforms: [],
          socialCaption: '',
          socialHashtags: '',
          socialCallToAction: '',
          socialScheduledDate: '',
        });
      } else {
        setFormData({ title: '', category: 'Graphics Design', subcategory: '', description: '', tags: '', visibility: 'Public', startupId: '', targetDate: propTargetDate || '', campaignEventId: campaignEventId || '', audienceType: 'ceo_only', specificMemberIds: [], socialPlatforms: [], socialCaption: '', socialHashtags: '', socialCallToAction: '', socialScheduledDate: '' });
      }
      setFiles([]);
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [isOpen, parentAsset]);

  const validateFile = (file: File): string | null => {
    const ext = getExt(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) return `"${file.name}" — unsupported format (.${ext || 'unknown'}).`;
    const isVideo = VIDEO_EXTENSIONS.has(ext);
    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.size > maxBytes) {
      return `"${file.name}" exceeds the ${isVideo ? '2 GB' : '100 MB'} limit.`;
    }
    return null;
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    const errors: string[] = [];
    const valid = arr.filter(f => {
      const err = validateFile(f);
      if (err) { errors.push(err); return false; }
      return true;
    });
    errors.forEach(e => toast(e, 'error'));
    if (valid.length === 0) return;

    if (parentAsset) {
      setFiles([valid[0]]);
    } else {
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name + f.size));
        const newFiles = valid.filter((f) => !existing.has(f.name + f.size));
        if (newFiles.length > 0) {
          setFormData((fd: any) => {
            const updates: any = {};
            if (!fd.title) {
              const baseName = newFiles[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
              const campaignEvent = campaignEvents.find((ev: any) => ev.id === (fd.campaignEventId || campaignEventId));
              const startup = startups.find(s => s.id === fd.startupId);
              updates.title = campaignEvent
                ? `${campaignEvent.title} — ${baseName}`
                : startup ? `${startup.name} — ${baseName}` : baseName;
            }
            const detected = detectMainCategory(newFiles[0].name);
            updates.category = detected;
            updates.subcategory = detectSubcategory(newFiles[0].name);
            return { ...fd, ...updates };
          });
        }
        return [...prev, ...newFiles];
      });
    }
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => addFiles(e.target.files);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) { toast('Please select a file to upload', 'error'); return; }
    if (!formData.title.trim()) { toast('Title is required', 'error'); return; }
    if (!formData.tags.trim()) { toast('At least one tag is required', 'error'); return; }
    if (isAgency && !parentAsset && startups.length > 0 && startupsEnabled && !formData.startupId) {
      toast('Please select a startup / organisation for this asset', 'error'); return;
    }
    if (!parentAsset && !formData.targetDate) {
      toast('Target date is required — set the week this asset is intended for', 'error'); return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      if (parentAsset) {
        const updated = await mediaService.addVariant(parentAsset.id, files[0], formData.title, correctionReplyTo);
        onUpload(updated);
        toast('Variant uploaded successfully!', 'success');
      } else if (files.length === 1) {
        const asset = await mediaService.uploadSingle(files[0], {
          ...formData,
          campaignEventId: campaignEventId || formData.campaignEventId || undefined,
          socialPosting: formData.socialPlatforms.length > 0 ? {
            platforms: formData.socialPlatforms,
            caption: formData.socialCaption,
            hashtags: formData.socialHashtags,
            callToAction: formData.socialCallToAction,
            scheduledDate: formData.socialScheduledDate || null,
          } : undefined,
        } as any, setUploadProgress);
        onUpload(asset);
        toast('Media uploaded successfully!', 'success');
      } else {
        const assets = await mediaService.uploadMultiple(files, {
          category: formData.category,
          subcategory: formData.subcategory,
          visibility: formData.visibility,
        });
        assets.forEach((a) => onUpload(a));
        toast(`${assets.length} files uploaded successfully!`, 'success');
      }
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Upload failed. Please try again.';
      toast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const previews = React.useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  React.useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const getFileType = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={parentAsset ? `Upload Variant for: ${parentAsset.title}` : 'Upload New Media'} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {parentAsset && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
              <img src={parentAsset.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Adding Variant to</p>
              <h4 className="text-sm font-bold text-text truncate">{parentAsset.title}</h4>
              <p className="text-xs text-text-muted">Current Version: v{parentAsset.variants.length + 1}.0</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Next Version</p>
              <p className="text-sm font-black text-primary">v{parentAsset.variants.length + 2}.0</p>
            </div>
          </div>
        )}

        {files.length === 0 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'relative border-2 border-dashed rounded-2xl p-10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer group overflow-hidden',
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-primary/5'
            )}
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text mb-1">Click or drag file to upload</p>
              <p className="text-sm text-text-muted">Images, videos (up to 2 GB), PDFs, PSD, AI, EPS, RAW and more</p>
            </div>
            <input type="file" multiple={!parentAsset} accept={ACCEPTED_INPUT} className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-4">
            <div className={cn(
              'grid gap-3',
              files.length === 1 ? 'grid-cols-1' : files.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            )}>
              {files.map((file, idx) => {
                const type = getFileType(file);
                const previewUrl = previews[idx];
                return (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden border border-border bg-card aspect-video">
                    {type === 'image' && <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />}
                    {type === 'video' && (
                      <video src={previewUrl} className="w-full h-full object-cover" muted playsInline
                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                      />
                    )}
                    {(type === 'pdf' || type === 'other') && (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-primary/5">
                        {type === 'pdf' ? <FileText size={36} className="text-primary" /> : <Layers size={36} className="text-primary" />}
                        <span className="text-xs font-bold text-text-muted uppercase">{file.type.split('/')[1] || 'file'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <button type="button" onClick={() => removeFile(idx)} className="self-end p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-all">
                        <X size={14} />
                      </button>
                      <div>
                        <p className="text-white text-xs font-bold truncate">{file.name}</p>
                        <p className="text-white/60 text-[10px]">{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] font-bold uppercase text-white">
                      {type === 'image' ? <ImageIcon size={10} className="inline mr-1" /> : type === 'video' ? <Film size={10} className="inline mr-1" /> : <FileText size={10} className="inline mr-1" />}
                      {file.type.split('/')[1]?.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
              <div className="flex items-center gap-2">
                {!parentAsset && (
                  <label className="relative cursor-pointer text-xs font-bold text-primary hover:underline">
                    + Add more
                    <input type="file" multiple accept={ACCEPTED_INPUT} className="absolute inset-0 opacity-0 w-0 h-0" onChange={handleFileChange} />
                  </label>
                )}
                <button type="button" onClick={() => setFiles([])} className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Input label="Title *" placeholder="Auto-generated from file name (editable)" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} spellCheck />

          {/* Main Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Category *</label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCat = e.target.value as MainCategory;
                  setFormData({ ...formData, category: newCat, subcategory: '' });
                }}
                className="w-full h-12 bg-background border border-border rounded-xl px-4 pr-10 text-sm text-text outline-none focus:border-primary/50 appearance-none transition-all"
              >
                {MAIN_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
            </div>
          </div>

          {/* Subcategory */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Type *</label>
            <div className="relative">
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full h-12 bg-background border border-border rounded-xl px-4 pr-10 text-sm text-text outline-none focus:border-primary/50 appearance-none transition-all"
              >
                <option value="">Select type...</option>
                {subcategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
            </div>
          </div>

          <Input label="Tags * (comma separated)" placeholder="summer, campaign, 2024" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Visibility</label>
            <div className="relative">
              <select value={formData.visibility} onChange={(e) => setFormData({ ...formData, visibility: e.target.value as MediaVisibility })} className="w-full h-12 bg-background border border-border rounded-xl px-4 pr-10 text-sm text-text outline-none focus:border-primary/50 appearance-none transition-all">
                <option value="Public">Public</option>
                <option value="Team">Team</option>
                <option value="Private">Private</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
            </div>
          </div>

          {isAgency && !parentAsset && startups.length > 0 && startupsEnabled && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Startup / Organisation <span className="text-red-400">*</span>
              </label>
              <StartupSelect
                startups={startups}
                value={formData.startupId}
                onChange={id => setFormData({ ...formData, startupId: id })}
                required
              />
            </div>
          )}

          {isAgency && !parentAsset && formData.startupId && startupsEnabled && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Users size={14} />
                Notify Recipients
              </label>
              <div className="relative">
                <select
                  value={formData.audienceType}
                  onChange={(e) => setFormData({ ...formData, audienceType: e.target.value as AudienceType, specificMemberIds: [] })}
                  className="w-full h-12 bg-background border border-border rounded-xl px-4 pr-10 text-sm text-text outline-none focus:border-primary/50 appearance-none transition-all"
                >
                  <option value="ceo_only">CEO Only</option>
                  <option value="social_media_manager">Social Media Manager</option>
                  <option value="marketing_team">Marketing Team</option>
                  <option value="brand_team">Brand Team</option>
                  <option value="specific">Specific Team Members</option>
                  <option value="everyone">Everyone</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={15} />
              </div>
              <p className="text-[10px] text-text-muted">Choose who will be notified when this asset is uploaded</p>

              {formData.audienceType === 'specific' && teamMembers.length > 0 && (
                <div className="mt-3 p-3 bg-background border border-border rounded-xl space-y-2">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Select Team Members</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {teamMembers.filter(m => m.isActive).map(member => (
                      <label key={member._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.specificMemberIds.includes(member._id!)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, specificMemberIds: [...formData.specificMemberIds, member._id!] });
                            } else {
                              setFormData({ ...formData, specificMemberIds: formData.specificMemberIds.filter(id => id !== member._id) });
                            }
                          }}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{member.name}</p>
                          <p className="text-[10px] text-text-muted">{member.position} • {member.department}</p>
                        </div>
                        <span className="text-[10px] text-text-muted px-2 py-0.5 bg-card rounded-full">{member.notificationPreference}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAgency && !parentAsset && formData.startupId && startupsEnabled && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Share2 size={14} />
                Social Media Posting (Optional)
              </label>
              <div className="p-3 bg-background border border-border rounded-xl space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-text-muted">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'TikTok', 'YouTube'].map(platform => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => {
                          if (formData.socialPlatforms.includes(platform)) {
                            setFormData({ ...formData, socialPlatforms: formData.socialPlatforms.filter(p => p !== platform) });
                          } else {
                            setFormData({ ...formData, socialPlatforms: [...formData.socialPlatforms, platform] });
                          }
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                          formData.socialPlatforms.includes(platform)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-text-muted border-border hover:border-primary/50'
                        )}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.socialPlatforms.length > 0 && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-muted">Caption</label>
                      <textarea
                        placeholder="Write your social media caption..."
                        value={formData.socialCaption}
                        onChange={(e) => setFormData({ ...formData, socialCaption: e.target.value })}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[60px] resize-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Hashtags"
                        placeholder="#brand #marketing"
                        value={formData.socialHashtags}
                        onChange={(e) => setFormData({ ...formData, socialHashtags: e.target.value })}
                      />
                      <Input
                        label="Call to Action"
                        placeholder="Learn More, Shop Now..."
                        value={formData.socialCallToAction}
                        onChange={(e) => setFormData({ ...formData, socialCallToAction: e.target.value })}
                      />
                    </div>
                    <Input
                      label="Scheduled Date (optional)"
                      type="date"
                      value={formData.socialScheduledDate}
                      onChange={(e) => setFormData({ ...formData, socialScheduledDate: e.target.value })}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {isAgency && !parentAsset && !campaignEventId && campaignEvents.length > 0 && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Campaign Event (optional)</label>
              <CampaignEventSelect
                events={campaignEvents}
                value={formData.campaignEventId || ''}
                onChange={id => setFormData({ ...formData, campaignEventId: id })}
              />
            </div>
          )}

          {!parentAsset && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Target Date <span className="text-red-400">*</span> (week this asset is for)
                {propTargetDate && <span className="ml-2 text-primary font-normal normal-case">(set by campaign event)</span>}
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => !propTargetDate && setFormData({ ...formData, targetDate: e.target.value })}
                readOnly={!!propTargetDate}
                required
                className={`w-full h-12 bg-background border border-border rounded-xl px-4 text-sm text-text outline-none focus:border-primary/50 transition-all ${propTargetDate ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              <p className="text-[10px] text-text-muted">Set the week this asset is intended for — helps filter by this week or next week.</p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
          <textarea placeholder="Describe this asset..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} spellCheck className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[100px] resize-none transition-all" />
        </div>

        {isUploading && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className="text-primary flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Uploading to Cloudinary...</span>
              <span className="text-text">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button type="submit" isLoading={isUploading} disabled={files.length === 0}>
            {parentAsset ? 'Upload Variant' : files.length > 1 ? `Upload ${files.length} Files` : 'Complete Upload'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
