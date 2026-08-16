DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE cnote_no IS NOT NULL
    GROUP BY cnote_no HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce unique Mengantar waybill: duplicate cnote_no values exist'
      USING ERRCODE = '23505';
  END IF;
END
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX uniq_orders_cnote_no
  ON public.orders (cnote_no)
  WHERE cnote_no IS NOT NULL;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION resolve_order_tenant_by_waybill(p_waybill text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT candidate.tenant_id
  FROM public.orders candidate
  WHERE candidate.cnote_no = p_waybill
    AND (SELECT count(*) FROM public.orders matching WHERE matching.cnote_no = p_waybill) = 1
  LIMIT 1
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_order_tenant_by_waybill(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_order_tenant_by_waybill(text) TO dotads_app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION resolve_autolaris_payment_tenant(
  p_transaction_id text,
  p_order_id uuid,
  p_amount integer
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT payment.tenant_id
  FROM public.payment_transactions payment
  JOIN public.orders customer_order
    ON customer_order.id = payment.order_id
   AND customer_order.tenant_id = payment.tenant_id
  WHERE lower(payment.gateway) = 'autolaris'
    AND payment.transaction_id = p_transaction_id
    AND payment.order_id = p_order_id
    AND payment.amount_minor = p_amount
    AND customer_order.total_minor = p_amount
  LIMIT 1
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_autolaris_payment_tenant(text, uuid, integer) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_autolaris_payment_tenant(text, uuid, integer) TO dotads_app;
