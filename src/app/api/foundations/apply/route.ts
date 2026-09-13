import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, HttpError, requireFields } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['legal_name', 'address', 'pic_name', 'pic_phone']);

    const payload = {
      id: user.id,
      legal_name: asString(body.legal_name),
      address: asString(body.address),
      pic_name: asString(body.pic_name),
      pic_phone: asString(body.pic_phone),
      legal_document_url: asString(body.legal_document_url) || null,
      verification_status: 'pending',
      is_suspended: false,
    };

    const { data: existing } = await supabase
      .from('foundation_profiles')
      .select('id, verification_status')
      .eq('id', user.id)
      .maybeSingle();

    const query = existing
      ? supabase.from('foundation_profiles').update(payload).eq('id', user.id)
      : supabase.from('foundation_profiles').insert(payload);

    const { data, error } = await query.select().single();
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ application: data }, existing ? 200 : 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
