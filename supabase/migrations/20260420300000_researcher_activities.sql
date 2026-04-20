-- Activities: editorial boards, conference participation, and professional
-- memberships. Previously the profile had an "Activities" tab that only
-- rendered an empty state because no schema backed it.
--
-- One table with a `type` enum keeps the edit UI and the RLS policies
-- uniform; we only need per-type fields for display, which we handle in
-- the app layer. Fields are intentionally generic (title, role, org,
-- years, url) so researchers can describe anything that fits.

CREATE TABLE IF NOT EXISTS public.researcher_activities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id  uuid NOT NULL REFERENCES public.researchers(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('editorial_board', 'conference', 'membership')),
  title_en       text NOT NULL,
  title_ar       text,
  role_en        text,
  role_ar        text,
  organization_en text,
  organization_ar text,
  location       text,
  start_year     smallint,
  end_year       smallint,
  url            text,
  description_en text,
  description_ar text,
  display_order  integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_researcher_activities_researcher_id
  ON public.researcher_activities(researcher_id);

CREATE INDEX IF NOT EXISTS idx_researcher_activities_type
  ON public.researcher_activities(researcher_id, type);

DROP TRIGGER IF EXISTS trg_researcher_activities_set_updated_at ON public.researcher_activities;
CREATE TRIGGER trg_researcher_activities_set_updated_at
  BEFORE UPDATE ON public.researcher_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: same pattern as the other child tables.
ALTER TABLE public.researcher_activities ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.researcher_activities FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.researcher_activities TO authenticated;

DROP POLICY IF EXISTS activities_owner_select ON public.researcher_activities;
CREATE POLICY activities_owner_select ON public.researcher_activities
  FOR SELECT TO authenticated
  USING (
    researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS activities_owner_insert ON public.researcher_activities;
CREATE POLICY activities_owner_insert ON public.researcher_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS activities_owner_update ON public.researcher_activities;
CREATE POLICY activities_owner_update ON public.researcher_activities
  FOR UPDATE TO authenticated
  USING (
    researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS activities_owner_delete ON public.researcher_activities;
CREATE POLICY activities_owner_delete ON public.researcher_activities
  FOR DELETE TO authenticated
  USING (
    researcher_id IN (SELECT id FROM public.researchers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS activities_admin_all ON public.researcher_activities;
CREATE POLICY activities_admin_all ON public.researcher_activities
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public view — only activities whose researcher is in researchers_public.
DROP VIEW IF EXISTS public.researcher_activities_public CASCADE;
CREATE VIEW public.researcher_activities_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT a.* FROM public.researcher_activities a
WHERE a.researcher_id IN (SELECT id FROM public.researchers_public);

GRANT SELECT ON public.researcher_activities_public TO anon, authenticated;
