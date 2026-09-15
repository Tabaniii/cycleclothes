export type UserRole = 'user' | 'foundation' | 'admin';
export type BadgeStatus = 'Newbie' | 'Orang Baik' | 'Anak Tuhan' | 'Penghuni Surga';
export type FoundationVerificationStatus = 'pending' | 'approved' | 'rejected';
export type WishlistStatus = 'open' | 'completed' | 'closed';
export type ClaimStatus = 'pending' | 'shipped' | 'verified' | 'expired' | 'cancelled';
export type ListingStatus = 'available' | 'reserved' | 'sold' | 'removed';
export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'disputed' | 'refunded';
export type ContentFlagStatus = 'open' | 'reviewed' | 'dismissed';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  city: string | null;
  role: UserRole;
  badge_status: BadgeStatus;
  donation_count: number;
  created_at: string;
  updated_at: string;
};

export type FoundationProfile = {
  id: string;
  legal_name: string;
  legal_document_url: string | null;
  address: string | null;
  pic_name: string | null;
  pic_phone: string | null;
  verification_status: FoundationVerificationStatus;
  review_note: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DonationWishlist = {
  id: string;
  foundation_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_items: number;
  fulfilled_items: number;
  status: WishlistStatus;
  created_at: string;
  updated_at: string;
  foundation_profiles?: Pick<FoundationProfile, 'legal_name' | 'verification_status'> | null;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'city' | 'badge_status'> | null;
};

export type DonationClaim = {
  id: string;
  wishlist_id: string;
  donor_id: string;
  item_description: string | null;
  item_qty: number;
  tracking_number: string | null;
  proof_image_url: string | null;
  status: ClaimStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  donation_wishlists?: Pick<DonationWishlist, 'id' | 'title' | 'foundation_id' | 'category'> | null;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'badge_status' | 'donation_count'> | null;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string | null;
  size: string | null;
  condition: ListingCondition | null;
  price: number | string;
  images: string[];
  location: string | null;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'city' | 'badge_status' | 'donation_count'> | null;
};

export type Order = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  stripe_payment_intent_id: string | null;
  amount: number | string;
  status: OrderStatus;
  tracking_number: string | null;
  dispute_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  listings?: Pick<Listing, 'id' | 'title' | 'images' | 'price' | 'status'> | null;
};

export type Message = {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url' | 'badge_status'> | null;
};

export type ChatConversation = {
  listingId: string;
  peerId: string;
  peerName: string | null;
  peerBadge: string | null;
  listingTitle: string;
  listingImage: string | null;
  listingPrice: number | string;
  listingStatus: ListingStatus;
  lastMessage: string;
  lastMessageAt: string;
};

export type Review = {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type ContentFlag = {
  id: string;
  reporter_id: string;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  status: ContentFlagStatus;
  created_at: string;
};

export type UserWishlist = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings?: Listing | null;
};

export type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
