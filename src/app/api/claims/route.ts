import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asPositiveInt, asString, assertUuid, HttpError, requireFields } from '@/lib/validations';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { PAGE_SIZE } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const url = new URL(request.url);
    const scope = asString(url.searchParams.get('scope')) || 'mine';
    const status = asString(url.searchParams.get('status'));
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(asPositiveInt(url.searchParams.get('limit') || PAGE_SIZE, PAGE_SIZE), 50);

    let query = supabase
      .from('donation_claims')
      .select(
        '*, donation_wishlists(id, title, foundation_id, category), profiles!donation_claims_donor_id_fkey(full_name, avatar_url, badge_status, donation_count)',
      )
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (scope === 'incoming') {
      const { data: wishlists, error: wError } = await supabase
        .from('donation_wishlists')
        .select('id')
        .eq('foundation_id', user.id);
      if (wError) throw new HttpError(400, wError.message);
      const ids = (wishlists || []).map((row) => row.id);
      if (ids.length === 0) return jsonOk({ data: [], nextCursor: null, hasMore: false });
      query = query.in('wishlist_id', ids);
    } else {
      query = query.eq('donor_id', user.id);
    }

    if (status) query = query.eq('status', status);
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
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['wishlist_id', 'item_description']);
    const wishlistId = asString(body.wishlist_id);
    assertUuid(wishlistId, 'wishlist_id');
    const itemQty = asPositiveInt(body.item_qty ?? 1, 1);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('donation_claims')
      .select('id', { count: 'exact', head: true })
      .eq('donor_id', user.id)
      .gte('created_at', since);
    if (countError) throw new HttpError(400, countError.message);
    if ((count ?? 0) >= 20) {
      throw new HttpError(429, 'Terlalu banyak klaim dalam 24 jam. Coba lagi nanti.');
    }

    const { data, error } = await supabase
      .from('donation_claims')
      .insert({
        wishlist_id: wishlistId,
        donor_id: user.id,
        item_description: asString(body.item_description),
        item_qty: itemQty,
      })
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);
    return jsonOk({ claim: data }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
