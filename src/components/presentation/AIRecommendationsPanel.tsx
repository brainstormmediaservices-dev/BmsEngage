import { useState, useEffect } from 'react';
import { Sparkles, Star, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { presentationService } from '../../services/presentationService';
import { MediaAsset } from '../../types/media';
import { StarButton } from '../ui/StarButton';
import { cn } from '../../lib/utils';

interface AIRecommendationsPanelProps {
  onAssetClick?: (asset: MediaAsset) => void;
  className?: string;
}

export const AIRecommendationsPanel = ({ onAssetClick, className }: AIRecommendationsPanelProps) => {
  const [recommended, setRecommended] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    presentationService.recommendations()
      .then(r => setRecommended(r.recommended))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={cn("bg-card border border-border rounded-2xl p-5", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-text">Best Picks</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!recommended.length) return null;

  return (
    <div className={cn("bg-card border border-border rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-text">Best Picks</h3>
        </div>
        <span className="text-[10px] text-text-muted font-medium">AI recommended</span>
      </div>
      <div className="space-y-2">
        {recommended.map(asset => (
          <motion.div
            key={asset.id}
            whileHover={{ x: 4 }}
            onClick={() => onAssetClick?.(asset)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0">
              {asset.metadata?.mimeType?.startsWith('video/') ? (
                <video src={asset.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text truncate">{asset.title}</p>
              <p className="text-[10px] text-text-muted">{asset.category}</p>
            </div>
            <StarButton assetId={asset.id} size={14} />
            <ArrowRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
