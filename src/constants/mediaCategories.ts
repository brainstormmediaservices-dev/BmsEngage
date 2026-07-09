export type MainCategory =
  | 'Graphics Design'
  | 'Social Media Content'
  | 'Branding'
  | 'Printing Design'
  | 'Web & Digital Design'
  | 'Marketing & Advertising Creatives'
  | 'Presentation & Documents';

export const CATEGORIES: Record<MainCategory, string[]> = {
  'Graphics Design': [
    'Flyer Design',
    'Poster Design',
    'Social Media Graphics',
    'Business Card Design',
    'ID Card Design',
    'Logo Design',
    'Brand Identity Design',
    'Letterhead Design',
    'Invoice Design',
    'Receipt Design',
    'Company Profile Design',
    'Brochure Design',
    'Catalogue Design',
    'Menu Design',
    'Banner Design',
    'Roll-up Banner Design',
    'Billboard Design',
    'Signage Design',
    'Packaging Design',
    'Label Design',
    'Certificate Design',
    'Invitation Card Design',
    'Event Branding',
    'Presentation (PowerPoint) Design',
    'Ebook/PDF Design',
    'Mockup Design',
    'T-Shirt & Merchandise Design',
    'Sticker Design',
    'Vehicle Branding Design',
    'UI Graphics (App/Web Assets)',
  ],
  'Social Media Content': [
    'Image Posts',
    'Carousel Posts',
    'Quote Graphics',
    'Promotional Posts',
    'Product Posts',
    'Educational Posts',
    'Infographics',
    'Reels',
    'Short Videos',
    'Motion Graphics',
    'AI Motion Graphics',
    'Animated Posts',
    'GIF Animations',
    'Story Posts',
    'Cover/Banner Design',
    'Social Media Campaigns',
    'Content Calendar',
    'Caption Writing',
  ],
  Branding: [
    'Logo Design',
    'Brand Identity',
    'Brand Guidelines',
    'Color Palette',
    'Typography Selection',
    'Brand Strategy',
    'Business Stationery',
    'Email Signature',
    'Packaging Design',
    'Merchandise Branding',
    'Uniform Branding',
    'Vehicle Branding',
    'Office Branding',
    'Event Branding',
    'Brand Refresh/Rebranding',
  ],
  'Printing Design': [
    'Business Cards',
    'Flyers',
    'Brochures',
    'Posters',
    'Banners',
    'Roll-up Banners',
    'Stickers',
    'Labels',
    'Packaging',
    'ID Cards',
    'Certificates',
    'Invitations',
    'Calendars',
    'Notebooks',
    'Receipt Books',
  ],
  'Web & Digital Design': [
    'Landing Pages',
    'Website UI Design',
    'Mobile App UI',
    'Dashboard Design',
    'Email Templates',
    'Digital Banners',
    'Website Graphics',
    'Icons & Illustrations',
  ],
  'Marketing & Advertising Creatives': [
    'Ad Creatives',
    'Facebook Ads Creatives',
    'Instagram Ads Creatives',
    'Google Display Banners',
    'Campaign Visuals',
    'Product Launch Graphics',
    'Event Promotion',
    'Sales Campaign Designs',
  ],
  'Presentation & Documents': [
    'Company Profile',
    'Pitch Deck',
    'Business Proposal',
    'Annual Report',
    'Ebook Design',
    'Presentation Slides',
    'PDF Design',
    'Portfolio Design',
  ],
};

export const MAIN_CATEGORIES = Object.keys(CATEGORIES) as MainCategory[];

/** Auto-detect main category from file extension */
export const detectMainCategory = (filename: string): MainCategory => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg', '3gp', 'flv', 'wmv', 'ogv', 'm4v', 'ts'];
  const designExts = ['psd', 'psb', 'ai', 'eps', 'indd', 'indt', 'xd', 'sketch', 'fig', 'afdesign', 'afphoto', 'cdr', 'xcf'];

  if (videoExts.includes(ext)) return 'Social Media Content';
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'Social Media Content';
  if (designExts.includes(ext)) return 'Graphics Design';
  if (ext === 'pdf') return 'Presentation & Documents';
  if (['svg'].includes(ext)) return 'Graphics Design';
  return 'Graphics Design';
};

/** Auto-detect subcategory from file extension */
export const detectSubcategory = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg', '3gp', 'flv', 'wmv', 'ogv', 'm4v', 'ts'];
  const designExts = ['psd', 'psb', 'ai', 'eps', 'indd', 'indt', 'xd', 'sketch', 'fig', 'afdesign', 'afphoto', 'cdr', 'xcf'];

  if (videoExts.includes(ext)) {
    if (['mp4', 'webm', 'ogv'].includes(ext)) return 'Short Videos';
    return 'Reels';
  }
  if (designExts.includes(ext)) return 'Mockup Design';
  if (ext === 'pdf') return 'PDF Design';
  if (ext === 'svg') return 'Social Media Graphics';
  return 'Image Posts';
};
