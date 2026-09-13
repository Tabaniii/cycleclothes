import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY belum di-set.');
  }
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET belum di-set.');
  }
  return secret;
}

export function toStripeAmountIdr(amount: number) {
  // Assumption: IDR is a zero-decimal Stripe currency.
  return Math.round(amount);
}
