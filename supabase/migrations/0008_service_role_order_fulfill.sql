-- service_role needs table grants (BYPASSRLS does not skip GRANT).
-- Without this, Stripe webhook/admin cannot mark orders paid after checkout.
-- FORCE RLS tables also get an explicit service_role policy as defense in depth.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.listings TO service_role;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.stripe_events TO service_role;

DROP POLICY IF EXISTS "orders_service_role_all" ON public.orders;
CREATE POLICY "orders_service_role_all"
  ON public.orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "listings_service_role_all" ON public.listings;
CREATE POLICY "listings_service_role_all"
  ON public.listings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_service_role_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_service_role_insert"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "stripe_events_service_role_write" ON public.stripe_events;
CREATE POLICY "stripe_events_service_role_write"
  ON public.stripe_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- State transition lives in SECURITY DEFINER so FORCE RLS + buyer trigger
-- cannot block pending -> paid. Execute is service_role only.
DROP FUNCTION IF EXISTS public.fulfill_paid_order(text, uuid);
DROP FUNCTION IF EXISTS public.fulfill_paid_order(text, uuid, integer);
DROP FUNCTION IF EXISTS public.fulfill_paid_order(text, uuid, bigint);
CREATE OR REPLACE FUNCTION public.fulfill_paid_order(
  p_payment_intent_id text,
  p_order_id uuid DEFAULT NULL,
  p_stripe_amount bigint DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders;
BEGIN
  IF p_payment_intent_id IS NULL OR btrim(p_payment_intent_id) = '' THEN
    RAISE EXCEPTION 'payment_intent_id required';
  END IF;

  PERFORM set_config('cycleclothes.system_update', 'true', true);

  IF p_order_id IS NOT NULL THEN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  ELSE
    SELECT * INTO v_order
    FROM public.orders
    WHERE stripe_payment_intent_id = p_payment_intent_id;
  END IF;

  IF v_order.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_order.status IN ('paid', 'shipped', 'completed') THEN
    RETURN v_order;
  END IF;

  IF v_order.status IS DISTINCT FROM 'pending' THEN
    RETURN v_order;
  END IF;

  IF p_stripe_amount IS NOT NULL AND round(v_order.amount * 100)::bigint <> p_stripe_amount THEN
    RAISE EXCEPTION 'amount mismatch';
  END IF;

  UPDATE public.orders
  SET
    status = 'paid',
    stripe_payment_intent_id = p_payment_intent_id
  WHERE id = v_order.id
    AND status = 'pending'
  RETURNING * INTO v_order;

  UPDATE public.listings
  SET status = 'reserved'
  WHERE id = v_order.listing_id
    AND status = 'available';

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_paid_order(text, uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_paid_order(text, uuid, bigint) TO postgres, service_role;

NOTIFY pgrst, 'reload schema';
