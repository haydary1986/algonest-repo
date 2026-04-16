-- Task 32 + FIX-04 (P0) — is_admin() helper
--
-- SECURITY DEFINER intentional: callers (RLS policies) must read `admins`
-- regardless of their own grants. SET search_path closes the search_path
-- injection vector (CVE-2018-1058 family).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
