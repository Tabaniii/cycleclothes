import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { PAGE_SIZE } from '@/lib/constants';
import { asPositiveInt, asString, assertUuid, HttpError, requireFields } from '@/lib/validations';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

const LISTING_SELECT =
  'id, seller_id, title, description, category, size, condition, price, images, location, status, created_at, updated_at, profiles!listings_seller_id_fkey(full_name, avatar_url, city, badge_status, donation_count)';

function wishlistSchemaError(error: { message?: string } | null) {
  if (error?.message && /user_wishlists|schema cache/i.test(error.message)) {
    return new HttpError(
      503,
      'Tabel wishlist belum siap. Jalankan supabase/migrations/0007_user_wishlists.sql di Supabase SQL Editor, lalu refresh.',
    );
  }
  return null;
}

function publicClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const idsOnly = url.searchParams.get('ids_only') === '1';
    const requestedUser = asString(url.searchParams.get('user_id'));
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(asPositiveInt(url.searchParams.get('limit') || PAGE_SIZE, PAGE_SIZE), 50);

    if (idsOnly) {
      const { supabase, user } = await getRequestUser(request);
      const { data, error } = await supabase
        .from('user_wishlists')
        .select('listing_id')
        .eq('user_id', user.id)
        .limit(500);
      if (error) throw wishlistSchemaError(error) || new HttpError(400, error.message);
      return jsonOk({
        ids: (data || []).map((row) => row.listing_id),
        count: data?.length || 0,
      });
    }

    let ownerId = requestedUser;
    let client = publicClient();
    if (!ownerId) {
      const { supabase, user } = await getRequestUser(request);
      ownerId = user.id;
      client = supabase;
    } else {
      assertUuid(ownerId, 'user_id');
    }

    let query = client
      .from('user_wishlists')
      .select(`id, user_id, listing_id, created_at, listings(${LISTING_SELECT})`)
      .eq('user_id', ownerId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (cursor) query = query.lt('created_at', cursor.createdAt);

    const { data, error } = await query;
    if (error) throw wishlistSchemaError(error) || new HttpError(400, error.message);
    return jsonOk(nextCursorFromRows(data || [], limit));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['listing_id']);
    const listingId = asString(body.listing_id);
    assertUuid(listingId, 'listing_id');

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, status')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError) throw new HttpError(400, listingError.message);
    if (!listing || listing.status === 'removed') throw new HttpError(404, 'Listing tidak ditemukan.');
    if (listing.seller_id === user.id) {
      throw new HttpError(400, 'Tidak bisa memasukkan listing sendiri ke wishlist.');
    }

    const { data, error } = await supabase
      .from('user_wishlists')
      .upsert(
        { user_id: user.id, listing_id: listingId },
        { onConflict: 'user_id,listing_id', ignoreDuplicates: true },
      )
      .select('id, user_id, listing_id, created_at')
      .maybeSingle();
    if (error) throw wishlistSchemaError(error) || new HttpError(400, error.message);

    return jsonOk({ item: data, saved: true }, data ? 201 : 200);
  } catch (error) {
    return handleRouteError(error);
  }
}
