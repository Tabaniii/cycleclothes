'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { apiFetch } from '@/lib/api/client';
import { formatDate, formatIdr } from '@/lib/utils';
import { productImageUrl } from '@/lib/storage';
import { getCurrentAuthUserWithProfile } from '@/services/authService';
import type { ChatConversation } from '@/types/database';

export default function ChatInboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentAuthUserWithProfile().then((session) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      apiFetch<{ data: ChatConversation[] }>('/api/chats')
        .then((body) => setItems(body.data || []))
        .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat chat.'))
        .finally(() => setLoading(false));
    });
  }, [router]);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-green/50">Pesan</p>
        <h1 className="mt-2 font-script text-4xl text-brand-green">Chat</h1>
        <p className="mt-2 text-sm text-brand-green/70">
          Percakapan dengan pembeli dan penjual, terpisah dari halaman produk.
        </p>

        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mt-6 text-sm text-brand-green/70">Memuat percakapan...</p> : null}

        {!loading && items.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white px-6 py-12 text-center text-brand-green shadow-sm ring-1 ring-brand-green/10">
            <p className="font-semibold">Belum ada chat.</p>
            <p className="mt-2 text-sm text-brand-green/70">
              Buka listing preloved, lalu ketuk Chat penjual untuk mulai bicara.
            </p>
            <Link
              href="/preloved"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-green px-4 text-sm font-semibold text-brand-cream"
            >
              Jelajah preloved
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((item) => {
              const thumb = productImageUrl(item.listingImage, 200);
              return (
                <li key={`${item.listingId}:${item.peerId}`}>
                  <Link
                    href={`/chat/${item.listingId}?with=${item.peerId}`}
                    className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-brand-green/10 hover:bg-brand-cream/40"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-cream">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-brand-green">{item.peerName || 'Pengguna'}</p>
                        <p className="shrink-0 text-[11px] text-brand-green/50">{formatDate(item.lastMessageAt)}</p>
                      </div>
                      <p className="truncate text-sm text-brand-green/80">{item.listingTitle}</p>
                      <p className="truncate text-sm text-brand-green/60">{item.lastMessage}</p>
                      <p className="mt-1 text-xs font-semibold text-brand-green">{formatIdr(item.listingPrice)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
