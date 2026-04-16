-- Task 26 — Revoke anon grants on sensitive tables; allow reads on lookups
--
-- Defence in depth: even if a policy is misconfigured, anon has no GRANT on
-- the underlying table so a direct query still fails with permission denied.
-- The public-facing path is always via the SECURITY INVOKER views (see
-- 20260416130300_views.sql) and the get_researchers_page RPC.

-- ---------------------------------------------------------------------------
-- Sensitive tables: anon gets nothing.
-- ---------------------------------------------------------------------------

REVOKE ALL ON public.researchers                      FROM anon;
REVOKE ALL ON public.researcher_social_profiles       FROM anon;
REVOKE ALL ON public.researcher_skills                FROM anon;
REVOKE ALL ON public.researcher_languages             FROM anon;
REVOKE ALL ON public.researcher_education             FROM anon;
REVOKE ALL ON public.researcher_work_experience       FROM anon;
REVOKE ALL ON public.researcher_certifications        FROM anon;
REVOKE ALL ON public.researcher_awards                FROM anon;
REVOKE ALL ON public.researcher_projects              FROM anon;
REVOKE ALL ON public.researcher_sdg_goals             FROM anon;
REVOKE ALL ON public.researcher_publications          FROM anon;
REVOKE ALL ON public.researcher_publication_coauthors FROM anon;

REVOKE ALL ON public.audit_log    FROM anon;
REVOKE ALL ON public.admins       FROM anon;
REVOKE ALL ON public.app_settings FROM anon;

-- Authenticated users also lose direct write privileges; everything funnels
-- through policies that require ownership or admin status.
REVOKE INSERT, UPDATE, DELETE ON public.researchers                      FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_social_profiles       FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_skills                FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_languages             FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_education             FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_work_experience       FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_certifications        FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_awards                FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_projects              FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_sdg_goals             FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_publications          FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.researcher_publication_coauthors FROM authenticated;

REVOKE ALL ON public.audit_log    FROM authenticated;
REVOKE ALL ON public.admins       FROM authenticated;
REVOKE ALL ON public.app_settings FROM authenticated;

-- Re-grant the minimum: SELECT on parents/children + write to authenticated.
-- Policies further restrict which rows are visible / writable.
GRANT SELECT                         ON public.researchers                      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_social_profiles       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_skills                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_languages             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_education             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_work_experience       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_certifications        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_awards                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_projects              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_sdg_goals             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_publications          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_publication_coauthors TO authenticated;
GRANT INSERT, UPDATE                 ON public.researchers                      TO authenticated;

-- audit_log: authenticated may INSERT (via triggers) but not SELECT directly.
GRANT INSERT ON public.audit_log    TO authenticated;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT SELECT ON public.admins       TO authenticated;

-- ---------------------------------------------------------------------------
-- Lookup tables: anon gets SELECT (needed for filter dropdowns).
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'genders','academic_titles','workplace_types',
    'colleges','departments','university_centers',
    'un_sdg_goals','publication_types','publication_sources'
  ] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s_public_read" ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)',
      t || '_public_read',
      t
    );
  END LOOP;
END$$;
