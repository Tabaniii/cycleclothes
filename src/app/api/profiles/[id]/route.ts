import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { assertUuid, HttpError } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: profile, error: profileError }, { data: reviews, error: reviewError }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, city, role, badge_status, donation_count, created_at')
        .eq('id', id)
        .maybeSingle(),
      supabase.from('reviews').select('rating').eq('reviewee_id', id),
    ]);

    if (profileError) throw new HttpError(400, profileError.message);
    if (!profile) throw new HttpError(404, 'Profil tidak ditemukan.');
    if (reviewError) throw new HttpError(400, reviewError.message);

    const ratings = (reviews || []).map((row) => row.rating);
    const ratingAvg = ratings.length ? ratings.reduce((sum, item) => sum + item, 0) / ratings.length : 0;

    return jsonOk({
      profile,
      rating: {
        average: Number(ratingAvg.toFixed(2)),
        count: ratings.length,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
