-- Algonest demo — institutional email enforcement DISABLED.
--
-- This platform is a demo Researcher Information System by Algonest, used
-- by multiple universities for evaluation. Restricting signups to a single
-- email domain doesn't fit that model, so the trigger is a no-op that
-- accepts any email. The function and trigger remain in place (rather than
-- being dropped) so a downstream deployment can replace the function body
-- to re-enable domain checks without a schema migration.

CREATE OR REPLACE FUNCTION public.enforce_institutional_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Demo mode: allow any email domain. Replace the body with a domain
  -- check (see git history) when deploying for a single institution.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_institutional_email_trigger ON auth.users;

CREATE TRIGGER enforce_institutional_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_institutional_email();
