'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { DonationModal } from '@/components/DonationModal';
import { UserBadgePill } from '@/components/UserBadgePill';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { getCurrentAuthUserWithProfile } from '@/services/authService';
import type { DonationWishlist } from '@/types/database';

export default function WishlistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [wishlist, setWishlist] = useState<DonationWishlist | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/wishlists/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Tidak ditemukan');
        setWishlist(body.wishlist);
      })
      .catch((err) => setError(err.message));
  }, [params.id]);

  async function donate() {
    const session = await getCurrentAuthUserWithProfile();
    if (!session) {
      router.push('/login');
      return;
    }
    setOpen(true);
  }

  if (error) {
    return (
      <PageShell>
        <p className="p-10 text-red-600">{error}</p>
      </PageShell>
    );
  }
  if (!wishlist) {
    return (
      <PageShell>
        <p className="p-10 text-brand-green">Memuat wishlist...</p>
      </PageShell>
    );
  }

  const percent = wishlist.target_items
    ? Math.min(100, (wishlist.fulfilled_items / wishlist.target_items) * 100)
    : 0;

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs uppercase tracking-widest text-brand-green/60">{wishlist.category}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-brand-green">{wishlist.title}</h1>
          <UserBadgePill status={wishlist.profiles?.badge_status} />
        </div>
        <p className="mt-4 text-brand-green/80">{wishlist.description}</p>
        <div className="mt-6 rounded-2xl bg-white p-5">
          <div className="mb-2 flex justify-between text-sm font-medium text-brand-green">
            <span>Progress</span>
            <span>
              {wishlist.fulfilled_items}/{wishlist.target_items}
            </span>
          </div>
          <Progress value={percent} />
        </div>
        <Button className="mt-6" onClick={donate} disabled={wishlist.status !== 'open'}>
          Donate Items
        </Button>
        <DonationModal
          wishlist={wishlist}
          open={open}
          onClose={() => setOpen(false)}
          onCreated={() => router.push('/dashboard/donor')}
        />
      </div>
    </PageShell>
  );
}
