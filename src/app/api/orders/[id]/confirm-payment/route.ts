import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { assertUuid, HttpError } from '@/lib/validations';
import { getStripe } from '@/lib/stripe';
import { fulfillPaidOrderFromPaymentIntent } from '@/lib/orders/stripe-fulfill';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!order) throw new HttpError(404, 'Order tidak ditemukan.');
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      throw new HttpError(403, 'Hanya peserta order yang bisa konfirmasi pembayaran.');
    }
    if (!order.stripe_payment_intent_id) {
      throw new HttpError(409, 'Order ini belum punya invoice Stripe.');
    }

    const intent = await getStripe().paymentIntents.retrieve(order.stripe_payment_intent_id);
    if (intent.status !== 'succeeded') {
      return jsonOk({ order, payment_status: intent.status });
    }

    await fulfillPaidOrderFromPaymentIntent(intent);
    const { data: refreshed } = await supabase
      .from('orders')
      .select('*, listings(id, title, images, price, status)')
      .eq('id', id)
      .maybeSingle();
    return jsonOk({ order: refreshed ?? order, payment_status: intent.status });
  } catch (error) {
    return handleRouteError(error);
  }
}
