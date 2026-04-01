import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  User, Bell, Shield, Globe, CreditCard, LogOut, Eye, EyeOff, Camera,
  Mail, Phone, MapPin, Lock, Smartphone, CheckCircle2,
  Building2, Briefcase, History, Download, Zap, Users, Plus,
  Monitor, QrCode, MessageSquare, RefreshCw, X, Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import * as settingsService from '../services/settingsService';
import { ROLE_GROUPS } from '../services/authService';
import type { User as UserType, NotificationPrefs } from '../services/authService';

// ─── helpers ────────────────────────────────────────────────────────────────
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dubai',
  'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
];

const isExecutiveOrProduction = (roles: string[] = []) =>
  roles.some(r =>
    [...ROLE_GROUPS.executive, ...ROLE_GROUPS.production].includes(r as any)
  );

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// ─── Toggle component ────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className={cn('w-14 h-7 rounded-full relative transition-all duration-300', checked ? 'bg-primary' : 'bg-white/10')}
  >
    <div className={cn('absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300', checked ? 'right-1' : 'left-1')} />
  </button>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('Profile');

  // Allow navigation from notification panel / query param to jump to a tab
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    const params = new URLSearchParams(location.search);
    const tabFromQuery = params.get('tab');
    if (tabFromQuery === 'notification-preferences') {
      setActiveTab('Notification Preferences');
    } else if (state?.tab) {
      setActiveTab(state.tab);
      window.history.replaceState({}, '');
    }
  }, [location.state, location.search]);

  // Refresh user data on every tab click so info is always current
  const handleTabChange = async (label: string) => {
    setActiveTab(label);
    try { await refreshUser(); } catch { /* ignore */ }
  };

  // Agency Profile tab:
  // - Personal context: only executive roles (to set up their own agency)
  // - Agency context: only if agencyRole is 'owner' or an executive agencyRole
  const isExecutive = (roles: string[] = []) =>
    roles.some(r => (ROLE_GROUPS.executive as readonly string[]).includes(r));

  const isExecutiveInAgency = () => {
    if (user?.activeContext !== 'agency') return false;
    const ar = user?.agencyRole;
    if (!ar) return false;
    if (ar === 'owner') return true;
    return (ROLE_GROUPS.executive as readonly string[]).includes(ar as any);
  };

  const showAgencyTab = user?.activeContext === 'agency'
    ? isExecutiveInAgency()
    : isExecutive(user?.roles ?? []);

  const tabs = [
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notification Preferences' },
    { icon: Shield, label: 'Security' },
    { icon: Users, label: 'Invitations' },
    ...(showAgencyTab ? [{ icon: Building2, label: 'Agency Profile' }] : []),
    { icon: CreditCard, label: 'Billing' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 pb-16 sm:pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-text mb-1 sm:mb-2">Settings</h1>
        <p className="text-sm text-text-muted font-medium">Manage your account, preferences, and security.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Sidebar — horizontal scroll tabs on mobile, vertical list on desktop */}
        <div className="w-full lg:w-64 shrink-0">
          {/* Mobile: horizontal scrollable tabs */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {tabs.map((item) => (
              <button
                key={item.label}
                onClick={() => handleTabChange(item.label)}
                className={cn(
                  'shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  activeTab === item.label
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-card border border-border text-text-muted hover:text-text'
                )}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-500 bg-card border border-border whitespace-nowrap"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>

          {/* Desktop: vertical sidebar */}
          <div className="hidden lg:block glass border border-white/10 p-2 rounded-[24px]">
            {tabs.map((item) => (
              <button
                key={item.label}
                onClick={() => handleTabChange(item.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all',
                  activeTab === item.label
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                )}
              >
                <item.icon size={18} className={cn(activeTab === item.label ? 'text-white' : 'text-text-muted')} />
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={18} /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'Profile' && <ProfileTab key="profile" user={user} onRefresh={refreshUser} toast={toast} />}
            {activeTab === 'Notification Preferences' && <NotificationsTab key="notifications" user={user} onRefresh={refreshUser} toast={toast} />}
            {activeTab === 'Security' && <SecurityTab key="security" user={user} onRefresh={refreshUser} toast={toast} />}
            {activeTab === 'Invitations' && <InvitationsTab key="invitations" toast={toast} />}
            {activeTab === 'Agency Profile' && <AgencyTab key="agency" user={user} onRefresh={refreshUser} toast={toast} />}
            {activeTab === 'Billing' && <BillingTab key="billing" />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab({ user, onRefresh, toast }: { user: UserType | null; onRefresh: () => Promise<void>; toast: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', phone: '', bio: '', country: '', city: '', timezone: 'UTC',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        country: user.country || '',
        city: user.city || '',
        timezone: user.timezone || 'UTC',
      });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await settingsService.uploadAvatar(file);
      await onRefresh();
      toast('Avatar updated!', 'success');
    } catch {
      toast('Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateProfile(form);
      await onRefresh();
      setEditing(false);
      toast('Profile updated!', 'success');
    } catch {
      toast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // In agency context show the assigned agency role, otherwise personal roles
  const roleLabel = user?.activeContext === 'agency' && user?.agencyRole
    ? (user.agencyRole === 'owner' ? 'Agency Owner' : user.agencyRole.replace(/_/g, ' '))
    : (user?.roles?.map(r => r.replace(/_/g, ' ')).join(', ') || 'No role');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
    >
      {/* Avatar + header */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-32 h-32 rounded-[40px] object-cover shadow-2xl" />
          ) : (
            <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-black shadow-2xl">
              {getInitials(user?.name)}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-primary rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            {uploading ? <RefreshCw size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div className="text-center md:text-left space-y-2">
          <h3 className="text-2xl font-black text-text">{user?.name || '—'}</h3>
          <p className="text-text-muted font-medium capitalize">{roleLabel}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
            {user?.verified && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">Verified</span>
            )}
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full capitalize">
              {user?.roles?.[0]?.replace(/_/g, ' ') || 'Member'}
            </span>
          </div>
        </div>
        <div className="md:ml-auto">
          {!editing ? (
            <Button onClick={() => setEditing(true)} className="rounded-xl h-10 px-6 font-bold">Edit Profile</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(false)} className="rounded-xl h-10 px-4 font-bold bg-white/5 border-white/10">Cancel</Button>
              <Button onClick={handleSave} isLoading={saving} className="rounded-xl h-10 px-6 font-bold">Save</Button>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Personal Information</h4>
          <div className="space-y-4">
            {editing ? (
              <>
                <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Email Address</label>
                  <div className="flex items-center gap-2 h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-text-muted">
                    <Mail size={16} className="shrink-0" />
                    <span>{user?.email}</span>
                    <span className="ml-auto text-[10px] text-text-muted">(cannot change)</span>
                  </div>
                </div>
                <Input label="Phone Number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" icon={<Phone size={16} />} />
                <div>
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1.5">Role</label>
                  <div className="flex items-center gap-2 h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-text-muted">
                    <span className="capitalize">{roleLabel}</span>
                    <span className="ml-auto text-[10px] text-text-muted">(cannot change)</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Full Name" value={user?.name} />
                <InfoRow label="Email" value={user?.email} icon={<Mail size={14} />} />
                <InfoRow label="Phone" value={user?.phone || '—'} icon={<Phone size={14} />} />
                <InfoRow label="Role" value={roleLabel} />
              </>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Location & Time</h4>
          <div className="space-y-4">
            {editing ? (
              <>
                <Input label="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" icon={<Globe size={16} />} />
                <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" icon={<MapPin size={16} />} />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Timezone</label>
                  <select
                    value={form.timezone}
                    onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                  >
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Country" value={user?.country || '—'} icon={<Globe size={14} />} />
                <InfoRow label="City" value={user?.city || '—'} icon={<MapPin size={14} />} />
                <InfoRow label="Timezone" value={user?.timezone || 'UTC'} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-4">
        <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Professional Bio</h4>
        {editing ? (
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[120px] resize-none transition-all"
            placeholder="Tell us about yourself..."
          />
        ) : (
          <p className="text-sm text-text-muted leading-relaxed">{user?.bio || 'No bio added yet.'}</p>
        )}
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">{label}</label>
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        {icon && <span className="text-text-muted">{icon}</span>}
        <span>{value || '—'}</span>
      </div>
    </div>
  );
}

// ─── Notifications Tab ───────────────────────────────────────────────────────
function NotificationsTab({ user, onRefresh, toast }: { user: UserType | null; onRefresh: () => Promise<void>; toast: any }) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    accountSecurity: false,
    galleryAssets: false,
    postSchedule: false,
    systemUpdates: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.notificationPrefs) {
      setPrefs(user.notificationPrefs);
    }
  }, [user]);

  const handleToggle = async (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await settingsService.updateNotificationPrefs({ [key]: value });
      await onRefresh();
    } catch {
      setPrefs(prefs); // revert
      toast('Failed to update preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: 'accountSecurity' as const,
      label: 'Account Security',
      desc: 'Login alerts, password changes, 2FA events, and all authentication notifications.',
      icon: Shield,
    },
    {
      key: 'galleryAssets' as const,
      label: 'Gallery & Assets',
      desc: 'Notifications for media uploads, comments, corrections, variants, and asset actions.',
      icon: CheckCircle2,
    },
    {
      key: 'postSchedule' as const,
      label: 'Post & Schedule',
      desc: 'Alerts when posts are published, scheduled, or fail to publish.',
      icon: MessageSquare,
    },
    {
      key: 'systemUpdates' as const,
      label: 'System Updates',
      desc: 'New feature announcements, maintenance notices, and platform updates.',
      icon: Zap,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-text">Notification Preferences</h3>
          <p className="text-sm text-text-muted mt-1">By default all notifications are off. Enable what you want to see.</p>
        </div>
        {saving && <RefreshCw size={16} className="animate-spin text-primary" />}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 group">
            <div className="flex items-center gap-5">
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110',
                prefs[item.key] ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'
              )}>
                <item.icon size={20} />
              </div>
              <div className="max-w-md">
                <p className="font-bold text-text">{item.label}</p>
                <p className="text-xs text-text-muted mt-1 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </div>
            <Toggle checked={prefs[item.key]} onChange={(v) => handleToggle(item.key, v)} />
          </div>
        ))}
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl text-xs text-text-muted leading-relaxed">
        Notifications you enable here will appear in your notification panel. Disabled categories are completely hidden.
      </div>
    </motion.div>
  );
}

// ─── Security Tab ────────────────────────────────────────────────────────────
function SecurityTab({ user, onRefresh, toast }: { user: UserType | null; onRefresh: () => Promise<void>; toast: any }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  // 2FA state
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'app-qr' | 'app-verify' | 'sms-phone' | 'sms-verify'>('idle');
  const [qrCode, setQrCode] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  const handlePasswordChange = async () => {
    if (pwForm.newPw !== pwForm.confirm) { toast('Passwords do not match', 'error'); return; }
    if (pwForm.newPw.length < 8) { toast('Password must be at least 8 characters', 'error'); return; }
    setPwSaving(true);
    try {
      await settingsService.changePassword(pwForm.current, pwForm.newPw);
      setPwForm({ current: '', newPw: '', confirm: '' });
      toast('Password updated!', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const startAppSetup = async () => {
    setTwoFALoading(true);
    try {
      const { qrCode: qr } = await settingsService.setup2FAApp();
      setQrCode(qr);
      setTwoFAStep('app-qr');
    } catch { toast('Failed to setup 2FA', 'error'); }
    finally { setTwoFALoading(false); }
  };

  const verifyApp = async () => {
    setTwoFALoading(true);
    try {
      await settingsService.verify2FAApp(totpToken);
      await onRefresh();
      setTwoFAStep('idle');
      setTotpToken('');
      toast('Authenticator app enabled!', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Invalid code', 'error');
    } finally { setTwoFALoading(false); }
  };

  const startSMSSetup = () => setTwoFAStep('sms-phone');

  const sendSMS = async () => {
    if (!smsPhone) { toast('Enter a phone number', 'error'); return; }
    setTwoFALoading(true);
    try {
      await settingsService.setup2FASMS(smsPhone);
      setTwoFAStep('sms-verify');
      toast('SMS sent!', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to send SMS', 'error');
    } finally { setTwoFALoading(false); }
  };

  const verifySMS = async () => {
    setTwoFALoading(true);
    try {
      await settingsService.verify2FASMS(smsCode);
      await onRefresh();
      setTwoFAStep('idle');
      setSmsCode('');
      toast('SMS 2FA enabled!', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Invalid code', 'error');
    } finally { setTwoFALoading(false); }
  };

  const disable2FA = async () => {
    setTwoFALoading(true);
    try {
      await settingsService.disable2FA();
      await onRefresh();
      toast('2FA disabled', 'success');
    } catch { toast('Failed to disable 2FA', 'error'); }
    finally { setTwoFALoading(false); }
  };

  const twoFAEnabled = user?.twoFA?.enabled;
  const twoFAMethod = user?.twoFA?.method;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
    >
      <h3 className="text-2xl font-black text-text">Security & Privacy</h3>

      {/* Password */}
      <div className="space-y-6">
        <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Change Password</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <Input label="Current Password" type={showCurrent ? 'text' : 'password'} value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" icon={<Lock size={16} />} />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-[34px] text-text-muted hover:text-text">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="hidden md:block" />
          <div className="relative">
            <Input label="New Password" type={showNew ? 'text' : 'password'} value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="••••••••" icon={<Lock size={16} />} />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-4 top-[34px] text-text-muted hover:text-text">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Input label="Confirm New Password" type={showNew ? 'text' : 'password'} value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="••••••••" icon={<Lock size={16} />} />
        </div>
        <Button onClick={handlePasswordChange} isLoading={pwSaving} className="rounded-xl h-10 px-6 font-bold">Update Password</Button>
      </div>

      {/* 2FA */}
      <div className="pt-8 border-t border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Two-Factor Authentication</h4>
          {twoFAEnabled && (
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">
              Enabled via {twoFAMethod === 'app' ? 'Authenticator App' : 'SMS'}
            </span>
          )}
        </div>

        {twoFAEnabled ? (
          <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
            <div className="flex items-center gap-4">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <div>
                <p className="font-bold text-text">2FA is active</p>
                <p className="text-xs text-text-muted">Your account is protected with {twoFAMethod === 'app' ? 'an authenticator app' : 'SMS verification'}.</p>
              </div>
            </div>
            <Button variant="outline" onClick={disable2FA} isLoading={twoFALoading} className="rounded-xl h-9 px-4 text-xs font-bold text-red-500 border-red-500/20 hover:bg-red-500/10">
              Disable
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[24px] hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <QrCode size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-text">Authenticator App</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Recommended</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={startAppSetup} isLoading={twoFALoading && twoFAStep === 'idle'}
                  className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">
                  Setup
                </Button>
              </div>
              <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[24px] hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 text-text-muted rounded-2xl flex items-center justify-center">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-text">SMS Verification</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Via Twilio</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={startSMSSetup}
                  className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">
                  Setup
                </Button>
              </div>
            </div>

            {/* App QR step */}
            <AnimatePresence>
              {twoFAStep === 'app-qr' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-text">Scan with your authenticator app</p>
                    <button onClick={() => setTwoFAStep('idle')}><X size={18} className="text-text-muted" /></button>
                  </div>
                  {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl" />}
                  <p className="text-xs text-text-muted text-center">Use Google Authenticator, Authy, or any TOTP app</p>
                  <div className="flex gap-3">
                    <Input label="Enter 6-digit code" value={totpToken} onChange={e => setTotpToken(e.target.value)} placeholder="000000" />
                    <div className="flex items-end">
                      <Button onClick={verifyApp} isLoading={twoFALoading} className="rounded-xl h-11 px-6 font-bold">Verify</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {twoFAStep === 'sms-phone' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-text">Enter your phone number</p>
                    <button onClick={() => setTwoFAStep('idle')}><X size={18} className="text-text-muted" /></button>
                  </div>
                  <div className="flex gap-3">
                    <Input label="Phone number (with country code)" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="+1 555 000 0000" icon={<Phone size={16} />} />
                    <div className="flex items-end">
                      <Button onClick={sendSMS} isLoading={twoFALoading} className="rounded-xl h-11 px-6 font-bold">Send SMS</Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {twoFAStep === 'sms-verify' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-text">Enter the code sent to {smsPhone}</p>
                    <button onClick={() => setTwoFAStep('idle')}><X size={18} className="text-text-muted" /></button>
                  </div>
                  <div className="flex gap-3">
                    <Input label="6-digit code" value={smsCode} onChange={e => setSmsCode(e.target.value)} placeholder="000000" />
                    <div className="flex items-end">
                      <Button onClick={verifySMS} isLoading={twoFALoading} className="rounded-xl h-11 px-6 font-bold">Verify</Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Login History */}
      <div className="pt-8 border-t border-white/10 space-y-6">
        <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Active Devices & Login History</h4>
        {!user?.loginHistory?.length ? (
          <p className="text-sm text-text-muted">No login history available.</p>
        ) : (
          <div className="space-y-3">
            {user.loginHistory.slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Monitor size={18} className="text-text-muted shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-text truncate max-w-[200px]">{entry.device || entry.userAgent || 'Unknown device'}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                      {entry.ip} {entry.location ? `• ${entry.location}` : ''}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  'text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap',
                  i === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/10 text-text-muted'
                )}>
                  {i === 0 ? 'Latest' : new Date(entry.loginAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Agency Tab ──────────────────────────────────────────────────────────────
function AgencyTab({ user, onRefresh, toast }: { user: UserType | null; onRefresh: () => Promise<void>; toast: any }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', website: '', industry: '', teamSize: '', description: '', enableStartups: false });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<settingsService.UserSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [selectedRole, setSelectedRole] = useState<settingsService.AgencyRole>('graphic_designer');
  const [inviting, setInviting] = useState(false);

  // Agency members (owner + accepted invitees)
  interface AgencyMember {
    id: string; name: string; email: string; avatar: string | null;
    roles: string[]; agencyRole: string; isOwner: boolean; inviteId: string | null;
  }
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const isOwner = !!(user?.agency?.name);

  useEffect(() => {
    if (user?.agency) {
      setForm({
        name: user.agency.name || '',
        website: user.agency.website || '',
        industry: user.agency.industry || '',
        teamSize: user.agency.teamSize || '',
        description: user.agency.description || '',
      });
    }
    fetchMembers();
  }, [user]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      // Use agency-members endpoint which returns owner + all accepted members, excluding self
      const res = await import('../services/api').then(m => m.default.get('/settings/team/agency-members'));
      setMembers(res.data.members || []);
    } catch { /* ignore */ }
    finally { setLoadingMembers(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      await settingsService.uploadAgencyLogo(file);
      await onRefresh();
      toast('Agency logo updated!', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateAgency(form as any);
      await onRefresh();
      setEditing(false);
      toast('Agency profile updated!', 'success');
    } catch {
      toast('Failed to update agency', 'error');
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (user?.agency) {
      setForm({
        name: user.agency.name || '',
        website: user.agency.website || '',
        industry: user.agency.industry || '',
        teamSize: user.agency.teamSize || '',
        description: user.agency.description || '',
        enableStartups: user.agency.enableStartups ?? false,
      });
    }
    setEditing(false);
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);
    setSearchError('');
    try {
      const result = await settingsService.searchUserByEmail(searchEmail.trim());
      setSearchResult(result);
    } catch (err: any) {
      setSearchError(err?.response?.data?.error || 'User not found');
    } finally { setSearching(false); }
  };

  const handleInvite = async () => {
    if (!searchResult) return;
    setInviting(true);
    try {
      await settingsService.sendTeamInvite(searchResult.user.id, selectedRole);
      toast(`Invite sent to ${searchResult.user.name} as ${ROLE_LABELS[selectedRole] || selectedRole}!`, 'success');
      setSearchResult(null);
      setSearchEmail('');
      setSelectedRole('graphic_designer');
      fetchMembers();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to send invite', 'error');
    } finally { setInviting(false); }
  };

  const handleRemove = async (inviteId: string) => {
    setRemovingId(inviteId);
    try {
      await settingsService.removeTeamMember(inviteId);
      setMembers(prev => prev.filter(m => m.inviteId !== inviteId));
      toast('Member removed', 'success');
    } catch {
      toast('Failed to remove member', 'error');
    } finally { setRemovingId(null); }
  };

  const handleRoleChange = async (inviteId: string, agencyRole: settingsService.AgencyRole) => {
    setUpdatingRoleId(inviteId);
    try {
      await settingsService.updateMemberRole(inviteId, agencyRole);
      setMembers(prev => prev.map(m => m.inviteId === inviteId ? { ...m, agencyRole } : m));
      toast('Role updated', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to update role', 'error');
    } finally { setUpdatingRoleId(null); }
  };

  const agency = user?.agency;

  const ROLE_LABELS: Record<string, string> = {
    graphic_designer: 'Graphic Designer', photographer: 'Photographer',
    videographer: 'Videographer', editor: 'Editor',
    producer: 'Producer', director: 'Director', production_manager: 'Production Manager',
    social_media_manager: 'Social Media Manager', content_strategist: 'Content Strategist',
    brand_manager: 'Brand Manager', ceo: 'CEO', coo: 'COO',
    creative_director: 'Creative Director', head_of_production: 'Head of Production',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
    >
      {/* ── Header: logo + name + edit toggle ── */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-[40px] bg-white/5 border-2 border-white/10 overflow-hidden flex items-center justify-center">
            {agency?.logo ? (
              <img src={agency.logo} alt="Agency logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-text-muted">
                <Building2 size={32} className="mb-1" />
                <span className="text-[9px] font-black uppercase tracking-widest">No Logo</span>
              </div>
            )}
          </div>
          <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo} title="Upload agency logo"
            className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-primary rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform disabled:opacity-60">
            {uploadingLogo ? <RefreshCw size={16} className="animate-spin" /> : <Camera size={16} />}
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>

        <div className="flex-1 text-center md:text-left space-y-1.5">
          <h3 className="text-2xl font-black text-text">{agency?.name || 'Your Agency'}</h3>
          <p className="text-text-muted text-sm">{agency?.description || 'No description yet.'}</p>
          {agency?.website && (
            <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{agency.website}</a>
          )}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
            {agency?.industry && <span className="px-2 py-0.5 bg-white/5 text-text-muted text-[10px] font-bold uppercase tracking-widest rounded-full">{agency.industry}</span>}
            {agency?.teamSize && <span className="px-2 py-0.5 bg-white/5 text-text-muted text-[10px] font-bold uppercase tracking-widest rounded-full">{agency.teamSize}</span>}
          </div>
        </div>

        <div className="shrink-0">
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="outline" className="rounded-xl h-10 px-5 font-bold bg-white/5 border-white/10">Edit Agency</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} className="rounded-xl h-10 px-4 font-bold bg-white/5 border-white/10">Cancel</Button>
              <Button onClick={handleSave} isLoading={saving} className="rounded-xl h-10 px-5 font-bold">Save</Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Agency details: view or edit ── */}
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Edit Agency Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Agency Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} icon={<Building2 size={16} />} placeholder="Your agency name" />
              <Input label="Website URL" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} icon={<Globe size={16} />} placeholder="https://yoursite.com" />
              <Input label="Industry" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} icon={<Briefcase size={16} />} placeholder="e.g. Marketing & Advertising" />
              <Input label="Team Size" value={form.teamSize} onChange={e => setForm(f => ({ ...f, teamSize: e.target.value }))} icon={<Users size={16} />} placeholder="e.g. 11-50 employees" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                spellCheck
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[100px] resize-none transition-all"
                placeholder="Describe your agency..." />
            </div>
            {/* Startups feature toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div>
                <p className="font-bold text-text text-sm">Enable Startups</p>
                <p className="text-xs text-text-muted mt-0.5">Show the Startups section in the sidebar and allow assigning assets to startups.</p>
              </div>
              <Toggle checked={form.enableStartups} onChange={v => setForm(f => ({ ...f, enableStartups: v }))} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow label="Agency Name" value={agency?.name || '—'} icon={<Building2 size={14} />} />
            <InfoRow label="Website" value={agency?.website || '—'} icon={<Globe size={14} />} />
            <InfoRow label="Industry" value={agency?.industry || '—'} icon={<Briefcase size={14} />} />
            <InfoRow label="Team Size" value={agency?.teamSize || '—'} icon={<Users size={14} />} />
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-1">Description</label>
              <p className="text-sm text-text-muted leading-relaxed">{agency?.description || '—'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Team Members ── */}
      <div className="pt-8 border-t border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Team Members</h4>
          <button onClick={fetchMembers} className="p-1.5 text-text-muted hover:text-text hover:bg-white/5 rounded-lg transition-all">
            <RefreshCw size={14} className={loadingMembers ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search & Invite — only owner can invite */}
        {isOwner && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <Input label="Search user by email to invite" value={searchEmail}
                onChange={e => { setSearchEmail(e.target.value); setSearchResult(null); setSearchError(''); }}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
                placeholder="colleague@company.com" icon={<Mail size={16} />} />
              <div className="flex items-end">
                <Button onClick={handleSearch} isLoading={searching} variant="outline"
                  className="rounded-xl h-11 px-5 font-bold bg-white/5 border-white/10 whitespace-nowrap">Search</Button>
              </div>
            </div>

            {searchError && <p className="text-xs text-red-400 flex items-center gap-1.5"><X size={12} /> {searchError}</p>}

            <AnimatePresence>
              {searchResult && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  {/* User info */}
                  <div className="flex items-center gap-3">
                    {searchResult.user.avatar ? (
                      <img src={searchResult.user.avatar} alt={searchResult.user.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {getInitials(searchResult.user.name)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-text">{searchResult.user.name}</p>
                      <p className="text-xs text-text-muted">{searchResult.user.email}</p>
                    </div>
                  </div>

                  {searchResult.inviteStatus === 'accepted' ? (
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">Already a member</span>
                  ) : searchResult.inviteStatus === 'pending' ? (
                    <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-full">Invite pending</span>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Assign Agency Role</label>
                        <select
                          value={selectedRole}
                          onChange={e => setSelectedRole(e.target.value as settingsService.AgencyRole)}
                          className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all"
                        >
                          {settingsService.AGENCY_ROLES.map(r => (
                            <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-text-muted">
                          This role determines what {searchResult.user.name.split(' ')[0]} can do in the agency context.
                        </p>
                      </div>
                      <Button onClick={handleInvite} isLoading={inviting} className="w-full rounded-xl h-9 font-bold text-sm">
                        <Plus size={14} className="mr-1.5" /> Send Invite as {ROLE_LABELS[selectedRole] || selectedRole}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Members list */}
        {loadingMembers ? (
          <div className="flex items-center gap-2 text-text-muted text-sm py-4">
            <RefreshCw size={15} className="animate-spin" /> Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="py-10 text-center">
            <Users size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-muted">{isOwner ? 'No other members yet. Invite someone above.' : 'No other team members.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                      {getInitials(m.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text truncate">{m.name}</p>
                    <p className="text-xs text-text-muted truncate">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Role selector — owner can change member roles, not their own */}
                  {isOwner && !m.isOwner && m.inviteId ? (
                    <div className="relative">
                      <select
                        value={m.agencyRole}
                        disabled={updatingRoleId === m.inviteId}
                        onChange={e => handleRoleChange(m.inviteId!, e.target.value as settingsService.AgencyRole)}
                        className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] font-bold text-text outline-none focus:border-primary/50 transition-all pr-6 appearance-none cursor-pointer"
                      >
                        {settingsService.AGENCY_ROLES.map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                        ))}
                      </select>
                      {updatingRoleId === m.inviteId && (
                        <RefreshCw size={10} className="animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                      )}
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                      {m.isOwner ? 'Owner' : (ROLE_LABELS[m.agencyRole] || m.agencyRole)}
                    </span>
                  )}

                  {/* Remove button — owner only, not for themselves */}
                  {isOwner && !m.isOwner && m.inviteId && (
                    <button onClick={() => handleRemove(m.inviteId!)} disabled={removingId === m.inviteId}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-text-muted hover:text-red-500" title="Remove">
                      {removingId === m.inviteId ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}



// ─── Invitations Tab ─────────────────────────────────────────────────────────
function InvitationsTab({ toast }: { toast: any }) {
  const [invitations, setInvitations] = useState<settingsService.TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getMyInvitations();
      setInvitations(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvitations(); }, []);

  const handleRespond = async (inviteId: string, action: 'accept' | 'reject') => {
    setRespondingId(inviteId);
    try {
      await settingsService.respondToInvitation(inviteId, action);
      setInvitations(prev => prev.map(inv =>
        inv.inviteId === inviteId ? { ...inv, status: action === 'accept' ? 'accepted' : 'rejected', respondedAt: new Date().toISOString() } : inv
      ));
      toast(action === 'accept' ? 'Invitation accepted!' : 'Invitation declined', action === 'accept' ? 'success' : 'info');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to respond', 'error');
    } finally { setRespondingId(null); }
  };

  const pending = invitations.filter(i => i.status === 'pending');
  const responded = invitations.filter(i => i.status !== 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-text">Team Invitations</h3>
          <p className="text-sm text-text-muted mt-1">Invitations from agency owners to join their team.</p>
        </div>
        <button onClick={fetchInvitations} className="p-2 text-text-muted hover:text-text hover:bg-white/5 rounded-xl transition-all">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-text-muted py-8 justify-center">
          <RefreshCw size={16} className="animate-spin" /> Loading invitations...
        </div>
      ) : invitations.length === 0 ? (
        <div className="py-16 text-center">
          <Users size={40} className="text-text-muted mx-auto mb-4 opacity-30" />
          <p className="text-text-muted font-semibold">No invitations yet</p>
          <p className="text-xs text-text-muted mt-1">When someone invites you to their agency, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Pending ({pending.length})</h4>
              {pending.map(inv => (
                <div key={inv.inviteId} className="p-5 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {inv.invitedBy?.avatar ? (
                        <img src={inv.invitedBy.avatar} alt={inv.invitedBy.name} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                          {getInitials(inv.invitedBy?.name || '?')}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-text">{inv.invitedBy?.name || 'Unknown'}</p>
                        <p className="text-xs text-text-muted">invited you to join</p>
                        <p className="text-sm font-black text-primary mt-0.5">"{inv.agencyName}"</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => handleRespond(inv.inviteId, 'reject')}
                        isLoading={respondingId === inv.inviteId}
                        variant="outline"
                        className="rounded-xl h-9 px-4 text-xs font-bold text-red-500 border-red-500/20 hover:bg-red-500/10"
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => handleRespond(inv.inviteId, 'accept')}
                        isLoading={respondingId === inv.inviteId}
                        className="rounded-xl h-9 px-4 text-xs font-bold"
                      >
                        <Check size={13} className="mr-1" /> Accept
                      </Button>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted mt-3">
                    Received {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {responded.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">History</h4>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Agency</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Invited By</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-text-muted uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responded.map(inv => (
                      <tr key={inv.inviteId} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3 font-semibold text-text">{inv.agencyName}</td>
                        <td className="px-4 py-3 text-text-muted">{inv.invitedBy?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full',
                            inv.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {inv.respondedAt ? new Date(inv.respondedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────
function BillingTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
    >
      <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-[32px] gap-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Current Plan</p>
          <h3 className="text-3xl font-black text-text">Agency Pro</h3>
          <p className="text-text-muted font-medium">Billed annually</p>
        </div>
        <div className="text-center md:text-right space-y-4">
          <p className="text-4xl font-black text-text">$199<span className="text-lg text-text-muted">/mo</span></p>
          <Button className="rounded-xl h-11 px-8 font-black shadow-xl shadow-primary/30">Upgrade Plan</Button>
        </div>
      </div>

      <div className="space-y-6">
        <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Payment Methods</h4>
        <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[24px]">
          <div className="flex items-center gap-6">
            <div className="w-16 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
              <CreditCard size={24} className="text-text-muted" />
            </div>
            <div>
              <p className="font-bold text-text">•••• •••• •••• 4242</p>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Expires 12/26 • Visa</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">Primary</span>
        </div>
        <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-white/20 bg-transparent hover:bg-white/5 text-text-muted font-bold">
          <Plus size={18} className="mr-2" /> Add Payment Method
        </Button>
      </div>

      <div className="pt-8 border-t border-white/10 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Billing History</h4>
          <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">
            <Download size={14} className="mr-2" /> Download All
          </Button>
        </div>
        {[
          { id: 'INV-2026-001', date: 'Feb 12, 2026', amount: '$199.00' },
          { id: 'INV-2026-002', date: 'Jan 12, 2026', amount: '$199.00' },
          { id: 'INV-2025-012', date: 'Dec 12, 2025', amount: '$199.00' },
        ].map((inv) => (
          <div key={inv.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-4">
              <History size={18} className="text-text-muted" />
              <div>
                <p className="text-sm font-bold text-text">{inv.id}</p>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{inv.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-black text-text">{inv.amount}</p>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">Paid</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg bg-white/5 border-white/10"><Download size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

