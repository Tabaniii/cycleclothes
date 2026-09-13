import { getRequestUser, requireRole } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { HttpError } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { supabase, profile } = await getRequestUser(request);
    requireRole(profile, ['admin']);

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    const { data, error } = await supabase
      .from('foundation_profiles')
      .select('*')
      .eq('verification_status', status)
      .order('created_at', { ascending: false });
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ data: data || [] });
  } catch (error) {
    return handleRouteError(error);
  }
}
