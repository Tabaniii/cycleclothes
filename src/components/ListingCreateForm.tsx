'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { CLOTHING_CATEGORIES, CLOTHING_SIZES, LISTING_CONDITIONS } from '@/lib/constants';
import { apiFetch } from '@/lib/api/client';
import { uploadPrivateFile } from '@/lib/storage';
import { isAllowedImageFile } from '@/lib/validations';
import { supabase } from '@/lib/supabase';

type CreatedListing = { id: string };

export function ListingCreateForm({
  defaultLocation = '',
  onCreated,
  compact = false,
}: {
  defaultLocation?: string;
  onCreated?: (listing: CreatedListing) => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('atasan');
  const [size, setSize] = useState('M');
  const [condition, setCondition] = useState('good');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState(defaultLocation);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) {
        router.push('/login');
        return;
      }
      const images: string[] = [];
      for (const file of files.slice(0, 5)) {
        if (!isAllowedImageFile(file)) throw new Error('Setiap gambar maks 5MB (JPG/PNG/WebP/GIF).');
        images.push(await uploadPrivateFile('product-images', userId, file, 'listing'));
      }
      const result = await apiFetch<{ listing: CreatedListing }>('/api/listings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          category,
          size,
          condition,
          price: Number(price),
          location,
          images,
        }),
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setFiles([]);
      setSuccess('Baju berhasil diumumkan di Preloved.');
      if (onCreated) onCreated(result.listing);
      else router.push(`/preloved/${result.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat listing.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <div>
        <Label htmlFor="listing-title">Nama baju</Label>
        <Input
          id="listing-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Contoh: Kemeja flanel cokelat"
        />
      </div>
      <div>
        <Label htmlFor="listing-description">Cerita singkat</Label>
        <Textarea
          id="listing-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kondisi, alasan jual, atau ukuran lebih detail..."
          rows={compact ? 3 : 4}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Kategori</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CLOTHING_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Ukuran</Label>
          <Select value={size} onChange={(e) => setSize(e.target.value)}>
            {CLOTHING_SIZES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Kondisi</Label>
          <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {LISTING_CONDITIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="listing-price">Harga (Rp)</Label>
          <Input
            id="listing-price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            placeholder="75000"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="listing-location">Kota pengiriman</Label>
        <Input
          id="listing-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Jakarta, Bandung, ..."
        />
      </div>
      <div>
        <Label htmlFor="listing-images">Foto baju (maks 5)</Label>
        <Input
          id="listing-images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 5))}
        />
        {files.length > 0 ? (
          <p className="mt-2 text-xs text-brand-green/70">{files.length} foto siap diunggah</p>
        ) : null}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Mengunggah...' : 'Umumkan di Preloved'}
      </Button>
    </form>
  );
}
