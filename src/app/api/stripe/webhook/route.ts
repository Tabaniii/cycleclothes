import Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { jsonOk, jsonError } from '@/lib/api/http';
import { fulfillPaidOrderFromPaymentIntent } from '@/lib/orders/stripe-fulfill';

export const runtime = 'nodejs';

async function markProcessed(admin: ReturnType<typeof createAdminClient>, event: Stripe.Event) {
  const { error } = await admin.from('stripe_events').insert({
    id: event.id,
    type: event.type,
  });
  if (error) {
    if (error.code === '23505') return false;
    throw error;
  }
  return true;
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return jsonError('Missing stripe-signature', 400);

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook signature';
    return jsonError(message, 400);
  }

  const admin = createAdminClient();
  const isNew = await markProcessed(admin, event);
  if (!isNew) return jsonOk({ received: true, duplicate: true });

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await fulfillPaidOrderFromPaymentIntent(intent);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await admin.from('audit_logs').insert({
        actor_id: intent.metadata?.buyer_id || null,
        action: 'order.payment_failed',
        entity_type: 'orders',
        entity_id: intent.metadata?.order_id || null,
        metadata: { stripe_event_id: event.id, payment_intent_id: intent.id },
      });
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (paymentIntentId) {
        const { data: order } = await admin
          .from('orders')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .maybeSingle();
        if (order) {
          await admin.from('orders').update({ status: 'refunded' }).eq('id', order.id);
          await admin.from('listings').update({ status: 'available' }).eq('id', order.listing_id);
        }
      }
    }
  } catch (error) {
    await admin.from('stripe_events').delete().eq('id', event.id);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return jsonError(message, 500);
  }

  return jsonOk({ received: true });
}
