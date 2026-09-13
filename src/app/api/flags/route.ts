import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError, requireFields } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['entity_type', 'entity_id', 'reason']);
    const entityId = asString(body.entity_id);
    assertUuid(entityId, 'entity_id');

    const { data, error } = await supabase
      .from('content_flags')
      .insert({
        reporter_id: user.id,
        entity_type: asString(body.entity_type),
        entity_id: entityId,
        reason: asString(body.reason),
      })
      .select()
      .single();
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ flag: data }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
