CREATE OR REPLACE FUNCTION resolve_unique_session_workspace(
  p_user_id text,
  p_session_id text
)
RETURNS TABLE (
  "workspaceCount" integer,
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
  candidate_count integer;
  candidate record;
BEGIN
  SELECT count(*)::integer
  INTO candidate_count
  FROM public.members member
  JOIN public.organizations organization ON organization.id = member.organization_id
  JOIN public.tenants tenant ON tenant.id = organization.tenant_id
  WHERE member.user_id = p_user_id
    AND tenant.status = 'active'
    AND member.role IN ('TENANT_OWNER', 'ADMIN', 'ADVERTISER', 'CUSTOMER_SERVICE');

  IF candidate_count <> 1 THEN
    RETURN QUERY SELECT candidate_count, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT organization.tenant_id, organization.id, member.role,
    tenant.name::text, tenant.status::text
  INTO candidate
  FROM public.members member
  JOIN public.organizations organization ON organization.id = member.organization_id
  JOIN public.tenants tenant ON tenant.id = organization.tenant_id
  WHERE member.user_id = p_user_id
    AND tenant.status = 'active'
    AND member.role IN ('TENANT_OWNER', 'ADMIN', 'ADVERTISER', 'CUSTOMER_SERVICE')
  LIMIT 1;

  UPDATE public.sessions
  SET active_organization_id = candidate.id, updated_at = now()
  WHERE id = p_session_id
    AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, NULL::uuid, NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT 1, candidate.tenant_id, candidate.id, candidate.role::text,
    candidate.name, candidate.status;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION resolve_unique_session_workspace(text, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION resolve_unique_session_workspace(text, text) TO dotads_app;
