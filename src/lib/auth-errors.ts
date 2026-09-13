export function errorText(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: string }).message || '');
  }
  if (error instanceof Error) return error.message;
  return String(error || '');
}

export function isNetworkAuthError(error: unknown) {
  const raw = errorText(error);
  return /fetch failed|Failed to fetch|NetworkError|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|NXDOMAIN|Could not resolve host|getaddrinfo|AuthRetryableFetchError/i.test(
    raw,
  );
}

export function authErrorMessage(error: unknown) {
  const raw = errorText(error);

  if (isNetworkAuthError(error) || /nxdomain|could not resolve host/i.test(raw)) {
    return 'Host Supabase di NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di internet (DNS NXDOMAIN). Bukan salah browser. Proyek kemungkinan dihapus, masih pause, atau URL-nya salah. Buka Supabase Dashboard → Connect, salin Project URL + kunci ke .env.local, lalu restart npm run dev.';
  }
  if (/Database error saving new user|unexpected_failure/i.test(raw)) {
    return 'Pendaftaran terblokir trigger profil. Jalankan migrasi 0006_repair_profiles_auth.sql di Supabase SQL Editor.';
  }
  return raw || 'Terjadi kesalahan autentikasi.';
}
