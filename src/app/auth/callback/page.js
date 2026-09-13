'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const href = window.location.href;
      if (href.includes('code=')) {
        await supabase.auth.exchangeCodeForSession(href);
      }
      router.replace('/dashboard');
    }
    run();
  }, [router]);

  return <p className="p-10 text-brand-cream">Menyelesaikan login...</p>;
}
