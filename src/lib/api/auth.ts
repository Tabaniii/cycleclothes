import { createClient } from '@supabase/supabase-js';
import type { UserRole, Profile } from '@/types/database';
import { createUserClient } from '@/lib/supabase/route-client';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { HttpError } from '@/lib/validations';

function getBearerToken(request: Request) {
  const header = request.headers.get('Authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export async function getRequestUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) throw new HttpError(401, 'Unauthorized: silakan masuk dulu.');

  const authClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Sesi tidak valid. Silakan masuk ulang.');

  const supabase = createUserClient(token);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) throw new HttpError(500, profileError.message);

  return {
    token,
    user: data.user,
    profile: (profile as Profile | null) ?? null,
    supabase,
  };
}

export function requireRole(profile: Profile | null, roles: UserRole[]) {
  if (!profile || !roles.includes(profile.role)) {
    throw new HttpError(403, 'Anda tidak punya akses untuk aksi ini.');
  }
  return profile;
}

export async function requireApprovedFoundation(supabase: ReturnType<typeof createUserClient>, userId: string) {
  const { data, error } = await supabase
    .from('foundation_profiles')
    .select('id, verification_status, is_suspended')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new HttpError(500, error.message);
  if (!data || data.verification_status !== 'approved' || data.is_suspended) {
    throw new HttpError(403, 'Hanya yayasan terverifikasi yang bisa melakukan aksi ini.');
  }
  return data;
}
