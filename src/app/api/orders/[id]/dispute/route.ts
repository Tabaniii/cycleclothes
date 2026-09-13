import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError, requireFields } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['reason']);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!order) throw new HttpError(404, 'Order tidak ditemukan.');
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      throw new HttpError(403, 'Hanya peserta order yang bisa membuka sengketa.');
    }
    if (!['paid', 'shipped'].includes(order.status)) {
      throw new HttpError(409, 'Sengketa hanya untuk order paid/shipped.');
    }

    const { data, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'disputed',
        dispute_reason: asString(body.reason),
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new HttpError(400, updateError.message);

    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'order.disputed',
      entity_type: 'orders',
      entity_id: id,
      metadata: { reason: asString(body.reason) },
    });

    return jsonOk({ order: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
