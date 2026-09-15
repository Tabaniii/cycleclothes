import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk, readJsonBody } from '@/lib/api/http';
import { asString, assertUuid, HttpError, requireFields } from '@/lib/validations';
import { decodeCursor, nextCursorFromRows } from '@/lib/pagination';
import { MESSAGE_PAGE_SIZE } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const url = new URL(request.url);
    const peerId = asString(url.searchParams.get('peer_id'));
    const cursor = decodeCursor(url.searchParams.get('cursor'));
    const limit = Math.min(Number(url.searchParams.get('limit') || MESSAGE_PAGE_SIZE) || MESSAGE_PAGE_SIZE, 100);

    let query = supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, avatar_url, badge_status)')
      .eq('listing_id', id)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(limit + 1);

    if (peerId) {
      assertUuid(peerId, 'peer_id');
      query = query.or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`,
      );
    } else {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    }

    if (cursor) query = query.gt('created_at', cursor.createdAt);

    const { data, error } = await query;
    if (error) throw new HttpError(400, error.message);
    return jsonOk(nextCursorFromRows(data || [], limit));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    assertUuid(id);
    const { supabase, user } = await getRequestUser(request);
    const body = await readJsonBody(request);
    requireFields(body, ['content']);
    const content = asString(body.content);
    if (!content) throw new HttpError(400, 'Pesan tidak boleh kosong.');

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('id', id)
      .maybeSingle();
    if (listingError) throw new HttpError(400, listingError.message);
    if (!listing) throw new HttpError(404, 'Listing tidak ditemukan.');

    let receiverId = listing.seller_id;
    if (user.id === listing.seller_id) {
      const explicit = asString(body.receiver_id);
      if (!explicit) {
        const { data: last } = await supabase
          .from('messages')
          .select('sender_id, receiver_id')
          .eq('listing_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        receiverId = last?.sender_id === user.id ? last.receiver_id : last?.sender_id;
      } else {
        receiverId = explicit;
      }
      if (!receiverId || receiverId === user.id) {
        throw new HttpError(400, 'Tentukan pembeli yang ingin dibalas.');
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        listing_id: id,
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      })
      .select('*, profiles!messages_sender_id_fkey(full_name, avatar_url, badge_status)')
      .single();

    if (error) throw new HttpError(400, error.message);
    return jsonOk({ message: data }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
