import { lookup } from 'node:dns/promises';

export type SupabaseProbeReason =
  | 'missing_url'
  | 'invalid_url'
  | 'missing_key'
  | 'nxdomain'
  | 'unreachable'
  | 'reachable';

export type SupabaseProbe = {
  ok: boolean;
  host: string | null;
  reason: SupabaseProbeReason;
  hint: string;
  httpStatus?: number;
};

const HINTS: Record<SupabaseProbeReason, string> = {
  missing_url:
    'NEXT_PUBLIC_SUPABASE_URL belum di-set. Salin Project URL dari Supabase Dashboard → Connect ke .env.local, lalu restart npm run dev.',
  invalid_url:
    'NEXT_PUBLIC_SUPABASE_URL bukan URL valid. Harusnya berbentuk https://<project-ref>.supabase.co',
  missing_key:
    'Kunci publishable/anon belum di-set. Salin dari Supabase Dashboard → Settings → API Keys.',
  nxdomain:
    'Host proyek Supabase tidak ada di internet (DNS NXDOMAIN). Proyek kemungkinan dihapus, masih pause, atau URL-nya salah. Buka Dashboard → Connect, salin ulang Project URL + kunci ke .env.local, restart npm run dev. Setelah itu deploy ke Vercel supaya situs bisa dibuka dari mana saja.',
  unreachable:
    'Host Supabase ketemu di DNS, tapi server tidak bisa terhubung. Cek proyek tidak pause, lalu coba restart proyek di dashboard.',
  reachable: 'Supabase Auth terjangkau.',
};

export function describeSupabaseProbe(reason: SupabaseProbeReason) {
  return HINTS[reason];
}

export async function probeSupabase(): Promise<SupabaseProbe> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  if (!rawUrl) {
    return { ok: false, host: null, reason: 'missing_url', hint: HINTS.missing_url };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, host: null, reason: 'invalid_url', hint: HINTS.invalid_url };
  }

  const host = parsed.hostname;
  if (!host.endsWith('.supabase.co') && !host.endsWith('.supabase.net') && host !== 'localhost' && host !== '127.0.0.1') {
    return { ok: false, host, reason: 'invalid_url', hint: HINTS.invalid_url };
  }

  if (!key) {
    return { ok: false, host, reason: 'missing_key', hint: HINTS.missing_key };
  }

  try {
    await lookup(host);
  } catch {
    return { ok: false, host, reason: 'nxdomain', hint: HINTS.nxdomain };
  }

  try {
    const healthUrl = `${parsed.origin}/auth/v1/health`;
    const res = await fetch(healthUrl, { cache: 'no-store' });
    if (res.ok || res.status === 401) {
      return { ok: true, host, reason: 'reachable', hint: HINTS.reachable, httpStatus: res.status };
    }
    return {
      ok: false,
      host,
      reason: 'unreachable',
      hint: HINTS.unreachable,
      httpStatus: res.status,
    };
  } catch {
    return { ok: false, host, reason: 'unreachable', hint: HINTS.unreachable };
  }
}
