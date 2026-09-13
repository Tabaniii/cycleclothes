import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asPositiveInt, asString, assertUuid, HttpError, requireFields } from '@/lib/validations';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['rating']);
    const rating = asPositiveInt(body.rating);
    if (rating > 5) throw new HttpError(400, 'Rating 1-5.');

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!order) throw new HttpError(404, 'Order tidak ditemukan.');
    if (order.status !== 'completed') throw new HttpError(409, 'Review hanya setelah order completed.');

    const revieweeId = order.buyer_id === user.id ? order.seller_id : order.seller_id === user.id ? order.buyer_id : null;
    if (!revieweeId) throw new HttpError(403, 'Hanya pembeli/penjual yang bisa memberi ulasan.');

    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        order_id: id,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: asString(body.comment) || null,
      })
      .select()
      .single();
    if (insertError) throw new HttpError(400, insertError.message);
    return jsonOk({ review: data }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
