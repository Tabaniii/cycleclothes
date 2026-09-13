'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';
import type { DonationWishlist } from '@/types/database';

export function DonationModal({
  wishlist,
  open,
  onClose,
  onCreated,
}: {
  wishlist: Pick<DonationWishlist, 'id' | 'title'>;
  open: boolean;
  onClose: () => void;
  onCreated?: (claimId: string) => void;
}) {
  const [itemDescription, setItemDescription] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch<{ claim: { id: string } }>('/api/claims', {
        method: 'POST',
        body: JSON.stringify({
          wishlist_id: wishlist.id,
          item_description: itemDescription,
          item_qty: itemQty,
        }),
      });
      onCreated?.(result.claim.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat klaim.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Donasi ke ${wishlist.title}`}>
      <div className="space-y-4">
        <p className="text-sm text-brand-green/80">
          Isi deskripsi barang dan jumlah. Setelah mengirim, unggah nomor resi + foto bukti kirim.
        </p>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div>
          <Label htmlFor="item_description">Deskripsi item</Label>
          <Textarea
            id="item_description"
            value={itemDescription}
            onChange={(event) => setItemDescription(event.target.value)}
            placeholder="Contoh: 3 kemeja anak size S, kondisi layak pakai"
            required
          />
        </div>
        <div>
          <Label htmlFor="item_qty">Jumlah item</Label>
          <Input
            id="item_qty"
            type="number"
            min={1}
            value={itemQty}
            onChange={(event) => setItemQty(Number(event.target.value) || 1)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={loading || !itemDescription.trim()}>
            {loading ? 'Mengirim...' : 'Kirim klaim'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
