'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendResetPasswordEmail } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setIsSuccess(false);

    try {
      await sendResetPasswordEmail(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengirim email reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream-light flex flex-col">
      <header className="bg-brand-blue py-4">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Link href="/" className="text-3xl font-bold text-brand-cream-dark">
            Cycle Clothes
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-brand-blue flex items-center justify-center">
                <svg className="h-6 w-6 text-brand-cream-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-blue mb-2">
                Lupa Password?
              </h1>
              <p className="text-gray-600">
                Masukkan email Anda, kami akan kirimkan link untuk reset password
              </p>
            </div>

            {isSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      Email Terkirim!
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      Cek inbox email Anda dan ikuti instruksi untuk mereset password. Jika tidak ada, periksa folder spam.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!isSuccess && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cream-dark focus:border-brand-cream-dark outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-opacity-90 focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Mengirim...
                    </span>
                  ) : (
                    'Kirim Link Reset Password'
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center space-y-2">
              <p className="text-gray-600">
                <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                  &larr; Kembali ke Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
