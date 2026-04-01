import * as React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MediaAsset } from '../types/media';
import { mediaService, requestDeleteMedia, acceptDeleteRequest } from '../services/mediaService';
import { startupService, Startup } from '../services/startupService';
import { MediaGalleryTopBar } from '../components/gallery/MediaGalleryTopBar';
import { MediaAssetCard } from '../components/gallery/MediaAssetCard';
import { UploadMediaModal } from '../components/gallery/UploadMediaModal';
import { AssetDetailModal } from '../components/gallery/AssetDetailModal';
import { EditAssetModal } from '../components/gallery/EditAssetModal';
import { DeleteAssetModal } from '../components/gallery/DeleteAssetModal';
import { ShareAssetModal } from '../components/gallery/ShareAssetModal';
import { PresentationView } from '../components/gallery/PresentationView';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_GROUPS } from '../services/authService';

import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';

const PAGE_SIZE = 12;
const DAY_INDEX: Record<string, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5,
};

export default function GalleryPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFileType, setActiveFileType] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest');
  const [activeWeekRange, setActiveWeekRange] = useState('all');
  const [activeDateFrom, setActiveDateFrom] = useState('');
  const [activeDateTo, setActiveDateTo] = useState('');
  const [activeStartup, setActiveStartup] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [startups, setStartups] = useState<Startup[]>([]);
  const { toast } = useToast();
  const { canUploadAsset } = usePermissions();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAgency = user?.activeContext === 'agency';

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

  useEffect(() => {
    if (!isAgency) return;
    startupService.list().then(setStartups).catch(() => {});
  }, [isAgency]);

  useEffect(() => {
    const editAssetId = searchParams.get('editAsset');
    if (!editAssetId || isLoading) return;
    const target = media.find(m => m.id === editAssetId);
    if (target) {
      setParentForVariant(target);
      setIsUploadOpen(true);
      mediaService.getMediaById?.(editAssetId, 'editlink').catch(() => {});
    }
  }, [searchParams, media, isLoading]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [parentForVariant, setParentForVariant] = useState<MediaAsset | undefined>(undefined);
  const [correctionReplyTo, setCorrectionReplyTo] = useState<string | undefined>(undefined);
  const [presentationOpen, setPresentationOpen] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);

  // Presentation mode: agency context + executive/production/marketing roles
  const canPresent = isAgency && (() => {
    const role = user?.agencyRole;
    if (!role) return false;
    if (role === 'owner') return true;
    const execRoles = [...ROLE_GROUPS.executive, ...ROLE_GROUPS.production, ...ROLE_GROUPS.marketing] as string[];
    return execRoles.includes(role);
  })();

  // Assets uploaded this week (Mon–Sun)
  const thisWeekAssets = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return media.filter(a => new Date(a.metadata.createdDate) >= monday);
  }, [media]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeCategory, activeFileType, activeSort, activeWeekRange, activeDateFrom, activeDateTo, activeStartup]);

  const filteredMedia = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });

    return media.filter(asset => {
      const matchesSearch =
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || asset.category === activeCategory;
      const matchesFileType = activeFileType === 'All' || asset.metadata.fileType === activeFileType;

      // Week range filter — based on asset's targetDate
      let matchesWeek = true;
      const td = asset.targetDate ? new Date(asset.targetDate) : null;
      if (activeWeekRange === 'this_week') {
        matchesWeek = !!td && td >= thisWeekStart && td <= thisWeekEnd;
      } else if (activeWeekRange === 'next_week') {
        matchesWeek = !!td && td >= nextWeekStart && td <= nextWeekEnd;
      }

      // Date range filter
      let matchesDateRange = true;
      if (activeDateFrom || activeDateTo) {
        const assetDate = td || new Date(asset.metadata.createdDate);
        if (activeDateFrom) matchesDateRange = matchesDateRange && assetDate >= new Date(activeDateFrom);
        if (activeDateTo) matchesDateRange = matchesDateRange && assetDate <= new Date(activeDateTo + 'T23:59:59');
      }

      // Startup filter
      let matchesStartup = true;
      if (activeStartup !== 'All') {
        matchesStartup = activeStartup === 'none' ? !asset.startupId : asset.startupId === activeStartup;
      }

      return matchesSearch && matchesCategory && matchesFileType && matchesWeek && matchesDateRange && matchesStartup;
    }).sort((a, b) => {
      if (activeSort === 'Newest') return new Date(b.metadata.createdDate).getTime() - new Date(a.metadata.createdDate).getTime();
      if (activeSort === 'Oldest') return new Date(a.metadata.createdDate).getTime() - new Date(b.metadata.createdDate).getTime();
      if (activeSort === 'A–Z') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [media, searchQuery, activeCategory, activeFileType, activeSort, activeWeekRange, activeDateFrom, activeDateTo, activeStartup]);

  const totalPages = Math.max(1, Math.ceil(filteredMedia.length / PAGE_SIZE));
  const pagedMedia = filteredMedia.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleUpload = (newAsset: MediaAsset) => {
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

  const handleClearFilters = () => {
    setSearchQuery(''); setActiveCategory('All'); setActiveFileType('All');
    setActiveSort('Newest'); setActiveWeekRange('all'); setActiveDateFrom(''); setActiveDateTo(''); setActiveStartup('All');
    toast('All filters cleared', 'info');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-20">
      {/* Presentation tab button — agency + executive/production/marketing only */}
      {canPresent && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPresentationIndex(0); setPresentationOpen(true); }}
              disabled={thisWeekAssets.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Monitor size={16} /> Presentation Mode
            </button>
            {thisWeekAssets.length > 0 && (
              <span className="text-xs text-text-muted">{thisWeekAssets.length} asset{thisWeekAssets.length !== 1 ? 's' : ''} this week</span>
            )}
          </div>
        </div>
      )}

      <MediaGalleryTopBar
        onSearch={setSearchQuery}
        onCategoryChange={setActiveCategory}
        onFileTypeChange={setActiveFileType}
        onSortChange={setActiveSort}
        onWeekRangeChange={setActiveWeekRange}
        onDateRangeChange={(from, to) => { setActiveDateFrom(from); setActiveDateTo(to); setActiveWeekRange('all'); }}
        onStartupChange={setActiveStartup}
        onClearFilters={handleClearFilters}
        onUploadClick={() => { setParentForVariant(undefined); setIsUploadOpen(true); }}
        canUpload={canUploadAsset}
        activeCategory={activeCategory}
        activeFileType={activeFileType}
        activeSort={activeSort}
        activeWeekRange={activeWeekRange}
        activeDateFrom={activeDateFrom}
        activeDateTo={activeDateTo}
        activeStartup={activeStartup}
        searchQuery={searchQuery}
        startups={startups}
        isAgencyContext={isAgency}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : pagedMedia.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {pagedMedia.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  currentUserId={user?.id}
                  startup={asset.startupId ? (startups.find(s => s.id === asset.startupId) ?? null) : null}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-border text-text-muted hover:text-text hover:border-primary/30 disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                    page === currentPage
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'border border-border text-text-muted hover:text-text hover:border-primary/30'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-border text-text-muted hover:text-text hover:border-primary/30 disabled:opacity-40 transition-all"
              >
                <ChevronRight size={18} />
              </button>
              <span className="text-xs text-text-muted ml-2">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredMedia.length)} of {filteredMedia.length}
              </span>
            </div>
          )}
        </>
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
          <p className="text-text-muted max-w-md">We couldn't find any media matching your current filters.</p>
          <Button variant="outline" className="mt-8" onClick={handleClearFilters}>Clear All Filters</Button>
        </motion.div>
      )}

      <UploadMediaModal
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); setParentForVariant(undefined); setCorrectionReplyTo(undefined); }}
        onUpload={handleUpload}
        parentAsset={parentForVariant}
        correctionReplyTo={correctionReplyTo}
        startups={startups}
      />
      <AssetDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        asset={selectedAsset}
        onEdit={(a) => { setIsDetailOpen(false); setSelectedAsset(a); setIsEditOpen(true); }}
        onDownload={(asset) => toast(`Downloading ${asset.title}...`, 'success')}
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

      {/* Presentation mode — full-screen overlay */}
      {presentationOpen && thisWeekAssets.length > 0 && (
        <PresentationView
          assets={thisWeekAssets}
          initialIndex={presentationIndex}
          onClose={() => setPresentationOpen(false)}
          onAssetUpdate={(updated) => setMedia(prev => prev.map(m => m.id === updated.id ? updated : m))}
          startups={startups.map(s => ({ id: s.id, name: s.name, logo: s.logo ?? null }))}
        />
      )}
    </div>
  );
}
