import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError } from '@/lib/validations';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles!listings_seller_id_fkey(full_name, avatar_url, city, badge_status, donation_count)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Listing tidak ditemukan.');
    return jsonOk({ listing: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    const patch: Record<string, unknown> = {};
    for (const key of ['title', 'description', 'category', 'size', 'condition', 'location', 'status']) {
      if (typeof body[key] === 'string') patch[key] = asString(body[key]);
    }
    if (typeof body.price === 'number') patch.price = body.price;
    if (Array.isArray(body.images)) patch.images = body.images;

    const { data, error } = await supabase
      .from('listings')
      .update(patch)
      .eq('id', id)
      .eq('seller_id', user.id)
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ listing: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const { data, error } = await supabase
      .from('listings')
      .update({ status: 'removed' })
      .eq('id', id)
      .eq('seller_id', user.id)
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ listing: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
