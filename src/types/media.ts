export type MediaCategory = 'Flyer' | 'Image' | 'Video' | 'Graphics';
export type MediaStatus = 'Draft' | 'Published' | 'Archived';
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
}

export interface MediaComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  replies: CommentReply[];
  reactions: CommentReaction[];
}

export interface MediaCorrection {
  id: string;
  authorName: string;
  text: string;
  timestamp: string | null;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  context: 'personal' | 'agency';
  agencyId: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  category: MediaCategory;
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
  deleteRequest: { requestedAt: string; acceptances: string[] } | null;
}
