'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getUserProfile, updateUserProfile } from '@/services/userService';

export default function ProfileTestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullNameInput, setFullNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const sessionData = await getCurrentUser();
      if (!sessionData) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(sessionData.user);
      setFullNameInput('');

      try {
        const profileData = await getUserProfile(sessionData.user.id);
        setProfile(profileData);
        setFullNameInput(profileData.full_name || '');
      } catch (profileErr) {
        setError('Profil tidak ditemukan: ' + profileErr.message);
      }
    } catch (err) {
      setError(err.message || 'Gagal mengambil data user.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSaveStatus(null);
    setError(null);

    try {
      const updated = await updateUserProfile(user.id, {
        full_name: fullNameInput.trim(),
      });
      setProfile(updated);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setError(err.message || 'Gagal memperbarui profil.');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-900 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
                Profile Test
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Tes userService.js
              </p>
            </div>
            <button
              onClick={loadData}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
              {error}
            </div>
          )}

          {loading ? (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading data user...
            </div>
          ) : !user ? (
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Belum Login
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Silakan login terlebih dahulu melalui Supabase Auth untuk melihat data profil.
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 pt-2">
                Auth User ID: <code className="font-mono text-zinc-500">null</code>
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                  Auth User
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-600 dark:text-zinc-400">Email</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 truncate">
                      {user.email || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-zinc-600 dark:text-zinc-400">ID</span>
                    <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100 truncate">
                      {user.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-2">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
                  Profile Data
                </p>
                {profile ? (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600 dark:text-zinc-400">Full Name</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {profile.full_name || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600 dark:text-zinc-400">Role</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 text-xs font-mono">
                          {profile.role}
                        </code>
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600 dark:text-zinc-400">Phone</span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {profile.phone_number || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-600 dark:text-zinc-400">Created At</span>
                      <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                        {new Date(profile.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    (Profile belum ada di tabel)
                  </p>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Update Full Name
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-700/50"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving || !fullNameInput.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-300 transition-colors"
                  >
                    {saving ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      'Simpan Perubahan'
                    )}
                  </button>

                  {saveStatus === 'success' && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Tersimpan!
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Route: /profile-test
        </p>
      </div>
    </div>
  );
}
