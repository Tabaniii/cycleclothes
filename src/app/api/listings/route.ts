import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asNonNegativeNumber, asString, HttpError, requireFields } from '@/lib/validations';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { CLOTHING_CATEGORIES, CLOTHING_SIZES, PAGE_SIZE } from '@/lib/constants';

function publicClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = asString(url.searchParams.get('scope'));
    const category = asString(url.searchParams.get('category'));
    const size = asString(url.searchParams.get('size'));
    const condition = asString(url.searchParams.get('condition'));
    const location = asString(url.searchParams.get('location'));
    const q = asString(url.searchParams.get('q'));
    const minPrice = url.searchParams.get('min_price');
    const maxPrice = url.searchParams.get('max_price');
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(Number(url.searchParams.get('limit') || PAGE_SIZE) || PAGE_SIZE, 50);

    if (scope === 'mine') {
      const { supabase, user } = await getRequestUser(request);
      let mineQuery = supabase
        .from('listings')
        .select('*, profiles!listings_seller_id_fkey(full_name, avatar_url, city, badge_status, donation_count)')
        .eq('seller_id', user.id)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);
      if (cursor) mineQuery = mineQuery.lt('created_at', cursor.createdAt);
      const { data, error } = await mineQuery;
      if (error) throw new HttpError(400, error.message);
      return jsonOk(nextCursorFromRows(data || [], limit));
    }

    let query = publicClient()
      .from('listings')
      .select('*, profiles!listings_seller_id_fkey(full_name, avatar_url, city, badge_status, donation_count)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (category) query = query.eq('category', category);
    if (size) query = query.eq('size', size);
    if (condition) query = query.eq('condition', condition);
    if (location) query = query.ilike('location', `%${location}%`);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));
    if (cursor) query = query.lt('created_at', cursor.createdAt);

    const { data, error } = await query;
    if (error) throw new HttpError(400, error.message);
    return jsonOk(nextCursorFromRows(data || [], limit));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user, profile } = await getRequestUser(request);
    if (!profile) throw new HttpError(403, 'Lengkapi profil terlebih dahulu.');
    const body = await readJsonBody(request);
    requireFields(body, ['title', 'price']);

    const category = asString(body.category);
    const size = asString(body.size);
    const condition = asString(body.condition) || 'good';
    if (category && !(CLOTHING_CATEGORIES as readonly string[]).includes(category)) {
      throw new HttpError(400, 'Kategori tidak valid.');
    }
    if (size && !(CLOTHING_SIZES as readonly string[]).includes(size)) {
      throw new HttpError(400, 'Ukuran tidak valid.');
    }

    const images = Array.isArray(body.images)
      ? body.images.filter((item): item is string => typeof item === 'string').slice(0, 8)
      : [];

    const { data, error } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        title: asString(body.title),
        description: asString(body.description) || null,
        category: category || null,
        size: size || null,
        condition,
        price: asNonNegativeNumber(body.price),
        images,
        location: asString(body.location) || profile.city || null,
      })
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);
    return jsonOk({ listing: data }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
