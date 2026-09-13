'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { ChatThread } from '@/components/ChatThread';
import { UserBadgePill } from '@/components/UserBadgePill';
import { Button } from '@/components/ui/button';
import { WishlistButton } from '@/components/WishlistButton';
import { formatIdr } from '@/lib/utils';
import { productImageUrl } from '@/lib/storage';
import { apiFetch } from '@/lib/api/client';
import { getCurrentAuthUserWithProfile } from '@/services/authService';
import type { Listing } from '@/types/database';

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setListing(body.listing);
      })
      .catch((err) => setError(err.message));
    getCurrentAuthUserWithProfile().then((session) => setUserId(session?.user.id ?? null));
  }, [params.id]);

  async function checkout() {
    if (!userId) {
      router.push('/login');
      return;
    }
    setBuying(true);
    setError('');
    try {
      const result = await apiFetch<{ order_id: string; client_secret: string | null }>(
        '/api/stripe/create-invoice',
        {
          method: 'POST',
          body: JSON.stringify({ listing_id: params.id }),
        },
      );
      if (result.client_secret) {
        sessionStorage.setItem(`cc_pi_${result.order_id}`, result.client_secret);
      }
      router.push(`/checkout/${result.order_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat invoice.');
    } finally {
      setBuying(false);
    }
  }

  if (!listing) {
    return (
      <PageShell>
        <p className="p-10 text-brand-green">{error || 'Memuat listing...'}</p>
      </PageShell>
    );
  }

  const hero = productImageUrl(listing.images?.[0], 1200);
  const isSeller = userId === listing.seller_id;

  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-cream">
          {hero ? (
            <Image src={hero} alt={listing.title} fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" priority />
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserBadgePill status={listing.profiles?.badge_status} />
            <a href={`/u/${listing.seller_id}`} className="text-sm underline">
              {listing.profiles?.full_name || 'Penjual'}
            </a>
          </div>
          <h1 className="text-3xl font-bold text-brand-green">{listing.title}</h1>
          <p className="text-2xl font-semibold text-brand-green">{formatIdr(listing.price)}</p>
          <p className="text-sm text-brand-green/70">
            {listing.category} · {listing.size} · {listing.condition} · {listing.location}
          </p>
          <p className="text-brand-green/80">{listing.description}</p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            {!isSeller ? (
              <Button onClick={checkout} disabled={buying || listing.status !== 'available'}>
                {buying ? 'Menyiapkan invoice...' : 'Beli via Stripe'}
              </Button>
            ) : (
              <p className="text-sm text-brand-green/70">Ini listing kamu.</p>
            )}
            {!isSeller ? <WishlistButton listingId={listing.id} /> : null}
          </div>
          {userId ? (
            <ChatThread
              listingId={listing.id}
              currentUserId={userId}
              peerName={isSeller ? 'Pembeli' : listing.profiles?.full_name || 'Penjual'}
              peerBadge={listing.profiles?.badge_status}
            />
          ) : (
            <p className="text-sm">
              <a className="underline" href="/login">
                Masuk
              </a>{' '}
              untuk chat dengan penjual.
            </p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
