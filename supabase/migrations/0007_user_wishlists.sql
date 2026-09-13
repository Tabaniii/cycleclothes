-- Personal preloved wishlist per user (bukan donation_wishlists yayasan).
-- SELECT publik supaya halaman /u/<id>/wishlist bisa dibuka orang lain.
-- Tulis hanya milik sendiri.

CREATE TABLE IF NOT EXISTS public.user_wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_wishlists_user_listing_unique'
      AND conrelid = 'public.user_wishlists'::regclass
  ) THEN
    ALTER TABLE public.user_wishlists
      ADD CONSTRAINT user_wishlists_user_listing_unique UNIQUE (user_id, listing_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_wishlists_user_id_created_idx
  ON public.user_wishlists (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS user_wishlists_listing_id_idx
  ON public.user_wishlists (listing_id);

ALTER TABLE public.user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wishlists FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.user_wishlists FROM PUBLIC;
GRANT SELECT ON TABLE public.user_wishlists TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.user_wishlists TO authenticated;

DROP POLICY IF EXISTS "user_wishlists_public_read" ON public.user_wishlists;
CREATE POLICY "user_wishlists_public_read"
  ON public.user_wishlists
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "user_wishlists_owner_insert" ON public.user_wishlists;
CREATE POLICY "user_wishlists_owner_insert"
  ON public.user_wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "user_wishlists_owner_delete" ON public.user_wishlists;
CREATE POLICY "user_wishlists_owner_delete"
  ON public.user_wishlists
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
