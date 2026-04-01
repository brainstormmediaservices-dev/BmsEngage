import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ChartCard } from '../components/cards/ChartCard';
import { Button } from '../components/ui/Button';
import {
  Download, Calendar, Filter, ChevronDown, FileText, Table,
  Image as ImageIcon, Layers, CheckCircle2, AlertCircle, Clock,
  RefreshCw, Building2, Share2, Users, BarChart3, Loader2,
} from 'lucide-react';
import { useState as useS, useEffect as useE } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { startupService, Startup } from '../services/startupService';
import api from '../services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#410179', '#6D28D9', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD'];

type AnalyticsTab = 'work' | 'social' | 'reports';
type Period = 'week' | 'month' | 'custom';

const STATUS_COLORS: Record<string, string> = {
  'Approved':            '#10b981',
  'Corrected':           '#06b6d4',
  'Sent for Correction': '#f97316',
  'In Development':      '#3b82f6',
  'Archived':            '#6b7280',
};

// ── Export helpers ────────────────────────────────────────────────────────────
const addWatermarks = (doc: jsPDF, agencyName: string, agencyLogo?: string) => {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Agency watermark — top
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (agencyLogo) {
    try { doc.addImage(agencyLogo, 'PNG', 10, 6, 20, 10); } catch {}
  }
  doc.text(agencyName || 'Agency', agencyLogo ? 34 : 10, 13);

  // BMS Engage watermark — bottom
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Powered by BMS Engage', w / 2, h - 6, { align: 'center' });
  try { doc.addImage('/logo.png', 'PNG', w / 2 - 30, h - 14, 8, 8); } catch {}
};

const exportCSV = (rows: Record<string, any>[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
  XLSX.writeFile(wb, `${filename}.csv`);
};

const exportExcel = (rows: Record<string, any>[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

const exportPDF = (
  title: string,
  columns: string[],
  rows: (string | number)[][],
  agencyName: string,
  agencyLogo?: string,
  filename?: string,
) => {
  const doc = new jsPDF();
  addWatermarks(doc, agencyName, agencyLogo);
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text(title, 14, 28);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 35);
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [65, 1, 121], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 255] },
  });
  doc.save(`${filename || title}.pdf`);
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AnalyticsTab>('work');
  const [period, setPeriod] = useState<Period>('month');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [startupFilter, setStartupFilter] = useState('all');
  const [startups, setStartups] = useState<Startup[]>([]);
  const [showExport, setShowExport] = useState(false);
  const isAgency = user?.activeContext === 'agency';

  // Work analytics
  const [workData, setWorkData] = useState<any>(null);
  const [workLoading, setWorkLoading] = useState(false);

  // Social analytics
  const [socialData, setSocialData] = useState<any>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const agencyName = user?.agency?.name || 'Agency';
  const agencyLogo = user?.agency?.logo;

  useEffect(() => {
    if (isAgency) startupService.list().then(setStartups).catch(() => {});
  }, [isAgency]);

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {};
    if (period !== 'custom') { p.period = period; }
    else { if (dateFrom) p.from = dateFrom; if (dateTo) p.to = dateTo; }
    if (startupFilter !== 'all') p.startupId = startupFilter;
    return new URLSearchParams(p).toString();
  }, [period, dateFrom, dateTo, startupFilter]);

  const loadWork = useCallback(async () => {
    setWorkLoading(true);
    try {
      const { data } = await api.get(`/analytics/work?${buildParams()}`);
      setWorkData(data);
    } catch { setWorkData(null); }
    finally { setWorkLoading(false); }
  }, [buildParams]);

  const loadSocial = useCallback(async () => {
    setSocialLoading(true);
    try {
      const { data } = await api.get('/analytics/social');
      setSocialData(data);
    } catch { setSocialData(null); }
    finally { setSocialLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'work' || tab === 'reports') loadWork();
    if (tab === 'social' || tab === 'reports') loadSocial();
  }, [tab, loadWork, loadSocial]);

  // ── Export handlers ─────────────────────────────────────────────────────────
  const handleExport = (fmt: 'csv' | 'excel' | 'pdf') => {
    setShowExport(false);
    if (tab === 'work' && workData) {
      const rows = (workData.assets || []).map((a: any) => ({
        Title: a.title, Category: a.category, Status: a.status,
        'Uploaded By': a.uploadedBy, Versions: a.variantCount,
        Comments: a.commentCount, Revisions: a.correctionCount,
        'Created At': a.createdAt ? format(new Date(a.createdAt), 'PPP') : '',
      }));
      if (fmt === 'csv') exportCSV(rows, 'work-analytics');
      else if (fmt === 'excel') exportExcel(rows, 'work-analytics');
      else exportPDF('Work Analytics', ['Title','Category','Status','Uploaded By','Versions','Comments'],
        rows.map(r => [r.Title, r.Category, r.Status, r['Uploaded By'], r.Versions, r.Comments]),
        agencyName, agencyLogo, 'work-analytics');
    } else if (tab === 'social' && socialData) {
      const rows = (socialData.posts || []).map((p: any) => ({
        Content: p.content?.slice(0, 80), Platforms: (p.platforms || []).join(', '),
        Status: p.status, Scheduled: p.scheduledTime ? format(new Date(p.scheduledTime), 'PPP') : '',
      }));
      if (fmt === 'csv') exportCSV(rows, 'social-analytics');
      else if (fmt === 'excel') exportExcel(rows, 'social-analytics');
      else exportPDF('Social Analytics', ['Content','Platforms','Status','Scheduled'],
        rows.map(r => [r.Content, r.Platforms, r.Status, r.Scheduled]),
        agencyName, agencyLogo, 'social-analytics');
    } else if (tab === 'reports') {
      // Combined report
      const workRows = (workData?.assets || []).map((a: any) => ({
        Type: 'Asset', Name: a.title, Status: a.status, Detail: a.category,
        Date: a.createdAt ? format(new Date(a.createdAt), 'PPP') : '',
      }));
      const socialRows = (socialData?.posts || []).map((p: any) => ({
        Type: 'Post', Name: p.content?.slice(0, 60), Status: p.status,
        Detail: (p.platforms || []).join(', '),
        Date: p.scheduledTime ? format(new Date(p.scheduledTime), 'PPP') : '',
      }));
      const combined = [...workRows, ...socialRows];
      if (fmt === 'csv') exportCSV(combined, 'full-report');
      else if (fmt === 'excel') exportExcel(combined, 'full-report');
      else exportPDF('Full Analytics Report', ['Type','Name','Status','Detail','Date'],
        combined.map(r => [r.Type, r.Name, r.Status, r.Detail, r.Date]),
        agencyName, agencyLogo, 'full-report');
    }
  };

  const statusChartData = workData
    ? Object.entries(workData.byStatus || {}).map(([name, value]) => ({ name, value }))
    : [];

  const categoryChartData = workData
    ? Object.entries(workData.byCategory || {}).map(([name, value]) => ({ name, value }))
    : [];

  const platformChartData = socialData
    ? (socialData.byPlatform || []).map((p: any) => ({
        name: p.platform, published: p.posts, scheduled: p.scheduled, drafts: p.drafts,
      }))
    : [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-text mb-1">Analytics</h1>
          <p className="text-sm text-text-muted">Track your agency's work output and social media performance.</p>
        </div>
        <div className="relative">
          <Button variant="outline" className="h-10 rounded-xl font-bold" onClick={() => setShowExport(v => !v)}>
            <Download size={16} className="mr-2" /> Export
          </Button>
          <AnimatePresence>
            {showExport && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 mt-2 w-48 glass border border-white/10 rounded-xl p-2 z-50 shadow-2xl">
                {[['csv','CSV',Table],['excel','Excel',FileText],['pdf','PDF',FileText]].map(([fmt, label, Icon]: any) => (
                  <button key={fmt} onClick={() => handleExport(fmt as any)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-text-muted hover:text-text hover:bg-white/5 transition-all">
                    <Icon size={14} /> Export as {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        {([['work','Work',Layers],['social','Social',Share2],['reports','Reports',BarChart3]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all',
              tab === t ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text')}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Filters — shown for work and reports tabs */}
      {(tab === 'work' || tab === 'reports') && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(['week','month','custom'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                  period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="h-9 bg-card border border-border rounded-xl px-3 text-xs text-text outline-none focus:border-primary/50" />
              <span className="text-text-muted text-xs">–</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="h-9 bg-card border border-border rounded-xl px-3 text-xs text-text outline-none focus:border-primary/50" />
            </div>
          )}
          {isAgency && startups.length > 0 && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <select value={startupFilter} onChange={e => setStartupFilter(e.target.value)}
                className="h-9 bg-card border border-border rounded-xl pl-8 pr-8 text-xs text-text outline-none focus:border-primary/50 appearance-none">
                <option value="all">All Startups</option>
                {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={12} />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={loadWork} className="h-9 rounded-xl">
            <RefreshCw size={13} className={cn('mr-1.5', workLoading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      )}

      {/* ── WORK TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'work' && (
        <div className="space-y-6">
          {workLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
          ) : workData ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Total Assets', value: workData.summary.total, color: 'text-text', bg: 'bg-white/5' },
                  { label: 'Approved', value: workData.summary.approved, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'In Development', value: workData.summary.inDevelopment, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'For Correction', value: workData.summary.sentForCorrection, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                  { label: 'Corrected', value: workData.summary.corrected, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                ].map(s => (
                  <div key={s.label} className={cn('p-4 rounded-2xl border border-white/10', s.bg)}>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Assets by Status" subtitle="Workflow distribution">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={6} dataKey="value">
                        {statusChartData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Assets by Category" subtitle="Content type breakdown">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#410179" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              {/* Asset table */}
              <div className="glass border border-white/10 rounded-[24px] overflow-hidden">
                <div className="p-5 border-b border-white/5">
                  <h3 className="font-black text-lg text-text">Asset Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/5">
                      <tr>{['Title','Category','Status','Uploaded By','Versions','Comments','Revisions','Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-widest text-[9px]">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {(workData.assets || []).map((a: any) => (
                        <tr key={a.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-3 font-bold text-text truncate max-w-[160px]">{a.title}</td>
                          <td className="px-4 py-3 text-text-muted">{a.category}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                              style={{ backgroundColor: (STATUS_COLORS[a.status] || '#6b7280') + '20', color: STATUS_COLORS[a.status] || '#6b7280' }}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{a.uploadedBy}</td>
                          <td className="px-4 py-3 text-center text-text">{a.variantCount + 1}</td>
                          <td className="px-4 py-3 text-center text-text">{a.commentCount}</td>
                          <td className="px-4 py-3 text-center text-text">{a.correctionCount}</td>
                          <td className="px-4 py-3 text-text-muted">{a.createdAt ? format(new Date(a.createdAt), 'MMM d, yyyy') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(workData.assets || []).length === 0 && (
                    <div className="py-12 text-center text-text-muted text-sm">No assets found for this period.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-text-muted">Failed to load work analytics.</div>
          )}
        </div>
      )}

      {/* ── SOCIAL TAB ───────────────────────────────────────────────────────── */}
      {tab === 'social' && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={loadSocial} className="h-9 rounded-xl">
              <RefreshCw size={13} className={cn('mr-1.5', socialLoading && 'animate-spin')} /> Refresh
            </Button>
          </div>
          {socialLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
          ) : socialData ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Connected Accounts', value: socialData.summary.totalAccounts, color: 'text-primary' },
                  { label: 'Published Posts', value: socialData.summary.totalPosts, color: 'text-emerald-500' },
                  { label: 'Scheduled', value: socialData.summary.totalScheduled, color: 'text-blue-400' },
                  { label: 'Drafts', value: socialData.summary.totalDrafts, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="p-4 glass border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{s.label}</p>
                    <p className={cn('text-2xl font-black', s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Connected accounts */}
              <div className="glass border border-white/10 rounded-[24px] p-5 space-y-3">
                <h3 className="font-black text-base text-text">Connected Accounts</h3>
                {(socialData.accounts || []).length === 0 ? (
                  <p className="text-sm text-text-muted">No connected accounts. <a href="/social-accounts" className="text-primary underline">Connect accounts →</a></p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(socialData.accounts || []).map((acc: any) => (
                      <div key={acc.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                        {acc.avatar ? <img src={acc.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" /> : (
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm">{acc.platform[0].toUpperCase()}</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-text capitalize">{acc.platform}</p>
                          <p className="text-[10px] text-text-muted truncate">{acc.displayName || acc.username}</p>
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Platform chart */}
              {platformChartData.length > 0 && (
                <ChartCard title="Posts by Platform" subtitle="Published, scheduled, and draft breakdown">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="published" fill="#10b981" radius={[4,4,0,0]} name="Published" />
                      <Bar dataKey="scheduled" fill="#410179" radius={[4,4,0,0]} name="Scheduled" />
                      <Bar dataKey="drafts" fill="#f59e0b" radius={[4,4,0,0]} name="Drafts" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {/* Posts table */}
              <div className="glass border border-white/10 rounded-[24px] overflow-hidden">
                <div className="p-5 border-b border-white/5"><h3 className="font-black text-base text-text">Post History</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/5">
                      <tr>{['Content','Platforms','Status','Scheduled / Published'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-black text-text-muted uppercase tracking-widest text-[9px]">{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {(socialData.posts || []).map((p: any) => (
                        <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-text max-w-[200px] truncate">{p.content}</td>
                          <td className="px-4 py-3 text-text-muted capitalize">{(p.platforms || []).join(', ')}</td>
                          <td className="px-4 py-3">
                            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-black uppercase',
                              p.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' :
                              p.status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-400'
                            )}>{p.status}</span>
                          </td>
                          <td className="px-4 py-3 text-text-muted">
                            {p.scheduledTime ? format(new Date(p.scheduledTime), 'MMM d, yyyy h:mm a') :
                             p.publishedAt ? format(new Date(p.publishedAt), 'MMM d, yyyy') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(socialData.posts || []).length === 0 && (
                    <div className="py-12 text-center text-text-muted text-sm">No posts yet.</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-text-muted">Failed to load social analytics.</div>
          )}
        </div>
      )}

      {/* ── REPORTS TAB ──────────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="space-y-6">
          {(workLoading || socialLoading) ? (
            <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Work summary */}
                <div className="glass border border-white/10 rounded-[24px] p-6 space-y-4">
                  <h3 className="font-black text-base text-text flex items-center gap-2"><Layers size={16} className="text-primary" /> Work Summary</h3>
                  {workData ? (
                    <div className="space-y-2">
                      {Object.entries(workData.byStatus || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-xs font-bold text-text">{status}</span>
                          <span className="text-xs font-black" style={{ color: STATUS_COLORS[status] || '#fff' }}>{count as number}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 font-black">
                        <span className="text-xs text-text">Total Assets</span>
                        <span className="text-xs text-primary">{workData.summary.total}</span>
                      </div>
                    </div>
                  ) : <p className="text-sm text-text-muted">No work data.</p>}
                </div>

                {/* Social summary */}
                <div className="glass border border-white/10 rounded-[24px] p-6 space-y-4">
                  <h3 className="font-black text-base text-text flex items-center gap-2"><Share2 size={16} className="text-primary" /> Social Summary</h3>
                  {socialData ? (
                    <div className="space-y-2">
                      {[
                        ['Connected Accounts', socialData.summary.totalAccounts],
                        ['Published Posts', socialData.summary.totalPosts],
                        ['Scheduled Posts', socialData.summary.totalScheduled],
                        ['Draft Posts', socialData.summary.totalDrafts],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-xs font-bold text-text">{label}</span>
                          <span className="text-xs font-black text-primary">{val}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-text-muted">No social data.</p>}
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl text-xs text-text-muted">
                Reports include data from both Work and Social tabs. Use the Export button above to download as CSV, Excel, or PDF with agency and BMS Engage watermarks.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
