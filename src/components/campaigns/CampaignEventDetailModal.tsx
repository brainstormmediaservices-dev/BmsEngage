import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Calendar, Tag, Globe, RefreshCw, Plus, Loader2, Trash2,
  Image as ImageIcon, Flag, Clock, CheckCircle2, FileText,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import {
  CampaignEvent, EventTemplate, ScheduledCampaign,
  eventTemplateService, scheduledCampaignService,
} from '../../services/campaignEventService';
import { mediaService } from '../../services/mediaService';
import { MediaAsset } from '../../types/media';
import { EventTemplateCard } from './EventTemplateCard';
import { CampaignSchedulerModal } from './CampaignSchedulerModal';
import { UploadMediaModal } from '../gallery/UploadMediaModal';
import { AssetDetailModal } from '../gallery/AssetDetailModal';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'overview' | 'templates' | 'campaigns' | 'assets';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-500/10 text-amber-400',
  scheduled: 'bg-primary/10 text-primary',
  published: 'bg-emerald-500/10 text-emerald-500',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: CampaignEvent | null;
}

export const CampaignEventDetailModal = ({ isOpen, onClose, event }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const EXECUTIVE_ROLES = ['owner', 'ceo', 'coo', 'creative_director', 'head_of_production'];
  const isExecutive = EXECUTIVE_ROLES.includes(user?.agencyRole || '');
  const [tab, setTab] = React.useState<Tab>('overview');
  const [templates, setTemplates] = React.useState<EventTemplate[]>([]);
  const [campaigns, setCampaigns] = React.useState<ScheduledCampaign[]>([]);
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [schedulerOpen, setSchedulerOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EventTemplate | null>(null);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [viewAsset, setViewAsset] = React.useState<MediaAsset | null>(null);
  const [newTemplateText, setNewTemplateText] = React.useState('');
  const [addingTemplate, setAddingTemplate] = React.useState(false);
  const [showAddTemplate, setShowAddTemplate] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen || !event) return;
    setTab('overview');
    loadAll();
  }, [isOpen, event?.id]);

  const loadAll = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const [tmpl, camp, med] = await Promise.all([
        eventTemplateService.list(event.id),
        scheduledCampaignService.list({ eventId: event.id }),
        mediaService.getMedia(),
      ]);
      setTemplates(tmpl);
      setCampaigns(camp);
      setAssets(med.filter(a => (a as any).campaignEventId === event.id));
    } catch { toast('Failed to load event data', 'error'); }
    finally { setLoading(false); }
  };

  const handleUseTemplate = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setSchedulerOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await eventTemplateService.remove(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast('Template deleted', 'success');
    } catch { toast('Failed to delete template', 'error'); }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await scheduledCampaignService.remove(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast('Campaign deleted', 'success');
    } catch { toast('Failed to delete campaign', 'error'); }
  };

  const handleAddTemplate = async () => {
    if (!event || !newTemplateText.trim()) return;
    setAddingTemplate(true);
    try {
      const t = await eventTemplateService.create({ eventId: event.id, templateText: newTemplateText.trim(), platform: 'all', contentType: 'post' });
      setTemplates(prev => [t, ...prev]);
      setNewTemplateText('');
      setShowAddTemplate(false);
      toast('Template added', 'success');
    } catch { toast('Failed to add template', 'error'); }
    finally { setAddingTemplate(false); }
  };

  if (!event) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <Flag size={13} /> },
    { id: 'templates', label: 'Templates', icon: <FileText size={13} />, count: templates.length },
    { id: 'campaigns', label: 'Campaigns', icon: <Calendar size={13} />, count: campaigns.length },
    { id: 'assets', label: 'Assets', icon: <ImageIcon size={13} />, count: assets.length },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={event.title} maxWidth="max-w-4xl">
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn('shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all',
                  tab === t.id ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text')}>
                {t.icon} {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black',
                    tab === t.id ? 'bg-white/20' : 'bg-primary/10 text-primary')}>{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {loading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>}

          {/* Overview */}
          {!loading && tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Date', value: format(new Date(event.date), 'PPP'), icon: <Calendar size={14} /> },
                  { label: 'Category', value: event.category, icon: <Flag size={14} /> },
                  { label: 'Region', value: event.region, icon: <Globe size={14} /> },
                  { label: 'Recurrence', value: event.recurrence, icon: <RefreshCw size={14} /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-primary">{item.icon}</span>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-bold text-text capitalize">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-full text-[10px] font-bold text-primary">
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>
              )}
              <Button onClick={() => { setSelectedTemplate(null); setSchedulerOpen(true); }} className="w-full sm:w-auto shadow-lg shadow-primary/30">
                <Plus size={14} className="mr-2" /> Create Campaign for this Event
              </Button>
            </div>
          )}

          {/* Templates */}
          {!loading && tab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">Templates help you quickly create campaigns for this event.</p>
                {isExecutive && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddTemplate(v => !v)} className="h-8">
                    <Plus size={13} className="mr-1" /> Add Template
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {showAddTemplate && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <textarea value={newTemplateText} onChange={e => setNewTemplateText(e.target.value)} spellCheck
                      placeholder="Write your template text…"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[80px] resize-none transition-all" />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowAddTemplate(false)} className="flex-1 h-9">Cancel</Button>
                      <Button onClick={handleAddTemplate} isLoading={addingTemplate} className="flex-1 h-9">Save Template</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {templates.length === 0 ? (
                <div className="py-10 text-center text-text-muted text-sm">No templates yet. Add one above.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {templates.map(t => <EventTemplateCard key={t.id} template={t} onUse={isExecutive ? handleUseTemplate : () => {}} onDelete={isExecutive ? handleDeleteTemplate : undefined} />)}
                </div>
              )}
            </div>
          )}

          {/* Campaigns */}
          {!loading && tab === 'campaigns' && (
            <div className="space-y-3">
              {isExecutive && (
                <Button onClick={() => { setSelectedTemplate(null); setSchedulerOpen(true); }} className="w-full sm:w-auto shadow-lg shadow-primary/30">
                  <Plus size={14} className="mr-2" /> New Campaign
                </Button>
              )}
              {campaigns.length === 0 ? (
                <div className="py-10 text-center text-text-muted text-sm">No campaigns yet.</div>
              ) : campaigns.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-3 p-4 glass border border-white/10 rounded-xl hover:border-primary/30 transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase', STATUS_COLORS[c.status])}>{c.status}</span>
                      {c.scheduledDate && (
                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                          <Clock size={10} /> {format(new Date(c.scheduledDate), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text line-clamp-2">{c.caption || '(no caption)'}</p>
                    {c.platforms.length > 0 && (
                      <p className="text-[10px] text-text-muted mt-1 capitalize">{c.platforms.join(', ')}</p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteCampaign(c.id)}
                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Assets */}
          {!loading && tab === 'assets' && (
            <div className="space-y-4">
              <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto shadow-lg shadow-primary/30">
                <Plus size={14} className="mr-2" /> Upload Asset for this Event
              </Button>
              {assets.length === 0 ? (
                <div className="py-10 text-center text-text-muted text-sm">No assets linked to this event yet.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {assets.map(a => (
                    <button key={a.id} onClick={() => setViewAsset(a)}
                      className="relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all group">
                      {a.metadata?.mimeType?.startsWith('video/')
                        ? <video src={a.url} className="w-full h-full object-cover" muted />
                        : <img src={a.url} alt={a.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      }
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-[9px] font-bold text-white truncate">{a.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Campaign Scheduler */}
      <CampaignSchedulerModal
        isOpen={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        event={event}
        templateId={selectedTemplate?.id}
        initialCaption={selectedTemplate?.templateText || ''}
        onSaved={c => { setCampaigns(prev => [c, ...prev]); setTab('campaigns'); }}
      />

      {/* Upload Asset */}
      <UploadMediaModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={a => { setAssets(prev => [a, ...prev]); }}
        campaignEventId={event.id}
        targetDate={event.date ? event.date.split('T')[0] : ''}
      />

      {/* View Asset */}
      <AssetDetailModal
        isOpen={!!viewAsset}
        onClose={() => setViewAsset(null)}
        asset={viewAsset}
        onEdit={() => {}}
        onDownload={() => {}}
        onShare={() => {}}
        onAssetUpdate={u => setAssets(prev => prev.map(a => a.id === u.id ? u : a))}
      />
    </>
  );
};
