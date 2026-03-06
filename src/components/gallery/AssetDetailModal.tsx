import * as React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Layers, 
  Calendar, 
  User, 
  Tag, 
  Info, 
  Download, 
  Share2, 
  History,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Maximize2,
  Edit2
} from 'lucide-react';
import { MediaAsset, MediaVariant } from '../../types/media';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../ui/Toast';

interface AssetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAsset | null;
  onEdit: (asset: MediaAsset) => void;
  onDownload: (asset: MediaAsset | MediaVariant) => void;
  onShare: (asset: MediaAsset) => void;
}

export const AssetDetailModal = ({ isOpen, onClose, asset, onEdit, onDownload, onShare }: AssetDetailModalProps) => {
  const [showMetadata, setShowMetadata] = React.useState(true);
  const [activeVariant, setActiveVariant] = React.useState<MediaAsset | MediaVariant | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const { toast } = useToast();

  const sortedVariants = React.useMemo(() => {
    if (!asset) return [];
    return [...asset.variants].sort((a, b) => 
      new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
    );
  }, [asset]);

  React.useEffect(() => {
    if (asset) {
      if (sortedVariants.length > 0) {
        setActiveVariant(sortedVariants[0]);
      } else {
        setActiveVariant(asset);
      }
    }
  }, [asset, sortedVariants]);

  if (!asset || !activeVariant) return null;

  const isVariant = 'parentAssetId' in activeVariant;
  const metadata = activeVariant.metadata;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={asset.title}
      maxWidth="max-w-6xl"
    >
      <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
        {/* Left: Preview Section */}
        <div className="flex-1 space-y-6">
          <div className="relative aspect-video bg-black/40 rounded-3xl overflow-hidden border border-border group flex items-center justify-center">
            {asset.category === 'Video' ? (
              <video 
                src={activeVariant.url} 
                controls 
                className="w-full h-full object-contain"
                preload="metadata"
              />
            ) : (
              <img 
                src={activeVariant.url} 
                alt={activeVariant.title} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="outline" size="sm" className="bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60">
                <Maximize2 size={16} className="mr-2" /> Fullscreen
              </Button>
            </div>
          </div>

          {/* Variants List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <History size={16} /> Version History
              </h4>
              <span className="text-xs text-primary font-bold">{asset.variants.length + 1} Versions Available</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Variants (Sorted Latest First) */}
              {sortedVariants.map((variant, index) => (
                <button 
                  key={variant.id}
                  onClick={() => setActiveVariant(variant)}
                  className={cn(
                    "p-3 rounded-xl border transition-all text-left group relative",
                    activeVariant.id === variant.id 
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/20" 
                      : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", activeVariant.id === variant.id ? "text-primary" : "text-text-muted")}>Variant</p>
                  <p className="text-xs font-bold text-text truncate">v{variant.version}.0 - {variant.title}</p>
                  {index === 0 && (
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-primary text-[6px] font-bold uppercase tracking-widest text-white">
                      Latest
                    </div>
                  )}
                </button>
              ))}

              {/* Original (Always Last) */}
              <button 
                onClick={() => setActiveVariant(asset)}
                className={cn(
                  "p-3 rounded-xl border transition-all text-left group",
                  activeVariant.id === asset.id 
                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/20" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", activeVariant.id === asset.id ? "text-primary" : "text-text-muted")}>Original</p>
                <p className="text-xs font-bold text-text truncate">v1.0 - Master</p>
                {sortedVariants.length === 0 && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-primary text-[6px] font-bold uppercase tracking-widest text-white">
                    Latest
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Metadata Panel */}
        <div className="w-full lg:w-[380px] space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {asset.category === 'Image' ? <ImageIcon size={20} /> : asset.category === 'Video' ? <Film size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{asset.category}</p>
                  <p className="text-sm font-bold text-text">{metadata.fileType} Asset</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    if (!activeVariant) return;
                    setIsDownloading(true);
                    try {
                      await onDownload(activeVariant);
                      toast('Download started successfully', 'success');
                    } catch (err) {
                      toast('Failed to prepare download', 'error');
                    } finally {
                      setIsDownloading(false);
                    }
                  }}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Clock size={16} />
                    </motion.div>
                  ) : (
                    <Download size={16} />
                  )}
                  <span className="ml-2 hidden sm:inline">Download</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => asset && onShare(asset)}>
                  <Share2 size={16} />
                  <span className="ml-2 hidden sm:inline">Share</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Description</h5>
                <p className="text-sm text-text leading-relaxed">{asset.description || 'No description provided.'}</p>
              </div>

              <div>
                <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Tags</h5>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <button 
                onClick={() => setShowMetadata(!showMetadata)}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-text hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-2"><Info size={14} /> Technical Metadata</span>
                {showMetadata ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence>
                {showMetadata && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-text-muted uppercase font-bold">File Size</p>
                        <p className="text-xs font-bold text-text">{metadata.fileSize}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-text-muted uppercase font-bold">Resolution</p>
                        <p className="text-xs font-bold text-text">{metadata.resolution || `${metadata.width}x${metadata.height}`}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-text-muted uppercase font-bold">MIME Type</p>
                        <p className="text-xs font-bold text-text truncate">{metadata.mimeType}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-text-muted uppercase font-bold">Color Model</p>
                        <p className="text-xs font-bold text-text">{metadata.colorModel || 'N/A'}</p>
                      </div>
                      {metadata.duration && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-text-muted uppercase font-bold">Duration</p>
                          <p className="text-xs font-bold text-text">{metadata.duration}</p>
                        </div>
                      )}
                      {metadata.frameRate && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-text-muted uppercase font-bold">Frame Rate</p>
                          <p className="text-xs font-bold text-text">{metadata.frameRate} fps</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6 border-t border-border space-y-3">
              <div className="flex items-center gap-3 text-xs">
                <Calendar size={14} className="text-text-muted" />
                <span className="text-text-muted">Uploaded on</span>
                <span className="text-text font-bold">{new Date(metadata.createdDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <User size={14} className="text-text-muted" />
                <span className="text-text-muted">Uploaded by</span>
                <span className="text-text font-bold">{asset.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Clock size={14} className="text-text-muted" />
                <span className="text-text-muted">Last modified</span>
                <span className="text-text font-bold">{new Date(metadata.modifiedDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <Button onClick={() => onEdit(asset)} className="w-full">
                <Edit2 size={16} className="mr-2" /> Edit Asset Details
              </Button>
              <Button variant="outline" className="w-full">
                <ExternalLink size={16} className="mr-2" /> Open in New Tab
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
