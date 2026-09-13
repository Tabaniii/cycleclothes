import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { authErrorMessage } from '@/lib/auth-errors';
import { jsonError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, HttpError, requireFields } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    requireFields(body, ['email', 'password', 'fullName']);
    const email = asString(body.email).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const fullName = asString(body.fullName);
    if (password.length < 6) throw new HttpError(400, 'Password minimal 6 karakter.');

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/verified`,
        data: { full_name: fullName },
      },
    });

    if (error) throw new HttpError(400, authErrorMessage(error));
    if (!data.user) throw new HttpError(400, 'Pendaftaran gagal. Coba lagi.');
    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new HttpError(400, 'Email sudah terdaftar. Silakan masuk.');
    }

    try {
      const admin = createAdminClient();
      const { error: profileError } = await admin.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: fullName,
          role: 'user',
          badge_status: 'Newbie',
          donation_count: 0,
        },
        { onConflict: 'id' },
      );
      if (profileError) {
        await admin.from('profiles').upsert({ id: data.user.id, full_name: fullName }, { onConflict: 'id' });
      }
    } catch {
      // Trigger handle_new_user tetap jadi jalur utama jika service role belum siap.
    }

    return jsonOk({
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
      needsEmailConfirmation: !data.session,
    }, 201);
  } catch (error) {
    if (error instanceof HttpError) return jsonError(error.message, error.status);
    return jsonError(authErrorMessage(error), 500);
  }
}
