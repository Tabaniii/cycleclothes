'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/services/authService';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak sama.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setIsSuccess(false);

    try {
      await updatePassword(formData.newPassword);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memperbarui password.');
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-brand-blue mb-2">
                Perbarui Password
              </h1>
              <p className="text-gray-600">
                Masukkan password baru Anda
              </p>
            </div>

            {isSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      Password Berhasil Diperbarui!
                    </p>
                    <p className="text-sm text-emerald-600 mt-1">
                      Anda dapat masuk menggunakan password baru Anda.
                    </p>
                    <button
                      onClick={() => router.push('/login')}
                      className="mt-3 text-sm font-semibold text-emerald-700 underline hover:no-underline"
                    >
                      Ke halaman Login &rarr;
                    </button>
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
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cream-dark focus:border-brand-cream-dark outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Ulangi password baru..."
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
                      Memperbarui...
                    </span>
                  ) : (
                    'Perbarui Password'
                  )}
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Sudah ingat passwordnya?{' '}
                <Link href="/login" className="font-semibold text-brand-blue hover:underline">
                  Masuk sekarang
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
