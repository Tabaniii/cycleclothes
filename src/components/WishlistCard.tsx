import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserBadgePill } from '@/components/UserBadgePill';
import type { DonationWishlist } from '@/types/database';

export function WishlistCard({ wishlist }: { wishlist: DonationWishlist }) {
  const percent = wishlist.target_items
    ? Math.min(100, (wishlist.fulfilled_items / wishlist.target_items) * 100)
    : 0;
  const nestedFoundation =
    wishlist.foundation_profiles?.legal_name ||
    (wishlist.profiles as { foundation_profiles?: { legal_name?: string } } | undefined)
      ?.foundation_profiles?.legal_name;
  const foundationName = nestedFoundation || wishlist.profiles?.full_name || 'Yayasan';

  return (
    <Card className="overflow-hidden bg-brand-cream/40">
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-green/60">{wishlist.category || 'Umum'}</p>
            <h3 className="text-lg font-bold text-brand-green">
              <Link href={`/donasi/${wishlist.id}`} className="hover:underline">
                {wishlist.title}
              </Link>
            </h3>
          </div>
          <UserBadgePill status={wishlist.profiles?.badge_status} compact />
        </div>
        <p className="line-clamp-2 text-sm text-brand-green/80">{wishlist.description || 'Kebutuhan pakaian layak pakai.'}</p>
        <div>
          <div className="mb-1 flex justify-between text-xs font-medium text-brand-green">
            <span>{foundationName}</span>
            <span>
              {wishlist.fulfilled_items}/{wishlist.target_items} item
            </span>
          </div>
          <Progress value={percent} />
        </div>
        <Link
          href={`/donasi/${wishlist.id}`}
          className="inline-flex text-sm font-semibold text-brand-green underline-offset-4 hover:underline"
        >
          Donasikan item
        </Link>
      </CardContent>
    </Card>
  );
}
