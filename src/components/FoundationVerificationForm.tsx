'use client';

import { useState, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api/client';
import { uploadPrivateFile } from '@/lib/storage';
import { isAllowedDocFile } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export function FoundationVerificationForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [legalName, setLegalName] = useState('');
  const [address, setAddress] = useState('');
  const [picName, setPicName] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [file, setFile] = useState<File | null>(null);
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
      if (!userId) throw new Error('Silakan masuk terlebih dahulu.');
      if (file && !isAllowedDocFile(file)) {
        throw new Error('Dokumen harus PDF/JPG/PNG/WebP dan maksimal 5MB.');
      }

      let legalDocumentUrl: string | undefined;
      if (file) {
        legalDocumentUrl = await uploadPrivateFile('foundation-docs', userId, file, 'legal');
      }

      await apiFetch('/api/foundations/apply', {
        method: 'POST',
        body: JSON.stringify({
          legal_name: legalName,
          address,
          pic_name: picName,
          pic_phone: picPhone,
          legal_document_url: legalDocumentUrl,
        }),
      });
      setSuccess('Pengajuan terkirim. Admin akan meninjau dokumen legal yayasan.');
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pengajuan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <div>
        <Label htmlFor="legal_name">Nama resmi yayasan</Label>
        <Input id="legal_name" value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="address">Alamat</Label>
        <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pic_name">Nama PIC</Label>
          <Input id="pic_name" value={picName} onChange={(e) => setPicName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="pic_phone">Kontak PIC</Label>
          <Input id="pic_phone" value={picPhone} onChange={(e) => setPicPhone(e.target.value)} required />
        </div>
      </div>
      <div>
        <Label htmlFor="legal_doc">Dokumen legal (PDF/gambar, maks 5MB)</Label>
        <Input
          id="legal_doc"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim pengajuan'}
      </Button>
    </form>
  );
}
