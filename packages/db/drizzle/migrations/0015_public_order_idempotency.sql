ALTER TABLE "idempotency_keys" ALTER COLUMN "response_code" DROP NOT NULL;
ALTER TABLE "idempotency_keys" ALTER COLUMN "response_json" DROP NOT NULL;
ALTER TABLE "idempotency_keys" ADD COLUMN IF NOT EXISTS "request_hash" varchar(64);
ALTER TABLE "idempotency_keys" ADD COLUMN IF NOT EXISTS "state" varchar(30) NOT NULL DEFAULT 'LEGACY_COMPLETED';
ALTER TABLE "idempotency_keys" ADD COLUMN IF NOT EXISTS "order_id" uuid REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "payment_transactions" ALTER COLUMN "transaction_id" DROP NOT NULL;

ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_request_hash_format"
  CHECK ("request_hash" IS NULL OR "request_hash" ~ '^[0-9a-f]{64}$');
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_state_valid"
  CHECK ("state" IN ('LEGACY_COMPLETED', 'CLAIMED', 'ORDER_CREATED', 'PAYMENT_REQUESTING', 'PAYMENT_AMBIGUOUS', 'COMPLETED'));
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_response_valid"
  CHECK ("response_code" IS NULL OR "response_code" IN (201, 202));
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_state_shape"
  CHECK (
    "state" = 'LEGACY_COMPLETED'
    OR ("request_hash" IS NOT NULL AND (
      ("state" = 'CLAIMED' AND "order_id" IS NULL AND "response_code" IS NULL AND "response_json" IS NULL)
      OR ("state" = 'ORDER_CREATED' AND "order_id" IS NOT NULL AND "response_code" IS NULL AND "response_json" IS NULL)
      OR ("state" IN ('PAYMENT_REQUESTING', 'PAYMENT_AMBIGUOUS') AND "order_id" IS NOT NULL AND "response_code" = 202 AND "response_json" IS NOT NULL)
      OR ("state" = 'COMPLETED' AND "order_id" IS NOT NULL AND "response_code" = 201 AND "response_json" IS NOT NULL)
    ))
  );
CREATE INDEX IF NOT EXISTS "idx_idempotency_tenant_state" ON "idempotency_keys" ("tenant_id", "state");
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_payment_tenant_gateway_order"
  ON "payment_transactions" ("tenant_id", "gateway", "order_id");
