'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { UserBadgePill } from '@/components/UserBadgePill';
import { getAvatarPublicUrl } from '@/services/userService';
import type { BadgeStatus } from '@/types/database';

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<{
    profile: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      city: string | null;
      badge_status: BadgeStatus;
      donation_count: number;
    };
    rating: { average: number; count: number };
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/profiles/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setData(body);
      })
      .catch((err) => setError(err.message));
  }, [params.id]);

  if (error) {
    return (
      <PageShell>
        <p className="p-10 text-red-600">{error}</p>
      </PageShell>
    );
  }
  if (!data) {
    return (
      <PageShell>
        <p className="p-10">Memuat profil...</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 text-center">
          <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-brand-green text-3xl font-bold leading-[96px] text-brand-cream">
            {data.profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getAvatarPublicUrl(data.profile.avatar_url) || ''} alt="" className="h-full w-full object-cover" />
            ) : (
              (data.profile.full_name || 'U')[0]
            )}
          </div>
          <h1 className="text-2xl font-bold text-brand-green">{data.profile.full_name || 'Pengguna'}</h1>
          <p className="text-sm text-brand-green/70">{data.profile.city || 'Lokasi belum diisi'}</p>
          <div className="mt-3 flex justify-center">
            <UserBadgePill status={data.profile.badge_status} />
          </div>
          <p className="mt-4 text-sm">
            {data.profile.donation_count} donasi terverifikasi
          </p>
          <p className="text-sm">
            Rating {data.rating.average.toFixed(1)} ({data.rating.count} ulasan)
          </p>
          <a
            href={`/u/${data.profile.id}/wishlist`}
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-brand-cream"
          >
            Lihat wishlist
          </a>
        </div>
      </div>
    </PageShell>
  );
}
