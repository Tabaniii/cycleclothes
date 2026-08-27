'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function VerifiedContent() {
  const searchParams = useSearchParams();
  const hasError = Boolean(searchParams.get('error'));

  useEffect(() => {
    let cancelled = false;

    async function clearSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled && session) {
        await supabase.auth.signOut();
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        await supabase.auth.signOut();
      }
    });

    clearSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className={`mx-auto mb-4 h-14 w-14 rounded-full flex items-center justify-center ${hasError ? 'bg-red-100' : 'bg-brand-light-green'}`}>
        {hasError ? (
          <svg className="h-7 w-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-7 w-7 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      <h1 className="text-2xl font-bold text-brand-green mb-3">
        {hasError ? 'Verification failed' : 'Your account has been verified'}
      </h1>
      <p className="text-gray-600 mb-8">
        {hasError
          ? 'This confirmation link is invalid or has expired. Please register again or request a new email.'
          : 'Please go back to the login page and login with your account.'}
      </p>

      <Link
        href="/login"
        className="inline-flex w-full items-center justify-center bg-brand-green text-brand-cream font-semibold py-3 px-4 rounded-lg hover:bg-opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-all"
      >
        Back to login
      </Link>
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      <header className="bg-brand-green py-4">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link href="/" className="text-3xl font-bold text-brand-cream">
            Cycle Clothes
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <Suspense fallback={
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-brand-green">
              Loading...
            </div>
          }>
            <VerifiedContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
