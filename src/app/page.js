'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [supabaseUrl, setSupabaseUrl] = useState('');

  useEffect(() => {
    async function testSupabaseConnection() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        setStatus('error');
        setError('Environment variable NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY tidak ditemukan. Periksa file .env.local Anda.');
        return;
      }

      setSupabaseUrl(url);

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Koneksi ke Supabase gagal.');
      }
    }

    testSupabaseConnection();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
                Tes Koneksi Supabase
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Memverifikasi integrasi dengan database Supabase
              </p>
            </div>

            <div className="w-full space-y-3">
              {status === 'loading' && (
                <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Checking connection...
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-3">
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Terhubung ke Supabase!
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-4 py-3 text-left dark:bg-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                      Supabase URL
                    </p>
                    <p className="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all">
                      {supabaseUrl}
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-3">
                  <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Koneksi Gagal / Environment Variable Hilang
                  </div>
                  <div className="rounded-lg bg-zinc-50 px-4 py-3 text-left dark:bg-zinc-800/50">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-1">
                      Detail Error
                    </p>
                    <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                      {error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Environment dibaca dari .env.local
        </p>
      </div>
    </div>
  );
}
