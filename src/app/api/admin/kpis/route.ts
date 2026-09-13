import { getRequestUser, requireRole } from '@/lib/api/auth';
import { handleRouteError, jsonOk } from '@/lib/api/http';
import { HttpError } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { supabase, profile } = await getRequestUser(request);
    requireRole(profile, ['admin']);

    const [pendingFoundations, openWishlists, paidOrders, verifiedClaims, openFlags] = await Promise.all([
      supabase.from('foundation_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('donation_wishlists').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['paid', 'shipped']),
      supabase.from('donation_claims').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('content_flags').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);

    const errors = [pendingFoundations, openWishlists, paidOrders, verifiedClaims, openFlags]
      .map((item) => item.error)
      .filter(Boolean);
    if (errors[0]) throw new HttpError(400, errors[0]!.message);

    return jsonOk({
      pending_foundations: pendingFoundations.count ?? 0,
      open_wishlists: openWishlists.count ?? 0,
      escrow_orders: paidOrders.count ?? 0,
      verified_claims: verifiedClaims.count ?? 0,
      open_flags: openFlags.count ?? 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
