'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { OrderStatusTimeline } from '@/components/OrderStatusTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api/client';
import { formatIdr } from '@/lib/utils';
import type { Order } from '@/types/database';

export default function OrdersPage() {
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [tracking, setTracking] = useState<Record<string, string>>({});
  const [rating, setRating] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  async function load() {
    try {
      const [buy, sell] = await Promise.all([
        apiFetch<{ data: Order[] }>('/api/orders?role=buyer'),
        apiFetch<{ data: Order[] }>('/api/orders?role=seller'),
      ]);
      setBuyerOrders(buy.data);
      setSellerOrders(sell.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat order.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <h1 className="text-2xl font-bold text-brand-green">Pesanan</h1>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <section>
          <h2 className="mb-3 font-semibold">Sebagai pembeli</h2>
          <div className="space-y-3">
            {buyerOrders.map((order) => (
              <div key={order.id} className="rounded-xl bg-white p-4">
                <p className="font-semibold">{order.listings?.title}</p>
                <p className="text-sm">{formatIdr(order.amount)}</p>
                <OrderStatusTimeline status={order.status} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status === 'shipped' ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await apiFetch(`/api/orders/${order.id}/complete`, { method: 'PATCH' });
                        await load();
                      }}
                    >
                      Barang diterima
                    </Button>
                  ) : null}
                  {order.status === 'completed' ? (
                    <>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        className="w-24"
                        placeholder="Rating"
                        value={rating[order.id] || ''}
                        onChange={(e) => setRating((prev) => ({ ...prev, [order.id]: Number(e.target.value) }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await apiFetch(`/api/orders/${order.id}/review`, {
                            method: 'POST',
                            body: JSON.stringify({ rating: rating[order.id] || 5 }),
                          });
                          await load();
                        }}
                      >
                        Kirim ulasan
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Sebagai penjual</h2>
          <div className="space-y-3">
            {sellerOrders.map((order) => (
              <div key={order.id} className="rounded-xl bg-white p-4">
                <p className="font-semibold">{order.listings?.title}</p>
                <OrderStatusTimeline status={order.status} />
                {order.status === 'paid' ? (
                  <div className="mt-3 flex gap-2">
                    <Input
                      placeholder="Nomor resi"
                      value={tracking[order.id] || ''}
                      onChange={(e) => setTracking((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    />
                    <Button
                      onClick={async () => {
                        await apiFetch(`/api/orders/${order.id}/ship`, {
                          method: 'PATCH',
                          body: JSON.stringify({ tracking_number: tracking[order.id] }),
                        });
                        await load();
                      }}
                    >
                      Tandai dikirim
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
