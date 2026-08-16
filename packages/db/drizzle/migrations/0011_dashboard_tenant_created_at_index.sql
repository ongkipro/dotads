CREATE INDEX IF NOT EXISTS "idx_orders_tenant_created_at"
ON "orders" USING btree ("tenant_id", "created_at");
