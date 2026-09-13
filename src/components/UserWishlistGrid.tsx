'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';
import type { Listing, Paginated, UserWishlist } from '@/types/database';

function asListing(item: UserWishlist): Listing | null {
  return item.listings || null;
}

export function UserWishlistGrid({
  userId,
  isOwner,
  ownerName,
}: {
  userId: string;
  isOwner: boolean;
  ownerName?: string;
}) {
  const [items, setItems] = useState<Listing[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(reset = false) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ user_id: userId, limit: '12' });
    if (!reset && cursor) params.set('cursor', cursor);
    try {
      const body = await apiFetch<Paginated<UserWishlist>>(`/api/user-wishlists?${params.toString()}`);
      const listings = body.data.map(asListing).filter((row): row is Listing => Boolean(row));
      setItems((prev) => (reset ? listings : [...prev, ...listings]));
      setCursor(body.nextCursor);
      setHasMore(body.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat wishlist.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const title = isOwner ? 'Wishlist kamu' : `Wishlist ${ownerName || 'pengguna'}`;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-green/50">Preloved tersimpan</p>
          <h1 className="mt-2 font-script text-4xl text-brand-green">{title}</h1>
          <p className="mt-2 max-w-xl text-sm text-brand-green/70">
            {isOwner
              ? 'Baju yang kamu incar dari katalog. Ketuk hati lagi untuk menghapus.'
              : 'Koleksi preloved yang diincar pengguna ini.'}
          </p>
        </div>
        {isOwner ? (
          <Link
            href="/preloved"
            className="inline-flex h-10 items-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-brand-cream"
          >
            Cari baju
          </Link>
        ) : null}
      </div>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

      {items.length === 0 && !loading && !error ? (
        <div className="mt-10 rounded-2xl bg-white px-6 py-12 text-center text-brand-green shadow-sm ring-1 ring-brand-green/10">
          <p className="font-semibold">{isOwner ? 'Wishlist masih kosong.' : 'Belum ada baju tersimpan.'}</p>
          <p className="mt-2 text-sm text-brand-green/70">
            {isOwner
              ? 'Di katalog Preloved, ketuk ikon hati pada baju yang kamu mau.'
              : 'Pengguna ini belum menandai listing.'}
          </p>
          {isOwner ? (
            <Link href="/preloved">
              <Button className="mt-5">Jelajah preloved</Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showWishlist={isOwner} />
          ))}
        </div>
      )}

      {loading ? <p className="mt-6 text-sm text-brand-green/70">Memuat wishlist...</p> : null}
      {hasMore ? (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => load(false)}>
            Muat lebih banyak
          </Button>
        </div>
      ) : null}
    </div>
  );
}
