DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM invitations
    WHERE status = 'pending'
    GROUP BY organization_id, lower(email)
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot enforce unique pending invitations: duplicate organization/email rows exist'
      USING ERRCODE = '23505';
  END IF;
END
$$;

CREATE UNIQUE INDEX uniq_pending_invitation_org_email
ON invitations (organization_id, lower(email))
WHERE status = 'pending';
