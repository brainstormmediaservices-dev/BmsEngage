import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { assetStarService } from '../../services/presentationService';
import { cn } from '../../lib/utils';

interface StarButtonProps {
  assetId: string;
  className?: string;
  size?: number;
  onToggle?: (starred: boolean) => void;
}

export const StarButton = ({ assetId, className, size = 16, onToggle }: StarButtonProps) => {
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    assetStarService.check(assetId).then(r => setStarred(r.starred)).catch(() => {});
  }, [assetId]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (starred) {
        await assetStarService.unstar(assetId);
        setStarred(false);
        onToggle?.(false);
      } else {
        await assetStarService.star(assetId);
        setStarred(true);
        onToggle?.(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        'p-1.5 rounded-full transition-all hover:scale-110',
        starred ? 'text-amber-400' : 'text-white/50 hover:text-amber-300',
        loading && 'opacity-50 cursor-wait',
        className,
      )}
      title={starred ? 'Remove from starred' : 'Star this asset'}
    >
      <Star size={size} fill={starred ? 'currentColor' : 'none'} />
    </button>
  );
};
