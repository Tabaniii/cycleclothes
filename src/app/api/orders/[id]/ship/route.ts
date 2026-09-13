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
    requireFields(body, ['tracking_number']);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!order) throw new HttpError(404, 'Order tidak ditemukan.');
    if (order.seller_id !== user.id) throw new HttpError(403, 'Hanya penjual yang bisa input resi.');
    if (order.status !== 'paid') throw new HttpError(409, 'Order harus berstatus paid sebelum dikirim.');

    const { data, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'shipped',
        tracking_number: asString(body.tracking_number),
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new HttpError(400, updateError.message);

    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'order.shipped',
      entity_type: 'orders',
      entity_id: id,
      metadata: { tracking_number: asString(body.tracking_number) },
    });

    return jsonOk({ order: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
