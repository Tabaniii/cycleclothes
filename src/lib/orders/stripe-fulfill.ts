import Stripe from 'stripe';
import { getStripe, toStripeAmountIdr } from '@/lib/stripe';
import { STRIPE_CURRENCY } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Order } from '@/types/database';

const ORDER_SELECT = '*, listings(id, title, images, price, status)';
const SETTLED_STATUSES = new Set(['paid', 'shipped', 'completed']);

function asOrder(row: unknown): Order | null {
  if (!row || typeof row !== 'object' || !('id' in row)) return null;
  return row as Order;
}

function supabaseMessage(error: { message?: string; details?: string; hint?: string; code?: string } | null) {
  if (!error) return 'Unknown Supabase error';
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(' | ');
}

function intentMatchesOrder(intent: Stripe.PaymentIntent, order: Order) {
  const metaOrderId = intent.metadata?.order_id;
  if (metaOrderId && metaOrderId !== order.id) return false;
  if (intent.currency !== STRIPE_CURRENCY) return false;
  return toStripeAmountIdr(Number(order.amount)) === intent.amount;
}

async function loadOrderByIntent(
  admin: ReturnType<typeof createAdminClient>,
  intent: Stripe.PaymentIntent,
) {
  const orderId = intent.metadata?.order_id;
  const query = orderId
    ? admin.from('orders').select(ORDER_SELECT).eq('id', orderId)
    : admin.from('orders').select(ORDER_SELECT).eq('stripe_payment_intent_id', intent.id);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Load order: ${supabaseMessage(error)}`);
  return asOrder(data);
}

export async function fulfillPaidOrderFromPaymentIntent(intent: Stripe.PaymentIntent) {
  if (intent.status !== 'succeeded') return null;

  const admin = createAdminClient();
  const { data: rpcData, error: rpcError } = await admin.rpc('fulfill_paid_order', {
    p_payment_intent_id: intent.id,
    p_order_id: intent.metadata?.order_id || null,
    p_stripe_amount: intent.amount,
  });

  if (!rpcError) {
    const paid = asOrder(rpcData);
    if (!paid) return null;
    const { data: withListing } = await admin.from('orders').select(ORDER_SELECT).eq('id', paid.id).maybeSingle();
    return asOrder(withListing) ?? paid;
  }

  const missingFn = rpcError.code === 'PGRST202' || /fulfill_paid_order/i.test(rpcError.message || '');
  if (!missingFn) {
    throw new Error(`fulfill_paid_order: ${supabaseMessage(rpcError)}`);
  }

  const order = await loadOrderByIntent(admin, intent);
  if (!order) return null;
  if (SETTLED_STATUSES.has(order.status)) return order;
  if (order.status !== 'pending') return order;
  if (!intentMatchesOrder(intent, order)) {
    throw new Error('PaymentIntent tidak cocok dengan order.');
  }

  const { data: paid, error: updateError } = await admin
    .from('orders')
    .update({ status: 'paid', stripe_payment_intent_id: intent.id })
    .eq('id', order.id)
    .eq('status', 'pending')
    .select(ORDER_SELECT)
    .maybeSingle();
  if (updateError) throw new Error(`Update order: ${supabaseMessage(updateError)}`);

  const { error: listingError } = await admin
    .from('listings')
    .update({ status: 'reserved' })
    .eq('id', order.listing_id)
    .eq('status', 'available');
  if (listingError) throw new Error(`Update listing: ${supabaseMessage(listingError)}`);

  const { error: auditError } = await admin.from('audit_logs').insert({
    actor_id: order.buyer_id,
    action: 'order.paid',
    entity_type: 'orders',
    entity_id: order.id,
    metadata: { payment_intent_id: intent.id },
  });
  if (auditError) throw new Error(`Audit log: ${supabaseMessage(auditError)}`);

  return paid ? asOrder(paid) : { ...order, status: 'paid' as const, stripe_payment_intent_id: intent.id };
}

export async function syncPendingOrderFromStripe(order: Order) {
  if (order.status !== 'pending' || !order.stripe_payment_intent_id) return order;
  try {
    const intent = await getStripe().paymentIntents.retrieve(order.stripe_payment_intent_id);
    if (intent.status !== 'succeeded') return order;
    const updated = await fulfillPaidOrderFromPaymentIntent(intent);
    return updated ?? order;
  } catch (error) {
    console.error('[stripe-sync]', order.id, error instanceof Error ? error.message : error);
    return order;
  }
}

export async function syncPendingOrdersFromStripe(orders: Order[]) {
  return Promise.all(orders.map((order) => syncPendingOrderFromStripe(order)));
}
