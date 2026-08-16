CREATE OR REPLACE FUNCTION list_user_workspaces(p_user_id text)
RETURNS TABLE (
  "organizationId" text,
  "organizationName" text,
  "tenantName" text,
  "tenantStatus" text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT organization.id, organization.name::text, tenant.name::text, tenant.status::text, member.role::text
  FROM public.members member
  JOIN public.organizations organization ON organization.id = member.organization_id
  JOIN public.tenants tenant ON tenant.id = organization.tenant_id
  WHERE member.user_id = p_user_id
    AND member.role IN ('TENANT_OWNER', 'ADMIN', 'ADVERTISER', 'CUSTOMER_SERVICE')
  ORDER BY tenant.name, organization.id
  LIMIT 100
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION select_session_workspace(
  p_user_id text,
  p_session_id text,
  p_organization_id text
)
RETURNS TABLE (
  "tenantId" uuid,
  "organizationId" text,
  role text,
  "tenantName" text,
  "tenantStatus" text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  candidate record;
BEGIN
  SELECT organization.tenant_id, organization.id, member.role::text AS role,
    tenant.name::text AS name, tenant.status::text AS status
  INTO candidate
  FROM public.members member
  JOIN public.organizations organization ON organization.id = member.organization_id
  JOIN public.tenants tenant ON tenant.id = organization.tenant_id
  WHERE member.user_id = p_user_id
    AND organization.id = p_organization_id
    AND tenant.status = 'active'
    AND member.role IN ('TENANT_OWNER', 'ADMIN', 'ADVERTISER', 'CUSTOMER_SERVICE')
  LIMIT 1;

  IF candidate.id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.sessions
  SET active_organization_id = candidate.id, updated_at = now()
  WHERE id = p_session_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT candidate.tenant_id, candidate.id, candidate.role,
    candidate.name, candidate.status;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION list_user_workspaces(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION select_session_workspace(text, text, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION list_user_workspaces(text) TO dotads_app;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION select_session_workspace(text, text, text) TO dotads_app;
