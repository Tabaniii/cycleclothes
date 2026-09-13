import { createAdminClient } from '@/lib/supabase/admin';
import { jsonError, jsonOk } from '@/lib/api/http';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const urlToken = new URL(request.url).searchParams.get('secret');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : urlToken;

  if (!secret || token !== secret) {
    return jsonError('Unauthorized cron request', 401);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('expire_stale_donation_claims');

  if (error) {
    const { data: expired, error: updateError } = await admin
      .from('donation_claims')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .select('id');
    if (updateError) return jsonError(updateError.message, 500);
    return jsonOk({ expired: expired?.length ?? 0, via: 'direct-update' });
  }

  return jsonOk({ expired: data ?? 0, via: 'rpc' });
}

export async function POST(request: Request) {
  return GET(request);
}
