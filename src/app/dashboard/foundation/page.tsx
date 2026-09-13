'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';
import { CLOTHING_CATEGORIES } from '@/lib/constants';
import type { DonationClaim, DonationWishlist } from '@/types/database';

export default function FoundationDashboardPage() {
  const [wishlists, setWishlists] = useState<DonationWishlist[]>([]);
  const [claims, setClaims] = useState<DonationClaim[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('atasan');
  const [target, setTarget] = useState(10);
  const [error, setError] = useState('');

  async function load() {
    try {
        const [w, c] = await Promise.all([
        apiFetch<{ data: DonationWishlist[] }>('/api/wishlists?mine=1'),
        apiFetch<{ data: DonationClaim[] }>('/api/claims?scope=incoming'),
      ]);
      setWishlists(w.data || []);
      setClaims(c.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard yayasan.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createWishlist() {
    await apiFetch('/api/wishlists', {
      method: 'POST',
      body: JSON.stringify({ title, description, category, target_items: target }),
    });
    setTitle('');
    setDescription('');
    await load();
  }

  const pending = claims.filter((item) => item.status === 'shipped');
  const verifiedQty = claims.filter((item) => item.status === 'verified').reduce((sum, item) => sum + item.item_qty, 0);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-green">Dashboard Yayasan</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs uppercase text-brand-green/60">Wishlist aktif</p>
            <p className="text-2xl font-bold">{wishlists.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs uppercase text-brand-green/60">Perlu verifikasi</p>
            <p className="text-2xl font-bold">{pending.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs uppercase text-brand-green/60">Item terverifikasi</p>
            <p className="text-2xl font-bold">{verifiedQty}</p>
          </div>
        </div>
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 font-semibold">Buat wishlist</h2>
          <div className="grid gap-3">
            <div>
              <Label>Judul</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CLOTHING_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Input type="number" min={1} value={target} onChange={(e) => setTarget(Number(e.target.value) || 1)} />
            </div>
            <Button onClick={createWishlist} disabled={!title}>
              Simpan wishlist
            </Button>
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-brand-green">Klaim masuk</h2>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="rounded-xl bg-white p-4">
                <p className="font-semibold">{claim.profiles?.full_name} · {claim.status}</p>
                <p className="text-sm">{claim.item_description} ({claim.item_qty})</p>
                <p className="text-xs text-brand-green/60">Resi: {claim.tracking_number || '-'}</p>
                {claim.status === 'shipped' ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await apiFetch(`/api/claims/${claim.id}/verify`, { method: 'PATCH' });
                        await load();
                      }}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await apiFetch(`/api/claims/${claim.id}/reject`, {
                          method: 'PATCH',
                          body: JSON.stringify({ reason: 'Tidak sesuai' }),
                        });
                        await load();
                      }}
                    >
                      Tolak
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
