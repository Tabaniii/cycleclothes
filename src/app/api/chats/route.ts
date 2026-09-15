import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { HttpError } from '@/lib/validations';
import type { ChatConversation, ListingStatus } from '@/types/database';

type ListingSnippet = {
  id: string;
  title: string;
  images: string[] | null;
  price: number | string;
  status: ListingStatus;
};

type MessageRow = {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  listings: ListingSnippet | ListingSnippet[] | null;
};

function asListing(value: MessageRow['listings']) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getRequestUser(request);
    const { data, error } = await supabase
      .from('messages')
      .select(
        'id, listing_id, sender_id, receiver_id, content, created_at, listings(id, title, images, price, status)',
      )
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(300);

    if (error) throw new HttpError(400, error.message);

    const grouped = new Map<string, ChatConversation>();
    for (const row of (data || []) as MessageRow[]) {
      const peerId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
      const key = `${row.listing_id}:${peerId}`;
      if (grouped.has(key)) continue;
      const listing = asListing(row.listings);
      grouped.set(key, {
        listingId: row.listing_id,
        peerId,
        peerName: null,
        peerBadge: null,
        listingTitle: listing?.title || 'Listing',
        listingImage: listing?.images?.[0] || null,
        listingPrice: listing?.price ?? 0,
        listingStatus: listing?.status || 'available',
        lastMessage: row.content,
        lastMessageAt: row.created_at,
      });
    }

    const conversations = [...grouped.values()];
    const peerIds = [...new Set(conversations.map((item) => item.peerId))];
    if (peerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, badge_status')
        .in('id', peerIds);
      const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
      for (const item of conversations) {
        const profile = byId.get(item.peerId);
        item.peerName = profile?.full_name || 'Pengguna';
        item.peerBadge = profile?.badge_status || null;
      }
    }

    return jsonOk({ data: conversations });
  } catch (error) {
    return handleRouteError(error);
  }
}
