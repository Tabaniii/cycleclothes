-- ============================================================
-- CycleClothes platform v2 schema
-- Assumption: 0001_create_profiles + 0002_storage_avatars already applied.
-- Role lives in public.profiles (never JWT user_metadata).
-- Extra tables beyond the PRD (notifications, stripe_events, content_flags)
-- exist so dashboards, webhook idempotency, and admin flags have a home.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role, authenticated, anon;

-- ------------------------------------------------------------
-- 1. Extend profiles (convert enum role -> text to match PRD)
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE text USING role::text;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE public.profiles
  ALTER COLUMN role SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('user', 'foundation', 'admin'));
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS badge_status text NOT NULL DEFAULT 'Newbie',
  ADD COLUMN IF NOT EXISTS donation_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_badge_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_badge_status_check
      CHECK (badge_status IN ('Newbie', 'Orang Baik', 'Anak Tuhan', 'Penghuni Surga'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_donation_count_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_donation_count_check
      CHECK (donation_count >= 0);
  END IF;
END $$;

DROP TYPE IF EXISTS user_role;

-- ------------------------------------------------------------
-- 2. Core tables
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.foundation_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  legal_document_url text,
  address text,
  pic_name text,
  pic_phone text,
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  review_note text,
  is_suspended boolean NOT NULL DEFAULT false,
  suspension_reason text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.donation_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  foundation_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  target_items integer NOT NULL CHECK (target_items > 0),
  fulfilled_items integer NOT NULL DEFAULT 0 CHECK (fulfilled_items >= 0),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donation_wishlists_fulfilled_not_exceed
    CHECK (fulfilled_items <= target_items)
);

CREATE TABLE IF NOT EXISTS public.donation_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id uuid NOT NULL REFERENCES public.donation_wishlists(id) ON DELETE CASCADE,
  donor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_description text,
  item_qty integer NOT NULL DEFAULT 1 CHECK (item_qty > 0),
  tracking_number text,
  proof_image_url text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'shipped', 'verified', 'expired', 'cancelled')),
  verified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  size text,
  condition text CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  price numeric(12, 2) NOT NULL CHECK (price >= 0),
  images text[] NOT NULL DEFAULT '{}',
  location text,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'sold', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  stripe_payment_intent_id text,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'completed', 'disputed', 'refunded')),
  tracking_number text,
  dispute_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT orders_buyer_seller_distinct CHECK (buyer_id <> seller_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_uidx
  ON public.orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_order_reviewer_unique UNIQUE (order_id, reviewer_id),
  CONSTRAINT reviews_reviewer_reviewee_distinct CHECK (reviewer_id <> reviewee_id)
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. Indexes (FK, RLS predicates, feed filters, cursor pagination)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS foundation_profiles_status_idx
  ON public.foundation_profiles (verification_status);
CREATE INDEX IF NOT EXISTS foundation_profiles_reviewed_by_idx
  ON public.foundation_profiles (reviewed_by);

CREATE INDEX IF NOT EXISTS donation_wishlists_status_idx
  ON public.donation_wishlists (status);
CREATE INDEX IF NOT EXISTS donation_wishlists_foundation_id_idx
  ON public.donation_wishlists (foundation_id);
CREATE INDEX IF NOT EXISTS donation_wishlists_status_category_created_idx
  ON public.donation_wishlists (status, category, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS donation_wishlists_open_created_idx
  ON public.donation_wishlists (created_at DESC, id DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS donation_claims_wishlist_id_idx
  ON public.donation_claims (wishlist_id);
CREATE INDEX IF NOT EXISTS donation_claims_donor_status_idx
  ON public.donation_claims (donor_id, status);
CREATE INDEX IF NOT EXISTS donation_claims_status_created_idx
  ON public.donation_claims (status, created_at);
CREATE INDEX IF NOT EXISTS donation_claims_pending_created_idx
  ON public.donation_claims (created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS listings_seller_id_idx ON public.listings (seller_id);
CREATE INDEX IF NOT EXISTS listings_status_category_idx
  ON public.listings (status, category);
CREATE INDEX IF NOT EXISTS listings_status_created_idx
  ON public.listings (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS listings_available_price_idx
  ON public.listings (price)
  WHERE status = 'available';

CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON public.orders (seller_id);
CREATE INDEX IF NOT EXISTS orders_listing_id_idx ON public.orders (listing_id);
CREATE INDEX IF NOT EXISTS orders_status_created_idx
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_listing_created_idx
  ON public.messages (listing_id, created_at, id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages (receiver_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS reviews_reviewee_id_idx ON public.reviews (reviewee_id);
CREATE INDEX IF NOT EXISTS reviews_order_id_idx ON public.reviews (order_id);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON public.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS content_flags_status_idx
  ON public.content_flags (status, created_at DESC);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS listings_title_trgm_idx
  ON public.listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS donation_wishlists_title_trgm_idx
  ON public.donation_wishlists USING gin (title gin_trgm_ops);
