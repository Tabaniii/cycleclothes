# Cycle Clothes

Platform preloved + donasi langsung ke yayasan (PRD v2). Stack: Next.js App Router, Supabase, Stripe sandbox, Tailwind.

## Setup lokal

1. Salin `.env.example` ke `.env.local` lalu isi kunci Supabase/Stripe.
2. Jalankan migrasi `supabase/migrations/0001_*.sql` sampai `0006_*.sql` di proyek Supabase. `0006` wajib jika register/login error setelah v2 — memperbaiki trigger `profiles`.
3. Aktifkan Google OAuth di Supabase Auth (redirect: `{origin}/auth/callback`).
4. Stripe: webhook endpoint `https://<domain>/api/stripe/webhook` untuk `payment_intent.succeeded`.
5. `npm install` lalu `npm run dev`.
6. Seed data uji: `npm run seed` (butuh `SUPABASE_SERVICE_ROLE_KEY`).

Akun seed default (password `CycleClothes123!`):

- `admin@cycleclothes.local`
- `yayasan@cycleclothes.local`
- `donor@cycleclothes.local`
- `seller@cycleclothes.local`

## Cron

Klaim `pending` > 3 hari di-expire oleh `private.expire_stale_donation_claims` (pg_cron jika tersedia) dan `/api/cron/expire-claims` (Vercel Cron + `CRON_SECRET`).

## Asumsi

- Mata uang Stripe sandbox: **IDR** (two-decimal di API Stripe; kirim `harga_rupiah * 100`).
- Role otorisasi diambil dari `profiles.role`, bukan `user_metadata` JWT.
- Kit UI mengikuti pola shadcn (CVA + token brand di `design.md`), tanpa CLI shadcn penuh.
