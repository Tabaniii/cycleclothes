import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError, requireFields } from '@/lib/validations';
import { getStripe, toStripeAmountIdr } from '@/lib/stripe';
import { STRIPE_CURRENCY } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['listing_id']);
    const listingId = asString(body.listing_id);
    assertUuid(listingId, 'listing_id');

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id, title, price, status')
      .eq('id', listingId)
      .maybeSingle();
    if (listingError) throw new HttpError(400, listingError.message);
    if (!listing) throw new HttpError(404, 'Listing tidak ditemukan.');
    if (listing.status !== 'available') throw new HttpError(409, 'Listing tidak tersedia.');
    if (listing.seller_id === user.id) throw new HttpError(400, 'Tidak bisa membeli listing sendiri.');

    const amount = Number(listing.price);
    const { data: existing } = await supabase
      .from('orders')
      .select('*')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let order = existing;
    if (!order) {
      const { data: created, error: orderError } = await supabase
        .from('orders')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          amount,
          status: 'pending',
        })
        .select()
        .single();
      if (orderError) throw new HttpError(400, orderError.message);
      order = created;
    }

    const stripe = getStripe();
    const stripeAmount = toStripeAmountIdr(amount);
    let paymentIntentId = order.stripe_payment_intent_id as string | null;
    let clientSecret: string | null = null;
    const updatableStatuses = new Set(['requires_payment_method', 'requires_confirmation', 'requires_action']);

    if (paymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (updatableStatuses.has(existingIntent.status)) {
        if (existingIntent.amount !== stripeAmount) {
          const updated = await stripe.paymentIntents.update(paymentIntentId, { amount: stripeAmount });
          clientSecret = updated.client_secret;
        } else {
          clientSecret = existingIntent.client_secret;
        }
      } else {
        paymentIntentId = null;
      }
    }

    if (!paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: STRIPE_CURRENCY,
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_id: order.id,
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: listing.seller_id,
        },
        description: `CycleClothes: ${listing.title}`,
      });
      paymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
      const { error: updateError } = await supabase
        .from('orders')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', order.id);
      if (updateError) throw new HttpError(400, updateError.message);
    }

    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'order.invoice_created',
      entity_type: 'orders',
      entity_id: order.id,
      metadata: { payment_intent_id: paymentIntentId, amount },
    });

    return jsonOk({
      order_id: order.id,
      client_secret: clientSecret,
      payment_intent_id: paymentIntentId,
      amount,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
