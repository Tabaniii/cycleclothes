'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { ListingCreateForm } from '@/components/ListingCreateForm';
import { ListingCard } from '@/components/ListingCard';
import { UserBadgePill } from '@/components/UserBadgePill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/client';
import { nextBadgeProgress } from '@/lib/badges';
import { formatIdr } from '@/lib/utils';
import { productImageUrl } from '@/lib/storage';
import {
  getCurrentAuthUserWithProfile,
  signOutUser,
  deleteCurrentUserAccount,
} from '@/services/authService';
import {
  createProfileIfMissing,
  getAvatarPublicUrl,
  updateUserProfile,
  uploadUserAvatar,
} from '@/services/userService';
import type { DonationClaim, Listing, Order, Paginated, Profile } from '@/types/database';

const LISTING_STATUS: Record<string, string> = {
  available: 'Aktif',
  reserved: 'Dipesan',
  sold: 'Terjual',
  removed: 'Dihapus',
};

const CLAIM_STATUS: Record<string, string> = {
  pending: 'Menunggu kirim',
  shipped: 'Dalam perjalanan',
  verified: 'Terverifikasi',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
};

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<DonationClaim[]>([]);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError('');
    let redirected = false;
    try {
      const session = await getCurrentAuthUserWithProfile();
      if (!session?.user) {
        redirected = true;
        router.replace('/login');
        return;
      }

      let nextProfile = (session.profile as Profile | null) ?? null;
      if (!nextProfile) {
        await createProfileIfMissing(session.user.id, {
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        });
        const refreshed = await getCurrentAuthUserWithProfile();
        nextProfile = (refreshed?.profile as Profile | null) ?? null;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || '');
      setProfile(nextProfile);
      setFullName(nextProfile?.full_name || '');
      setCity(nextProfile?.city || '');
      setPhone(nextProfile?.phone_number || '');
      setAvatarUrl(nextProfile?.avatar_url ? getAvatarPublicUrl(nextProfile.avatar_url) : null);

      const [mine, buy, sell, donation] = await Promise.allSettled([
        apiFetch<Paginated<Listing>>('/api/listings?scope=mine&limit=12'),
        apiFetch<Paginated<Order>>('/api/orders?role=buyer&limit=5'),
        apiFetch<Paginated<Order>>('/api/orders?role=seller&limit=5'),
        apiFetch<Paginated<DonationClaim>>('/api/claims?scope=mine&limit=5'),
      ]);

      if (mine.status === 'fulfilled') setListings(mine.value.data);
      if (buy.status === 'fulfilled') setBuyerOrders(buy.value.data);
      if (sell.status === 'fulfilled') setSellerOrders(sell.value.data);
      if (donation.status === 'fulfilled') setClaims(donation.value.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard.');
    } finally {
      if (!redirected) setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [router]);

  async function handleLogout() {
    await signOutUser();
    router.replace('/');
  }

  async function saveProfile() {
    if (!userId) return;
    setSavingProfile(true);
    setError('');
    try {
      const updated = await updateUserProfile(userId, {
        full_name: fullName,
        city,
        phone_number: phone,
      });
      setProfile(updated as Profile);
      setSuccessMsg('Profil disimpan.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function onAvatar(file?: File) {
    if (!file || !userId) return;
    try {
      const result = await uploadUserAvatar(userId, file);
      setAvatarUrl(result.url);
      setSuccessMsg('Foto profil diperbarui.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal unggah foto.');
    }
  }

  async function removeListing(id: string) {
    try {
      await apiFetch(`/api/listings/${id}`, { method: 'DELETE' });
      setListings((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus listing.');
    }
  }

  async function confirmDelete() {
    if (deleteText.trim() !== `HAPUS ${email}`) return;
    setDeleting(true);
    try {
      await deleteCurrentUserAccount();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus akun.');
    } finally {
      setDeleting(false);
    }
  }

  const displayName = profile?.full_name || email.split('@')[0] || 'Kawan Cycle';
  const badge = nextBadgeProgress(profile?.donation_count || 0);
  const orders = [...buyerOrders, ...sellerOrders].slice(0, 4);

  return (
    <PageShell className="bg-brand-cream">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10 sm:px-8">
        <section className="rounded-3xl bg-brand-green px-6 py-8 text-brand-cream sm:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-light-green">Lemarimu</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-script text-4xl sm:text-5xl">Halo, {displayName}</h1>
              <p className="mt-2 max-w-xl text-sm text-brand-cream/80">
                Jual sisa baju yang masih layak, atau donasikan ke yayasan yang sudah diverifikasi.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <UserBadgePill status={badge.current} />
                <span className="text-xs text-brand-cream/70">
                  {profile?.donation_count || 0} donasi terverifikasi
                  {profile?.city ? ` · ${profile.city}` : ''}
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(true);
                document.getElementById('jual-preloved')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              + Jual baju preloved
            </Button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="#jual-preloved" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-green/10">
            <p className="text-xs uppercase tracking-wide text-brand-green/50">Preloved</p>
            <p className="mt-1 text-lg font-semibold text-brand-green">Jual dari lemari</p>
            <p className="mt-1 text-sm text-brand-green/70">Foto, harga, lalu umuman. Pembeli bayar lewat Stripe.</p>
          </Link>
          <Link href="/wishlist" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-green/10">
            <p className="text-xs uppercase tracking-wide text-brand-green/50">Wishlist</p>
            <p className="mt-1 text-lg font-semibold text-brand-green">Baju yang diincar</p>
            <p className="mt-1 text-sm text-brand-green/70">Simpan listing preloved, buka lagi kapan saja.</p>
          </Link>
          <Link href="/donasi" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-green/10">
            <p className="text-xs uppercase tracking-wide text-brand-green/50">Donasi</p>
            <p className="mt-1 text-lg font-semibold text-brand-green">Beri ke yayasan</p>
            <p className="mt-1 text-sm text-brand-green/70">Pilih kebutuhan yayasan, kirim sendiri, dapat badge.</p>
          </Link>
          <Link href="/dashboard/orders" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-green/10">
            <p className="text-xs uppercase tracking-wide text-brand-green/50">Transaksi</p>
            <p className="mt-1 text-lg font-semibold text-brand-green">Pesanan kamu</p>
            <p className="mt-1 text-sm text-brand-green/70">Lacak pembelian, pengiriman, dan penjualan.</p>
          </Link>
        </div>

        {successMsg ? (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMsg}</p>
        ) : null}
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-brand-green/70">Menyiapkan lemarimu...</p>
        ) : (
          <>
            <section id="jual-preloved" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-brand-green">Tambah baju preloved</h2>
                      <p className="mt-1 text-sm text-brand-green/70">
                        Isi data di sini. Nanti langsung muncul di katalog Preloved.
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm((v) => !v)}>
                      {showForm ? 'Sembunyikan' : 'Tampilkan'}
                    </Button>
                  </div>
                  {showForm ? (
                    <ListingCreateForm
                      compact
                      defaultLocation={city}
                      onCreated={() => {
                        setShowForm(false);
                        loadAll();
                      }}
                    />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-green">Baju yang kamu jual</h2>
                    <Link href="/preloved" className="text-sm font-semibold text-brand-green underline">
                      Lihat katalog
                    </Link>
                  </div>
                  {listings.length === 0 ? (
                    <p className="rounded-xl bg-brand-cream/60 px-4 py-6 text-sm text-brand-green/70">
                      Belum ada listing. Fotoin satu baju di form sebelah, lalu umumkan.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {listings.map((listing) => {
                        const thumb = productImageUrl(listing.images?.[0], 200);
                        return (
                          <li key={listing.id} className="flex gap-3 rounded-xl border border-brand-green/10 p-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-cream">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link href={`/preloved/${listing.id}`} className="font-semibold text-brand-green hover:underline">
                                {listing.title}
                              </Link>
                              <p className="text-sm text-brand-green/70">
                                {formatIdr(listing.price)} · {LISTING_STATUS[listing.status] || listing.status}
                              </p>
                            </div>
                            {listing.status === 'available' ? (
                              <Button variant="ghost" size="sm" onClick={() => removeListing(listing.id)}>
                                Hapus
                              </Button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>

            {listings.length > 0 ? (
              <section>
                <h2 className="mb-4 text-xl font-bold text-brand-green">Tampilan di katalog</h2>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {listings.filter((item) => item.status === 'available').slice(0, 4).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-brand-green">Pesanan terakhir</h2>
                    <Link href="/dashboard/orders" className="text-sm font-semibold text-brand-green underline">
                      Semua
                    </Link>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-sm text-brand-green/70">Belum ada transaksi preloved.</p>
                  ) : (
                    <ul className="space-y-2">
                      {orders.map((order) => (
                        <li key={order.id} className="rounded-lg bg-brand-cream/50 px-3 py-2 text-sm text-brand-green">
                          <p className="font-semibold">{order.listings?.title || 'Pesanan'}</p>
                          <p className="text-brand-green/70">
                            {formatIdr(order.amount)} · {order.status}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-brand-green">Donasi kamu</h2>
                    <Link href="/dashboard/donor" className="text-sm font-semibold text-brand-green underline">
                      Detail
                    </Link>
                  </div>
                  {claims.length === 0 ? (
                    <p className="text-sm text-brand-green/70">
                      Belum ada klaim.{' '}
                      <Link href="/donasi" className="font-semibold underline">
                        Lihat kebutuhan yayasan
                      </Link>
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {claims.map((claim) => (
                        <li key={claim.id} className="rounded-lg bg-brand-cream/50 px-3 py-2 text-sm text-brand-green">
                          <p className="font-semibold">{claim.donation_wishlists?.title || 'Wishlist'}</p>
                          <p className="text-brand-green/70">
                            {claim.item_qty} item · {CLAIM_STATUS[claim.status] || claim.status}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                  {badge.next ? (
                    <p className="text-xs text-brand-green/60">
                      {badge.remaining} donasi lagi menuju badge {badge.next}.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_auto]">
              <Card>
                <CardContent className="space-y-4">
                  <h2 className="text-lg font-bold text-brand-green">Profil</h2>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="relative h-16 w-16 overflow-hidden rounded-full bg-brand-green text-lg font-bold text-brand-cream"
                      aria-label="Ganti foto profil"
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        displayName[0]?.toUpperCase()
                      )}
                    </button>
                    <div>
                      <p className="font-semibold text-brand-green">{displayName}</p>
                      <p className="text-sm text-brand-green/70">{email}</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onAvatar(e.target.files?.[0])}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Nama</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="city">Kota</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="phone">WhatsApp / telepon</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={saveProfile} disabled={savingProfile}>
                      {savingProfile ? 'Menyimpan...' : 'Simpan profil'}
                    </Button>
                    <Button variant="outline" onClick={handleLogout}>
                      Keluar
                    </Button>
                    {profile?.id ? (
                      <>
                        <Link href={`/u/${profile.id}`}>
                          <Button variant="ghost">Lihat profil publik</Button>
                        </Link>
                        <Link href="/wishlist">
                          <Button variant="ghost">Wishlist saya</Button>
                        </Link>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {profile?.role === 'foundation' ? (
                  <Link href="/dashboard/foundation" className="block rounded-2xl bg-white px-5 py-4 font-semibold text-brand-green shadow-sm">
                    Dashboard yayasan
                  </Link>
                ) : (
                  <Link href="/yayasan/daftar" className="block rounded-2xl bg-white px-5 py-4 text-sm text-brand-green shadow-sm">
                    Daftar sebagai yayasan
                  </Link>
                )}
                {profile?.role === 'admin' ? (
                  <Link href="/dashboard/admin" className="block rounded-2xl bg-white px-5 py-4 font-semibold text-brand-green shadow-sm">
                    Dashboard admin
                  </Link>
                ) : null}

                <details className="rounded-2xl bg-white px-5 py-4 text-sm text-brand-green/80 shadow-sm">
                  <summary className="cursor-pointer font-semibold text-red-700">Hapus akun</summary>
                  <p className="mt-3">Semua listing dan data akun hilang permanen.</p>
                  {!showDelete ? (
                    <Button className="mt-3" variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                      Lanjutkan
                    </Button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p>
                        Ketik <code className="rounded bg-red-50 px-1">HAPUS {email}</code>
                      </p>
                      <Input value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteText.trim() !== `HAPUS ${email}` || deleting}
                        onClick={confirmDelete}
                      >
                        {deleting ? 'Menghapus...' : 'Hapus permanen'}
                      </Button>
                    </div>
                  )}
                </details>
              </div>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
