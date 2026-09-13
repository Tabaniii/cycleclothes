# Product Requirement Document
## Preloved & Charity Clothes Matching Platform — v2.0 (Expanded)

**Tanggal:** 13 September 2026
**Tech Stack:** Next.js 14+ (App Router, TypeScript), Supabase (PostgreSQL, Auth, Storage, Realtime), Stripe (Sandbox), Vercel, TailwindCSS + shadcn/ui
**Status:** Draft — siap dieksekusi oleh AI coding agent

---

## 1. Executive Summary

**Nama Proyek:** Preloved & Charity Clothes Matching Platform

**Nilai Inti:** Menjadi jembatan tepercaya antara (a) pembeli/penjual pakaian preloved dan (b) pemilik pakaian layak pakai yang ingin berdonasi langsung ke yayasan terverifikasi — tanpa platform pernah menyentuh dana donasi. Kepercayaan dibangun lewat verifikasi yayasan oleh admin dan sistem badge/reputasi berbasis riwayat donasi terverifikasi.

**Model Bisnis (opsional untuk fase lanjut):** Komisi/fee dari transaksi preloved (via Stripe), bukan dari donasi. Donasi bersifat murni peer-to-foundation.

### 1.1 Masalah yang Diselesaikan
- Penjual pakaian preloved kesulitan menemukan pembeli tepercaya dan proses pembayaran yang aman (escrow).
- Yayasan/panti kesulitan mempublikasikan kebutuhan pakaian secara spesifik dan melacak siapa yang sudah janji donasi.
- Calon donatur ingin bukti bahwa donasinya benar-benar sampai dan dihargai (pengakuan sosial/badge).
- Tidak ada satu platform yang menggabungkan dua kebutuhan ini (jual-beli & donasi) dalam satu ekosistem kepercayaan.

---

## 2. Goals & Success Metrics

### 2.1 Business Goals
- Membangun ekosistem donasi pakaian peer-to-foundation yang transparan dan terverifikasi.
- Menjadikan preloved marketplace sebagai sumber traksi awal & monetisasi (fee transaksi).
- Meningkatkan retensi pengguna lewat gamifikasi badge donasi.

### 2.2 Success Metrics (KPI) — MVP (3 bulan pertama pasca-launch)

| Kategori | Metrik | Target |
|---|---|---|
| Aktivasi | Jumlah yayasan terverifikasi aktif | ≥ 15 yayasan |
| Donasi | Total `donation_claims` berstatus `verified` | ≥ 300 klaim/bulan |
| Marketplace | GMV transaksi preloved via Stripe (sandbox → live) | Tumbuh 15% MoM |
| Engagement | Retensi 30 hari pengguna yang sudah donasi ≥1x | ≥ 35% |
| Kepercayaan | Rata-rata waktu verifikasi klaim oleh yayasan | ≤ 48 jam |

---

## 3. User Roles & Personas

| Role | Deskripsi | Kewenangan Utama |
|---|---|---|
| **Regular User** | Individu umum | Jual/beli barang preloved; berdonasi ke wishlist yayasan; melihat badge sendiri & orang lain |
| **Foundation (Yayasan)** | Panti asuhan, yayasan sosial, komunitas amal — terverifikasi admin | Membuat & mengelola wishlist kebutuhan; memverifikasi klaim donasi masuk |
| **Admin** | Tim internal platform | Verifikasi akun yayasan; moderasi konten; memantau penyalahgunaan klaim/badge; melihat dashboard metrik |

### 3.1 Catatan Desain Peran
- Satu akun bisa merangkap Regular User + pernah bertransaksi sebagai penjual/pembeli/donatur sekaligus.
- Role `foundation` diajukan lewat form pendaftaran khusus dan baru aktif setelah disetujui admin (status: `pending` → `approved`/`rejected`).
- Role disimpan di kolom `profiles.role`, tapi verifikasi yayasan dipisah ke tabel `foundation_profiles` agar dokumen legal (SK yayasan, NPWP, dsb.) tidak mencampuri tabel `profiles` utama.

---

## 4. Core User Flows (Detail)

### 4.1 Preloved Flow
1. Penjual membuat listing produk (foto, deskripsi, harga, kondisi, kategori).
2. Pembeli chat/nego harga dengan penjual (realtime chat via Supabase Realtime).
3. Kesepakatan harga → sistem generate invoice Stripe (Payment Intent, mode sandbox).
4. Pembeli membayar → status order menjadi `paid` (dana ditahan/escrow secara logis di sistem, bukan dirilis ke penjual).
5. Penjual mengirim barang & input nomor resi.
6. Pembeli konfirmasi barang diterima (atau auto-confirm setelah N hari) → status `completed` → dana dirilis ke penjual.
7. Kedua pihak dapat saling memberi rating/ulasan.

### 4.2 Donation Flow (Peer-to-Foundation)
1. Yayasan (setelah diverifikasi admin) membuat wishlist: judul, deskripsi, kategori pakaian, `target_items`.
2. Wishlist tampil di feed publik dengan progress bar (`fulfilled_items / target_items`).
3. Donatur memilih wishlist → klik "Donate Items" → mengisi deskripsi barang + estimasi jumlah.
4. Donatur mengirim barang secara mandiri (via kurir pilihan sendiri) lalu upload nomor resi + foto bukti kirim ke bucket `donation-proofs`.
5. Status klaim otomatis menjadi `shipped`.
6. Yayasan menerima paket fisik, mencocokkan dengan klaim, lalu menekan tombol "Verify" di dashboard.
7. Trigger database: `fulfilled_items` wishlist +1 (atau +jumlah item), `donation_count` profil donatur +1.
8. Function/trigger otomatis mengevaluasi `badge_status` donatur berdasarkan threshold terbaru.
9. Notifikasi dikirim ke donatur (in-app/email) bahwa donasi terverifikasi & badge (jika naik level) diberikan.

### 4.3 Edge Cases yang Perlu Ditangani
- Donatur mengklaim tapi tidak pernah mengirim barang → status `expired`/`cancelled` dengan auto-cancel setelah X hari tanpa update resi.
- Yayasan tidak merespons klaim yang sudah `shipped` dalam waktu lama → admin bisa melakukan force-review atau reminder otomatis.
- Donatur mengklaim item lebih banyak dari target_items yang tersisa → validasi di level aplikasi & constraint DB agar `fulfilled_items` tidak melebihi `target_items`.
- Sengketa preloved (barang tidak sesuai) → perlu alur dispute/resolution sebelum dana dirilis ke penjual.

---

## 5. Functional Requirements per Modul

### 5.1 Autentikasi & Profil
- Sign up/login via email+password dan OAuth (Google) menggunakan Supabase Auth.
- Onboarding: lengkapi nama, foto profil, kota/lokasi (untuk estimasi ongkir preloved).
- Halaman profil publik menampilkan `badge_status`, jumlah donasi terverifikasi, rating sebagai penjual/pembeli.

### 5.2 Marketplace Preloved
- CRUD listing produk (create/edit/delete/mark as sold) dengan multi-foto (Supabase Storage bucket `product-images`).
- Filter & pencarian: kategori, ukuran, rentang harga, kondisi, lokasi.
- Chat real-time antara pembeli-penjual per listing (tabel `messages` + Supabase Realtime channel).
- Checkout & invoice via Stripe Sandbox (Payment Intents), dengan status order: `pending → paid → shipped → completed / disputed / refunded`.
- Sistem rating & ulasan pasca-transaksi.

### 5.3 Donasi Langsung (Peer-to-Foundation)
- Yayasan: buat/edit/tutup wishlist; lihat daftar klaim masuk & statusnya; tombol verifikasi.
- Donatur: lihat feed wishlist (dengan progress bar), ajukan klaim, upload resi & bukti kirim, lihat riwayat donasi pribadi.
- Sistem badge otomatis (lihat Bagian 7) yang tampil di listing preloved, kartu profil, dan header chat.
- Notifikasi in-app (dan opsional email) untuk setiap perubahan status klaim.

### 5.4 Verifikasi Yayasan (Admin)
- Form pengajuan yayasan: nama resmi, dokumen legal (upload PDF/gambar), alamat, kontak PIC.
- Dashboard admin untuk approve/reject pengajuan dengan catatan alasan.
- Admin dapat men-suspend yayasan yang terbukti melakukan penyalahgunaan (fake wishlist, dsb.).

### 5.5 Dashboard & Notifikasi
- Dashboard donatur: total donasi, badge saat ini, progress ke badge berikutnya, riwayat klaim.
- Dashboard yayasan: daftar wishlist aktif, klaim pending yang butuh verifikasi, statistik total donasi diterima.
- Dashboard admin: jumlah yayasan pending, laporan/flag konten, metrik KPI dasar.

---

## 6. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| Keamanan | Row Level Security aktif di semua tabel; upload file divalidasi tipe & ukuran (maks. 5MB); rate limiting pada endpoint klaim untuk mencegah spam |
| Skalabilitas | Pagination/infinite scroll pada feed wishlist & listing; index pada kolom yang sering difilter (status, foundation_id, category) |
| Reliabilitas | Stripe webhook harus idempotent (cek `event.id` sebelum memproses ulang); retry mechanism untuk trigger badge yang gagal |
| Auditability | Semua perubahan status penting (klaim, order) dicatat di tabel `audit_logs` (actor_id, action, before/after, timestamp) |
| Aksesibilitas | UI mengikuti kontras warna WCAG AA minimum; form dapat dinavigasi via keyboard |
| Performa | Target LCP < 2.5s pada halaman feed utama; gambar dioptimasi via Next.js Image + Supabase transform |
| Privasi Data | Dokumen legal yayasan (bucket `foundation-docs`) hanya bisa diakses admin & yayasan pemilik (RLS + private bucket) |

---

## 7. Gamification Rules (Badge Logic)

| Threshold | Badge Title | DB Enum | Perlakuan UI |
|---|---|---|---|
| 1 – 4 donasi terverifikasi | Orang Baik | `Orang Baik` | Lencana bronze, tampil di kartu profil |
| 5 – 9 donasi terverifikasi | Anak Tuhan | `Anak Tuhan` | Lencana silver + highlight di listing preloved |
| 10+ donasi terverifikasi | Penghuni Surga | `Penghuni Surga` | Lencana gold + badge khusus di header chat & prioritas tampil di feed "Top Donors" |

> Catatan: perhitungan badge dilakukan lewat trigger/function di database (bukan di client) agar konsisten dan tidak bisa dimanipulasi dari sisi front-end.

---

## 8. Database Schema Design (Supabase PostgreSQL)

### 8.1 Tabel Inti

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  city TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user','foundation','admin')),
  badge_status TEXT DEFAULT 'Newbie'
    CHECK (badge_status IN ('Newbie','Orang Baik','Anak Tuhan','Penghuni Surga')),
  donation_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE foundation_profiles (
  id UUID REFERENCES profiles(id) PRIMARY KEY,
  legal_name TEXT NOT NULL,
  legal_document_url TEXT,
  address TEXT,
  pic_name TEXT,
  pic_phone TEXT,
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donation_wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  foundation_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_items INT NOT NULL CHECK (target_items > 0),
  fulfilled_items INT DEFAULT 0 CHECK (fulfilled_items >= 0),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','completed','closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fulfilled_not_exceed CHECK (fulfilled_items <= target_items)
);

CREATE TABLE donation_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wishlist_id UUID REFERENCES donation_wishlists(id),
  donor_id UUID REFERENCES profiles(id),
  item_description TEXT,
  item_qty INT DEFAULT 1,
  tracking_number TEXT,
  proof_image_url TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','shipped','verified','expired','cancelled')),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Tabel Tambahan (Marketplace Preloved)

```sql
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  size TEXT,
  condition TEXT CHECK (condition IN ('new','like_new','good','fair')),
  price NUMERIC(12,2) NOT NULL,
  images TEXT[],
  status TEXT DEFAULT 'available'
    CHECK (status IN ('available','reserved','sold','removed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  stripe_payment_intent_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','paid','shipped','completed','disputed','refunded')),
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  reviewer_id UUID REFERENCES profiles(id),
  reviewee_id UUID REFERENCES profiles(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.3 Index yang Direkomendasikan

```sql
CREATE INDEX idx_wishlists_status ON donation_wishlists(status);
CREATE INDEX idx_claims_wishlist ON donation_claims(wishlist_id);
CREATE INDEX idx_claims_donor_status ON donation_claims(donor_id, status);
CREATE INDEX idx_listings_status_category ON listings(status, category);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_messages_listing ON messages(listing_id, created_at);
```

### 8.4 Trigger: Auto-Update Badge Saat Klaim Diverifikasi

```sql
CREATE OR REPLACE FUNCTION fn_on_claim_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
    UPDATE profiles
    SET donation_count = donation_count + 1,
        badge_status = CASE
          WHEN donation_count + 1 >= 10 THEN 'Penghuni Surga'
          WHEN donation_count + 1 >= 5  THEN 'Anak Tuhan'
          WHEN donation_count + 1 >= 1  THEN 'Orang Baik'
          ELSE 'Newbie'
        END
    WHERE id = NEW.donor_id;

    UPDATE donation_wishlists
    SET fulfilled_items = LEAST(target_items, fulfilled_items + NEW.item_qty)
    WHERE id = NEW.wishlist_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_claim_verified
AFTER UPDATE ON donation_claims
FOR EACH ROW EXECUTE FUNCTION fn_on_claim_verified();
```

### 8.5 Row Level Security — Contoh Kebijakan

```sql
ALTER TABLE donation_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read open wishlists"
  ON donation_wishlists FOR SELECT
  USING (status = 'open' OR foundation_id = auth.uid());

CREATE POLICY "foundation manage own wishlists"
  ON donation_wishlists FOR INSERT WITH CHECK (
    foundation_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'foundation')
  );

CREATE POLICY "donor create own claim"
  ON donation_claims FOR INSERT WITH CHECK (donor_id = auth.uid());

CREATE POLICY "donor update own tracking"
  ON donation_claims FOR UPDATE USING (donor_id = auth.uid())
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "foundation verify own claims"
  ON donation_claims FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM donation_wishlists w
      WHERE w.id = donation_claims.wishlist_id AND w.foundation_id = auth.uid()
    )
  );
```

---

## 9. API Endpoints (Next.js App Router)

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/wishlists` | Yayasan membuat wishlist baru |
| GET | `/api/wishlists` | Feed wishlist publik (filter status/kategori, pagination) |
| POST | `/api/claims` | Donatur membuat klaim donasi baru |
| PATCH | `/api/claims/[id]/ship` | Donatur update no. resi + upload bukti kirim |
| PATCH | `/api/claims/[id]/verify` | Yayasan memverifikasi klaim (trigger badge update) |
| POST | `/api/listings` | Penjual membuat listing preloved |
| GET | `/api/listings` | Pencarian & filter listing |
| POST | `/api/stripe/create-invoice` | Membuat Payment Intent Stripe (sandbox) untuk order |
| POST | `/api/stripe/webhook` | Menerima event Stripe (`payment_intent.succeeded`, dsb.) |
| PATCH | `/api/orders/[id]/complete` | Konfirmasi barang diterima → rilis dana ke penjual |
| POST | `/api/foundations/apply` | Pengajuan verifikasi akun yayasan |
| PATCH | `/api/admin/foundations/[id]` | Admin approve/reject pengajuan yayasan |

---

## 10. Release Roadmap

| Fase | Cakupan |
|---|---|
| **Fase 1 — MVP** (Minggu 1-4) | Auth & profil, CRUD wishlist, alur klaim & verifikasi manual, badge dasar, CRUD listing preloved (tanpa Stripe: nego via chat manual) |
| **Fase 2** (Minggu 5-7) | Integrasi Stripe Sandbox penuh (invoice, webhook, escrow logis), dashboard admin verifikasi yayasan, notifikasi in-app |
| **Fase 3** (Minggu 8-10) | Sistem rating & review, dispute resolution untuk preloved, dashboard analitik yayasan & donatur, optimasi performa (index, caching) |
| **Fase 4** (Pasca-MVP) | Migrasi Stripe ke live mode, program "Top Donors", kemungkinan ekspansi kategori barang selain pakaian |

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Klaim donasi palsu (tidak pernah kirim barang) | Auto-expire klaim `pending` setelah 3 hari tanpa resi; wajib foto bukti kirim |
| Yayasan fiktif | Verifikasi dokumen legal manual oleh admin sebelum status `approved` |
| Sengketa transaksi preloved | Dana ditahan (escrow logis) sampai buyer konfirmasi/berlaku auto-release N hari + jalur dispute ke admin |
| Manipulasi badge dari client | Semua perhitungan badge dilakukan via DB trigger/function (`SECURITY DEFINER`), bukan di front-end |
| Penyalahgunaan storage (upload besar/berbahaya) | Validasi tipe file (jpg/png/pdf) & batas ukuran di level policy Storage + client |
