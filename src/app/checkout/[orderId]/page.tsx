'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { PageShell } from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline';
import { apiFetch } from '@/lib/api/client';
import { formatIdr } from '@/lib/utils';
import type { Order } from '@/types/database';

function PayForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/orders?paid=${orderId}`,
      },
    });
    if (error) setMessage(error.message || 'Pembayaran gagal.');
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <PaymentElement />
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      <Button onClick={pay} disabled={busy}>
        {busy ? 'Memproses...' : 'Bayar sekarang'}
      </Button>
    </div>
  );
}

export default function CheckoutPage() {
  const params = useParams<{ orderId: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return key ? loadStripe(key) : null;
  }, []);

  useEffect(() => {
    apiFetch<{ data: Order[] }>('/api/orders?role=buyer')
      .then((res) => {
        const found = res.data.find((item) => item.id === params.orderId) || null;
        setOrder(found);
      })
      .catch((err) => setError(err.message));

    const secretFromSession = sessionStorage.getItem(`cc_pi_${params.orderId}`);
    if (secretFromSession) setClientSecret(secretFromSession);
  }, [params.orderId]);

  if (error) {
    return (
      <PageShell>
        <p className="p-10 text-red-600">{error}</p>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-lg space-y-6 px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-green">Checkout</h1>
        {order ? (
          <>
            <p className="text-brand-green">{order.listings?.title}</p>
            <p className="text-xl font-semibold">{formatIdr(order.amount)}</p>
            <OrderStatusTimeline status={order.status} />
          </>
        ) : (
          <p>Menyiapkan pesanan...</p>
        )}
        {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Stripe publishable key belum di-set. Tambahkan NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY untuk sandbox checkout.
          </p>
        ) : null}
        {stripePromise && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PayForm orderId={params.orderId} />
          </Elements>
        ) : (
          <p className="text-sm text-brand-green/70">
            Invoice Stripe dibuat saat kamu menekan Beli. Jika halaman ini terbuka lewat tautan lama, ulangi pembelian dari
            halaman listing.
          </p>
        )}
      </div>
    </PageShell>
  );
}
