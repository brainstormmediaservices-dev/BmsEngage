import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Edit2, 
  Trash2, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Music2 as TikTok,
  ExternalLink,
  Heart,
  MessageSquare,
  Share2,
  Eye
} from 'lucide-react';
import { SocialPost } from '../../types/social';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

const platformIcons: Record<string, any> = {
  Instagram,
  Facebook,
  Twitter,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  TikTok,
};

interface PostDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialPost | null;
  onEdit: (post: SocialPost) => void;
  onDelete: (post: SocialPost) => void;
}

export const PostDetailsModal = ({ isOpen, onClose, post, onEdit, onDelete }: PostDetailsModalProps) => {
  if (!post) return null;

  const scheduledDate = post.scheduledDate || post.publishedDate;
  const dateObj = scheduledDate ? new Date(scheduledDate) : new Date();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Post Details"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Media Preview */}
          <div className="w-full md:w-1/2 aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
            {post.mediaUrls && post.mediaUrls.length > 0 ? (
              <img 
                src={post.mediaUrls[0]} 
                alt="Post media" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted italic text-xs">
                No media attached
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              {post.platforms.map(p => {
                const Icon = platformIcons[p] || Globe;
                return (
                  <div key={p} className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white">
                    <Icon size={16} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Info */}
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  post.status === 'Published' ? "bg-emerald-500/10 text-emerald-500" : 
                  post.status === 'Scheduled' ? "bg-primary/10 text-primary" : "bg-white/10 text-text-muted"
                )}>
                  {post.status}
                </span>
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
                  <Clock size={14} />
                  {format(dateObj, 'h:mm a')}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Caption</h4>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Scheduled For</h4>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-xs font-bold text-text">{format(dateObj, 'EEEE, MMMM do, yyyy')}</span>
                </div>
              </div>

              {post.engagement && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Engagement</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-pink-500">
                        <Heart size={14} />
                        <span className="text-[10px] font-bold">Likes</span>
                      </div>
                      <span className="text-xs font-black text-text">{post.engagement.likes}</span>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-500">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-bold">Comments</span>
                      </div>
                      <span className="text-xs font-black text-text">{post.engagement.comments}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
          <Button 
            variant="outline" 
            className="border-red-500/20 text-red-500 hover:bg-red-500/10"
            onClick={() => onDelete(post)}
          >
            <Trash2 size={18} className="mr-2" /> Delete Post
          </Button>
          <Button onClick={() => onEdit(post)}>
            <Edit2 size={18} className="mr-2" /> Edit Post
          </Button>
        </div>
      </div>
    </Modal>
  );
};
