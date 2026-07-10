import { MediaAsset } from '../types/media';
import { SocialAccount, PlatformConfig, SocialPost } from '../types/social';

export const MOCK_STATS = [
  { label: 'Total Assets', value: '4,284', change: '+12.5%', trend: 'up' },
  { label: 'Storage Used', value: '1.2 TB', change: '+3.2%', trend: 'up' },
  { label: 'Active Variants', value: '842', change: '+8%', trend: 'neutral' },
  { label: 'Team Members', value: '24', change: '0%', trend: 'neutral' },
];

const baseMedia = {
  context: 'personal' as const,
  agencyId: null,
  startupId: null,
  campaignEventId: null,
  targetDate: null,
  approvalStatus: 'pending' as const,
  approvedBy: null,
  approvedAt: null,
  comments: [],
  corrections: [],
  sharedWith: [],
  pendingShareWith: [],
  viewLog: [],
  editLog: [],
  deleteRequest: null,
  shareLog: [],
  ownerId: 'user1',
  isOwner: true,
  recipients: { audienceType: 'ceo_only' as const, specificMemberIds: [] },
  socialPosting: { platforms: [] as string[], caption: '', hashtags: '', callToAction: '', scheduledDate: null, postedDate: null, postedBy: '', postUrl: '' },
  deliveryTracking: [],
  auditLog: [],
};

export const MOCK_MEDIA: MediaAsset[] = [
  {
    ...baseMedia,
    id: '1',
    category: 'Graphics Design',
    subcategory: 'Flyer Design',
    title: 'Summer Campaign Hero',
    description: 'Main hero image for the 2024 summer collection campaign.',
    url: 'https://picsum.photos/seed/summer/1200/800',
    tags: ['summer', 'campaign', 'hero', '2024'],
    status: 'Approved',
    visibility: 'Public',
    uploadedBy: 'Alex Rivera',
    metadata: {
      width: 1200,
      height: 800,
      dpi: 300,
      colorModel: 'RGB',
      fileType: 'JPG',
      fileSize: '2.4 MB',
      createdDate: '2024-03-01T10:00:00Z',
      modifiedDate: '2024-03-01T10:00:00Z',
      mimeType: 'image/jpeg'
    },
    variants: [
      {
        id: 'v1',
        parentAssetId: '1',
        version: 2,
        title: 'Compressed Web Version',
        url: 'https://picsum.photos/seed/summer-web/800/600',
        metadata: {
          width: 800,
          height: 600,
          fileType: 'WEBP',
          fileSize: '450 KB',
          createdDate: '2024-03-02T14:00:00Z',
          modifiedDate: '2024-03-02T14:00:00Z',
          mimeType: 'image/webp'
        }
      }
    ]
  },
  {
    ...baseMedia,
    id: '2',
    category: 'Social Media Content',
    subcategory: 'Reels',
    title: 'Product Launch Teaser',
    description: '15-second teaser for the upcoming product launch.',
    url: 'https://picsum.photos/seed/launch/1920/1080',
    tags: ['launch', 'teaser', 'video', 'social'],
    status: 'Approved',
    visibility: 'Team',
    uploadedBy: 'Sarah Chen',
    metadata: {
      duration: '00:15',
      resolution: '1080p',
      frameRate: 30,
      codec: 'H.264',
      fileType: 'MP4',
      fileSize: '45 MB',
      bitrate: '15 Mbps',
      audioPresence: true,
      createdDate: '2024-03-02T11:30:00Z',
      modifiedDate: '2024-03-02T11:30:00Z',
      mimeType: 'video/mp4'
    },
    variants: []
  },
  {
    ...baseMedia,
    id: '3',
    category: 'Printing Design',
    subcategory: 'Flyers',
    title: 'Annual Sale Event',
    description: 'Promotional flyer for the annual clearance sale.',
    url: 'https://picsum.photos/seed/sale/1000/1414',
    tags: ['sale', 'flyer', 'print', 'promo'],
    status: 'In Development',
    visibility: 'Private',
    uploadedBy: 'Alex Rivera',
    metadata: {
      width: 1000,
      height: 1414,
      dpi: 300,
      colorModel: 'CMYK',
      fileType: 'PDF',
      fileSize: '12.8 MB',
      createdDate: '2024-03-03T09:15:00Z',
      modifiedDate: '2024-03-03T09:15:00Z',
      mimeType: 'application/pdf'
    },
    variants: []
  },
  {
    ...baseMedia,
    id: '4',
    category: 'Branding',
    subcategory: 'Logo Design',
    title: 'Brand Logo Set',
    description: 'Official brand logo assets in various formats.',
    url: 'https://picsum.photos/seed/logo/800/800',
    tags: ['brand', 'logo', 'identity', 'vector'],
    status: 'Approved',
    visibility: 'Public',
    uploadedBy: 'Marcus Miller',
    metadata: {
      width: 800,
      height: 800,
      fileType: 'SVG',
      fileSize: '120 KB',
      createdDate: '2024-03-04T15:45:00Z',
      modifiedDate: '2024-03-04T15:45:00Z',
      mimeType: 'image/svg+xml'
    },
    variants: []
  },
  {
    ...baseMedia,
    id: '5',
    category: 'Graphics Design',
    subcategory: 'Social Media Graphics',
    title: 'Office Lifestyle 01',
    description: 'Candid shot of the creative team in the studio.',
    url: 'https://picsum.photos/seed/office/1200/800',
    tags: ['lifestyle', 'office', 'team', 'culture'],
    status: 'Approved',
    visibility: 'Team',
    uploadedBy: 'Sarah Chen',
    metadata: {
      width: 1200,
      height: 800,
      dpi: 72,
      colorModel: 'RGB',
      fileType: 'PNG',
      fileSize: '5.2 MB',
      createdDate: '2024-03-05T12:00:00Z',
      modifiedDate: '2024-03-05T12:00:00Z',
      mimeType: 'image/png'
    },
    variants: []
  },
  {
    ...baseMedia,
    id: '6',
    category: 'Social Media Content',
    subcategory: 'Motion Graphics',
    title: 'Client Testimonial',
    description: 'Interview with the CEO of our top client.',
    url: 'https://picsum.photos/seed/interview/1920/1080',
    tags: ['client', 'testimonial', 'interview', 'corporate'],
    status: 'Archived',
    visibility: 'Private',
    uploadedBy: 'Marcus Miller',
    metadata: {
      duration: '02:45',
      resolution: '4K',
      frameRate: 24,
      codec: 'ProRes',
      fileType: 'MOV',
      fileSize: '1.2 GB',
      bitrate: '150 Mbps',
      audioPresence: true,
      createdDate: '2024-03-06T16:20:00Z',
      modifiedDate: '2024-03-06T16:20:00Z',
      mimeType: 'video/quicktime'
    },
    variants: []
  }
];

export const MOCK_ACCOUNTS: SocialAccount[] = [
  { 
    id: '1', 
    platform: 'Instagram', 
    username: '@bms_agency', 
    userId: 'inst_123', 
    status: 'connected', 
    connectedAt: '2024-01-15T10:00:00Z',
    profileImage: 'https://picsum.photos/seed/user1/100/100'
  },
  { 
    id: '2', 
    platform: 'Facebook', 
    username: 'BMS Creative', 
    userId: 'fb_456', 
    status: 'connected', 
    connectedAt: '2024-01-20T14:30:00Z',
    profileImage: 'https://picsum.photos/seed/user2/100/100'
  },
  { 
    id: '3', 
    platform: 'Twitter', 
    username: '@bms_media', 
    userId: 'tw_789', 
    status: 'connected', 
    connectedAt: '2024-02-05T09:15:00Z',
    profileImage: 'https://picsum.photos/seed/user3/100/100'
  },
  { 
    id: '4', 
    platform: 'LinkedIn', 
    username: 'BMS Agency', 
    userId: 'li_012', 
    status: 'connected', 
    connectedAt: '2024-02-10T16:45:00Z',
    profileImage: 'https://picsum.photos/seed/user4/100/100'
  },
];

export const SUPPORTED_PLATFORMS: PlatformConfig[] = [
  { id: 'Google', name: 'Google', description: 'Connect for YouTube and Google Ads management.', icon: 'Google' },
  { id: 'Apple', name: 'Apple', description: 'Manage your Apple Business and App Store presence.', icon: 'Apple' },
  { id: 'Instagram', name: 'Instagram', description: 'Schedule posts, reels, and stories.', icon: 'Instagram' },
  { id: 'Facebook', name: 'Facebook', description: 'Manage pages, groups, and ad accounts.', icon: 'Facebook' },
  { id: 'LinkedIn', name: 'LinkedIn', description: 'Professional networking and company updates.', icon: 'Linkedin' },
  { id: 'YouTube', name: 'YouTube', description: 'Upload videos and manage your channel.', icon: 'Youtube' },
  { id: 'TikTok', name: 'TikTok', description: 'Create and schedule short-form video content.', icon: 'Music2' },
  { id: 'Twitter', name: 'Twitter / X', description: 'Real-time updates and community engagement.', icon: 'Twitter' },
];

export const MOCK_POSTS: SocialPost[] = [
  {
    id: 'p1',
    content: 'Excited to announce our new summer collection! ☀️ Check out the full range on our website. #SummerCollection #BMSAgency',
    mediaUrls: ['https://picsum.photos/seed/summer/1200/800'],
    platforms: ['Instagram', 'Facebook'],
    status: 'Published',
    publishedDate: '2024-03-01T10:00:00Z',
    engagement: { likes: 1284, comments: 42, shares: 15, views: 5400 }
  },
  {
    id: 'p2',
    content: 'Our product launch teaser is live! Watch the full video to see what we have been working on. 🚀',
    mediaUrls: ['https://picsum.photos/seed/launch/1920/1080'],
    platforms: ['Twitter', 'LinkedIn'],
    status: 'Published',
    publishedDate: '2024-03-02T11:30:00Z',
    engagement: { likes: 856, comments: 24, shares: 82, views: 12000 }
  },
  {
    id: 'p3',
    content: 'Join us for our annual clearance sale! Up to 70% off on all items. Limited time only! 🛍️',
    mediaUrls: ['https://picsum.photos/seed/sale/1000/1414'],
    platforms: ['Instagram', 'Facebook', 'Twitter'],
    status: 'Scheduled',
    scheduledDate: '2024-03-10T09:00:00Z',
  },
  {
    id: 'p4',
    content: 'We are hiring! 📢 Looking for a creative designer to join our team in New York. Apply now via the link in bio.',
    mediaUrls: ['https://picsum.photos/seed/office/1200/800'],
    platforms: ['LinkedIn'],
    status: 'Scheduled',
    scheduledDate: '2024-03-15T14:30:00Z',
  },
  {
    id: 'p5',
    content: 'Behind the scenes at BMS Agency. Our creative process in action! 🎨',
    mediaUrls: ['https://picsum.photos/seed/interview/1920/1080'],
    platforms: ['Instagram', 'YouTube'],
    status: 'Draft',
  }
];

export const MOCK_ANALYTICS_DATA = [
  { name: 'Mon', engagement: 400, reach: 2400 },
  { name: 'Tue', engagement: 300, reach: 1398 },
  { name: 'Wed', engagement: 200, reach: 9800 },
  { name: 'Thu', engagement: 278, reach: 3908 },
  { name: 'Fri', engagement: 189, reach: 4800 },
  { name: 'Sat', engagement: 239, reach: 3800 },
  { name: 'Sun', engagement: 349, reach: 4300 },
];

export const MOCK_PLATFORM_DATA = [
  { name: 'Instagram', value: 45 },
  { name: 'Facebook', value: 25 },
  { name: 'X', value: 15 },
  { name: 'LinkedIn', value: 15 },
];
