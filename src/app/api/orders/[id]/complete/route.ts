import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { assertUuid, HttpError } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!order) throw new HttpError(404, 'Order tidak ditemukan.');
    if (order.buyer_id !== user.id) throw new HttpError(403, 'Hanya pembeli yang bisa konfirmasi penerimaan.');
    if (order.status !== 'shipped' && order.status !== 'paid') {
      throw new HttpError(409, 'Order belum bisa diselesaikan.');
    }

    const { data, error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new HttpError(400, updateError.message);

    const admin = createAdminClient();
    await admin.from('listings').update({ status: 'sold' }).eq('id', order.listing_id);
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'order.completed',
      entity_type: 'orders',
      entity_id: id,
      metadata: { note: 'Buyer confirmed receipt; funds logically released to seller.' },
    });

    return jsonOk({ order: data });
  } catch (error) {
    return handleRouteError(error);
  }
}
