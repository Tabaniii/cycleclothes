'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { UserWishlistGrid } from '@/components/UserWishlistGrid';
import { getCurrentAuthUserWithProfile } from '@/services/authService';

export default function MyWishlistPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getCurrentAuthUserWithProfile().then((session) => {
      if (!session?.user) {
        setChecked(true);
        router.replace('/login?redirect=/wishlist');
        return;
      }
      setUserId(session.user.id);
      setChecked(true);
    });
  }, [router]);

  return (
    <PageShell className="bg-brand-cream">
      {userId ? (
        <UserWishlistGrid userId={userId} isOwner />
      ) : checked ? (
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-brand-green/10">
            <h1 className="font-script text-3xl text-brand-green">Masuk ke Akun</h1>
            <p className="mt-2 text-sm text-brand-green/75">
              Masuk untuk melihat dan menyimpan koleksi pakaian favorit ke dalam wishlist kamu.
            </p>
            <Link
              href="/login?redirect=/wishlist"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-green py-2.5 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/90"
            >
              Masuk Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <p className="px-6 py-16 text-center text-sm text-brand-green/70">Menyiapkan wishlist...</p>
      )}
    </PageShell>
  );
}
