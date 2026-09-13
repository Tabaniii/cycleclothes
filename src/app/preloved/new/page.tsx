'use client';

import { PageShell } from '@/components/PageShell';
import { ListingCreateForm } from '@/components/ListingCreateForm';

export default function NewListingPage() {
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
