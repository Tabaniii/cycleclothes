import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { getRequestUser } from '@/lib/api/auth';
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
    const { data, error } = await supabase
      .from('donation_wishlists')
      .select(
        '*, profiles!donation_wishlists_foundation_id_fkey(full_name, avatar_url, city, badge_status, foundation_profiles(legal_name, verification_status, address))',
      )
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Wishlist tidak ditemukan.');
    return jsonOk({ wishlist: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase } = await getRequestUser(request);
    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.title === 'string') patch.title = body.title.trim();
    if (typeof body.description === 'string') patch.description = body.description.trim();
    if (typeof body.category === 'string') patch.category = body.category.trim();
    if (typeof body.status === 'string') patch.status = body.status;
    if (typeof body.target_items === 'number') patch.target_items = body.target_items;

    const { data, error } = await supabase
      .from('donation_wishlists')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ wishlist: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
