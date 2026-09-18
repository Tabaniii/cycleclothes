'use client';

import dynamic from 'next/dynamic';

const DropoffMap = dynamic(() => import('@/components/home/DropoffMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[22rem] items-center justify-center text-xs text-brand-green/60">
      Memuat peta...
    </div>
  ),
});

export function DropoffMapLoader() {
  return <DropoffMap />;
}
