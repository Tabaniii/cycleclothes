'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { UserBadgePill } from '@/components/UserBadgePill';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api/client';
import { uploadPrivateFile } from '@/lib/storage';
import { nextBadgeProgress } from '@/lib/badges';
import { getCurrentAuthUserWithProfile } from '@/services/authService';
import { isAllowedImageFile } from '@/lib/validations';
import type { DonationClaim, Notification, Profile } from '@/types/database';

export default function DonorDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claims, setClaims] = useState<DonationClaim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | undefined>>({});

  async function load() {
    try {
      const session = await getCurrentAuthUserWithProfile();
      if (!session?.profile) {
        setError('Silakan masuk.');
        return;
      }
      setProfile(session.profile as Profile);
      const [claimRes, notifRes] = await Promise.all([
        apiFetch<{ data: DonationClaim[] }>('/api/claims?scope=mine'),
        apiFetch<{ data: Notification[] }>('/api/notifications'),
      ]);
      setClaims(claimRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function ship(claim: DonationClaim) {
    if (!profile) return;
    const file = files[claim.id];
    const trackingNumber = tracking[claim.id];
    if (!file || !trackingNumber) {
      setError('Resi dan foto bukti kirim wajib.');
      return;
    }
    if (!isAllowedImageFile(file)) {
      setError('Bukti kirim maks 5MB (JPG/PNG/WebP/GIF).');
      return;
    }
    const path = await uploadPrivateFile('donation-proofs', profile.id, file, claim.id);
    await apiFetch(`/api/claims/${claim.id}/ship`, {
      method: 'PATCH',
      body: JSON.stringify({ tracking_number: trackingNumber, proof_image_url: path }),
    });
    await load();
  }

  const progress = nextBadgeProgress(profile?.donation_count || 0);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-green">Dashboard Donatur</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex items-center gap-3">
            <UserBadgePill status={progress.current} />
            <p className="font-semibold text-brand-green">{profile?.donation_count || 0} donasi terverifikasi</p>
          </div>
          <p className="mt-3 text-sm text-brand-green/80">
            {progress.next
              ? `${progress.remaining} donasi lagi menuju ${progress.next}`
              : 'Kamu sudah di badge tertinggi.'}
          </p>
          <Progress className="mt-2" value={progress.progress * 100} />
        </div>
        <section>
          <h2 className="mb-3 font-semibold text-brand-green">Riwayat klaim</h2>
          <div className="space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="rounded-xl bg-white p-4">
                <p className="font-semibold text-brand-green">{claim.donation_wishlists?.title}</p>
                <p className="text-sm text-brand-green/70">
                  {claim.item_description} · {claim.item_qty} item · {claim.status}
                </p>
                {claim.status === 'pending' || claim.status === 'shipped' ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder="Nomor resi"
                      value={tracking[claim.id] || claim.tracking_number || ''}
                      onChange={(e) => setTracking((prev) => ({ ...prev, [claim.id]: e.target.value }))}
                    />
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => setFiles((prev) => ({ ...prev, [claim.id]: e.target.files?.[0] }))}
                    />
                    <Button onClick={() => ship(claim)}>Upload bukti kirim</Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold text-brand-green">Notifikasi</h2>
          <ul className="space-y-2">
            {notifications.map((item) => (
              <li key={item.id} className="rounded-lg bg-white px-4 py-3 text-sm">
                <p className="font-semibold">{item.title}</p>
                <p className="text-brand-green/70">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
