'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ConfirmAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'email';
  const confirmationUrl = searchParams.get('confirmation_url');

  useEffect(() => {
    if (tokenHash || confirmationUrl) return undefined;

    let cancelled = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        await supabase.auth.signOut();
        router.replace('/auth/verified');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [tokenHash, confirmationUrl, router]);

  async function handleConfirm() {
    setStatus('confirming');
    setError('');

    try {
      if (tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (verifyError) throw verifyError;

        try {
          await supabase.auth.signOut();
        } catch {
          // session may already be empty
        }

        router.replace('/auth/verified');
        return;
      }

      if (confirmationUrl) {
        window.location.assign(confirmationUrl);
        return;
      }

      throw new Error('This confirmation link is incomplete. Please use the link from your email.');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Unable to confirm this account.');
    }
  }

  const canConfirm = Boolean(tokenHash || confirmationUrl);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-brand-light-green flex items-center justify-center">
        <svg className="h-7 w-7 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-brand-green mb-2">
        Confirm your account
      </h1>
      <p className="text-gray-600 mb-6">
        Click the button below to verify your email and finish creating your Cycle Clothes account.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm || status === 'confirming'}
        className="w-full bg-brand-green text-brand-cream font-semibold py-3 px-4 rounded-lg hover:bg-opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {status === 'confirming' ? 'Confirming...' : 'Verify my account'}
      </button>

      {!canConfirm && (
        <p className="mt-4 text-sm text-gray-500">
          Open this page from the confirmation email we sent you.
        </p>
      )}
    </div>
  );
}

export default function ConfirmAccountPage() {
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
            <ConfirmAccountContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
