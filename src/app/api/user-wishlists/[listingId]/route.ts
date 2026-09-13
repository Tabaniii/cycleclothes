import { getRequestUser } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { assertUuid, HttpError } from '@/lib/validations';

type Params = { params: Promise<{ listingId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { listingId } = await params;
    assertUuid(listingId, 'listingId');
    const { supabase, user } = await getRequestUser(request);
    const { error } = await supabase
      .from('user_wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    if (error) throw new HttpError(400, error.message);
    return jsonOk({ saved: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
