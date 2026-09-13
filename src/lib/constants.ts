export const CLOTHING_CATEGORIES = [
  'atasan',
  'bawahan',
  'luaran',
  'anak',
  'sepatu',
  'aksesoris',
] as const;

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'] as const;

export const LISTING_CONDITIONS = [
  { value: 'new', label: 'Baru' },
  { value: 'like_new', label: 'Seperti baru' },
  { value: 'good', label: 'Bagus' },
  { value: 'fair', label: 'Cukup' },
] as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export const DOC_MIME_TYPES = [...IMAGE_MIME_TYPES, 'application/pdf'] as const;

export const PAGE_SIZE = 12;
export const MESSAGE_PAGE_SIZE = 30;

export const BADGE_THRESHOLDS = [
  { min: 10, status: 'Penghuni Surga' as const },
  { min: 5, status: 'Anak Tuhan' as const },
  { min: 1, status: 'Orang Baik' as const },
  { min: 0, status: 'Newbie' as const },
];

export const STRIPE_CURRENCY = 'idr';
