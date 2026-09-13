import { getRequestUser, requireApprovedFoundation } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    await requireApprovedFoundation(supabase, user.id);
    const body = await readJsonBody(request).catch(() => ({} as Record<string, unknown>));

    const { data, error } = await supabase
      .from('donation_claims')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);

    if (asString(body.reason)) {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'claim.rejected',
        entity_type: 'donation_claims',
        entity_id: id,
        metadata: { reason: asString(body.reason) },
      }).then(() => undefined, () => undefined);
    }

    return jsonOk({ claim: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
