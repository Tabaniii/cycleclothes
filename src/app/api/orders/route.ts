import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { asString, HttpError } from '@/lib/validations';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { PAGE_SIZE } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const url = new URL(request.url);
    const role = asString(url.searchParams.get('role')) || 'buyer';
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(Number(url.searchParams.get('limit') || PAGE_SIZE) || PAGE_SIZE, 50);

    let query = supabase
      .from('orders')
      .select('*, listings(id, title, images, price, status)')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    query = role === 'seller' ? query.eq('seller_id', user.id) : query.eq('buyer_id', user.id);
    if (cursor) query = query.lt('created_at', cursor.createdAt);

    const { data, error } = await query;
    if (error) throw new HttpError(400, error.message);
    return jsonOk(nextCursorFromRows(data || [], limit));
  } catch (error) {
    return handleRouteError(error);
  }
}
