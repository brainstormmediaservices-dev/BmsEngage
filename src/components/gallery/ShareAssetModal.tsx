import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Mail, Link as LinkIcon, Send, Copy, Check, Shield, Clock, Globe } from 'lucide-react';
import { MediaAsset } from '../../types/media';
import { useToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'motion/react';

interface ShareAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
}

export const ShareAssetModal = ({ isOpen, onClose, asset }: ShareAssetModalProps) => {
  const [email, setEmail] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const { toast } = useToast();

  if (!asset) return null;

  const shareUrl = `${window.location.origin}/share/${asset.id}`;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSending(false);
    setEmail('');
    toast('Access link sent successfully to ' + email, 'success');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast('Link copied to clipboard', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Share Asset"
      maxWidth="max-w-md"
    >
      <div className="space-y-8 py-2">
        {/* Asset Preview Mini */}
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
            <img 
              src={asset.url} 
              alt={asset.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-text truncate">{asset.title}</h4>
            <p className="text-xs text-text-muted">{asset.category} • {asset.metadata.fileType}</p>
          </div>
        </div>

        {/* Option 1: Email */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
            <Mail size={14} /> Share via Email
          </div>
          <form onSubmit={handleSendEmail} className="relative">
            <Input
              type="email"
              placeholder="Enter recipient's email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pr-12"
              required
            />
            <button
              type="submit"
              disabled={isSending || !email || !email.includes('@')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary-light disabled:text-text-muted transition-colors"
            >
              {isSending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Clock size={18} />
                </motion.div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
          <p className="text-[10px] text-text-muted flex items-center gap-1.5 px-1">
            <Shield size={10} /> A secure temporary access link will be sent.
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="bg-card px-4 text-text-muted">Or share via link</span>
          </div>
        </div>

        {/* Option 2: Link */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-muted">
            <LinkIcon size={14} /> Shareable Link
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                readOnly
                value={shareUrl}
                className="pr-4 bg-white/5 border-white/10 text-text-muted text-xs"
              />
            </div>
            <Button 
              onClick={handleCopyLink}
              variant="outline"
              className="flex-shrink-0"
            >
              {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </Button>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
            <Globe size={14} className="text-amber-500 mt-0.5" />
            <p className="text-[10px] text-amber-200/70 leading-relaxed">
              Anyone with this link can view this asset. You can revoke access at any time from the asset settings.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
