import { PAGE_SIZE, CLOTHING_CATEGORIES } from '@/lib/constants';
import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { asPositiveInt, asString, HttpError, requireFields } from '@/lib/validations';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

function publicSupabase() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = asString(url.searchParams.get('category'));
    const mine = url.searchParams.get('mine') === '1';
    const requestedStatus = asString(url.searchParams.get('status'));
    const status = mine ? requestedStatus : requestedStatus || 'open';
    const q = asString(url.searchParams.get('q'));
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(asPositiveInt(url.searchParams.get('limit') || PAGE_SIZE, PAGE_SIZE), 50);

    const sort = asString(url.searchParams.get('sort')) || 'newest';
    const ascending = sort === 'oldest';
    const wishlistSelect =
      '*, profiles!donation_wishlists_foundation_id_fkey(full_name, avatar_url, city, badge_status)';

    let query = publicSupabase()
      .from('donation_wishlists')
      .select(wishlistSelect)
      .order('created_at', { ascending })
      .order('id', { ascending })
      .limit(limit + 1);

    if (mine) {
      const { supabase, user } = await getRequestUser(request);
      query = supabase
        .from('donation_wishlists')
        .select(wishlistSelect)
        .eq('foundation_id', user.id)
        .order('created_at', { ascending })
        .order('id', { ascending })
        .limit(limit + 1);
    }

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (q) query = query.ilike('title', `%${q}%`);
    if (cursor) {
      query = ascending ? query.gt('created_at', cursor.createdAt) : query.lt('created_at', cursor.createdAt);
    }

    const { data, error } = await query;
    if (error) throw new HttpError(400, error.message);

    const rows = data || [];
    const foundationIds = [...new Set(rows.map((row) => row.foundation_id).filter(Boolean))];
    let foundationsById: Record<string, { legal_name: string; verification_status: string; address: string | null; pic_phone: string | null }> = {};

    if (foundationIds.length > 0) {
      const { data: foundations } = await publicSupabase()
        .from('foundation_profiles')
        .select('id, legal_name, verification_status, address, pic_phone')
        .in('id', foundationIds);
      foundationsById = Object.fromEntries((foundations || []).map((item) => [item.id, item]));
    }

    const merged = rows.map((row) => ({
      ...row,
      foundation_profiles: foundationsById[row.foundation_id] || null,
    }));

    return jsonOk(nextCursorFromRows(merged, limit));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await getRequestUser(request);
    if (!profile) throw new HttpError(403, 'Lengkapi profil terlebih dahulu.');

    const body = await readJsonBody(request);
    requireFields(body, ['title', 'target_items']);
    const title = asString(body.title);
    const description = asString(body.description) || null;
    const category = asString(body.category) || null;
    const targetItems = asPositiveInt(body.target_items);

    if (category && !(CLOTHING_CATEGORIES as readonly string[]).includes(category)) {
      throw new HttpError(400, 'Kategori tidak valid.');
    }

    const { data, error } = await supabase
      .from('donation_wishlists')
      .insert({
        foundation_id: profile.id,
        title,
        description,
        category,
        target_items: targetItems,
      })
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);
    return jsonOk({ wishlist: data }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
