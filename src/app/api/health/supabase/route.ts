import { probeSupabase } from '@/lib/supabase/probe';
import { jsonOk } from '@/lib/api/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const probe = await probeSupabase();
  return jsonOk(probe, probe.ok ? 200 : 503);
}
