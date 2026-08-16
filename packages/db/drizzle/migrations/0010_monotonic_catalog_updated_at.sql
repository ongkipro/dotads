CREATE OR REPLACE FUNCTION dotads_set_catalog_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  -- API concurrency tokens are serialized to milliseconds. Advancing by at
  -- least one millisecond makes every committed write observable to clients,
  -- including multiple writes within one transaction or wall-clock tick.
  NEW.updated_at = greatest(
    clock_timestamp() AT TIME ZONE 'UTC',
    OLD.updated_at + interval '1 millisecond'
  );
  RETURN NEW;
END
$$;
