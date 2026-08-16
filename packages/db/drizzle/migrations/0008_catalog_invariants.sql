DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM products WHERE gtin IS NOT NULL
    GROUP BY tenant_id, gtin HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce product GTIN uniqueness: duplicate tenant/GTIN rows exist'
      USING ERRCODE = '23505';
  END IF;
  IF EXISTS (
    SELECT 1 FROM product_variants WHERE sku IS NOT NULL
    GROUP BY tenant_id, upper(sku) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce variant SKU uniqueness: duplicate tenant/SKU rows exist'
      USING ERRCODE = '23505';
  END IF;
  IF EXISTS (
    SELECT 1 FROM product_variants WHERE gtin IS NOT NULL
    GROUP BY tenant_id, gtin HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce variant GTIN uniqueness: duplicate tenant/GTIN rows exist'
      USING ERRCODE = '23505';
  END IF;
  IF EXISTS (
    SELECT 1 FROM product_variants variant
    JOIN products product ON product.id = variant.product_id
    WHERE product.tenant_id <> variant.tenant_id
  ) THEN
    RAISE EXCEPTION 'Cannot enforce variant parent ownership: cross-tenant parent rows exist'
      USING ERRCODE = '23503';
  END IF;
END
$$;

CREATE UNIQUE INDEX uniq_products_tenant_id
ON products (tenant_id, id);

CREATE UNIQUE INDEX uniq_tenant_product_gtin
ON products (tenant_id, gtin) WHERE gtin IS NOT NULL;

CREATE UNIQUE INDEX uniq_tenant_variant_sku
ON product_variants (tenant_id, upper(sku)) WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX uniq_tenant_variant_gtin
ON product_variants (tenant_id, gtin) WHERE gtin IS NOT NULL;

ALTER TABLE products
  ADD CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'archived')),
  ADD CONSTRAINT products_price_check CHECK (price_minor >= 0),
  ADD CONSTRAINT products_compare_price_check CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor >= price_minor),
  ADD CONSTRAINT products_weight_check CHECK (weight_grams > 0);

ALTER TABLE product_variants
  ADD CONSTRAINT variants_price_check CHECK (price_minor >= 0),
  ADD CONSTRAINT variants_compare_price_check CHECK (compare_at_price_minor IS NULL OR compare_at_price_minor >= price_minor),
  ADD CONSTRAINT variants_weight_check CHECK (weight_grams > 0),
  ADD CONSTRAINT variants_stock_check CHECK (stock_quantity >= 0),
  ADD CONSTRAINT variants_tenant_product_fk FOREIGN KEY (tenant_id, product_id)
    REFERENCES products (tenant_id, id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION dotads_set_catalog_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION dotads_set_catalog_updated_at();

CREATE TRIGGER product_variants_set_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION dotads_set_catalog_updated_at();
