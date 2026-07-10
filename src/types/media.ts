export type MediaCategory = 'Graphics Design' | 'Social Media Content' | 'Branding' | 'Printing Design' | 'Web & Digital Design' | 'Marketing & Advertising Creatives' | 'Presentation & Documents';
export type MediaStatus = 'In Development' | 'Sent for Correction' | 'Corrected' | 'Approved' | 'Archived';
export type MediaVisibility = 'Private' | 'Public' | 'Team';

export interface MediaMetadata {
  width?: number;
  height?: number;
  dpi?: number;
  colorModel?: string;
  fileType: string;
  fileSize: string;
  createdDate: string;
  modifiedDate: string;
  exif?: Record<string, any>;
  duration?: string;
  resolution?: string;
  frameRate?: number;
  codec?: string;
  bitrate?: string;
  audioPresence?: boolean;
  mimeType: string;
}

export interface MediaVariant {
  id: string;
  parentAssetId: string;
  version: number;
  title: string;
  url: string;
  uploadedBy?: string;
  correctionReplyTo?: string | null;
  metadata: MediaMetadata;
}

export interface CommentReaction {
  userId: string;
  authorName: string;
  emoji: string;
}

export interface CommentReply {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  editedAt?: string;
}

export interface MediaComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  mentions: string[];
  slideIndex?: number;
  replies: CommentReply[];
  reactions: CommentReaction[];
}

export type CorrectionStatus = 'open' | 'in_progress' | 'resolved';

export interface MediaCorrection {
  id: string;
  authorName: string;
  text: string;
  timestamp: string | null;
  status: CorrectionStatus;
  createdAt: string;
  mentions: string[];
  slideIndex?: number;
}

export interface MediaAsset {
  id: string;
  context: 'personal' | 'agency';
  agencyId: string | null;
  startupId: string | null;
  campaignEventId: string | null;
  targetDate: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  category: MediaCategory;
  subcategory: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  status: MediaStatus;
  visibility: MediaVisibility;
  metadata: MediaMetadata;
  variants: MediaVariant[];
  comments: MediaComment[];
  corrections: MediaCorrection[];
  uploadedBy: string;
  ownerId: string;
  isOwner?: boolean;
  sharedWith: string[];
  pendingShareWith: string[];
  viewLog: { ip: string; userAgent: string; viewedAt: string }[];
  editLog: { userId: string; name: string; email: string; accessedAt: string }[];
  shareLog: ShareLogEntry[];
  deleteRequest: { requestedAt: string; acceptances: string[] } | null;
  recipients: Recipients;
  socialPosting: SocialPosting;
  deliveryTracking: DeliveryRecord[];
  auditLog: AuditLogEntry[];
}

export interface ShareLogEntry {
  _id?: string;
  startupId: string | null;
  startupName: string;
  ceoName: string;
  whatsapp: string;
  sharedBy: string;
  sharedByUserId: string;
  assetIds: string[];
  assetTitles: string[];
  message: string;
  method: 'whatsapp' | 'email' | 'link';
  sharedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AudienceType = 'ceo_only' | 'social_media_manager' | 'marketing_team' | 'brand_team' | 'specific' | 'everyone';

export interface Recipients {
  audienceType: AudienceType;
  specificMemberIds: string[];
}

export interface SocialPosting {
  platforms: string[];
  caption: string;
  hashtags: string;
  callToAction: string;
  scheduledDate: string | null;
  postedDate: string | null;
  postedBy: string;
  postUrl: string;
}

export type DeliveryMethod = 'email' | 'whatsapp';
export type DeliveryStatus = 'Pending' | 'Sent' | 'Delivered' | 'Opened' | 'Read' | 'Failed';

export interface DeliveryRecord {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientWhatsApp: string;
  recipientRole: string;
  method: DeliveryMethod;
  status: DeliveryStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  failedReason: string | null;
}

export type AuditAction = 'uploaded' | 'assigned' | 'notified' | 'viewed' | 'downloaded' | 'commented' | 'approved' | 'posted' | 'revised' | 'social_posting_updated' | 'marked_as_posted';

export interface AuditLogEntry {
  action: AuditAction;
  performedBy: string;
  performedByUserId: string | null;
  details: string;
  timestamp: string;
}
