'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { UserWishlistGrid } from '@/components/UserWishlistGrid';
import { getCurrentAuthUserWithProfile } from '@/services/authService';

export default function MyWishlistPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentAuthUserWithProfile().then((session) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      setUserId(session.user.id);
    });
  }, [router]);

  return (
    <PageShell className="bg-brand-cream">
      {userId ? (
        <UserWishlistGrid userId={userId} isOwner />
      ) : (
        <p className="px-6 py-10 text-sm text-brand-green/70">Menyiapkan wishlist...</p>
      )}
    </PageShell>
  );
}
