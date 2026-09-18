'use client';

import { Suspense } from 'react';
import { PageShell } from '@/components/PageShell';
import { DonationLanding } from '@/components/donasi/DonationLanding';

function DonasiFallback() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 text-center text-sm text-brand-cream/70">
      Memuat...
    </div>
  );
}

export default function DonasiPage() {
  return (
    <PageShell className="bg-brand-green">
      <Suspense fallback={<DonasiFallback />}>
        <DonationLanding />
      </Suspense>
    </PageShell>
  );
}
