'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { ListingCreateForm } from '@/components/ListingCreateForm';
import { supabase } from '@/lib/supabase';

export default function NewListingPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(Boolean(data.session));
      setSessionChecked(true);
    });
  }, []);

  if (!sessionChecked) {
    return (
      <PageShell className="bg-brand-cream">
        <div className="mx-auto max-w-xl px-6 py-16 text-center text-sm text-brand-green/70">
          Memeriksa status login...
        </div>
      </PageShell>
    );
  }

  if (!isLoggedIn) {
    return (
      <PageShell className="bg-brand-cream">
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-brand-green/10">
            <h1 className="font-script text-3xl text-brand-green">Masuk Terlebih Dahulu</h1>
            <p className="mt-2 text-sm text-brand-green/75">
              Untuk menjual pakaian di CycleClothes, kamu perlu masuk ke akunmu terlebih dahulu.
            </p>
            <Link
              href="/login?redirect=/preloved/new"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-brand-green py-2.5 text-sm font-semibold text-brand-cream transition hover:bg-brand-green/90"
            >
              Masuk Sekarang
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-green/50">Preloved</p>
        <h1 className="mt-2 font-script text-4xl text-brand-green">Jual dari lemari</h1>
        <p className="mt-2 mb-6 text-sm text-brand-green/70">
          Foto baju, tentukan harga, lalu umumkan. Pembeli bayar lewat Stripe sandbox.
        </p>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-green/10">
          <ListingCreateForm />
        </div>
      </div>
    </PageShell>
  );
}
