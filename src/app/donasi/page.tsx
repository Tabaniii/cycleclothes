'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { WishlistCard } from '@/components/WishlistCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CLOTHING_CATEGORIES } from '@/lib/constants';
import type { DonationWishlist, Paginated } from '@/types/database';

export default function DonasiPage() {
  const [items, setItems] = useState<DonationWishlist[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('open');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(reset = false) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status, limit: '12' });
      if (category) params.set('category', category);
      if (q) params.set('q', q);
      if (!reset && cursor) params.set('cursor', cursor);
      const res = await fetch(`/api/wishlists?${params.toString()}`);
      const body = (await res.json()) as Paginated<DonationWishlist> & { error?: string };
      if (!res.ok) throw new Error(body.error || 'Gagal memuat wishlist.');
      setItems((prev) => (reset ? body.data : [...prev, ...body.data]));
      setCursor(body.nextCursor);
      setHasMore(body.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat wishlist.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCursor(null);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status]);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <h1 className="font-script text-4xl text-brand-green">Donasi Langsung</h1>
        <p className="mt-2 max-w-2xl text-brand-green/80">
          Pilih kebutuhan yayasan terverifikasi, kirim pakaian secara mandiri, lalu unggah bukti kirim.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Input
            placeholder="Cari judul wishlist"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') load(true);
            }}
          />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Semua kategori</option>
            {CLOTHING_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="open">Terbuka</option>
            <option value="completed">Terpenuhi</option>
            <option value="closed">Ditutup</option>
          </Select>
          <Button onClick={() => load(true)}>Terapkan</Button>
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((wishlist) => (
            <WishlistCard key={wishlist.id} wishlist={wishlist} />
          ))}
        </div>
        {loading ? <p className="mt-6 text-sm text-brand-green/70">Memuat...</p> : null}
        {!loading && items.length === 0 ? (
          <p className="mt-6 text-sm text-brand-green/70">Belum ada wishlist untuk filter ini.</p>
        ) : null}
        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => load(false)}>
              Muat lebih banyak
            </Button>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
