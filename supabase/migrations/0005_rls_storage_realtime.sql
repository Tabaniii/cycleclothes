-- ============================================================
-- RLS policies, grants, storage buckets, realtime publication
-- Wrap auth.uid() in (SELECT ...) so Postgres can cache it per query.
-- ------------------------------------------------------------

-- Expose tables to the Data API (RLS still decides which rows).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.stripe_events TO service_role;
GRANT INSERT, SELECT ON public.stripe_events TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foundation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.foundation_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.donation_claims FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events FORCE ROW LEVEL SECURITY;

-- ======================== profiles ========================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ======================== foundation_profiles ========================
DROP POLICY IF EXISTS "foundation_self_read" ON public.foundation_profiles;
CREATE POLICY "foundation_self_read"
  ON public.foundation_profiles
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "foundation_public_approved_read" ON public.foundation_profiles;
CREATE POLICY "foundation_public_approved_read"
  ON public.foundation_profiles
  FOR SELECT
  TO anon, authenticated
  USING (verification_status = 'approved' AND is_suspended = false);

DROP POLICY IF EXISTS "foundation_self_insert" ON public.foundation_profiles;
CREATE POLICY "foundation_self_insert"
  ON public.foundation_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "foundation_self_update_pending" ON public.foundation_profiles;
CREATE POLICY "foundation_self_update_pending"
  ON public.foundation_profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    AND verification_status IN ('pending', 'rejected')
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    AND verification_status = 'pending'
    AND is_suspended = false
  );

DROP POLICY IF EXISTS "foundation_admin_update" ON public.foundation_profiles;
CREATE POLICY "foundation_admin_update"
  ON public.foundation_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ======================== donation_wishlists ========================
DROP POLICY IF EXISTS "public read open wishlists" ON public.donation_wishlists;
DROP POLICY IF EXISTS "wishlists_public_read_open" ON public.donation_wishlists;
CREATE POLICY "wishlists_public_read_open"
  ON public.donation_wishlists
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'open'
    OR foundation_id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "foundation manage own wishlists" ON public.donation_wishlists;
DROP POLICY IF EXISTS "wishlists_foundation_insert" ON public.donation_wishlists;
CREATE POLICY "wishlists_foundation_insert"
  ON public.donation_wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    foundation_id = (SELECT auth.uid())
    AND (SELECT private.is_approved_foundation())
  );

DROP POLICY IF EXISTS "wishlists_foundation_update" ON public.donation_wishlists;
CREATE POLICY "wishlists_foundation_update"
  ON public.donation_wishlists
  FOR UPDATE
  TO authenticated
  USING (
    foundation_id = (SELECT auth.uid())
    AND (SELECT private.is_approved_foundation())
  )
  WITH CHECK (
    foundation_id = (SELECT auth.uid())
    AND (SELECT private.is_approved_foundation())
  );

DROP POLICY IF EXISTS "wishlists_admin_write" ON public.donation_wishlists;
CREATE POLICY "wishlists_admin_write"
  ON public.donation_wishlists
  FOR ALL
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ======================== donation_claims ========================
DROP POLICY IF EXISTS "donor create own claim" ON public.donation_claims;
DROP POLICY IF EXISTS "donor update own tracking" ON public.donation_claims;
DROP POLICY IF EXISTS "foundation verify own claims" ON public.donation_claims;

DROP POLICY IF EXISTS "claims_select" ON public.donation_claims;
CREATE POLICY "claims_select"
  ON public.donation_claims
  FOR SELECT
  TO authenticated
  USING (
    donor_id = (SELECT auth.uid())
    OR (SELECT private.owns_wishlist(wishlist_id))
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "claims_donor_insert" ON public.donation_claims;
CREATE POLICY "claims_donor_insert"
  ON public.donation_claims
  FOR INSERT
  TO authenticated
  WITH CHECK (donor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "claims_donor_update" ON public.donation_claims;
CREATE POLICY "claims_donor_update"
  ON public.donation_claims
  FOR UPDATE
  TO authenticated
  USING (
    donor_id = (SELECT auth.uid())
    AND status IN ('pending', 'shipped')
  )
  WITH CHECK (
    donor_id = (SELECT auth.uid())
    AND status IN ('pending', 'shipped', 'cancelled')
  );

DROP POLICY IF EXISTS "claims_foundation_update" ON public.donation_claims;
CREATE POLICY "claims_foundation_update"
  ON public.donation_claims
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.owns_wishlist(wishlist_id)))
  WITH CHECK ((SELECT private.owns_wishlist(wishlist_id)));

DROP POLICY IF EXISTS "claims_admin_update" ON public.donation_claims;
CREATE POLICY "claims_admin_update"
  ON public.donation_claims
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ======================== listings ========================
DROP POLICY IF EXISTS "listings_public_read" ON public.listings;
CREATE POLICY "listings_public_read"
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (status <> 'removed' OR seller_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "listings_seller_insert" ON public.listings;
CREATE POLICY "listings_seller_insert"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "listings_seller_update" ON public.listings;
CREATE POLICY "listings_seller_update"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (seller_id = (SELECT auth.uid()))
  WITH CHECK (seller_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "listings_admin_update" ON public.listings;
CREATE POLICY "listings_admin_update"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ======================== orders ========================
DROP POLICY IF EXISTS "orders_participant_select" ON public.orders;
CREATE POLICY "orders_participant_select"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    buyer_id = (SELECT auth.uid())
    OR seller_id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "orders_buyer_insert" ON public.orders;
CREATE POLICY "orders_buyer_insert"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (SELECT auth.uid()) AND buyer_id <> seller_id);

DROP POLICY IF EXISTS "orders_participant_update" ON public.orders;
CREATE POLICY "orders_participant_update"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    buyer_id = (SELECT auth.uid())
    OR seller_id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  )
  WITH CHECK (
    buyer_id = (SELECT auth.uid())
    OR seller_id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  );

-- ======================== messages ========================
DROP POLICY IF EXISTS "messages_participants_select" ON public.messages;
CREATE POLICY "messages_participants_select"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR receiver_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "messages_sender_insert" ON public.messages;
CREATE POLICY "messages_sender_insert"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND (
      receiver_id = (
        SELECT l.seller_id FROM public.listings l WHERE l.id = listing_id
      )
      OR EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = listing_id AND l.seller_id = (SELECT auth.uid())
      )
    )
  );

-- ======================== reviews ========================
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "reviews_participant_insert" ON public.reviews;
CREATE POLICY "reviews_participant_insert"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND o.status = 'completed'
        AND (o.buyer_id = (SELECT auth.uid()) OR o.seller_id = (SELECT auth.uid()))
        AND (
          (o.buyer_id = (SELECT auth.uid()) AND reviewee_id = o.seller_id)
          OR (o.seller_id = (SELECT auth.uid()) AND reviewee_id = o.buyer_id)
        )
    )
  );

-- ======================== notifications ========================
DROP POLICY IF EXISTS "notifications_self_select" ON public.notifications;
CREATE POLICY "notifications_self_select"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_self_update" ON public.notifications;
CREATE POLICY "notifications_self_update"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ======================== audit_logs / stripe_events ========================
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_admin_read"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "stripe_events_admin_read" ON public.stripe_events;
CREATE POLICY "stripe_events_admin_read"
  ON public.stripe_events
  FOR SELECT
  TO authenticated
  USING ((SELECT private.is_admin()));

-- Writes to audit_logs / stripe_events go through SECURITY DEFINER or service_role.

-- ======================== content_flags ========================
DROP POLICY IF EXISTS "flags_self_insert" ON public.content_flags;
CREATE POLICY "flags_self_insert"
  ON public.content_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "flags_self_select" ON public.content_flags;
CREATE POLICY "flags_self_select"
  ON public.content_flags
  FOR SELECT
  TO authenticated
  USING (reporter_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));

DROP POLICY IF EXISTS "flags_admin_update" ON public.content_flags;
CREATE POLICY "flags_admin_update"
  ON public.content_flags
  FOR UPDATE
  TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ======================== Storage buckets (5MB, typed) ========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'donation-proofs',
    'donation-proofs',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'foundation-docs',
    'foundation-docs',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- product-images: public read, owner write (path = {userId}/...)
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_owner_insert" ON storage.objects;
CREATE POLICY "product_images_owner_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "product_images_owner_update" ON storage.objects;
CREATE POLICY "product_images_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "product_images_owner_delete" ON storage.objects;
CREATE POLICY "product_images_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- donation-proofs: private; donor folder or foundation that owns the claim
DROP POLICY IF EXISTS "donation_proofs_insert" ON storage.objects;
CREATE POLICY "donation_proofs_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'donation-proofs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "donation_proofs_update" ON storage.objects;
CREATE POLICY "donation_proofs_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'donation-proofs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'donation-proofs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "donation_proofs_select" ON storage.objects;
CREATE POLICY "donation_proofs_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'donation-proofs'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT private.is_admin())
      OR EXISTS (
        SELECT 1
        FROM public.donation_claims c
        JOIN public.donation_wishlists w ON w.id = c.wishlist_id
        WHERE w.foundation_id = (SELECT auth.uid())
          AND (
            c.proof_image_url = name
            OR c.proof_image_url LIKE '%' || name
          )
      )
    )
  );

-- foundation-docs: owner + admin
DROP POLICY IF EXISTS "foundation_docs_insert" ON storage.objects;
CREATE POLICY "foundation_docs_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'foundation-docs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "foundation_docs_select" ON storage.objects;
CREATE POLICY "foundation_docs_select"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'foundation-docs'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR (SELECT private.is_admin())
    )
  );

DROP POLICY IF EXISTS "foundation_docs_update" ON storage.objects;
CREATE POLICY "foundation_docs_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'foundation-docs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'foundation-docs'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- Realtime for chat + in-app notifications
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;
