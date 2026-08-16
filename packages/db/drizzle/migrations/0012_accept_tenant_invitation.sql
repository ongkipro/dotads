CREATE OR REPLACE FUNCTION accept_tenant_invitation_for_session(
  p_invitation_id uuid,
  p_session_id text
)
RETURNS TABLE (
  outcome text,
  "membershipId" text,
  "organizationId" text,
  "tenantId" uuid,
  role text
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  session_identity record;
  invitation_record record;
  membership_record record;
  new_membership_id text;
BEGIN
  SELECT account_session.id, account_session.user_id, account_user.email::text
  INTO session_identity
  FROM public.sessions account_session
  JOIN public.users account_user ON account_user.id = account_session.user_id
  WHERE account_session.id = p_session_id
    AND account_session.expires_at > clock_timestamp()
  FOR UPDATE OF account_session;

  IF session_identity.id IS NULL THEN
    RETURN QUERY SELECT 'UNAUTHENTICATED', NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  SELECT invitation.id, invitation.organization_id, invitation.email::text,
    invitation.role::text, invitation.status::text, invitation.expires_at,
    organization.tenant_id, tenant.status::text AS tenant_status
  INTO invitation_record
  FROM public.invitations invitation
  JOIN public.organizations organization ON organization.id = invitation.organization_id
  JOIN public.tenants tenant ON tenant.id = organization.tenant_id
  WHERE invitation.id = p_invitation_id::text
  FOR UPDATE OF invitation, tenant;

  IF invitation_record.id IS NULL OR
    lower(btrim(invitation_record.email)) <> lower(btrim(session_identity.email)) THEN
    RETURN QUERY SELECT 'NOT_FOUND', NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF invitation_record.role NOT IN ('ADMIN', 'ADVERTISER', 'CUSTOMER_SERVICE') OR
    invitation_record.tenant_status <> 'active' THEN
    RETURN QUERY SELECT 'CONFLICT', NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  SELECT member.id, member.role::text
  INTO membership_record
  FROM public.members member
  WHERE member.organization_id = invitation_record.organization_id
    AND member.user_id = session_identity.user_id
  FOR UPDATE;

  IF invitation_record.status = 'accepted' THEN
    IF membership_record.id IS NULL OR membership_record.role <> invitation_record.role THEN
      RETURN QUERY SELECT 'CONFLICT', NULL::text, NULL::text, NULL::uuid, NULL::text;
      RETURN;
    END IF;

    UPDATE public.sessions
    SET active_organization_id = invitation_record.organization_id,
      updated_at = clock_timestamp()
    WHERE id = session_identity.id AND user_id = session_identity.user_id;

    RETURN QUERY SELECT 'ALREADY_ACCEPTED', membership_record.id,
      invitation_record.organization_id, invitation_record.tenant_id,
      invitation_record.role;
    RETURN;
  END IF;

  IF invitation_record.status <> 'pending' OR
    invitation_record.expires_at <= clock_timestamp() THEN
    RETURN QUERY SELECT 'CONFLICT', NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF membership_record.id IS NOT NULL AND membership_record.role <> invitation_record.role THEN
    RETURN QUERY SELECT 'CONFLICT', NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;

  IF membership_record.id IS NULL THEN
    new_membership_id := gen_random_uuid()::text;
    INSERT INTO public.members (id, organization_id, user_id, role)
    VALUES (new_membership_id, invitation_record.organization_id,
      session_identity.user_id, invitation_record.role);
  ELSE
    new_membership_id := membership_record.id;
  END IF;

  UPDATE public.invitations
  SET status = 'accepted'
  WHERE id = invitation_record.id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation acceptance lost its row lock';
  END IF;

  UPDATE public.sessions
  SET active_organization_id = invitation_record.organization_id,
    updated_at = clock_timestamp()
  WHERE id = session_identity.id AND user_id = session_identity.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'authenticated session disappeared during invitation acceptance';
  END IF;

  INSERT INTO public.audit_logs (
    tenant_id, actor_id, actor_email, actor_role, action,
    target_type, target_id, metadata_json
  ) VALUES (
    invitation_record.tenant_id,
    session_identity.user_id,
    session_identity.email,
    invitation_record.role,
    'member.invitation_accepted',
    'invitation',
    invitation_record.id,
    jsonb_build_object(
      'membershipId', new_membership_id,
      'organizationId', invitation_record.organization_id,
      'role', invitation_record.role
    )
  );

  RETURN QUERY SELECT 'ACCEPTED', new_membership_id,
    invitation_record.organization_id, invitation_record.tenant_id,
    invitation_record.role;
END
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION accept_tenant_invitation_for_session(uuid, text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION accept_tenant_invitation_for_session(uuid, text) TO dotads_app;
