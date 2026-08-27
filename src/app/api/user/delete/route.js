import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  return null;
}

export async function POST(request) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!serviceRoleKey || !supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Server error: SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL tidak di-set di environment.' },
        { status: 500 }
      );
    }

    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Anda belum login.' },
        { status: 401 }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser(accessToken);
    const currentUserId = authData?.user?.id || null;

    if (authError || !currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Sesi tidak valid. Silakan login ulang.' },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: adminCheck } = await supabaseAdmin.auth.admin.getUserById(currentUserId);
    if (!adminCheck?.user) {
      return NextResponse.json(
        { error: 'User dengan ID tersebut tidak ditemukan.' },
        { status: 404 }
      );
    }

    try {
      const { data: listData, error: listErr } = await supabaseAdmin
        .storage
        .from('avatars')
        .list(currentUserId, { limit: 200 });

      if (!listErr && Array.isArray(listData) && listData.length > 0) {
        const filesToRemove = listData.map((f) => `${currentUserId}/${f.name}`);
        await supabaseAdmin.storage.from('avatars').remove(filesToRemove);
      }
    } catch {
      // Ignore avatar cleanup errors, lanjut delete user
    }

    await supabaseAdmin.auth.admin.signOut(accessToken, 'global').catch(() => {});

    const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(currentUserId, true);

    if (deleteAuthErr) {
      return NextResponse.json(
        { error: deleteAuthErr.message || 'Gagal menghapus user.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
