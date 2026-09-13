import { getRequestUser, requireRole } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, HttpError } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { supabase, profile } = await getRequestUser(request);
    requireRole(profile, ['admin']);
    const { data, error } = await supabase
      .from('content_flags')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ data: data || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, profile } = await getRequestUser(request);
    requireRole(profile, ['admin']);
    const body = await readJsonBody(request);
    const id = asString(body.id);
    const status = asString(body.status);
    if (!id || !['reviewed', 'dismissed', 'open'].includes(status)) {
      throw new HttpError(400, 'id dan status flag tidak valid.');
    }
    const { data, error } = await supabase
      .from('content_flags')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ flag: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
