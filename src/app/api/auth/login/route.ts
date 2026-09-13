import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { authErrorMessage } from '@/lib/auth-errors';
import { jsonError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, HttpError, requireFields } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    requireFields(body, ['email', 'password']);
    const email = asString(body.email).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new HttpError(400, authErrorMessage(error));
    if (!data.session || !data.user) throw new HttpError(401, 'Login gagal. Periksa email dan password.');

    try {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        await admin.from('profiles').upsert({
          id: data.user.id,
          full_name:
            (data.user.user_metadata?.full_name as string | undefined) ||
            email.split('@')[0],
          role: 'user',
          badge_status: 'Newbie',
          donation_count: 0,
        });
      }
    } catch {
      // Login tetap dilanjutkan meski perbaikan profil gagal.
    }

    return jsonOk({
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
    });
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.message, error.status);
    return jsonError(authErrorMessage(error), 500);
  }
}
