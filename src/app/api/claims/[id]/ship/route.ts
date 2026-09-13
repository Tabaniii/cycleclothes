import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError, requireFields } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['tracking_number', 'proof_image_url']);

    const { data, error } = await supabase
      .from('donation_claims')
      .update({
        tracking_number: asString(body.tracking_number),
        proof_image_url: asString(body.proof_image_url),
        status: 'shipped',
      })
      .eq('id', id)
      .eq('donor_id', user.id)
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);
    return jsonOk({ claim: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
