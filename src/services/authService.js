import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/services/userService';

export async function signInUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email dan password harus diisi.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
}

export async function deleteCurrentUserAccount() {
  const res = await fetch('/api/user/delete', {
    method: 'POST',
    credentials: 'include',
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
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

  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password minimal 6 karakter.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}
