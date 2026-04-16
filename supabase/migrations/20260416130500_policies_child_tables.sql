-- Task 30 + FIX-03 — Policies for child tables
--
-- Pattern (per child table that has a researcher_id FK):
--   owner_*  : the row's researcher_id must belong to auth.uid()
--   admin_*  : public.is_admin() is true
-- Each op (SELECT/INSERT/UPDATE/DELETE) gets an explicit policy with
-- WITH CHECK on writes (FIX-03).
--
-- We loop over the table list to keep this DRY.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'researcher_social_profiles',
    'researcher_skills',
    'researcher_languages',
    'researcher_education',
    'researcher_work_experience',
    'researcher_certifications',
    'researcher_awards',
    'researcher_projects'
  ] LOOP
    -- drop old (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS "owner_select" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "owner_insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "owner_update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "owner_delete" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_select" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_insert" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_update" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_delete" ON public.%I', t);

    -- owner
    EXECUTE format(
      'CREATE POLICY "owner_select" ON public.%I FOR SELECT TO authenticated
         USING (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()))',
      t);
    EXECUTE format(
      'CREATE POLICY "owner_insert" ON public.%I FOR INSERT TO authenticated
         WITH CHECK (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()))',
      t);
    EXECUTE format(
      'CREATE POLICY "owner_update" ON public.%I FOR UPDATE TO authenticated
         USING      (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()))
         WITH CHECK (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()))',
      t);
    EXECUTE format(
      'CREATE POLICY "owner_delete" ON public.%I FOR DELETE TO authenticated
         USING (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()))',
      t);

    -- admin
    EXECUTE format(
      'CREATE POLICY "admin_select" ON public.%I FOR SELECT TO authenticated USING (public.is_admin())',
      t);
    EXECUTE format(
      'CREATE POLICY "admin_insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())',
      t);
    EXECUTE format(
      'CREATE POLICY "admin_update" ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t);
    EXECUTE format(
      'CREATE POLICY "admin_delete" ON public.%I FOR DELETE TO authenticated USING (public.is_admin())',
      t);
  END LOOP;
END$$;

-- ---------------------------------------------------------------------------
-- researcher_sdg_goals — composite PK (researcher_id, sdg_goal_id), no surrogate.
-- Same pattern; written out separately for clarity.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "owner_select" ON public.researcher_sdg_goals;
DROP POLICY IF EXISTS "owner_insert" ON public.researcher_sdg_goals;
DROP POLICY IF EXISTS "owner_delete" ON public.researcher_sdg_goals;
DROP POLICY IF EXISTS "admin_select" ON public.researcher_sdg_goals;
DROP POLICY IF EXISTS "admin_insert" ON public.researcher_sdg_goals;
DROP POLICY IF EXISTS "admin_delete" ON public.researcher_sdg_goals;

CREATE POLICY "owner_select" ON public.researcher_sdg_goals FOR SELECT TO authenticated
  USING (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));
CREATE POLICY "owner_insert" ON public.researcher_sdg_goals FOR INSERT TO authenticated
  WITH CHECK (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));
CREATE POLICY "owner_delete" ON public.researcher_sdg_goals FOR DELETE TO authenticated
  USING (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));

CREATE POLICY "admin_select" ON public.researcher_sdg_goals FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin_insert" ON public.researcher_sdg_goals FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete" ON public.researcher_sdg_goals FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- researcher_publications — extra: a researcher's bibliometrics row may also
-- be co-authored by another researcher (linked_researcher_id), but writes are
-- still gated by parent ownership.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "owner_select" ON public.researcher_publications;
DROP POLICY IF EXISTS "owner_insert" ON public.researcher_publications;
DROP POLICY IF EXISTS "owner_update" ON public.researcher_publications;
DROP POLICY IF EXISTS "owner_delete" ON public.researcher_publications;
DROP POLICY IF EXISTS "admin_select" ON public.researcher_publications;
DROP POLICY IF EXISTS "admin_insert" ON public.researcher_publications;
DROP POLICY IF EXISTS "admin_update" ON public.researcher_publications;
DROP POLICY IF EXISTS "admin_delete" ON public.researcher_publications;

CREATE POLICY "owner_select" ON public.researcher_publications FOR SELECT TO authenticated
  USING (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));
CREATE POLICY "owner_insert" ON public.researcher_publications FOR INSERT TO authenticated
  WITH CHECK (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));
CREATE POLICY "owner_update" ON public.researcher_publications FOR UPDATE TO authenticated
  USING      (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()))
  WITH CHECK (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));
CREATE POLICY "owner_delete" ON public.researcher_publications FOR DELETE TO authenticated
  USING (researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid()));

CREATE POLICY "admin_select" ON public.researcher_publications FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin_insert" ON public.researcher_publications FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_update" ON public.researcher_publications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete" ON public.researcher_publications FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- researcher_publication_coauthors — gated by parent publication.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "owner_select" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "owner_insert" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "owner_update" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "owner_delete" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "admin_select" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "admin_insert" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "admin_update" ON public.researcher_publication_coauthors;
DROP POLICY IF EXISTS "admin_delete" ON public.researcher_publication_coauthors;

CREATE POLICY "owner_select" ON public.researcher_publication_coauthors FOR SELECT TO authenticated
  USING (publication_id IN (
    SELECT p.id FROM public.researcher_publications p
    JOIN public.researchers r ON r.id = p.researcher_id
    WHERE r.user_id = auth.uid()
  ));
CREATE POLICY "owner_insert" ON public.researcher_publication_coauthors FOR INSERT TO authenticated
  WITH CHECK (publication_id IN (
    SELECT p.id FROM public.researcher_publications p
    JOIN public.researchers r ON r.id = p.researcher_id
    WHERE r.user_id = auth.uid()
  ));
CREATE POLICY "owner_update" ON public.researcher_publication_coauthors FOR UPDATE TO authenticated
  USING (publication_id IN (
    SELECT p.id FROM public.researcher_publications p
    JOIN public.researchers r ON r.id = p.researcher_id
    WHERE r.user_id = auth.uid()
  ))
  WITH CHECK (publication_id IN (
    SELECT p.id FROM public.researcher_publications p
    JOIN public.researchers r ON r.id = p.researcher_id
    WHERE r.user_id = auth.uid()
  ));
CREATE POLICY "owner_delete" ON public.researcher_publication_coauthors FOR DELETE TO authenticated
  USING (publication_id IN (
    SELECT p.id FROM public.researcher_publications p
    JOIN public.researchers r ON r.id = p.researcher_id
    WHERE r.user_id = auth.uid()
  ));

CREATE POLICY "admin_select" ON public.researcher_publication_coauthors FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin_insert" ON public.researcher_publication_coauthors FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_update" ON public.researcher_publication_coauthors FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete" ON public.researcher_publication_coauthors FOR DELETE TO authenticated USING (public.is_admin());
