'use client';

import { useState } from 'react';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import type { FoundationProfile } from '@/types/database';

export function AdminReviewTable({
  applications,
  onChanged,
}: {
  applications: FoundationProfile[];
  onChanged?: () => void;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function review(id: string, verification_status: 'approved' | 'rejected' | 'suspended') {
    setBusyId(id);
    setError('');
    try {
      await apiFetch(`/api/admin/foundations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          verification_status: verification_status === 'suspended' ? undefined : verification_status,
          is_suspended: verification_status === 'suspended' ? true : undefined,
          review_note: notes[id] || '',
          suspension_reason: verification_status === 'suspended' ? notes[id] || 'Suspended by admin' : undefined,
        }),
      });
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui yayasan.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Table>
        <THead>
          <TR>
            <TH>Yayasan</TH>
            <TH>Status</TH>
            <TH>Diajukan</TH>
            <TH>Catatan</TH>
            <TH>Aksi</TH>
          </TR>
        </THead>
        <TBody>
          {applications.map((row) => (
            <TR key={row.id}>
              <TD>
                <p className="font-semibold">{row.legal_name}</p>
                <p className="text-xs text-brand-green/60">{row.pic_name} · {row.pic_phone}</p>
              </TD>
              <TD>
                {row.verification_status}
                {row.is_suspended ? ' · suspended' : ''}
              </TD>
              <TD>{formatDate(row.created_at)}</TD>
              <TD>
                <Textarea
                  className="min-h-16"
                  value={notes[row.id] ?? row.review_note ?? ''}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [row.id]: event.target.value }))}
                />
              </TD>
              <TD>
                <div className="flex flex-col gap-2">
                  <Button size="sm" disabled={busyId === row.id} onClick={() => review(row.id, 'approved')}>
                    Setujui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'rejected')}
                  >
                    Tolak
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === row.id}
                    onClick={() => review(row.id, 'suspended')}
                  >
                    Suspend
                  </Button>
                </div>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      {applications.length === 0 ? (
        <p className="p-4 text-sm text-brand-green/70">Tidak ada pengajuan yayasan.</p>
      ) : null}
    </div>
  );
}
