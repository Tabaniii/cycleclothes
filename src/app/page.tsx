import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HomeLanding } from '@/components/home/HomeLanding';
import type { DonationWishlist } from '@/types/database';

export const revalidate = 60;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function Home() {
  const supabase = publicClient();
  let wishlists: DonationWishlist[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('donation_wishlists')
      .select('id, title, target_items, fulfilled_items, status')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3);
    wishlists = (data as DonationWishlist[]) || [];
  }

  return (
    <div className="flex min-h-dvh flex-col bg-brand-green font-sans">
      <Navbar />
      <main className="w-full flex-1">
        <HomeLanding campaigns={wishlists} />
      </main>
      <Footer />
    </div>
  );
}
