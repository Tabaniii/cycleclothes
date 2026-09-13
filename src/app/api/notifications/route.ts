import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { HttpError } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const url = new URL(request.url);
    const unread = url.searchParams.get('unread') === '1';
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(Number(url.searchParams.get('limit') || 20) || 20, 50);

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);
    if (unread) query = query.is('read_at', null);
    if (cursor) query = query.lt('created_at', cursor.createdAt);

    const { data, error } = await query;
    if (error) throw new HttpError(400, error.message);
    return jsonOk(nextCursorFromRows(data || [], limit));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    const ids = Array.isArray(body.ids) ? body.ids.filter((item) => typeof item === 'string') : [];
    let query = supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    if (ids.length) query = query.in('id', ids);
    const { error } = await query;
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
