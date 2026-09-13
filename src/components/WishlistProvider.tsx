'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api/client';
import { supabase } from '@/lib/supabase';

type WishlistContextValue = {
  userId: string | null;
  ids: Set<string>;
  count: number;
  ready: boolean;
  has: (listingId: string) => boolean;
  toggle: (listingId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setUserId(null);
      setIds([]);
      setReady(true);
      return;
    }
    setUserId(data.session.user.id);
    try {
      const body = await apiFetch<{ ids: string[] }>('/api/user-wishlists?ids_only=1');
      setIds(body.ids || []);
    } catch {
      setIds([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const idSet = useMemo(() => new Set(ids), [ids]);

  const toggle = useCallback(
    async (listingId: string) => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.href = '/login';
        return;
      }
      const exists = idSet.has(listingId);
      setIds((prev) => (exists ? prev.filter((id) => id !== listingId) : [...prev, listingId]));
      try {
        if (exists) {
          await apiFetch(`/api/user-wishlists/${listingId}`, { method: 'DELETE' });
        } else {
          await apiFetch('/api/user-wishlists', {
            method: 'POST',
            body: JSON.stringify({ listing_id: listingId }),
          });
        }
      } catch {
        await refresh();
      }
    },
    [idSet, refresh],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      userId,
      ids: idSet,
      count: ids.length,
      ready,
      has: (listingId: string) => idSet.has(listingId),
      toggle,
      refresh,
    }),
    [userId, idSet, ids.length, ready, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist harus dipakai di dalam WishlistProvider.');
  }
  return ctx;
}

export function useOptionalWishlist() {
  return useContext(WishlistContext);
}
