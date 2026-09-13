import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/services/userService';
import { authErrorMessage, isNetworkAuthError } from '@/lib/auth-errors';

async function applySession(session) {
  if (!session?.access_token || !session?.refresh_token) return;
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw error;
}

async function postAuth(path, payload) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || authErrorMessage(new Error('Failed to fetch')));
  }
  return body;
}

export async function signInWithGoogle() {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : 'http://localhost:3000/auth/callback';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(authErrorMessage(error));
}

export async function signInUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email dan password harus diisi.');
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) {
      throw new Error('Login gagal. Periksa email dan password.');
    }
    return {
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
    };
  } catch (error) {
    if (!isNetworkAuthError(error)) {
      throw new Error(authErrorMessage(error));
    }
  }

  const body = await postAuth('/api/auth/login', { email, password });
  await applySession(body.session);
  return body;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function deleteCurrentUserAccount() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) {
    throw new Error('Unauthorized: Anda belum login.');
  }

  const res = await fetch('/api/user/delete', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok || !body.success) {
    throw new Error(body.error || 'Gagal menghapus akun.');
  }

  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    // ignore sign out error karena akun sudah dihapus di server
  }

  return true;
}

export async function signUpUser({ email, password, fullName }) {
  if (!email || !password || !fullName) {
    throw new Error('Email, password, dan nama lengkap harus diisi.');
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/verified`
            : 'http://localhost:3000/auth/verified',
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Pendaftaran gagal. Coba lagi.');
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('Email sudah terdaftar. Silakan masuk.');
    }
    return {
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
      needsEmailConfirmation: !data.session,
    };
  } catch (error) {
    if (!isNetworkAuthError(error)) {
      throw new Error(authErrorMessage(error));
    }
  }

  const body = await postAuth('/api/auth/register', { email, password, fullName });
  await applySession(body.session);
  return body;
}

export async function getCurrentAuthUserWithProfile() {
  const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

  if (sessionErr) throw sessionErr;
  if (!session) return null;

  let profile = null;
  try {
    profile = await getUserProfile(session.user.id);
  } catch {
    profile = null;
  }

  return {
    user: session.user,
    session,
    profile,
  };
}

export async function sendResetPasswordEmail(email) {
  if (!email) {
    throw new Error('Email harus diisi.');
  }

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/update-password`
    : 'http://localhost:3000/auth/update-password';

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) throw new Error(authErrorMessage(error));
  return data;
}

export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(authErrorMessage(error));
  return data;
}
