'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { ChatThread } from '@/components/ChatThread';
import { Button } from '@/components/ui/button';
import { formatIdr } from '@/lib/utils';
import { productImageUrl } from '@/lib/storage';
import { getCurrentAuthUserWithProfile } from '@/services/authService';
import type { Listing, Profile } from '@/types/database';

function ChatRoomFallback() {
  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
        <p className="text-sm text-brand-green/70">Memuat ruang chat...</p>
      </div>
    </PageShell>
  );
}

function ChatRoomPage() {
  const params = useParams<{ listingId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const listingId = params.listingId;
  const withPeer = searchParams.get('with');

  const [userId, setUserId] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [peer, setPeer] = useState<Pick<Profile, 'full_name' | 'badge_status'> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentAuthUserWithProfile().then((session) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      setUserId(session.user.id);
    });
    fetch(`/api/listings/${listingId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setListing(body.listing);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Listing tidak ditemukan.'));
  }, [listingId, router]);

  const isSeller = Boolean(userId && listing && userId === listing.seller_id);
  const peerId = isSeller ? withPeer : listing?.seller_id || null;

  useEffect(() => {
    if (!listing || !userId || !isSeller || withPeer) return;
    router.replace('/chat');
  }, [listing, userId, isSeller, withPeer, router]);

  useEffect(() => {
    if (!peerId) {
      setPeer(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/profiles/${peerId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (!cancelled) {
          setPeer({
            full_name: body.profile?.full_name || null,
            badge_status: body.profile?.badge_status || 'Newbie',
          });
        }
      })
      .catch(() => {
        if (!cancelled) setPeer(null);
      });
    return () => {
      cancelled = true;
    };
  }, [peerId]);

  const thumb = productImageUrl(listing?.images?.[0], 200);
  const peerName = peer?.full_name || listing?.profiles?.full_name || (isSeller ? 'Pembeli' : 'Penjual');
  const peerBadge = peer?.badge_status || listing?.profiles?.badge_status || null;

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-3xl flex-col gap-4 px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/chat" className="text-sm font-semibold text-brand-green underline">
            Semua chat
          </Link>
          {listing ? (
            <Link href={`/preloved/${listing.id}`} className="text-sm text-brand-green/70 underline">
              Lihat produk
            </Link>
          ) : null}
        </div>

        {listing ? (
          <div className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-brand-green/10">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-cream">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-brand-green">{listing.title}</p>
              <p className="text-sm text-brand-green/70">{formatIdr(listing.price)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-brand-green/70">{error || 'Memuat ruang chat...'}</p>
        )}

        {userId && listing && peerId ? (
          <ChatThread
            key={`${listing.id}:${peerId}`}
            variant="conversation"
            className="min-h-[32rem] flex-1"
            listingId={listing.id}
            currentUserId={userId}
            peerId={peerId}
            isSeller={isSeller}
            listingPrice={listing.price}
            listingStatus={listing.status}
            peerName={peerName}
            peerBadge={peerBadge}
          />
        ) : userId && listing && isSeller && !withPeer ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-brand-green">
            <p>Pilih percakapan dari kotak masuk.</p>
            <Link href="/chat">
              <Button className="mt-3">Buka inbox chat</Button>
            </Link>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

export default function ChatRoomRoute() {
  return (
    <Suspense fallback={<ChatRoomFallback />}>
      <ChatRoomPage />
    </Suspense>
  );
}
