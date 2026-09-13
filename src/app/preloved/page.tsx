'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { ListingCard } from '@/components/ListingCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CLOTHING_CATEGORIES, CLOTHING_SIZES, LISTING_CONDITIONS } from '@/lib/constants';
import type { Listing, Paginated } from '@/types/database';

export default function PrelovedPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    size: '',
    condition: '',
    location: '',
    min_price: '',
    max_price: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(reset = false) {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: '12' });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (!reset && cursor) params.set('cursor', cursor);
    try {
      const res = await fetch(`/api/listings?${params.toString()}`);
      const body = (await res.json()) as Paginated<Listing> & { error?: string };
      if (!res.ok) throw new Error(body.error || 'Gagal memuat listing.');
      setItems((prev) => (reset ? body.data : [...prev, ...body.data]));
      setCursor(body.nextCursor);
      setHasMore(body.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat listing.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-script text-4xl text-brand-green">Preloved</h1>
            <p className="mt-2 text-brand-green/80">Cari pakaian layak pakai. Bayar aman lewat Stripe sandbox.</p>
          </div>
          <Link
            href="/preloved/new"
            className="inline-flex h-10 items-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-brand-cream"
          >
            Jual pakaian
          </Link>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Input
            placeholder="Cari"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          <Select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
            <option value="">Kategori</option>
            {CLOTHING_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={filters.size} onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))}>
            <option value="">Ukuran</option>
            {CLOTHING_SIZES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            value={filters.condition}
            onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value }))}
          >
            <option value="">Kondisi</option>
            {LISTING_CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Input
            placeholder="Lokasi"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          />
          <Input
            placeholder="Harga min"
            type="number"
            value={filters.min_price}
            onChange={(e) => setFilters((f) => ({ ...f, min_price: e.target.value }))}
          />
          <Input
            placeholder="Harga max"
            type="number"
            value={filters.max_price}
            onChange={(e) => setFilters((f) => ({ ...f, max_price: e.target.value }))}
          />
        </div>
        <Button className="mt-4" onClick={() => load(true)}>
          Filter
        </Button>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {loading ? <p className="mt-6 text-sm text-brand-green/70">Memuat...</p> : null}
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
