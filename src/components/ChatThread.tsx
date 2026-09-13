'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserBadgePill } from '@/components/UserBadgePill';
import type { Message } from '@/types/database';

type ChatThreadProps = {
  listingId: string;
  currentUserId: string;
  peerName?: string;
  peerBadge?: string | null;
};

export function ChatThread({ listingId, currentUserId, peerName, peerBadge }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      const result = await apiFetch<{ data: Message[] }>(
        `/api/listings/${listingId}/messages?limit=30`,
      );
      setMessages(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat chat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
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
          setMessages((prev) => (prev.some((item) => item.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    setError('');
    try {
      const result = await apiFetch<{ message: Message }>(`/api/listings/${listingId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setMessages((prev) =>
        prev.some((item) => item.id === result.message.id) ? prev : [...prev, result.message],
      );
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-2xl border border-brand-green/15 bg-white">
      <div className="flex items-center justify-between border-b border-brand-green/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-brand-green">Chat listing</p>
          <p className="text-xs text-brand-green/70">{peerName || 'Lawan chat'}</p>
        </div>
        <UserBadgePill status={peerBadge} compact />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {loading ? <p className="text-sm text-brand-green/60">Memuat percakapan...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {messages.map((message) => {
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
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={sending || !content.trim()}>
          Kirim
        </Button>
      </div>
    </div>
  );
}
