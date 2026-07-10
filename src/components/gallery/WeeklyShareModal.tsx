import * as React from 'react';
import {
  MessageCircle, Building2, Check, CheckCircle2, Search, Send, Copy,
  Loader2, ChevronDown, Eye, History, Calendar, Edit2,
} from 'lucide-react';
import { MediaAsset, ShareLogEntry } from '../../types/media';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { Startup } from '../../services/startupService';
import { recordShareLog, getShareLog } from '../../services/mediaService';
import { Modal } from '../ui/Modal';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface WeeklyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MediaAsset[];
  startups: Startup[];
}

type ShareStep = 'select_startup' | 'select_assets' | 'preview' | 'history';

const WEEK_RANGES = [
  { label: 'This Week', value: 'this_week' },
  { label: 'Last Week', value: 'last_week' },
  { label: 'This Month', value: 'this_month' },
];

function getWeekRange(value: string): { start: Date; end: Date } {
  const now = new Date();
  if (value === 'this_week') {
    return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  }
  if (value === 'last_week') {
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    return { start: startOfWeek(lastWeek, { weekStartsOn: 1 }), end: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
  }
  // this month
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
}

function buildWeeklyMessage(startupName: string, ceoName: string, assets: MediaAsset[]): string {
  const lines: string[] = [
    `Hello ${ceoName},`,
    '',
    `Here are your BMS assets for this week.`,
    '',
    `Startup: *${startupName}*`,
    '',
    `This week's assets include:`,
    '',
  ];
  assets.forEach((a, i) => {
    lines.push(`${i + 1}. *${a.title}*`);
    if (a.description) lines.push(`   ${a.description}`);
    lines.push('');
  });
  lines.push(
    'Please review each asset and let us know if any revisions or adjustments are required.',
    '',
    "We're always happy to make improvements before final approval.",
    '',
    'Thank you for choosing BMS.',
    '',
    'Best regards,',
    '*BMS Team*',
  );
  return lines.join('\n');
}

function buildIndividualMessage(asset: MediaAsset, startupName: string, ceoName: string): string {
  const lines: string[] = [
    `For Startup: *${startupName}*`,
    '',
    `CEO: *${ceoName}*`,
    '',
    `FEATURE: *${asset.title}*`,
    '',
    'Description:',
    asset.description || 'No description provided.',
    '',
    '---',
  ];
  return lines.join('\n');
}

function buildFullIndividualMessage(assets: MediaAsset[], startupName: string, ceoName: string): string {
  const blocks = assets.map(a => buildIndividualMessage(a, startupName, ceoName));
  blocks.push(
    'Please review these assets at your convenience. If you have any questions or would like revisions, kindly let us know.',
    '',
    'Thank you,',
    '*BMS Team*',
  );
  return blocks.join('\n');
}

export const WeeklyShareModal = ({ isOpen, onClose, assets, startups }: WeeklyShareModalProps) => {
  const [step, setStep] = React.useState<ShareStep>('select_startup');
  const [selectedStartup, setSelectedStartup] = React.useState<Startup | null>(null);
  const [shareMode, setShareMode] = React.useState<'weekly' | 'select'>('weekly');
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<Set<string>>(new Set());
  const [weekRange, setWeekRange] = React.useState('this_week');
  const [assetSearch, setAssetSearch] = React.useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = React.useState('All');
  const [message, setMessage] = React.useState('');
  const [messageEdited, setMessageEdited] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [shareHistory, setShareHistory] = React.useState<ShareLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [historyStartupFilter, setHistoryStartupFilter] = React.useState('all');
  const { toast } = useToast();
  const { user } = useAuth();

  // Startups with valid WhatsApp
  const shareableStartups = React.useMemo(
    () => startups.filter(s => s.whatsapp && s.whatsapp.trim().length > 0),
    [startups]
  );

  // Weekly assets for selected startup
  const weeklyAssets = React.useMemo(() => {
    if (!selectedStartup) return [];
    const { start, end } = getWeekRange(weekRange);
    return assets.filter(a => {
      if (a.startupId !== selectedStartup.id) return false;
      const d = a.targetDate ? new Date(a.targetDate) : new Date(a.metadata.createdDate);
      return d >= start && d <= end;
    });
  }, [assets, selectedStartup, weekRange]);

  // All assets for selected startup (for manual selection)
  const allStartupAssets = React.useMemo(() => {
    if (!selectedStartup) return [];
    return assets.filter(a => a.startupId === selectedStartup.id);
  }, [assets, selectedStartup]);

  // Filtered assets for manual selection
  const filteredAssets = React.useMemo(() => {
    const source = allStartupAssets;
    return source.filter(a => {
      const matchesSearch = !assetSearch || a.title.toLowerCase().includes(assetSearch.toLowerCase()) ||
        a.tags.some(t => t.toLowerCase().includes(assetSearch.toLowerCase()));
      const matchesCategory = assetCategoryFilter === 'All' || a.category === assetCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allStartupAssets, assetSearch, assetCategoryFilter]);

  // Active assets based on mode
  const activeAssets = React.useMemo(() => {
    if (shareMode === 'weekly') return weeklyAssets;
    return allStartupAssets.filter(a => selectedAssetIds.has(a.id));
  }, [shareMode, weeklyAssets, allStartupAssets, selectedAssetIds]);

  // Auto-generate message
  React.useEffect(() => {
    if (messageEdited) return;
    if (!selectedStartup || activeAssets.length === 0) { setMessage(''); return; }
    const msg = shareMode === 'weekly'
      ? buildWeeklyMessage(selectedStartup.name, user?.name || 'Team', activeAssets)
      : buildFullIndividualMessage(activeAssets, selectedStartup.name, user?.name || 'Team');
    setMessage(msg);
  }, [selectedStartup, activeAssets, shareMode, messageEdited, user?.name]);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('select_startup');
      setSelectedStartup(null);
      setShareMode('weekly');
      setSelectedAssetIds(new Set());
      setMessage('');
      setMessageEdited(false);
      setCopied(false);
      setAssetSearch('');
      setAssetCategoryFilter('All');
    }
  }, [isOpen]);

  const handleSelectStartup = (s: Startup) => {
    setSelectedStartup(s);
    setSelectedAssetIds(new Set());
    setMessageEdited(false);
    setStep('select_assets');
  };

  const handleToggleAsset = (id: string) => {
    setSelectedAssetIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
  };

  const handleDeselectAll = () => {
    setSelectedAssetIds(new Set());
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast('Message copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch { toast('Failed to copy', 'error'); }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedStartup || activeAssets.length === 0) return;
    setSending(true);
    try {
      // Record share log
      await recordShareLog({
        startupId: selectedStartup.id,
        startupName: selectedStartup.name,
        ceoName: user?.name || 'Team',
        whatsapp: selectedStartup.whatsapp,
        assetIds: activeAssets.map(a => a.id),
        assetTitles: activeAssets.map(a => a.title),
        message,
        method: 'whatsapp',
      });

      // Open WhatsApp
      const phone = selectedStartup.whatsapp.replace(/\D/g, '');
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      toast('WhatsApp opened with message', 'success');
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to send', 'error');
    } finally { setSending(false); }
  };

  const handleLoadHistory = async () => {
    setLoadingHistory(true);
    try {
      const logs = await getShareLog(historyStartupFilter === 'all' ? undefined : historyStartupFilter);
      setShareHistory(logs);
    } catch { toast('Failed to load share history', 'error'); }
    finally { setLoadingHistory(false); }
  };

  React.useEffect(() => {
    if (step === 'history') handleLoadHistory();
  }, [step, historyStartupFilter]);

  const categories = ['All', ...new Set(assets.map(a => a.category))];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Assets via WhatsApp" maxWidth="max-w-2xl">
      <div className="space-y-5">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {([
            { key: 'select_startup' as ShareStep, label: 'Startup' },
            { key: 'select_assets' as ShareStep, label: 'Assets' },
            { key: 'preview' as ShareStep, label: 'Preview' },
            { key: 'history' as ShareStep, label: 'History' },
          ]).map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <div className="flex-1 h-px bg-border" />}
              <button onClick={() => {
                if (s.key === 'history') { setStep('history'); return; }
                if (s.key === 'select_startup') { setStep('select_startup'); return; }
                if (selectedStartup) setStep(s.key);
              }}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0',
                  step === s.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text hover:bg-white/5'
                )}>
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">{i + 1}</span>
                {s.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Select Startup */}
        {step === 'select_startup' && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">Select a startup to share assets with. Only startups with a WhatsApp number are shown.</p>
            {shareableStartups.length === 0 ? (
              <div className="py-12 text-center">
                <Building2 size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-text-muted">No startups with WhatsApp numbers found.</p>
                <p className="text-xs text-text-muted mt-1">Add a WhatsApp number in Startups settings.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {shareableStartups.map(s => {
                  const assetCount = assets.filter(a => a.startupId === s.id).length;
                  const weeklyCount = (() => {
                    const { start, end } = getWeekRange('this_week');
                    return assets.filter(a => {
                      if (a.startupId !== s.id) return false;
                      const d = a.targetDate ? new Date(a.targetDate) : new Date(a.metadata.createdDate);
                      return d >= start && d <= end;
                    }).length;
                  })();
                  return (
                    <button key={s.id} onClick={() => handleSelectStartup(s)}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {s.logo
                          ? <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                          : <Building2 size={20} className="text-primary" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate">{s.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                            <MessageCircle size={10} /> {s.whatsapp}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-primary">{weeklyCount}</p>
                        <p className="text-[9px] text-text-muted uppercase tracking-widest">this week</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{assetCount} total</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Assets */}
        {step === 'select_assets' && selectedStartup && (
          <div className="space-y-3">
            {/* Startup info */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {selectedStartup.logo
                  ? <img src={selectedStartup.logo} alt="" className="w-full h-full object-cover" />
                  : <Building2 size={14} className="text-primary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary">{selectedStartup.name}</p>
                <p className="text-[10px] text-text-muted">{selectedStartup.whatsapp}</p>
              </div>
              <button onClick={() => { setStep('select_startup'); setSelectedStartup(null); }}
                className="text-xs text-text-muted hover:text-text transition-colors">Change</button>
            </div>

            {/* Share mode toggle */}
            <div className="flex gap-2">
              <button onClick={() => setShareMode('weekly')}
                className={cn('flex-1 p-3 rounded-xl border text-left transition-all',
                  shareMode === 'weekly' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                )}>
                <p className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary" /> Share Weekly Assets
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">Auto-include all assets this week ({weeklyAssets.length})</p>
              </button>
              <button onClick={() => setShareMode('select')}
                className={cn('flex-1 p-3 rounded-xl border text-left transition-all',
                  shareMode === 'select' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                )}>
                <p className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Eye size={12} className="text-primary" /> Select Specific Assets
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">Manually choose assets ({allStartupAssets.length} available)</p>
              </button>
            </div>

            {/* Week range selector (for weekly mode) */}
            {shareMode === 'weekly' && (
              <div className="flex gap-2">
                {WEEK_RANGES.map(r => (
                  <button key={r.value} onClick={() => setWeekRange(r.value)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                      weekRange === r.value ? 'bg-primary text-white' : 'bg-white/5 text-text-muted hover:bg-white/10'
                    )}>
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Asset list (for select mode) */}
            {shareMode === 'select' && (
              <div className="space-y-2">
                {/* Search and filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input type="text" value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
                      placeholder="Search assets..."
                      className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-lg text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50" />
                  </div>
                  <select value={assetCategoryFilter} onChange={e => setAssetCategoryFilter(e.target.value)}
                    className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-xs text-text appearance-none outline-none focus:border-primary/50">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {/* Select all / deselect */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    {selectedAssetIds.size} selected
                  </span>
                  <div className="flex gap-2">
                    <button onClick={handleSelectAll} className="text-[10px] text-primary font-bold hover:underline">Select All</button>
                    <button onClick={handleDeselectAll} className="text-[10px] text-text-muted font-bold hover:underline">Clear</button>
                  </div>
                </div>
                {/* Asset grid */}
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {filteredAssets.length === 0 ? (
                    <p className="text-xs text-text-muted py-6 text-center">No assets found</p>
                  ) : filteredAssets.map(a => {
                    const isSelected = selectedAssetIds.has(a.id);
                    return (
                      <button key={a.id} onClick={() => handleToggleAsset(a.id)}
                        className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all',
                          isSelected ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                        )}>
                        <div className={cn('w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected ? 'bg-primary border-primary' : 'border-white/20'
                        )}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/20 shrink-0">
                          {a.metadata?.mimeType?.startsWith('video/')
                            ? <video src={a.url} className="w-full h-full object-cover" muted />
                            : <img src={a.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-text truncate">{a.title}</p>
                          <p className="text-[10px] text-text-muted">{a.category} &middot; {a.metadata.fileType}</p>
                        </div>
                        <p className="text-[10px] text-text-muted shrink-0">
                          {new Date(a.metadata.createdDate).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active assets summary */}
            {activeAssets.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs font-bold text-text">{activeAssets.length} asset{activeAssets.length !== 1 ? 's' : ''} selected</span>
                <button onClick={() => setStep('preview')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
                  Preview Message <ChevronDown size={14} className="rotate-[-90deg]" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview Message */}
        {step === 'preview' && selectedStartup && (
          <div className="space-y-4">
            {/* Startup info */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {selectedStartup.logo
                  ? <img src={selectedStartup.logo} alt="" className="w-full h-full object-cover" />
                  : <Building2 size={14} className="text-primary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary">{selectedStartup.name}</p>
                <p className="text-[10px] text-text-muted">{selectedStartup.whatsapp} &middot; {activeAssets.length} assets</p>
              </div>
              <button onClick={() => setStep('select_assets')}
                className="text-xs text-text-muted hover:text-text transition-colors flex items-center gap-1">
                <Edit2 size={11} /> Edit
              </button>
            </div>

            {/* Message preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Message Preview</label>
                <button onClick={() => setMessageEdited(false)}
                  className="text-[10px] text-primary font-bold hover:underline">Reset to default</button>
              </div>
              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value); setMessageEdited(true); }}
                spellCheck
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[300px] resize-none font-mono leading-relaxed transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleCopyMessage}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-text rounded-xl text-xs font-bold transition-all">
                {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy Message'}
              </button>
              <button onClick={handleSendWhatsApp} disabled={sending || !selectedStartup.whatsapp}
                className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                {sending ? 'Sending...' : 'Open in WhatsApp'}
              </button>
            </div>
            <button onClick={handleSendWhatsApp} disabled={sending || !selectedStartup.whatsapp}
              className="w-full flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? 'Recording & Sending...' : 'Record & Send via WhatsApp'}
            </button>
          </div>
        )}

        {/* Step 4: Share History */}
        {step === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select value={historyStartupFilter} onChange={e => setHistoryStartupFilter(e.target.value)}
                className="h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-xs text-text appearance-none outline-none focus:border-primary/50">
                <option value="all">All Startups</option>
                {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={handleLoadHistory} disabled={loadingHistory}
                className="h-9 px-3 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all disabled:opacity-40">
                {loadingHistory ? <Loader2 size={12} className="animate-spin" /> : 'Refresh'}
              </button>
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : shareHistory.length === 0 ? (
              <div className="py-12 text-center">
                <History size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-text-muted">No share history yet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {shareHistory.map((log, i) => (
                  <div key={log._id || i} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-text">{log.startupName || 'Unknown'}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase">
                            {log.method}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted">
                          {log.assetTitles?.length || 0} asset{(log.assetTitles?.length || 0) !== 1 ? 's' : ''} shared
                        </p>
                        {log.assetTitles && log.assetTitles.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {log.assetTitles.slice(0, 3).map((t, j) => (
                              <p key={j} className="text-[10px] text-text-muted flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-primary shrink-0" /> {t}
                              </p>
                            ))}
                            {log.assetTitles.length > 3 && (
                              <p className="text-[10px] text-text-muted">+{log.assetTitles.length - 3} more</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-text-muted">{log.sharedBy}</p>
                        <p className="text-[9px] text-text-muted mt-0.5">
                          {log.sharedAt ? new Date(log.sharedAt).toLocaleDateString() : ''}
                          {' '}
                          {log.sharedAt ? new Date(log.sharedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
