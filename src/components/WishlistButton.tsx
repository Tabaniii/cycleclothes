'use client';

import { useOptionalWishlist } from '@/components/WishlistProvider';
import { cn } from '@/lib/utils';

export function WishlistButton({
  listingId,
  className,
  size = 'md',
}: {
  listingId: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const wishlist = useOptionalWishlist();
  const saved = wishlist?.has(listingId) ?? false;
  const iconClass = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <button
      type="button"
      aria-label={saved ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!wishlist) {
          window.location.href = '/login';
          return;
        }
        void wishlist.toggle(listingId);
      }}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-white/90 text-brand-green shadow-sm ring-1 ring-brand-green/10 transition hover:bg-white',
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
        saved ? 'text-red-600' : 'text-brand-green',
        className,
      )}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={iconClass} fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
      </svg>
    </button>
  );
}
