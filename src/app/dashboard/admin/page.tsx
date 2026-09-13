'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { AdminReviewTable } from '@/components/AdminReviewTable';
import { apiFetch } from '@/lib/api/client';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { ContentFlag, FoundationProfile } from '@/types/database';

type Kpis = {
  pending_foundations: number;
  open_wishlists: number;
  escrow_orders: number;
  verified_claims: number;
  open_flags: number;
};

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [apps, setApps] = useState<FoundationProfile[]>([]);
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [kpi, pending, flagRes] = await Promise.all([
        apiFetch<Kpis>('/api/admin/kpis'),
        apiFetch<{ data: FoundationProfile[] }>('/api/admin/foundations?status=pending'),
        apiFetch<{ data: ContentFlag[] }>('/api/admin/flags'),
      ]);
      setKpis(kpi);
      setApps(pending.data);
      setFlags(flagRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Akses admin gagal.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-green">Dashboard Admin</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-5">
          {kpis
            ? Object.entries(kpis).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-white p-4">
                  <p className="text-xs uppercase text-brand-green/60">{key.replaceAll('_', ' ')}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              ))
            : null}
        </div>
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 font-semibold">Pengajuan yayasan</h2>
          <AdminReviewTable applications={apps} onChanged={load} />
        </section>
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 font-semibold">Konten terflag</h2>
          <Table>
            <THead>
              <TR>
                <TH>Tipe</TH>
                <TH>Alasan</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {flags.map((flag) => (
                <TR key={flag.id}>
                  <TD>
                    {flag.entity_type}
                    <div className="text-xs text-brand-green/50">{flag.entity_id}</div>
                  </TD>
                  <TD>{flag.reason}</TD>
                  <TD>{flag.status}</TD>
                  <TD>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await apiFetch('/api/admin/flags', {
                          method: 'PATCH',
                          body: JSON.stringify({ id: flag.id, status: 'reviewed' }),
                        });
                        await load();
                      }}
                    >
                      Tinjau
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </section>
      </div>
    </PageShell>
  );
}
