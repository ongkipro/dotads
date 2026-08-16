DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dotads_app') THEN
    CREATE ROLE dotads_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dotads_platform') THEN
    CREATE ROLE dotads_platform NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$$;
--> statement-breakpoint
ALTER ROLE dotads_app NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
--> statement-breakpoint
ALTER ROLE dotads_platform NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO dotads_app, dotads_platform;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dotads_app, dotads_platform;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dotads_app, dotads_platform;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dotads_app, dotads_platform;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dotads_app, dotads_platform;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT nullif(current_setting('app.tenant_id', true), '')::uuid
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_current_tenant_id() FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_current_tenant_id() TO dotads_app, dotads_platform;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION resolve_database_session_context(p_user_id text, p_organization_id text)
RETURNS TABLE (
  "tenantId" uuid,
  "organizationId" text,
  role text,
  "tenantName" text,
  "tenantStatus" text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT organization.tenant_id, organization.id,
    CASE WHEN account_user.role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN' ELSE member.role END,
    tenant.name::text, tenant.status::text
  FROM public.organizations organization
  JOIN public.tenants tenant ON tenant.id = organization.tenant_id
  JOIN public.users account_user ON account_user.id = p_user_id
  LEFT JOIN public.members member
    ON member.organization_id = organization.id AND member.user_id = account_user.id
  WHERE organization.id = p_organization_id
    AND (account_user.role = 'SUPER_ADMIN' OR member.id IS NOT NULL)
  LIMIT 1
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_database_session_context(text, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_database_session_context(text, text) TO dotads_app;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION resolve_order_tenant_by_id(p_order_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$ SELECT tenant_id FROM public.orders WHERE id = p_order_id LIMIT 1 $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION resolve_order_tenant_by_waybill(p_waybill text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$ SELECT tenant_id FROM public.orders WHERE cnote_no = p_waybill LIMIT 1 $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION resolve_idempotency_tenant(p_key text, p_path text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$ SELECT tenant_id FROM public.idempotency_keys WHERE key = p_key AND request_path = p_path LIMIT 1 $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_order_tenant_by_id(uuid) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_order_tenant_by_waybill(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_idempotency_tenant(text, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_order_tenant_by_id(uuid) TO dotads_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_order_tenant_by_waybill(text) TO dotads_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_idempotency_tenant(text, text) TO dotads_app;
--> statement-breakpoint
DO $$
DECLARE
  table_name text;
  tenant_tables constant text[] := ARRAY[
    'organizations', 'tenant_domains', 'products', 'product_variants',
    'orders', 'order_items', 'order_events', 'form_schemas',
    'form_schema_versions', 'landing_pages', 'landing_page_versions',
    'draft_leads', 'mengantar_configs', 'mengantar_dispatch_queue',
    'autolaris_configs', 'payment_transactions', 'tracking_configs',
    'outbox_events', 'audit_logs', 'idempotency_keys'
  ];
BEGIN
  FOREACH table_name IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (current_user = ''dotads_platform'' OR tenant_id = app_current_tenant_id()) WITH CHECK (current_user = ''dotads_platform'' OR tenant_id = app_current_tenant_id())',
      table_name
    );
  END LOOP;
END
$$;
--> statement-breakpoint
DROP POLICY tenant_isolation ON product_variants;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON product_variants
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM products parent WHERE parent.id = product_variants.product_id AND parent.tenant_id = product_variants.tenant_id
  )
));
--> statement-breakpoint
DROP POLICY tenant_isolation ON order_items;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON order_items
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM orders parent WHERE parent.id = order_items.order_id AND parent.tenant_id = order_items.tenant_id
  )
));
--> statement-breakpoint
DROP POLICY tenant_isolation ON order_events;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON order_events
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM orders parent WHERE parent.id = order_events.order_id AND parent.tenant_id = order_events.tenant_id
  )
));
--> statement-breakpoint
DROP POLICY tenant_isolation ON form_schema_versions;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON form_schema_versions
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM form_schemas parent WHERE parent.id = form_schema_versions.form_id AND parent.tenant_id = form_schema_versions.tenant_id
  )
));
--> statement-breakpoint
DROP POLICY tenant_isolation ON landing_page_versions;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON landing_page_versions
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM landing_pages parent WHERE parent.id = landing_page_versions.page_id AND parent.tenant_id = landing_page_versions.tenant_id
  )
));
--> statement-breakpoint
DROP POLICY tenant_isolation ON mengantar_dispatch_queue;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON mengantar_dispatch_queue
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM orders parent WHERE parent.id = mengantar_dispatch_queue.order_id AND parent.tenant_id = mengantar_dispatch_queue.tenant_id
  )
));
--> statement-breakpoint
DROP POLICY tenant_isolation ON payment_transactions;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON payment_transactions
USING (current_user = 'dotads_platform' OR tenant_id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR (
  tenant_id = app_current_tenant_id() AND EXISTS (
    SELECT 1 FROM orders parent WHERE parent.id = payment_transactions.order_id AND parent.tenant_id = payment_transactions.tenant_id
  )
));
--> statement-breakpoint
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE members FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_membership_isolation ON members
USING (current_user = 'dotads_platform' OR EXISTS (
  SELECT 1 FROM organizations organization
  WHERE organization.id = members.organization_id AND organization.tenant_id = app_current_tenant_id()
))
WITH CHECK (current_user = 'dotads_platform' OR EXISTS (
  SELECT 1 FROM organizations organization
  WHERE organization.id = members.organization_id AND organization.tenant_id = app_current_tenant_id()
));
--> statement-breakpoint
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE invitations FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_invitation_isolation ON invitations
USING (current_user = 'dotads_platform' OR EXISTS (
  SELECT 1 FROM organizations organization
  WHERE organization.id = invitations.organization_id AND organization.tenant_id = app_current_tenant_id()
))
WITH CHECK (current_user = 'dotads_platform' OR EXISTS (
  SELECT 1 FROM organizations organization
  WHERE organization.id = invitations.organization_id AND organization.tenant_id = app_current_tenant_id()
));
--> statement-breakpoint
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS tenant_isolation ON tenants;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON tenants
USING (current_user = 'dotads_platform' OR id = app_current_tenant_id())
WITH CHECK (current_user = 'dotads_platform' OR id = app_current_tenant_id());
