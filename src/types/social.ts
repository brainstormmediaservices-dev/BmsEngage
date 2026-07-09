export type SocialPlatform = 
  | 'Google' 
  | 'Apple' 
  | 'Instagram' 
  | 'Facebook' 
  | 'LinkedIn' 
  | 'YouTube' 
  | 'TikTok' 
  | 'Twitter'
  | 'meta'
  | 'twitter'
  | 'linkedin'
  | 'tiktok'
  | 'instagram';

export type PostStatus = 'Draft' | 'Scheduled' | 'Published' | 'Failed';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  displayName?: string;
  avatar?: string;
  userId: string;
  profileImage?: string;
  status: 'connected' | 'expired';
  connectedAt: string;
  tokenExpiry?: string | null;
  meta?: { pageId: string; pageName: string };
  instagram?: { igUserId: string; igUsername: string };
  tiktok?: { openId: string };
}

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  description: string;
  icon: string;
}

export interface SocialPost {
  id: string;
  content: string;
  mediaUrls?: string[];
  platforms: SocialPlatform[];
  status: PostStatus;
  scheduledDate?: string;
  publishedDate?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
}
