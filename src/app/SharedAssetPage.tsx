import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, ExternalLink, FileText, Film, Image as ImageIcon, Calendar, User, Tag, History, Layers } from 'lucide-react';
import { MediaAsset, MediaVariant } from '../types/media';
import { cn } from '../lib/utils';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

export default function SharedAssetPage() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = React.useState<MediaAsset | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [downloading, setDownloading] = React.useState(false);
  const [activeVersion, setActiveVersion] = React.useState<MediaAsset | MediaVariant | null>(null);

  React.useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/media/public/${id}`);
        if (!res.ok) throw new Error('Asset not found');
        const data = await res.json();
        setAsset(data.media);
      } catch (e: any) {
        setError(e.message || 'Failed to load asset');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Set active version to latest variant (or original if none)
  React.useEffect(() => {
    if (!asset) return;
    if (asset.variants?.length > 0) {
      const sorted = [...asset.variants].sort(
        (a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
      );
      setActiveVersion(sorted[0]);
    } else {
      setActiveVersion(asset);
    }
  }, [asset]);

  const sortedVariants = React.useMemo(() => {
    if (!asset?.variants) return [];
    return [...asset.variants].sort(
      (a, b) => new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime()
    );
  }, [asset]);

  const handleDownload = async () => {
    if (!activeVersion) return;
    setDownloading(true);
    try {
      const response = await fetch(activeVersion.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeVersion.title}.${activeVersion.metadata.fileType?.toLowerCase() || 'file'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(activeVersion.url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error || !asset || !activeVersion) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center text-text-muted mb-2">
        <FileText size={32} />
      </div>
      <h1 className="text-2xl font-bold text-text">Asset Not Found</h1>
      <p className="text-text-muted max-w-sm">This shared link may have expired or the asset has been removed.</p>
      <Link to="/" className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">
        Go to BMS Engage
      </Link>
    </div>
  );

  const isVideo = asset.metadata.mimeType?.startsWith('video/') || asset.category === 'Video';
  const isPdf = activeVersion.metadata.mimeType === 'application/pdf';
  const totalVersions = sortedVariants.length + 1;

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <Link to="/" className="text-lg font-black text-primary tracking-tight">BMS Engage</Link>
        <span className="text-xs text-text-muted font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10">Shared Asset</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: Preview + Version History */}
          <div className="flex-1 space-y-6">
            {/* Active version preview */}
            <div className="rounded-3xl overflow-hidden border border-border bg-black/30 flex items-center justify-center min-h-[300px] max-h-[520px]">
              {isVideo ? (
                <video src={activeVersion.url} controls className="w-full max-h-[520px] object-contain" />
              ) : isPdf ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <FileText size={64} className="text-primary" />
                  <p className="text-text-muted font-medium">PDF Document</p>
                  <a href={activeVersion.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm">
                    <ExternalLink size={16} /> Open PDF
                  </a>
                </div>
              ) : (
                <img src={activeVersion.url} alt={activeVersion.title}
                  className="w-full max-h-[520px] object-contain" referrerPolicy="no-referrer" />
              )}
            </div>

            {/* Version History */}
            {totalVersions > 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                    <History size={15} /> Version History
                  </h3>
                  <span className="text-xs text-primary font-bold">{totalVersions} Versions</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {/* Variants — latest first */}
                  {sortedVariants.map((variant, index) => (
                    <button key={variant.id} onClick={() => setActiveVersion(variant)}
                      className={cn('relative p-0 rounded-2xl border overflow-hidden transition-all group',
                        activeVersion.id === variant.id
                          ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                      )}>
                      {/* Thumbnail */}
                      <div className="aspect-video bg-black/20">
                        {variant.metadata.mimeType?.startsWith('video/') ? (
                          <video src={variant.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={variant.url} alt={variant.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      {/* Label */}
                      <div className="p-2 bg-card">
                        <p className={cn('text-[9px] font-bold uppercase tracking-widest mb-0.5',
                          activeVersion.id === variant.id ? 'text-primary' : 'text-text-muted')}>
                          Variant
                        </p>
                        <p className="text-[10px] font-bold text-text truncate">v{variant.version}.0</p>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-primary text-[8px] font-bold uppercase text-white">
                          Latest
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Original */}
                  <button onClick={() => setActiveVersion(asset)}
                    className={cn('relative p-0 rounded-2xl border overflow-hidden transition-all',
                      activeVersion.id === asset.id
                        ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    )}>
                    <div className="aspect-video bg-black/20">
                      {isVideo ? (
                        <video src={asset.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="p-2 bg-card">
                      <p className={cn('text-[9px] font-bold uppercase tracking-widest mb-0.5',
                        activeVersion.id === asset.id ? 'text-primary' : 'text-text-muted')}>
                        Original
                      </p>
                      <p className="text-[10px] font-bold text-text truncate">v1.0 — Master</p>
                    </div>
                    {sortedVariants.length === 0 && (
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-primary text-[8px] font-bold uppercase text-white">
                        Latest
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Info + Actions */}
          <div className="w-full lg:w-[320px] space-y-4">
            <div className="p-5 bg-card border border-border rounded-3xl space-y-5">
              {/* Category + type */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {asset.category === 'Video' ? <Film size={20} /> : asset.category === 'Image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{asset.category}</p>
                  <p className="text-sm font-bold text-text">{activeVersion.metadata.fileType} Asset</p>
                </div>
              </div>

              {/* Title + description */}
              <div>
                <h1 className="text-xl font-black text-text mb-1">{asset.title}</h1>
                {asset.description && <p className="text-sm text-text-muted leading-relaxed">{asset.description}</p>}
              </div>

              {/* Tags */}
              {asset.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {asset.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="pt-4 border-t border-border space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-text-muted">
                  <User size={13} /> Uploaded by <span className="text-text font-bold ml-auto">{asset.uploadedBy}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Calendar size={13} /> Date <span className="text-text font-bold ml-auto">{new Date(asset.metadata.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <Layers size={13} /> File size <span className="text-text font-bold ml-auto">{activeVersion.metadata.fileSize}</span>
                </div>
                <div className="flex items-center gap-2 text-text-muted">
                  <History size={13} /> Versions <span className="text-text font-bold ml-auto">{totalVersions}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button onClick={handleDownload} disabled={downloading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-colors disabled:opacity-60 text-sm">
                  <Download size={16} /> {downloading ? 'Downloading...' : 'Download'}
                </button>
                <a href={activeVersion.url} target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 border border-border hover:border-primary/50 text-text-muted hover:text-text rounded-xl font-bold transition-colors text-sm">
                  <ExternalLink size={15} /> Open Original
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
