'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UserBadgePill } from '@/components/UserBadgePill';
import { formatIdr } from '@/lib/utils';
import type { ListingStatus, Message } from '@/types/database';

type ChatThreadProps = {
  listingId: string;
  currentUserId: string | null;
  peerId?: string | null;
  isSeller?: boolean;
  listingPrice?: number | string;
  listingStatus?: ListingStatus;
  peerName?: string;
  peerBadge?: string | null;
  className?: string;
  variant?: 'starter' | 'conversation';
};

function listingAmount(price: number | string | undefined) {
  const value = typeof price === 'string' ? Number(price) : price ?? 0;
  return Number.isFinite(value) ? value : 0;
}

function parseOffer(raw: string) {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function suggestOffers(price: number) {
  const roundTo = price >= 10_000 ? 1_000 : price >= 1_000 ? 100 : 1;
  const unique = new Set<number>();
  for (const ratio of [0.9, 0.8]) {
    const rounded = Math.round((price * ratio) / roundTo) * roundTo;
    if (rounded > 0 && rounded < price) unique.add(rounded);
  }
  return [...unique];
}

export function ChatThread({
  listingId,
  currentUserId,
  peerId,
  isSeller = false,
  listingPrice,
  listingStatus = 'available',
  peerName,
  peerBadge,
  className,
  variant = 'conversation',
}: ChatThreadProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(Boolean(currentUserId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showNego, setShowNego] = useState(false);
  const [offerInput, setOfferInput] = useState('');
  const [composerOpen, setComposerOpen] = useState(variant === 'conversation');
  const [justSent, setJustSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const price = listingAmount(listingPrice);
  const offers = useMemo(() => suggestOffers(price), [price]);
  const canContact = listingStatus === 'available';
  const conversation = useMemo(() => {
    if (isSeller || !currentUserId) return messages;
    return messages.filter(
      (message) => message.sender_id === currentUserId || message.receiver_id === currentUserId,
    );
  }, [messages, isSeller, currentUserId]);
  const hasConversation = conversation.length > 0;
  const startedChat = justSent || hasConversation;
  const chatHref = `/chat/${listingId}${isSeller && peerId ? `?with=${peerId}` : ''}`;
  const showThread = variant === 'conversation' || isSeller || hasConversation || composerOpen;

  function isMyMessage(row: Message) {
    if (!currentUserId) return false;
    return row.sender_id === currentUserId || row.receiver_id === currentUserId;
  }

  async function load() {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const peerQuery = peerId ? `&peer_id=${peerId}` : '';
      const result = await apiFetch<{ data: Message[] }>(
        `/api/listings/${listingId}/messages?limit=80${peerQuery}`,
      );
      setMessages(result.data);
      if (variant === 'conversation' && result.data.some((row) => isSeller || isMyMessage(row))) {
        setComposerOpen(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat chat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    if (!currentUserId) return undefined;

    const channel = supabase
      .channel(`listing-chat:${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          const involvesMe =
            row.sender_id === currentUserId || row.receiver_id === currentUserId;
          const involvesPeer =
            !peerId || row.sender_id === peerId || row.receiver_id === peerId;
          if (!involvesMe || !involvesPeer) return;
          setMessages((prev) => (prev.some((item) => item.id === row.id) ? prev : [...prev, row]));
          if (variant === 'conversation') setComposerOpen(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, currentUserId, peerId]);

  useEffect(() => {
    if (showThread) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, showThread]);

  function requireLogin() {
    if (currentUserId) return true;
    router.push('/login');
    return false;
  }

  async function sendMessage(text: string) {
    if (!requireLogin() || !text.trim()) return;
    setSending(true);
    setError('');
    try {
      const result = await apiFetch<{ message: Message }>(`/api/listings/${listingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: text.trim(),
          ...(peerId ? { receiver_id: peerId } : {}),
        }),
      });
      setMessages((prev) =>
        prev.some((item) => item.id === result.message.id) ? prev : [...prev, result.message],
      );
      setContent('');
      setShowNego(false);
      setOfferInput('');
      setJustSent(true);
      if (variant === 'conversation') setComposerOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  }

  function askAvailability() {
    void sendMessage('Halo, masih available?');
  }

  function sendOffer() {
    const offer = parseOffer(offerInput);
    if (!offer) {
      setError('Masukkan tawaran harga yang valid.');
      return;
    }
    if (price > 0 && offer >= price) {
      setError(`Tawaran harus di bawah harga listing (${formatIdr(price)}).`);
      return;
    }
    void sendMessage(`Halo, saya mau nego harga jadi ${formatIdr(offer)}. Masih bisa?`);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-green/15 bg-white px-4 py-4">
        <p className="text-sm text-brand-green/60">Memuat opsi chat...</p>
      </div>
    );
  }

  if (variant === 'starter') {
    return (
      <div className="rounded-2xl border border-brand-green/15 bg-white p-4">
        <p className="text-sm font-semibold text-brand-green">Hubungi penjual</p>
        <p className="mt-1 text-sm text-brand-green/70">
          Mulai percakapan dengan tanya ketersediaan atau kirim tawaran harga.
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {startedChat ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-brand-green">Pesan sudah terkirim ke penjual.</p>
            <Link href={chatHref}>
              <Button>Langsung ke chat</Button>
            </Link>
          </div>
        ) : showNego ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-brand-green/70">Harga listing {formatIdr(price)}</p>
            <Input
              inputMode="numeric"
              placeholder="Tawarkan harga, misalnya 45000"
              value={offerInput}
              onChange={(event) => {
                setOfferInput(event.target.value);
                setError('');
              }}
              disabled={!canContact || sending}
            />
            {offers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {offers.map((offer) => (
                  <Button
                    key={offer}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOfferInput(String(offer));
                      setError('');
                    }}
                    disabled={!canContact || sending}
                  >
                    {formatIdr(offer)}
                  </Button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button onClick={sendOffer} disabled={!canContact || sending || !offerInput.trim()}>
                {sending ? 'Mengirim...' : 'Kirim tawaran'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowNego(false)} disabled={sending}>
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={askAvailability} disabled={!canContact || sending}>
              {sending ? 'Mengirim...' : 'Masih available?'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setError('');
                setShowNego(true);
              }}
              disabled={!canContact || sending}
            >
              Nego harga
            </Button>
          </div>
        )}
        {!canContact ? (
          <p className="mt-3 text-xs text-brand-green/60">Listing ini sudah tidak tersedia untuk ditanya atau dinego.</p>
        ) : !currentUserId ? (
          <p className="mt-3 text-xs text-brand-green/60">Kamu akan diminta masuk sebelum pesan terkirim.</p>
        ) : null}
      </div>
    );
  }

  if (isSeller && !hasConversation && !peerId) {
    return (
      <div className="rounded-2xl border border-brand-green/15 bg-white px-4 py-4">
        <p className="text-sm font-semibold text-brand-green">Pesan pembeli</p>
        <p className="mt-1 text-sm text-brand-green/70">
          Belum ada yang menghubungi listing ini. Chat muncul setelah pembeli tanya ketersediaan atau nego.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex min-h-[28rem] flex-1 flex-col rounded-2xl border border-brand-green/15 bg-white ${className || ''}`}>
      <div className="flex items-center justify-between border-b border-brand-green/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-brand-green">Percakapan</p>
          <p className="text-xs text-brand-green/70">{peerName || 'Lawan chat'}</p>
        </div>
        <UserBadgePill status={peerBadge} compact />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {conversation.length === 0 ? (
          <p className="text-sm text-brand-green/60">Belum ada pesan. Kirim pembuka di bawah.</p>
        ) : null}
        {conversation.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-brand-green text-brand-cream' : 'bg-brand-cream text-brand-green'
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-brand-green/10 p-3">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Tulis pesan..."
          className="min-h-12"
          disabled={!canContact && !isSeller}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(content);
            }
          }}
        />
        <Button onClick={() => void sendMessage(content)} disabled={sending || !content.trim()}>
          Kirim
        </Button>
      </div>
    </div>
  );
}
