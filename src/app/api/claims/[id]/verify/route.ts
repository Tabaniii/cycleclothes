import { getRequestUser, requireApprovedFoundation } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { assertUuid, HttpError } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    await requireApprovedFoundation(supabase, user.id);

    const { data, error } = await supabase
      .from('donation_claims')
      .update({ status: 'verified' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new HttpError(400, error.message);
    return jsonOk({ claim: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
