import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { WishlistCard } from '@/components/WishlistCard';
import { ListingCard } from '@/components/ListingCard';
import Link from 'next/link';
import type { DonationWishlist, Listing } from '@/types/database';

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
  let listings: Listing[] = [];

  if (supabase) {
    const [wishlistRes, listingRes] = await Promise.all([
      supabase
        .from('donation_wishlists')
        .select(
          '*, profiles!donation_wishlists_foundation_id_fkey(full_name, avatar_url, city, badge_status, foundation_profiles(legal_name, verification_status))',
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('listings')
        .select('*, profiles!listings_seller_id_fkey(full_name, avatar_url, city, badge_status, donation_count)')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(4),
    ]);
    wishlists = (wishlistRes.data as DonationWishlist[]) || [];
    listings = (listingRes.data as Listing[]) || [];
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans">
      <Navbar />
      <main className="w-full flex-1">
        <section className="bg-brand-green text-brand-cream">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-light-green">Cycle Clothes</p>
            <h1 className="mt-3 max-w-3xl font-script text-5xl">Semua Berawal dari Lemarimu</h1>
            <p className="mt-4 max-w-2xl text-brand-cream/85">
              Jual pakaian preloved dengan pembayaran aman, atau donasikan langsung ke yayasan terverifikasi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/donasi" className="rounded-lg bg-brand-light-green px-5 py-3 text-sm font-semibold text-brand-green">
                Donasi sekarang
              </Link>
              <Link href="/preloved" className="rounded-lg border border-brand-cream px-5 py-3 text-sm font-semibold">
                Jelajah preloved
              </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-brand-green">Wishlist yayasan</h2>
            <Link href="/donasi" className="text-sm font-semibold underline">
              Lihat semua
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {wishlists.map((item) => (
              <WishlistCard key={item.id} wishlist={item} />
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 pb-16 sm:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-brand-green">Preloved pilihan</h2>
            <Link href="/preloved" className="text-sm font-semibold underline">
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {listings.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
