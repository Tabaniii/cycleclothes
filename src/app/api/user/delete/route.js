import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Server error: SUPABASE_SERVICE_ROLE_KEY atau NEXT_PUBLIC_SUPABASE_URL tidak di-set di environment.' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const authCookie = allCookies.find(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    let currentUserId = null;

    if (authCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(authCookie.value));
        currentUserId = parsed?.user?.id || parsed?.sub || null;
      } catch {
        currentUserId = null;
      }
    }

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Anda belum login.' },
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
