DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM mengantar_dispatch_queue
    GROUP BY tenant_id, order_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce unique dispatch queue: duplicate tenant/order rows exist'
      USING ERRCODE = '23505';
  END IF;
END
$$;

CREATE UNIQUE INDEX uniq_mengantar_queue_tenant_order
ON mengantar_dispatch_queue (tenant_id, order_id);
