'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { UserWishlistGrid } from '@/components/UserWishlistGrid';
import { getCurrentAuthUserWithProfile } from '@/services/authService';

export default function PublicUserWishlistPage() {
  const params = useParams<{ id: string }>();
  const [ownerName, setOwnerName] = useState('pengguna');
  const [myId, setMyId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getCurrentAuthUserWithProfile().then((session) => setMyId(session?.user.id ?? null));
    fetch(`/api/profiles/${params.id}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setOwnerName(body.profile?.full_name || 'pengguna');
      })
      .catch(() => setMissing(true));
  }, [params.id]);

  if (missing) {
    return (
      <PageShell className="bg-brand-cream">
        <p className="px-6 py-10 text-red-600">Pengguna tidak ditemukan.</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-brand-cream">
      <UserWishlistGrid userId={params.id} isOwner={myId === params.id} ownerName={ownerName} />
    </PageShell>
  );
}
