/**
 * Seed sample admin, foundation, donor, wishlists, and listings.
 * Usage: npm run seed
 * Assumption: migrations 0003-0005 already applied; service role key is set.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const file = resolve(process.cwd(), name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvFiles();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD || 'CycleClothes123!';

if (!url || !serviceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib untuk seed.');
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertUser(email: string, fullName: string, role: 'user' | 'foundation' | 'admin') {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId = data.user?.id;
  if (error) {
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = list.users.find((user) => user.email === email);
    if (!existing) throw error;
    userId = existing.id;
  }

  if (!userId) throw new Error(`Gagal membuat user ${email}`);

  await admin.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    role,
    city: 'Jakarta',
    badge_status: role === 'user' ? 'Orang Baik' : 'Newbie',
    donation_count: role === 'user' ? 2 : 0,
  });

  return userId;
}

async function main() {
  const adminId = await upsertUser('admin@cycleclothes.local', 'Admin Cycle', 'admin');
  const foundationId = await upsertUser('yayasan@cycleclothes.local', 'Yayasan Harapan', 'foundation');
  const donorId = await upsertUser('donor@cycleclothes.local', 'Donatur Baik', 'user');
  const sellerId = await upsertUser('seller@cycleclothes.local', 'Penjual Lemari', 'user');

  await admin.from('foundation_profiles').upsert({
    id: foundationId,
    legal_name: 'Yayasan Harapan Anak',
    address: 'Jl. Melati No. 10, Jakarta',
    pic_name: 'Sari',
    pic_phone: '081234567890',
    verification_status: 'approved',
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
  });

  const { data: existingWish } = await admin
    .from('donation_wishlists')
    .select('id')
    .eq('foundation_id', foundationId)
    .limit(1)
    .maybeSingle();

  let wishlistId = existingWish?.id;
  if (!wishlistId) {
    const { data, error } = await admin
      .from('donation_wishlists')
      .insert({
        foundation_id: foundationId,
        title: 'Seragam sekolah anak panti',
        description: 'Butuh kemeja putih dan celana/rok gelap size anak SD.',
        category: 'anak',
        target_items: 20,
        fulfilled_items: 4,
        status: 'open',
      })
      .select('id')
      .single();
    if (error) throw error;
    wishlistId = data.id;
  }

  const { data: jacket } = await admin
    .from('donation_wishlists')
    .select('id')
    .eq('foundation_id', foundationId)
    .eq('title', 'Jaket hangat musim hujan')
    .maybeSingle();
  if (!jacket) {
    await admin.from('donation_wishlists').insert({
      foundation_id: foundationId,
      title: 'Jaket hangat musim hujan',
      description: 'Luaran bekas layak pakai untuk remaja.',
      category: 'luaran',
      target_items: 12,
      status: 'open',
    });
  }

  const { count } = await admin.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', sellerId);
  if (!count) {
    await admin.from('listings').insert([
      {
        seller_id: sellerId,
        title: 'Kemeja flanel preloved',
        description: 'Nyaman, jarang dipakai.',
        category: 'atasan',
        size: 'L',
        condition: 'like_new',
        price: 75000,
        location: 'Jakarta',
        images: [],
        status: 'available',
      },
      {
        seller_id: sellerId,
        title: 'Celana chino cream',
        description: 'Ada sedikit kelunturan di ujung.',
        category: 'bawahan',
        size: 'M',
        condition: 'good',
        price: 60000,
        location: 'Bandung',
        images: [],
        status: 'available',
      },
    ]);
  }

  const { count: claimCount } = await admin
    .from('donation_claims')
    .select('id', { count: 'exact', head: true })
    .eq('donor_id', donorId);
  if (!claimCount) {
    await admin.from('donation_claims').insert({
      wishlist_id: wishlistId,
      donor_id: donorId,
      item_description: '5 kemeja putih anak size S',
      item_qty: 5,
      status: 'pending',
    });
  }

  console.log('Seed selesai.');
  console.log('Admin     : admin@cycleclothes.local');
  console.log('Yayasan   : yayasan@cycleclothes.local');
  console.log('Donatur   : donor@cycleclothes.local');
  console.log('Penjual   : seller@cycleclothes.local');
  console.log(`Password  : ${password}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
