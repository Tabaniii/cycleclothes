'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { UserBadgePill } from '@/components/UserBadgePill';
import { WishlistButton } from '@/components/WishlistButton';
import { useOptionalWishlist } from '@/components/WishlistProvider';
import { formatIdr } from '@/lib/utils';
import { productImageUrl } from '@/lib/storage';
import type { Listing } from '@/types/database';

const CONDITION_LABEL: Record<string, string> = {
  new: 'Baru',
  like_new: 'Seperti baru',
  good: 'Bagus',
  fair: 'Cukup',
};

export function ListingCard({
  listing,
  showWishlist = true,
}: {
  listing: Listing;
  showWishlist?: boolean;
}) {
  const src = productImageUrl(listing.images?.[0], 600);
  const sellerName = listing.profiles?.full_name || 'Penjual';
  const wishlist = useOptionalWishlist();
  const isOwn = Boolean(wishlist?.userId && wishlist.userId === listing.seller_id);
  const canSave = showWishlist && !isOwn;

  return (
    <Card className="relative overflow-hidden bg-white">
      {canSave ? (
        <WishlistButton listingId={listing.id} size="sm" className="absolute right-2 top-2 z-10" />
      ) : null}
      <Link href={`/preloved/${listing.id}`} className="block">
        <div className="relative aspect-[4/5] bg-brand-cream">
          {src ? (
            <Image
              src={src}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-green/50">
              Tanpa foto
            </div>
          )}
        </div>
        <div className="space-y-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wide text-brand-green/60">
              {listing.category || 'Pakaian'} · {listing.size || 'All'}
            </p>
            <UserBadgePill status={listing.profiles?.badge_status} compact />
          </div>
          <h3 className="line-clamp-2 font-semibold text-brand-green">{listing.title}</h3>
          <p className="text-sm font-bold text-brand-green">{formatIdr(listing.price)}</p>
          <p className="text-xs text-brand-green/70">
            {sellerName} · {CONDITION_LABEL[listing.condition || ''] || 'Bekas layak'}
            {listing.location ? ` · ${listing.location}` : ''}
          </p>
        </div>
      </Link>
    </Card>
  );
}
