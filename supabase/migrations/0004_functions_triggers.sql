-- ============================================================
-- Triggers, badge logic, claim guards, audit helpers, expire job
-- SECURITY DEFINER helpers live in `private` (not exposed via PostgREST).
-- ============================================================

-- Harden the existing signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
  END IF;
END $$;

-- Users cannot self-promote role or rewrite badge counters from the client.
CREATE OR REPLACE FUNCTION private.guard_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('cycleclothes.system_update', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  IF (SELECT private.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role can only be changed by an admin';
  END IF;

  IF NEW.donation_count IS DISTINCT FROM OLD.donation_count
    OR NEW.badge_status IS DISTINCT FROM OLD.badge_status
  THEN
    RAISE EXCEPTION 'Badge fields are system-managed';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_profile_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profile_guard ON public.profiles;
CREATE TRIGGER trg_profile_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.guard_profile_update();

-- ------------------------------------------------------------
-- Role helpers (used by RLS; auth.uid() is checked inside)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_approved_foundation()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.foundation_profiles f ON f.id = p.id
    WHERE p.id = (SELECT auth.uid())
      AND p.role = 'foundation'
      AND f.verification_status = 'approved'
      AND f.is_suspended = false
  );
$$;

CREATE OR REPLACE FUNCTION private.owns_wishlist(p_wishlist_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.donation_wishlists w
    WHERE w.id = p_wishlist_id
      AND w.foundation_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.write_audit(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (p_actor_id, p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION private.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_entity_type text,
  p_entity_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
  VALUES (p_user_id, p_type, p_title, p_body, p_entity_type, p_entity_id);
END;
$$;

CREATE OR REPLACE FUNCTION private.badge_for_count(p_count integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_count >= 10 THEN 'Penghuni Surga'
    WHEN p_count >= 5 THEN 'Anak Tuhan'
    WHEN p_count >= 1 THEN 'Orang Baik'
    ELSE 'Newbie'
  END;
$$;

REVOKE ALL ON FUNCTION private.write_audit(uuid, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.notify_user(uuid, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.badge_for_count(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.is_approved_foundation() TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_wishlist(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_uid() TO authenticated, anon;

-- ------------------------------------------------------------
-- updated_at helper
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.touch_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS trg_foundation_profiles_updated_at ON public.foundation_profiles;
CREATE TRIGGER trg_foundation_profiles_updated_at
BEFORE UPDATE ON public.foundation_profiles
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS trg_wishlists_updated_at ON public.donation_wishlists;
CREATE TRIGGER trg_wishlists_updated_at
BEFORE UPDATE ON public.donation_wishlists
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS trg_claims_updated_at ON public.donation_claims;
CREATE TRIGGER trg_claims_updated_at
BEFORE UPDATE ON public.donation_claims
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS trg_listings_updated_at ON public.listings;
CREATE TRIGGER trg_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();

-- ------------------------------------------------------------
-- Wishlist insert/update: approved foundation only
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.guard_wishlist_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL OR (SELECT private.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL OR NEW.foundation_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Wishlist foundation_id must match the authenticated user';
  END IF;

  IF NOT (SELECT private.is_approved_foundation()) THEN
    RAISE EXCEPTION 'Only an approved, unsuspended foundation can manage wishlists';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_wishlist_write() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_wishlist_guard ON public.donation_wishlists;
CREATE TRIGGER trg_wishlist_guard
BEFORE INSERT OR UPDATE ON public.donation_wishlists
FOR EACH ROW EXECUTE FUNCTION private.guard_wishlist_write();

-- ------------------------------------------------------------
-- Claim insert: remaining capacity + donor identity
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.guard_claim_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_target integer;
  v_fulfilled integer;
  v_reserved integer;
  v_status text;
BEGIN
  IF v_uid IS NULL OR (SELECT private.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.donor_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Donors may only create claims for themselves';
  END IF;

  SELECT w.target_items, w.fulfilled_items, w.status
  INTO v_target, v_fulfilled, v_status
  FROM public.donation_wishlists w
  WHERE w.id = NEW.wishlist_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wishlist not found';
  END IF;

  IF v_status IS DISTINCT FROM 'open' THEN
    RAISE EXCEPTION 'Wishlist is not open for claims';
  END IF;

  SELECT COALESCE(SUM(c.item_qty), 0)
  INTO v_reserved
  FROM public.donation_claims c
  WHERE c.wishlist_id = NEW.wishlist_id
    AND c.status IN ('pending', 'shipped', 'verified');

  IF (v_fulfilled + NEW.item_qty) > v_target THEN
    RAISE EXCEPTION 'Claim quantity exceeds remaining wishlist target';
  END IF;

  -- Reserved (in-flight) qty is informational; fulfilled is the source of truth.
  IF (v_reserved + NEW.item_qty) > v_target THEN
    RAISE EXCEPTION 'Claim quantity exceeds remaining wishlist capacity';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.guard_claim_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_claim_insert_guard ON public.donation_claims;
CREATE TRIGGER trg_claim_insert_guard
BEFORE INSERT ON public.donation_claims
FOR EACH ROW EXECUTE FUNCTION private.guard_claim_insert();

-- ------------------------------------------------------------
-- Claim update: donors may only touch tracking/proof while pending|shipped
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.guard_claim_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_is_foundation boolean := (SELECT private.owns_wishlist(OLD.wishlist_id));
  v_is_admin boolean := (SELECT private.is_admin());
BEGIN
  IF current_setting('cycleclothes.system_update', true) = 'true' OR v_uid IS NULL THEN
    RETURN NEW;
  END IF;
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NOT NULL AND v_uid = OLD.donor_id AND NOT v_is_foundation THEN
    IF NEW.wishlist_id IS DISTINCT FROM OLD.wishlist_id
      OR NEW.donor_id IS DISTINCT FROM OLD.donor_id
      OR NEW.item_description IS DISTINCT FROM OLD.item_description
      OR NEW.item_qty IS DISTINCT FROM OLD.item_qty
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    THEN
      RAISE EXCEPTION 'Donors may only update tracking_number and proof_image_url';
    END IF;

    IF OLD.status NOT IN ('pending', 'shipped') THEN
      RAISE EXCEPTION 'Donors can only update pending or shipped claims';
    END IF;

    IF NEW.status NOT IN ('pending', 'shipped', 'cancelled') THEN
      RAISE EXCEPTION 'Donors cannot set this claim status';
    END IF;

    IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'Only pending claims can be cancelled by the donor';
    END IF;

    IF NEW.tracking_number IS NOT NULL
      AND btrim(NEW.tracking_number) <> ''
      AND NEW.proof_image_url IS NOT NULL
      AND NEW.status = 'pending'
    THEN
      NEW.status := 'shipped';
    END IF;

    RETURN NEW;
  END IF;

  IF v_is_foundation THEN
    IF NEW.wishlist_id IS DISTINCT FROM OLD.wishlist_id
      OR NEW.donor_id IS DISTINCT FROM OLD.donor_id
      OR NEW.item_qty IS DISTINCT FROM OLD.item_qty
    THEN
      RAISE EXCEPTION 'Foundations cannot reassign claim ownership or quantity';
    END IF;

    IF NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
      IF OLD.status IS DISTINCT FROM 'shipped' THEN
        RAISE EXCEPTION 'Only shipped claims can be verified';
      END IF;
      NEW.verified_by := v_uid;
      NEW.verified_at := now();
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this claim';
END;
$$;

REVOKE ALL ON FUNCTION private.guard_claim_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_claim_update_guard ON public.donation_claims;
CREATE TRIGGER trg_claim_update_guard
BEFORE UPDATE ON public.donation_claims
FOR EACH ROW EXECUTE FUNCTION private.guard_claim_update();

-- ------------------------------------------------------------
-- PRD trigger: on verified → donation_count, badge, fulfilled_items
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.fn_on_claim_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_count integer;
  v_badge text;
BEGIN
  IF NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
    PERFORM set_config('cycleclothes.system_update', 'true', true);

    UPDATE public.profiles
    SET
      donation_count = donation_count + 1,
      badge_status = CASE
        WHEN donation_count + 1 >= 10 THEN 'Penghuni Surga'
        WHEN donation_count + 1 >= 5 THEN 'Anak Tuhan'
        WHEN donation_count + 1 >= 1 THEN 'Orang Baik'
        ELSE 'Newbie'
      END
    WHERE id = NEW.donor_id
    RETURNING donation_count, badge_status INTO v_new_count, v_badge;

    UPDATE public.donation_wishlists
    SET
      fulfilled_items = LEAST(target_items, fulfilled_items + NEW.item_qty),
      status = CASE
        WHEN LEAST(target_items, fulfilled_items + NEW.item_qty) >= target_items THEN 'completed'
        ELSE status
      END
    WHERE id = NEW.wishlist_id;

    PERFORM private.write_audit(
      NEW.verified_by,
      'claim.verified',
      'donation_claims',
      NEW.id,
      jsonb_build_object(
        'donor_id', NEW.donor_id,
        'wishlist_id', NEW.wishlist_id,
        'item_qty', NEW.item_qty,
        'donation_count', v_new_count,
        'badge_status', v_badge
      )
    );

    PERFORM private.notify_user(
      NEW.donor_id,
      'claim.verified',
      'Donasi terverifikasi',
      'Yayasan telah memverifikasi donasi kamu. Badge saat ini: ' || COALESCE(v_badge, 'Newbie') || '.',
      'donation_claims',
      NEW.id
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM private.notify_user(
      NEW.donor_id,
      'claim.' || NEW.status,
      'Status klaim donasi: ' || NEW.status,
      'Klaim donasi kamu sekarang berstatus ' || NEW.status || '.',
      'donation_claims',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.fn_on_claim_verified() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_claim_verified ON public.donation_claims;
CREATE TRIGGER trg_claim_verified
AFTER UPDATE ON public.donation_claims
FOR EACH ROW EXECUTE FUNCTION private.fn_on_claim_verified();

-- ------------------------------------------------------------
-- Order status audit + notifications
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.fn_on_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM private.write_audit(
      COALESCE((SELECT auth.uid()), NEW.buyer_id),
      'order.' || NEW.status,
      'orders',
      NEW.id,
      jsonb_build_object(
        'from', OLD.status,
        'to', NEW.status,
        'stripe_payment_intent_id', NEW.stripe_payment_intent_id,
        'amount', NEW.amount
      )
    );

    PERFORM private.notify_user(
      NEW.buyer_id,
      'order.' || NEW.status,
      'Status pesanan: ' || NEW.status,
      'Pesanan kamu sekarang ' || NEW.status || '.',
      'orders',
      NEW.id
    );

    PERFORM private.notify_user(
      NEW.seller_id,
      'order.' || NEW.status,
      'Status pesanan: ' || NEW.status,
      'Pesanan masuk sekarang ' || NEW.status || '.',
      'orders',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- completed_at must be set BEFORE UPDATE; split into before + after
CREATE OR REPLACE FUNCTION private.fn_on_order_status_before()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  END IF;

  IF current_setting('cycleclothes.system_update', true) = 'true' OR v_uid IS NULL OR (SELECT private.is_admin()) THEN
    RETURN NEW;
  END IF;

  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
    OR NEW.seller_id IS DISTINCT FROM OLD.seller_id
    OR NEW.listing_id IS DISTINCT FROM OLD.listing_id
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR (
      NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
      AND OLD.stripe_payment_intent_id IS NOT NULL
    )
  THEN
    RAISE EXCEPTION 'Order financial fields are immutable';
  END IF;

  IF v_uid = OLD.buyer_id THEN
    IF NEW.status = OLD.status THEN
      RETURN NEW;
    END IF;
    IF OLD.status IN ('paid', 'shipped') AND NEW.status IN ('completed', 'disputed') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Buyer cannot transition order from % to %', OLD.status, NEW.status;
  END IF;

  IF v_uid = OLD.seller_id THEN
    IF NEW.status = OLD.status THEN
      RETURN NEW;
    END IF;
    IF OLD.status = 'paid' AND NEW.status = 'shipped' THEN
      RETURN NEW;
    END IF;
    IF OLD.status IN ('paid', 'shipped') AND NEW.status = 'disputed' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Seller cannot transition order from % to %', OLD.status, NEW.status;
  END IF;

  RAISE EXCEPTION 'Not allowed to update this order';
END;
$$;

REVOKE ALL ON FUNCTION private.fn_on_order_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.fn_on_order_status_before() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_order_status_before ON public.orders;
CREATE TRIGGER trg_order_status_before
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.fn_on_order_status_before();

DROP TRIGGER IF EXISTS trg_order_status_after ON public.orders;
CREATE TRIGGER trg_order_status_after
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.fn_on_order_status_change();

-- ------------------------------------------------------------
-- Auto-expire pending claims older than 3 days
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.expire_stale_donation_claims()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('cycleclothes.system_update', 'true', true);
  WITH expired AS (
    UPDATE public.donation_claims
    SET status = 'expired'
    WHERE status = 'pending'
      AND created_at < now() - interval '3 days'
    RETURNING id, donor_id
  ),
  noted AS (
    INSERT INTO public.notifications (user_id, type, title, body, entity_type, entity_id)
    SELECT
      donor_id,
      'claim.expired',
      'Klaim donasi kedaluwarsa',
      'Klaim pending lebih dari 3 hari tanpa pengiriman telah dibatalkan otomatis.',
      'donation_claims',
      id
    FROM expired
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM expired;

  RETURN COALESCE(v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION private.expire_stale_donation_claims() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.expire_stale_donation_claims() TO service_role;

CREATE OR REPLACE FUNCTION public.expire_stale_donation_claims()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Callable only by service_role via PostgREST RPC / cron.
  PERFORM set_config('cycleclothes.system_update', 'true', true);
  RETURN private.expire_stale_donation_claims();
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_donation_claims() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_stale_donation_claims() TO service_role;

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron tidak tersedia; gunakan Vercel cron /api/cron/expire-claims';
      RETURN;
  END;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-pending-donation-claims') THEN
    PERFORM cron.unschedule('expire-pending-donation-claims');
  END IF;

  PERFORM cron.schedule(
    'expire-pending-donation-claims',
    '20 * * * *',
    $cron$SELECT private.expire_stale_donation_claims();$cron$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Gagal menjadwalkan pg_cron: %', SQLERRM;
END $$;
