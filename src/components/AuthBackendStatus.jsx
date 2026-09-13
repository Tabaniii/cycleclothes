'use client';

import { useEffect, useState } from 'react';

export default function AuthBackendStatus() {
  const [hint, setHint] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/health/supabase', { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (cancelled || body?.ok) return;
        setHint(body?.hint || body?.error || 'Supabase belum siap. Cek Project URL di .env.local.');
      })
      .catch(() => {
        if (!cancelled) {
          setHint('Tidak bisa memeriksa status Supabase. Pastikan npm run dev masih berjalan.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!hint) return null;

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-sm font-semibold text-amber-900">Supabase tidak terjangkau</p>
      <p className="text-sm text-amber-800 mt-1">{hint}</p>
    </div>
  );
}
