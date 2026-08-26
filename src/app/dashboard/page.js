'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentAuthUserWithProfile, signOutUser, deleteCurrentUserAccount } from '@/services/authService';
import { createProfileIfMissing, getAvatarPublicUrl, uploadUserAvatar } from '@/services/userService';

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [authData, setAuthData] = useState(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function loadUserData() {
    setLoading(true);
    setError('');
    try {
      const data = await getCurrentAuthUserWithProfile();
      if (!data) {
        router.replace('/login');
        return;
      }
      setAuthData(data);
      if (data?.profile?.avatar_url) {
        setAvatarPreviewUrl(getAvatarPublicUrl(data.profile.avatar_url));
      } else {
        setAvatarPreviewUrl(null);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengambil data user.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUserData();
  }, [router]);

  async function handleLogout() {
    try {
      await signOutUser();
      router.replace('/login');
    } catch (err) {
      setError(err.message || 'Gagal logout.');
    }
  }

  async function handleCreateProfile() {
    if (!authData?.user?.id) return;
    setCreatingProfile(true);
    setError('');

    try {
      const defaultFullName = authData.user.email?.split('@')[0] || '';
      await createProfileIfMissing(authData.user.id, {
        full_name: defaultFullName,
      });
      await loadUserData();
    } catch (err) {
      setError(err.message || 'Gagal membuat data profile. Pastikan tabel public.profiles dan RLS Policy sudah dibuat di Supabase SQL Editor.');
    } finally {
      setCreatingProfile(false);
    }
  }

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file || !authData?.user?.id) return;

    setUploadingAvatar(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await uploadUserAvatar(authData.user.id, file);
      setAvatarPreviewUrl(result.url);
      setSuccessMsg('Foto profil berhasil diperbarui!');
      await loadUserData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Gagal upload foto profil.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function openDeleteModal() {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  }

  async function confirmDeleteAccount() {
    const expected = `DELETE ${authData?.user?.email || ''}`;
    if (deleteConfirmText.trim() !== expected) {
      setError('Konfirmasi teks tidak cocok.');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteCurrentUserAccount();
      router.replace('/');
    } catch (err) {
      setError(err.message || 'Gagal menghapus akun.');
    } finally {
      setDeleting(false);
    }
  }

  const expectedDeleteText = `DELETE ${authData?.user?.email || ''}`;
  const canConfirmDelete = deleteConfirmText.trim() === expectedDeleteText;

  return (
    <div className="min-h-screen bg-brand-cream-light flex flex-col">
      <header className="bg-brand-blue py-4">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-3xl font-bold text-brand-cream-dark">
              Cycle Clothes
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-brand-cream-light bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-brand-blue mb-1">
                  Dashboard User
                </h1>
                <p className="text-gray-600 text-sm">
                  Data akun Anda yang tersimpan di Supabase
                </p>
              </div>
              <button
                onClick={loadUserData}
                className="text-xs font-medium text-brand-blue bg-brand-cream-light hover:opacity-80 px-3 py-1.5 rounded-lg transition-opacity"
              >
                Refresh Data
              </button>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-600 font-medium">✓ {successMsg}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="inline-flex items-center gap-3 text-brand-blue">
                  <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="font-medium">Memuat data user...</span>
                </div>
              </div>
            ) : authData ? (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-gray-200 p-5 bg-gray-50 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="relative h-20 w-20 rounded-full bg-brand-blue flex items-center justify-center overflow-hidden border-2 border-brand-cream-dark ring-4 ring-brand-cream-light">
                        {avatarPreviewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarPreviewUrl}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-brand-cream-dark">
                            {(authData.profile?.full_name || authData.user.email || 'U')[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-cream-dark mb-1">
                        Foto Profil
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        JPG / PNG • Maks 2MB
                      </p>
                      <button
                        onClick={triggerFilePicker}
                        disabled={uploadingAvatar || !authData.profile}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand-cream-dark text-brand-blue px-2.5 py-1 text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {uploadingAvatar ? 'Uploading...' : 'Upload Foto'}
                      </button>
                      {!authData.profile && (
                        <p className="text-[10px] text-red-500 mt-1">Buat profile dulu sebelum upload</p>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-cream-dark mb-3">
                      Auth User (Supabase Auth)
                    </p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Email</span>
                        <span className="font-semibold text-brand-blue truncate">
                          {authData.user.email || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">User ID</span>
                        <span className="font-mono text-xs text-gray-700 truncate max-w-[50%]">
                          {authData.user.id}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Email Verified</span>
                        <span className={`font-medium ${authData.user.email_confirmed_at ? 'text-emerald-600' : 'text-red-600'}`}>
                          {authData.user.email_confirmed_at ? '✓ Sudah' : '✗ Belum'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Provider</span>
                        <span className="font-medium text-gray-700">
                          {authData.user.app_metadata?.provider || 'email'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-5 bg-gray-50">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-cream-dark mb-3">
                    Profile (Tabel public.profiles)
                  </p>
                  {authData.profile ? (
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Full Name</span>
                        <span className="font-semibold text-brand-blue">
                          {authData.profile.full_name || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Role</span>
                        <span>
                          <code className="rounded bg-brand-blue text-brand-cream-dark px-2 py-0.5 text-xs font-mono">
                            {authData.profile.role || 'user'}
                          </code>
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium text-gray-700">
                          {authData.profile.phone_number || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">Created At</span>
                        <span className="font-mono text-xs text-gray-700">
                          {authData.profile.created_at ? new Date(authData.profile.created_at).toLocaleString() : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 items-start pt-1">
                        <span className="text-gray-500 shrink-0">Avatar Path</span>
                        <span className="font-mono text-[10px] text-gray-700 text-right break-all">
                          {authData.profile.avatar_url || '-'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 p-4">
                        <div className="flex items-start gap-3">
                          <svg className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-amber-700">
                              Belum ada data profile
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Akun Auth Anda sudah ada, tapi row profile di tabel <code className="font-mono bg-amber-100 px-1 rounded">public.profiles</code> belum terbuat.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateProfile}
                        disabled={creatingProfile}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-cream-dark px-4 py-2.5 text-sm font-semibold text-brand-blue hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-cream-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {creatingProfile ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Membuat profile...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Buat Profile Sekarang
                          </>
                        )}
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        Full name akan otomatis diisi dari prefix email Anda
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {authData?.profile && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-600">
                    Zona Bahaya: Hapus Akun
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tindakan ini <strong>tidak bisa dibatalkan</strong>. Seluruh data (profile, foto profil, dan semua data terkait user ini) akan <strong>dihapus secara permanen</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={openDeleteModal}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Akun Saya Permanen
              </button>
            </div>
          )}
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 md:p-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Konfirmasi Hapus Akun
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Anda yakin ingin menghapus akun ini? Semua data akan hilang selamanya.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-5">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Untuk konfirmasi, ketik persis teks di bawah:
              </p>
              <code className="block text-xs font-mono text-red-700 bg-white border border-red-200 rounded px-3 py-2 break-all select-all">
                {expectedDeleteText}
              </code>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Ketik teks konfirmasi..."
              disabled={deleting}
              className="w-full mb-5 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteAccount}
                disabled={!canConfirmDelete || deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Ya, Hapus Akun
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
