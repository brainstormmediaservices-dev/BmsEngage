import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, CheckCircle2, XCircle, Clock, ShieldAlert, Search, RefreshCw,
  Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Shield,
  LayoutDashboard, Image as ImageIcon, Share2, PenTool, Calendar,
  BarChart3, Bell, Settings as SettingsIcon, Globe,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { cn } from '../../lib/utils';
import * as adminService from '../../services/adminService';
import type { AdminUser, AdminStats, NavFeatures } from '../../services/adminService';
// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',    color: 'bg-emerald-500/10 text-emerald-500' },
  pending:   { label: 'Pending',   color: 'bg-amber-500/10 text-amber-500' },
  rejected:  { label: 'Rejected',  color: 'bg-red-500/10 text-red-500' },
  suspended: { label: 'Suspended', color: 'bg-orange-500/10 text-orange-500' },
};

// ── Nav feature items — mirrors Sidebar.tsx ───────────────────────────────────
const NAV_FEATURES = [
  { key: 'gallery',        label: 'Gallery',         icon: ImageIcon },
  { key: 'socialAccounts', label: 'Social Accounts',  icon: Share2 },
  { key: 'posts',          label: 'Posts',            icon: PenTool },
  { key: 'scheduler',      label: 'Scheduler',        icon: Calendar },
  { key: 'analytics',      label: 'Analytics',        icon: BarChart3 },
  { key: 'notifications',  label: 'Notifications',    icon: Bell },
  { key: 'settings',       label: 'Settings',         icon: SettingsIcon },
] as const;

const ROLE_LABELS: Record<string, string> = {
  graphic_designer: 'Graphic Designer', photographer: 'Photographer',
  videographer: 'Videographer', editor: 'Editor', producer: 'Producer',
  director: 'Director', production_manager: 'Production Manager',
  social_media_manager: 'Social Media Manager', content_strategist: 'Content Strategist',
  brand_manager: 'Brand Manager', ceo: 'CEO', coo: 'COO',
  creative_director: 'Creative Director', head_of_production: 'Head of Production',
};

// ── Action buttons per status ─────────────────────────────────────────────────
// pending  → Approve | Reject
// active   → Suspend  (no reject — they're already in)
// rejected → Approve  (reinstate)
// suspended→ Approve  (reinstate)
function ActionButtons({
  user, isUpdating, onStatus, onVerify,
}: {
  user: AdminUser;
  isUpdating: boolean;
  onStatus: (status: AdminUser['accountStatus']) => void;
  onVerify: () => void;
}) {
  const s = user.accountStatus;
  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
      {/* Verify email — shown for unverified users */}
      {!user.verified && (
        <button onClick={onVerify} disabled={isUpdating}
          className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
          Verify Email
        </button>
      )}
      {/* Approve — shown for pending, rejected, suspended */}
      {(s === 'pending' || s === 'rejected' || s === 'suspended') && (
        <button onClick={() => onStatus('active')} disabled={isUpdating}
          className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
          Approve
        </button>
      )}
      {/* Reject — only for pending */}
      {s === 'pending' && (
        <button onClick={() => onStatus('rejected')} disabled={isUpdating}
          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
          Reject
        </button>
      )}
      {/* Suspend — only for active */}
      {s === 'active' && (
        <button onClick={() => onStatus('suspended')} disabled={isUpdating}
          className="px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40">
          Suspend
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Global nav defaults
  const [defaults, setDefaults] = useState<NavFeatures | null>(null);
  const [savingDefaults, setSavingDefaults] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, u, d] = await Promise.all([
        adminService.getStats(),
        adminService.listUsers({ status: statusFilter || undefined, search: search || undefined }),
        adminService.getDefaults(),
      ]);
      setStats(s);
      setUsers(u);
      setDefaults(d);
    } catch { toast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id: string, status: AdminUser['accountStatus']) => {
    setUpdatingId(id);
    try {
      const updated = await adminService.updateUserStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, accountStatus: updated.accountStatus } : u));
      toast(`User ${status}`, 'success');
      // Refresh stats
      adminService.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed', 'error');
    } finally { setUpdatingId(null); }
  };

  const handleFeatureToggle = async (id: string, feature: string, value: boolean) => {
    const key = id + feature;
    setUpdatingId(key);
    try {
      const updated = await adminService.updateUserFeatures(id, { [feature]: value });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, enabledFeatures: updated.enabledFeatures } : u));
    } catch { toast('Failed to update navigation', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
    setUpdatingId(id);
    try {
      await adminService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast('User deleted', 'success');
      adminService.getStats().then(setStats).catch(() => {});
    } catch { toast('Failed to delete user', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleVerify = async (id: string) => {
    setUpdatingId(id + 'verify');
    try {
      const updated = await adminService.verifyUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: updated.verified } : u));
      toast('User email verified', 'success');
    } catch { toast('Failed to verify user', 'error'); }
    finally { setUpdatingId(null); }
  };

  const handleDefaultToggle = (feature: string, value: boolean) => {
    if (!defaults) return;
    setDefaults(prev => prev ? { ...prev, [feature]: value } : prev);
  };

  const handleSaveDefaults = async (applyToAll: boolean) => {
    if (!defaults) return;
    setSavingDefaults(true);
    try {
      const updated = await adminService.setDefaults(defaults, applyToAll);
      setDefaults(updated);
      if (applyToAll) {
        // Refresh user list to reflect new features
        const u = await adminService.listUsers({ status: statusFilter || undefined, search: search || undefined });
        setUsers(u);
      }
      toast(applyToAll ? 'Defaults saved and applied to all users' : 'Defaults saved', 'success');
    } catch { toast('Failed to save defaults', 'error'); }
    finally { setSavingDefaults(false); }
  };

  const statCards = stats ? [
    { label: 'Total',     value: stats.total,     color: 'text-primary' },
    { label: 'Active',    value: stats.active,    color: 'text-emerald-500' },
    { label: 'Pending',   value: stats.pending,   color: 'text-amber-500' },
    { label: 'Rejected',  value: stats.rejected,  color: 'text-red-500' },
    { label: 'Suspended', value: stats.suspended, color: 'text-orange-500' },
  ] : [];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield size={28} className="text-primary" />
            <h1 className="text-4xl font-black tracking-tight text-text">Admin Panel</h1>
          </div>
          <p className="text-text-muted font-medium">Manage users, approvals, and dashboard navigation access.</p>
        </div>
        <button onClick={load} className="p-2 text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {statCards.map(s => (
            <button key={s.label} onClick={() => setStatusFilter(s.label === 'Total' ? '' : s.label.toLowerCase())}
              className={cn('p-5 rounded-2xl border border-white/10 glass space-y-1 text-left transition-all hover:border-white/20',
                statusFilter === (s.label === 'Total' ? '' : s.label.toLowerCase()) && 'ring-2 ring-primary/40'
              )}>
              <p className="text-xs font-black text-text-muted uppercase tracking-widest">{s.label}</p>
              <p className={cn('text-3xl font-black', s.color)}>{s.value}</p>
            </button>
          ))}
        </div>
      )}

      {/* Global Nav Defaults */}
      {defaults && (
        <div className="glass border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black text-text">Global Dashboard Navigation</h2>
                <p className="text-xs text-text-muted">Default nav items shown to all users. Save & Apply overrides every user.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSaveDefaults(false)} isLoading={savingDefaults}
                className="rounded-xl h-9 px-4 text-xs font-bold bg-white/5 border-white/10">
                Save Defaults
              </Button>
              <Button onClick={() => handleSaveDefaults(true)} isLoading={savingDefaults}
                className="rounded-xl h-9 px-4 text-xs font-bold">
                Save & Apply to All
              </Button>
            </div>
          </div>

          {/* Dashboard always on */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border bg-primary/5 border-primary/20">
            <div className="flex items-center gap-2">
              <LayoutDashboard size={14} className="text-primary" />
              <span className="text-xs font-bold text-primary">Dashboard</span>
            </div>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest">Always On</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NAV_FEATURES.map(({ key, label, icon: Icon }) => {
              const enabled = defaults[key as keyof NavFeatures];
              return (
                <button key={key} onClick={() => handleDefaultToggle(key, !enabled)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all',
                    enabled
                      ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                      : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                  )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={13} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </div>
                  {enabled ? <ToggleRight size={16} className="shrink-0" /> : <ToggleLeft size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 transition-all" />
        </div>
        <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
          {['', 'pending', 'active', 'rejected', 'suspended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                statusFilter === s ? 'bg-primary text-white' : 'text-text-muted hover:text-text')}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-20 text-center">
          <Users size={40} className="text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted font-semibold">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {users.map(u => {
              const sc = STATUS_CONFIG[u.accountStatus] ?? STATUS_CONFIG.pending;
              const isExpanded = expandedId === u.id;
              const isUpdating = updatingId === u.id;

              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass border border-white/10 rounded-2xl overflow-hidden">

                  {/* ── User row ── */}
                  <div className="flex items-center gap-4 p-4 flex-wrap">
                    {/* Avatar */}
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-text">{u.name}</p>
                        {!u.verified && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full">
                            Unverified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{u.email}</p>
                      <p className="text-[10px] text-text-muted capitalize mt-0.5">
                        {u.roles.map(r => ROLE_LABELS[r] || r).join(', ')}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0', sc.color)}>
                      {sc.label}
                    </span>

                    {/* Actions */}
                    <ActionButtons user={u} isUpdating={isUpdating}
                      onStatus={(status) => handleStatus(u.id, status)}
                      onVerify={() => handleVerify(u.id)} />

                    {/* Delete + expand */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleDelete(u.id, u.name)} disabled={isUpdating}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-text-muted hover:text-red-500" title="Delete user">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setExpandedId(isExpanded ? null : u.id)}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-text-muted hover:text-text" title="Manage navigation">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded: Dashboard Navigation toggles ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-5 pt-3 border-t border-white/10 space-y-4">

                          {/* Section header */}
                          <div className="flex items-center gap-2">
                            <LayoutDashboard size={14} className="text-primary" />
                            <p className="text-xs font-black text-text uppercase tracking-widest">
                              Dashboard Navigation
                            </p>
                            <span className="text-[10px] text-text-muted ml-1">
                              — toggle which sidebar items this user can see
                            </span>
                          </div>

                          {/* Dashboard is always on — show as locked */}
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl border bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-2">
                              <LayoutDashboard size={14} className="text-primary" />
                              <span className="text-xs font-bold text-primary">Dashboard</span>
                            </div>
                            <span className="text-[10px] text-primary font-black uppercase tracking-widest">Always On</span>
                          </div>

                          {/* Toggleable nav items */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {NAV_FEATURES.map(({ key, label, icon: Icon }) => {
                              const enabled = u.enabledFeatures[key as keyof typeof u.enabledFeatures];
                              const busy = updatingId === u.id + key;
                              return (
                                <button key={key}
                                  onClick={() => handleFeatureToggle(u.id, key, !enabled)}
                                  disabled={busy}
                                  className={cn(
                                    'flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all',
                                    enabled
                                      ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                                      : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                                  )}>
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon size={13} className="shrink-0" />
                                    <span className="truncate">{label}</span>
                                  </div>
                                  {busy
                                    ? <RefreshCw size={12} className="animate-spin shrink-0" />
                                    : enabled
                                      ? <ToggleRight size={16} className="shrink-0" />
                                      : <ToggleLeft size={16} className="shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          <p className="text-[10px] text-text-muted">
                            Joined {new Date(u.createdAt).toLocaleDateString()} ·{' '}
                            {u.verified ? '✓ Email verified' : '✗ Email not verified'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
