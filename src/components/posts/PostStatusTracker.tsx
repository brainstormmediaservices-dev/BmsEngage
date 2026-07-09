import { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Loader2,
  AlertTriangle, Send, Eye, ExternalLink,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { postService, PlatformResult } from '../../services/postService';

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Facebook',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  instagram: 'Instagram',
};

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'bg-blue-500',
  twitter: 'bg-sky-400',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-pink-500',
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400',
};

interface PostStatusTrackerProps {
  postId: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  platformResults?: PlatformResult[];
  error?: string;
  scheduledTime?: string | null;
  publishedAt?: string | null;
  onRetry?: (id: string) => void;
  compact?: boolean;
}

export function PostStatusTracker({
  postId,
  platforms,
  status,
  platformResults = [],
  error,
  scheduledTime,
  publishedAt,
  onRetry,
  compact = false,
}: PostStatusTrackerProps) {
  const { toast } = useToast();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await postService.retry(postId);
      toast('Post queued for retry', 'success');
      onRetry?.(postId);
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to retry', 'error');
    } finally {
      setRetrying(false);
    }
  };

  const statusIcon = () => {
    switch (status) {
      case 'published': return <CheckCircle2 size={compact ? 14 : 18} className="text-emerald-500" />;
      case 'failed': return <XCircle size={compact ? 14 : 18} className="text-red-500" />;
      case 'scheduled': return <Clock size={compact ? 14 : 18} className="text-amber-500" />;
      default: return <Send size={compact ? 14 : 18} className="text-text-muted" />;
    }
  };

  const statusLabel = () => {
    switch (status) {
      case 'published': return 'Published';
      case 'failed': return 'Failed';
      case 'scheduled': return 'Scheduled';
      default: return 'Draft';
    }
  };

  const platformResultMap = platformResults.reduce((acc, r) => {
    acc[r.platform] = r;
    return acc;
  }, {} as Record<string, PlatformResult>);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {platforms.map(p => {
          const result = platformResultMap[p];
          const ok = result?.success;
          const fail = result && !result.success;
          return (
            <div
              key={p}
              title={`${PLATFORM_LABELS[p] || p}: ${ok ? 'Published' : fail ? `Failed: ${result.error}` : 'Pending'}`}
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0',
                ok ? PLATFORM_COLORS[p] || 'bg-emerald-500' :
                fail ? 'bg-red-500' :
                'bg-white/10'
              )}
            >
              {(PLATFORM_LABELS[p] || p)[0]?.toUpperCase()}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="glass border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcon()}
            <span className={cn(
              'text-sm font-bold',
              status === 'published' ? 'text-emerald-500' :
              status === 'failed' ? 'text-red-500' :
              status === 'scheduled' ? 'text-amber-500' :
              'text-text-muted'
            )}>
              {statusLabel()}
            </span>
          </div>
          {status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              isLoading={retrying}
              className="h-8 text-[10px] font-bold rounded-xl"
            >
              <RefreshCw size={12} className="mr-1" /> Retry
            </Button>
          )}
        </div>

        {scheduledTime && status === 'scheduled' && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Clock size={12} />
            Scheduled for {new Date(scheduledTime).toLocaleString()}
          </div>
        )}

        {publishedAt && status === 'published' && (
          <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <Eye size={12} />
            Published {new Date(publishedAt).toLocaleString()}
          </div>
        )}

        {error && status === 'failed' && (
          <div className="flex items-start gap-1.5 text-[11px] text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-2.5">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="border-t border-white/5 divide-y divide-white/5">
        {platforms.map(p => {
          const result = platformResultMap[p];
          const ok = result?.success;
          const fail = result && !result.success;
          return (
            <div key={p} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  ok ? 'bg-emerald-500' :
                  fail ? 'bg-red-500' :
                  'bg-white/20'
                )} />
                <span className="text-xs font-bold text-text">{PLATFORM_LABELS[p] || p}</span>
              </div>
              <div className="flex items-center gap-2">
                {ok && result?.postId && (
                  <span className="text-[10px] text-text-muted" title={result.postId}>
                    <ExternalLink size={10} />
                  </span>
                )}
                {ok && <span className="text-[10px] text-emerald-500 font-bold">Published</span>}
                {fail && (
                  <span className="text-[10px] text-red-500 font-bold truncate max-w-[120px]" title={result.error}>
                    {result.error}
                  </span>
                )}
                {!result && <Loader2 size={10} className="animate-spin text-text-muted" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
