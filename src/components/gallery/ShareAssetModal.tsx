import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Mail, Link as LinkIcon, Send, Copy, Check, Shield, Globe,
  MessageCircle, Loader2, Users, UserCheck, Eye, Edit2, Clock, X,
} from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { useToast } from '../ui/Toast';
import {
  shareMedia, shareWithUsers, revokeShare, getAgencyTeamMembers, TeamUser, clearViewLog,
} from '../../services/mediaService';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

interface ShareAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  onAssetUpdate?: (asset: MediaAsset) => void;
}

type ShareTab = 'team' | 'link' | 'access' | 'email' | 'whatsapp';

const ROLE_LABELS: Record<string, string> = {
  graphic_designer: 'Graphic Designer', photographer: 'Photographer',
  videographer: 'Videographer', editor: 'Editor',
  producer: 'Producer', director: 'Director', production_manager: 'Production Manager',
  social_media_manager: 'Social Media Manager', content_strategist: 'Content Strategist',
  brand_manager: 'Brand Manager', ceo: 'CEO', coo: 'COO',
  creative_director: 'Creative Director', head_of_production: 'Head of Production',
};

export const ShareAssetModal = ({ isOpen, onClose, asset, onAssetUpdate }: ShareAssetModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<ShareTab>('team');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState<'view' | 'edit' | null>(null);
  const [teamUsers, setTeamUsers] = React.useState<TeamUser[]>([]);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [sharingUserId, setSharingUserId] = React.useState<string | null>(null);
  const [clearingLog, setClearingLog] = React.useState(false);
  // Personal share invite state
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviting, setInviting] = React.useState(false);
  const { toast } = useToast();
  const { fetchNotifications } = useNotifications();

  const isAgencyAsset = asset?.context === 'agency';

  React.useEffect(() => {
    if (isOpen) {
      setEmail(''); setPhone(''); setMessage(''); setIsCopied(null); setInviteEmail('');
      setActiveTab(isAgencyAsset ? 'team' : 'team');
      if (isAgencyAsset) loadTeamUsers();
    }
  }, [isOpen, isAgencyAsset]);

  const loadTeamUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getAgencyTeamMembers();
      setTeamUsers(users);
    } catch { /* silent */ }
    finally { setLoadingUsers(false); }
  };

  if (!asset) return null;

  const sharedWithSet = new Set(asset.sharedWith || []);
  const pendingSet = new Set(asset.pendingShareWith || []);

  // ── Agency: toggle team member access ──────────────────────────────────────
  const handleToggleUser = async (u: TeamUser) => {
    setSharingUserId(u.id);
    try {
      let updated: MediaAsset;
      if (sharedWithSet.has(u.id)) {
        updated = await revokeShare(asset.id, u.id);
        toast(`Access revoked for ${u.name}`, 'info');
      } else {
        updated = await shareWithUsers(asset.id, { userIds: [u.id] });
        toast(`Shared with ${u.name}`, 'success');
      }
      onAssetUpdate?.(updated);
      fetchNotifications();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to update share', 'error');
    } finally { setSharingUserId(null); }
  };

  // ── Personal: invite by email ───────────────────────────────────────────────
  const handlePersonalInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const updated = await shareWithUsers(asset.id, { email: inviteEmail.trim() });
      onAssetUpdate?.(updated);
      toast(`Invite sent to ${inviteEmail}`, 'success');
      setInviteEmail('');
      fetchNotifications();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to send invite', 'error');
    } finally { setInviting(false); }
  };

  const handleCopyLink = async (type: 'view' | 'edit') => {
    const url = type === 'edit'
      ? `${window.location.origin}/gallery/share/${asset.id}/edit`
      : `${window.location.origin}/gallery/share/${asset.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(type);
      toast(`${type === 'edit' ? 'Edit' : 'View'} link copied`, 'success');
      setTimeout(() => setIsCopied(null), 2500);
    } catch { toast('Failed to copy link', 'error'); }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSending(true);
    try {
      await shareMedia(asset.id, 'email', { email, message });
      toast(`Share link sent to ${email}`, 'success');
      setEmail(''); setMessage('');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to send email', 'error');
    } finally { setIsSending(false); }
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsSending(true);
    try {
      await shareMedia(asset.id, 'whatsapp', { phone, message });
      toast(`WhatsApp message sent to ${phone}`, 'success');
      setPhone(''); setMessage('');
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to send WhatsApp message', 'error');
    } finally { setIsSending(false); }
  };

  const handleClearViewLog = async () => {
    setClearingLog(true);
    try {
      const updated = await clearViewLog(asset.id);
      onAssetUpdate?.(updated);
      toast('View log cleared', 'success');
    } catch { toast('Failed to clear log', 'error'); }
    finally { setClearingLog(false); }
  };

  const tabs: { id: ShareTab; label: string; icon: React.ReactNode }[] = [
    { id: 'team', label: isAgencyAsset ? 'Team' : 'Invite', icon: isAgencyAsset ? <Users size={14} /> : <Mail size={14} /> },
    { id: 'link', label: 'Link', icon: <LinkIcon size={14} /> },
    { id: 'access', label: 'Access', icon: <Eye size={14} /> },
    { id: 'email', label: 'Email', icon: <Mail size={14} /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={14} /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Asset" maxWidth="max-w-md">
      <div className="space-y-5 py-2">
        {/* Asset preview */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/20">
            {asset.category === 'Video'
              ? <video src={asset.url} className="w-full h-full object-cover" muted />
              : <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-text truncate">{asset.title}</h4>
            <p className="text-xs text-text-muted">{asset.category} • {asset.metadata.fileType} • {asset.metadata.fileSize}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full',
                isAgencyAsset ? 'bg-primary/10 text-primary' : 'bg-white/10 text-text-muted')}>
                {isAgencyAsset ? 'Agency Asset' : 'Personal Asset'}
              </span>
              {(asset.sharedWith?.length ?? 0) > 0 && (
                <span className="text-[10px] text-primary font-bold">
                  {asset.sharedWith.length} shared
                </span>
              )}
              {(asset.pendingShareWith?.length ?? 0) > 0 && (
                <span className="text-[10px] text-amber-500 font-bold">
                  {asset.pendingShareWith.length} pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all',
                activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text-muted hover:text-text hover:bg-white/5'
              )}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Team tab (agency) / Invite tab (personal) ── */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            {isAgencyAsset ? (
              /* Agency: show team members list */
              <>
                <p className="text-xs text-text-muted">Toggle access for your agency team members.</p>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : teamUsers.length === 0 ? (
                  <div className="py-8 text-center">
                    <Users size={28} className="text-text-muted mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-text-muted">No team members yet.</p>
                    <p className="text-xs text-text-muted mt-1">Invite team members from Settings → Agency Profile.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {teamUsers.map(u => {
                      const isShared = sharedWithSet.has(u.id);
                      const isLoading = sharingUserId === u.id;
                      return (
                        <div key={u.id}
                          className={cn('flex items-center justify-between p-3 rounded-2xl border transition-all',
                            isShared ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                          )}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {(u as any).avatar ? (
                              <img src={(u as any).avatar} alt={u.name} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                                {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-text truncate">{u.name}</p>
                              <p className="text-[10px] text-text-muted truncate">{u.email}</p>
                            </div>
                          </div>
                          <button onClick={() => handleToggleUser(u)} disabled={isLoading}
                            className={cn('ml-3 p-2 rounded-xl transition-all shrink-0',
                              isShared ? 'bg-primary/20 text-primary hover:bg-red-500/20 hover:text-red-400' : 'bg-white/5 text-text-muted hover:bg-primary/20 hover:text-primary'
                            )}>
                            {isLoading ? <Loader2 size={14} className="animate-spin" />
                              : isShared ? <UserCheck size={14} /> : <Users size={14} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Personal: email invite with pending list */
              <>
                <p className="text-xs text-text-muted">
                  Invite someone by email. They'll receive a notification and must accept before seeing this asset in their gallery.
                </p>
                <form onSubmit={handlePersonalInvite} className="flex gap-2">
                  <Input
                    type="email"
                    label="Email address"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                  />
                  <div className="flex items-end">
                    <Button type="submit" isLoading={inviting} className="rounded-xl h-11 px-4 font-bold whitespace-nowrap">
                      <Send size={14} className="mr-1.5" /> Invite
                    </Button>
                  </div>
                </form>

                {/* Pending invites */}
                {(asset.pendingShareWith?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={11} /> Pending ({asset.pendingShareWith.length})
                    </p>
                    {asset.pendingShareWith.map(uid => (
                      <div key={uid} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-amber-500 shrink-0" />
                          <span className="text-xs text-text-muted font-mono">{uid}</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Already shared */}
                {(asset.sharedWith?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                      <UserCheck size={11} /> Has Access ({asset.sharedWith.length})
                    </p>
                    {asset.sharedWith.map(uid => (
                      <div key={uid} className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-emerald-500 shrink-0" />
                          <span className="text-xs text-text-muted font-mono">{uid}</span>
                        </div>
                        <button onClick={() => revokeShare(asset.id, uid).then(u => onAssetUpdate?.(u)).catch(() => {})}
                          className="p-1 hover:bg-red-500/10 rounded-lg transition-colors text-text-muted hover:text-red-500">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Link tab */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Globe size={12} /> View Link — read-only, no login required
              </p>
              <div className="flex gap-2">
                <input readOnly value={`${window.location.origin}/gallery/share/${asset.id}`}
                  className="flex-1 h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-text-muted outline-none font-mono" />
                <Button onClick={() => handleCopyLink('view')} variant="outline" className="flex-shrink-0 h-11 px-4">
                  {isCopied === 'view' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Shield size={12} className="text-primary" /> Edit Link — login required, can upload variants
              </p>
              <div className="flex gap-2">
                <input readOnly value={`${window.location.origin}/gallery/share/${asset.id}/edit`}
                  className="flex-1 h-11 bg-white/5 border border-primary/20 rounded-xl px-4 text-xs text-text-muted outline-none font-mono" />
                <Button onClick={() => handleCopyLink('edit')} variant="outline" className="flex-shrink-0 h-11 px-4 border-primary/30">
                  {isCopied === 'edit' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Access Log tab */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                  <Eye size={12} /> View Link Access ({asset.viewLog?.length ?? 0})
                </p>
                {(asset.viewLog?.length ?? 0) > 0 && (
                  <button onClick={handleClearViewLog} disabled={clearingLog}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold transition-colors disabled:opacity-40">
                    {clearingLog ? 'Clearing...' : 'Clear All'}
                  </button>
                )}
              </div>
              {(asset.viewLog?.length ?? 0) === 0 ? (
                <p className="text-xs text-text-muted py-3 text-center">No views yet</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {(asset.viewLog || []).map((v, i) => (
                    <div key={i} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-text font-mono">{v.ip}</span>
                        <span className="text-text-muted">{new Date(v.viewedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-text-muted truncate">{v.userAgent}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2 pt-3 border-t border-border">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Edit2 size={12} /> Edit Link Access ({asset.editLog?.length ?? 0})
              </p>
              {(asset.editLog?.length ?? 0) === 0 ? (
                <p className="text-xs text-text-muted py-3 text-center">No edit link accesses yet</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                  {(asset.editLog || []).map((e, i) => (
                    <div key={i} className="p-2.5 bg-primary/5 border border-primary/15 rounded-xl text-[10px] space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-text">{e.name || 'Unknown'}</span>
                        <span className="text-text-muted">{new Date(e.accessedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-text-muted">{e.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email tab */}
        {activeTab === 'email' && (
          <form onSubmit={handleSendEmail} className="space-y-4">
            <Input type="email" label="Recipient Email" placeholder="colleague@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Message (optional)</label>
              <textarea placeholder="Add a personal message..." value={message} onChange={e => setMessage(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[80px] resize-none transition-all" />
            </div>
            <Button type="submit" className="w-full" disabled={isSending || !email}>
              {isSending ? <><Loader2 size={15} className="animate-spin mr-2" />Sending...</> : <><Send size={15} className="mr-2" />Send Email</>}
            </Button>
          </form>
        )}

        {/* WhatsApp tab */}
        {activeTab === 'whatsapp' && (
          <form onSubmit={handleSendWhatsApp} className="space-y-4">
            <Input type="tel" label="WhatsApp Number" placeholder="+1234567890 (include country code)" value={phone} onChange={e => setPhone(e.target.value)} required />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Message (optional)</label>
              <textarea placeholder="Add a personal message..." value={message} onChange={e => setMessage(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[80px] resize-none transition-all" />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500" disabled={isSending || !phone}>
              {isSending ? <><Loader2 size={15} className="animate-spin mr-2" />Sending...</> : <><MessageCircle size={15} className="mr-2" />Send via WhatsApp</>}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};
