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
  // Stripe treats IDR as a two-decimal currency (minor unit = sen).
  // Listings store whole rupiah: 50000 => Rp50.000 => Stripe amount 5_000_000.
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Harga listing tidak valid.');
  }
  return Math.round(value * 100);
}
