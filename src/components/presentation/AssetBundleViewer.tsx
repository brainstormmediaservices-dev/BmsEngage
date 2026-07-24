import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package, X, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MediaAsset, BundleItem } from '../../types/media';

interface AssetBundleViewerProps {
  asset: MediaAsset;
  onClose?: () => void;
  className?: string;
}

export const AssetBundleViewer = ({ asset, onClose, className }: AssetBundleViewerProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const items: BundleItem[] = asset.bundleItems || [];
  const current = items[activeIndex];

  if (!items.length) {
    return (
      <div className={cn("text-center py-8 text-text-muted", className)}>
        <Package size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No bundle items</p>
      </div>
    );
  }

  const prev = () => setActiveIndex(i => (i > 0 ? i - 1 : items.length - 1));
  const next = () => setActiveIndex(i => (i < items.length - 1 ? i + 1 : 0));

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main preview */}
      <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-border group">
        {current?.metadata?.mimeType?.startsWith('video/') ? (
          <video src={current.url} className="w-full h-full object-contain" controls />
        ) : (
          <img src={current.url} alt={current.title} className="w-full h-full object-contain" />
        )}
        {items.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
              <ChevronRight size={16} />
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-[10px] font-bold">
          {activeIndex + 1} / {items.length}
        </div>
        {onClose && (
          <button onClick={onClose}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Title */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-text truncate">{current?.title || 'Untitled'}</h4>
        <a href={current?.url} target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-text-muted hover:text-primary transition-colors">
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={item._id || i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                i === activeIndex ? "border-primary" : "border-border opacity-60 hover:opacity-100"
              )}
            >
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
