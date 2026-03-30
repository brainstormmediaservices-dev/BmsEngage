import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MediaAsset, MediaCategory } from '../types/media';
import { mediaService, requestDeleteMedia, acceptDeleteRequest } from '../services/mediaService';
import { MediaGalleryTopBar } from '../components/gallery/MediaGalleryTopBar';
import { MediaAssetCard } from '../components/gallery/MediaAssetCard';
import { UploadMediaModal } from '../components/gallery/UploadMediaModal';
import { AssetDetailModal } from '../components/gallery/AssetDetailModal';
import { EditAssetModal } from '../components/gallery/EditAssetModal';
import { DeleteAssetModal } from '../components/gallery/DeleteAssetModal';
import { ShareAssetModal } from '../components/gallery/ShareAssetModal';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFileType, setActiveFileType] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest');
  const { toast } = useToast();
  const { canUploadAsset, canDeleteAsset } = usePermissions();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Load media from API
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await mediaService.getMedia();
        setMedia(data);
      } catch {
        toast('Failed to load media', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Handle ?editAsset=:id from edit share link — open variant upload for that asset
  useEffect(() => {
    const editAssetId = searchParams.get('editAsset');
    if (!editAssetId || isLoading) return;
    const target = media.find(m => m.id === editAssetId);
    if (target) {
      setParentForVariant(target);
      setIsUploadOpen(true);
      // Log edit link access on the backend
      mediaService.getMediaById?.(editAssetId, 'editlink').catch(() => {});
    }
  }, [searchParams, media, isLoading]);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [parentForVariant, setParentForVariant] = useState<MediaAsset | undefined>(undefined);
  const [correctionReplyTo, setCorrectionReplyTo] = useState<string | undefined>(undefined);

  // Filtering Logic
  const filteredMedia = useMemo(() => {
    return media.filter(asset => {
      const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || asset.category === activeCategory;
      const matchesFileType = activeFileType === 'All' || asset.metadata.fileType === activeFileType;
      
      return matchesSearch && matchesCategory && matchesFileType;
    }).sort((a, b) => {
      if (activeSort === 'Newest') return new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime();
      if (activeSort === 'Oldest') return new Date(a.metadata.createdDate).getTime() - new Date(b.metadata.createdDate).getTime();
      if (activeSort === 'A–Z') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [media, searchQuery, activeCategory, activeFileType, activeSort]);

  const handleUpload = (newAsset: MediaAsset) => {
    // If it's an updated asset (variant added), replace it; otherwise prepend
    setMedia((prev) => {
      const exists = prev.find((m) => m.id === newAsset.id);
      if (exists) return prev.map((m) => m.id === newAsset.id ? newAsset : m);
      return [newAsset, ...prev];
    });
    setParentForVariant(undefined);
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
      await mediaService.deleteMedia(selectedAsset.id);
      setMedia(prev => prev.filter(m => m.id !== selectedAsset.id));
      toast('Asset deleted successfully', 'success');
      setIsDeleteOpen(false);
      setSelectedAsset(null);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.requiresRequest) {
        // Need to send delete request first
        toast('Asset is shared — sending delete request to shared users...', 'info');
        try {
          const updated = await requestDeleteMedia(selectedAsset.id);
          setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
          toast('Delete request sent to all shared users', 'success');
        } catch { toast('Failed to send delete request', 'error'); }
      } else if (data?.pendingCount) {
        toast(`Waiting for ${data.pendingCount} user(s) to accept the delete request`, 'info');
      } else {
        toast('Failed to delete asset', 'error');
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const handleAcceptDelete = async (asset: MediaAsset) => {
    try {
      const updated = await acceptDeleteRequest(asset.id);
      setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
      toast('Delete request accepted', 'success');
    } catch { toast('Failed to accept delete request', 'error'); }
  };

  const handleDownload = (asset: any) => {
    toast(`Downloading ${asset.title}...`, 'success');
    // In a real app, this would trigger a file download
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setActiveFileType('All');
    setActiveSort('Newest');
    toast('All filters cleared', 'info');
  };

  return (
    <div className="space-y-8 pb-20">
      <MediaGalleryTopBar 
        onSearch={setSearchQuery}
        onCategoryChange={setActiveCategory}
        onFileTypeChange={setActiveFileType}
        onSortChange={setActiveSort}
        onClearFilters={handleClearFilters}
        onUploadClick={() => { setParentForVariant(undefined); setIsUploadOpen(true); }}
        canUpload={canUploadAsset}
        activeCategory={activeCategory}
        activeFileType={activeFileType}
        activeSort={activeSort}
        searchQuery={searchQuery}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredMedia.map((asset) => (
              <MediaAssetCard 
                key={asset.id}
                asset={asset}
                currentUserId={user?.id}
                onView={(a) => { setSelectedAsset(a); setIsDetailOpen(true); }}
                onEdit={(a) => { setSelectedAsset(a); setIsEditOpen(true); }}
                onAddVariant={(a) => { setCorrectionReplyTo(undefined); setParentForVariant(a); setIsUploadOpen(true); }}
                onAddVariantForCorrection={(a, corrId) => { setCorrectionReplyTo(corrId); setParentForVariant(a); setIsUploadOpen(true); }}
                onDelete={(a) => { setSelectedAsset(a); setIsDeleteOpen(true); }}
                onShare={(a) => { setSelectedAsset(a); setIsShareOpen(true); }}
                onAcceptDelete={handleAcceptDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center text-text-muted mb-6">
            <Search size={32} />
          </div>
          <h3 className="text-2xl font-bold text-text mb-2">No assets found</h3>
          <p className="text-text-muted max-w-md">We couldn't find any media matching your current filters. Try adjusting your search or category.</p>
          <Button 
            variant="outline" 
            className="mt-8"
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveFileType('All'); }}
          >
            Clear All Filters
          </Button>
        </motion.div>
      )}

      {/* Modals */}
      <UploadMediaModal 
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); setParentForVariant(undefined); setCorrectionReplyTo(undefined); }}
        onUpload={handleUpload}
        parentAsset={parentForVariant}
        correctionReplyTo={correctionReplyTo}
      />

      <AssetDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        asset={selectedAsset}
        onEdit={(a) => { setIsDetailOpen(false); setSelectedAsset(a); setIsEditOpen(true); }}
        onDownload={handleDownload}
        onShare={(a) => { setSelectedAsset(a); setIsShareOpen(true); }}
        onAssetUpdate={(updated) => {
          setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
        onAddVariantForCorrection={(a, corrId) => {
          setIsDetailOpen(false);
          setCorrectionReplyTo(corrId);
          setParentForVariant(a);
          setIsUploadOpen(true);
        }}
      />

      <EditAssetModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        asset={selectedAsset}
        onSave={(updated) => {
          setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
      />

      <DeleteAssetModal 
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedAsset(null); }}
        onConfirm={handleDelete}
        asset={selectedAsset}
        isLoading={isDeleting}
      />

      <ShareAssetModal 
        isOpen={isShareOpen}
        onClose={() => { setIsShareOpen(false); setSelectedAsset(null); }}
        asset={selectedAsset}
        onAssetUpdate={(updated) => {
          setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
          setSelectedAsset(updated);
        }}
      />
    </div>
  );
}
