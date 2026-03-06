import * as React from 'react';
import { useState, useMemo } from 'react';
import { MOCK_MEDIA } from '../lib/mock-data';
import { MediaAsset, MediaCategory } from '../types/media';
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

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaAsset[]>(MOCK_MEDIA);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFileType, setActiveFileType] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest');
  const { toast } = useToast();

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [parentForVariant, setParentForVariant] = useState<MediaAsset | undefined>(undefined);

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

  const handleUpload = (newAssetData: Partial<MediaAsset>) => {
    if (parentForVariant) {
      // Add variant to existing asset
      const updatedMedia = media.map(asset => {
        if (asset.id === parentForVariant.id) {
          const newVariant = {
            id: `v${Date.now()}`,
            parentAssetId: asset.id,
            version: asset.variants.length + 2,
            title: newAssetData.title || 'New Variant',
            url: newAssetData.url!,
            metadata: newAssetData.metadata!
          };
          return {
            ...asset,
            variants: [...asset.variants, newVariant]
          };
        }
        return asset;
      });
      setMedia(updatedMedia);
      setParentForVariant(undefined);
    } else {
      // Add new asset
      const newAsset: MediaAsset = {
        id: Date.now().toString(),
        uploadedBy: 'Alex Rivera',
        variants: [],
        ...newAssetData
      } as MediaAsset;
      setMedia([newAsset, ...media]);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    
    setIsDeleting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMedia(media.filter(m => m.id !== selectedAsset.id));
    setIsDeleting(false);
    setIsDeleteOpen(false);
    setSelectedAsset(null);
    toast('Asset deleted successfully', 'success');
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
        activeCategory={activeCategory}
        activeFileType={activeFileType}
        activeSort={activeSort}
        searchQuery={searchQuery}
      />

      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredMedia.map((asset) => (
              <MediaAssetCard 
                key={asset.id}
                asset={asset}
                onView={(a) => { setSelectedAsset(a); setIsDetailOpen(true); }}
                onEdit={(a) => { setSelectedAsset(a); setIsEditOpen(true); }}
                onAddVariant={(a) => { setParentForVariant(a); setIsUploadOpen(true); }}
                onDelete={(a) => { setSelectedAsset(a); setIsDeleteOpen(true); }}
                onShare={(a) => { setSelectedAsset(a); setIsShareOpen(true); }}
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
        onClose={() => { setIsUploadOpen(false); setParentForVariant(undefined); }}
        onUpload={handleUpload}
        parentAsset={parentForVariant}
      />

      <AssetDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        asset={selectedAsset}
        onEdit={(a) => { setIsDetailOpen(false); setSelectedAsset(a); setIsEditOpen(true); }}
        onDownload={handleDownload}
        onShare={(a) => { setSelectedAsset(a); setIsShareOpen(true); }}
      />

      <EditAssetModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        asset={selectedAsset}
        onSave={(updated) => {
          setMedia(media.map(m => m.id === updated.id ? updated : m));
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
      />
    </div>
  );
}
