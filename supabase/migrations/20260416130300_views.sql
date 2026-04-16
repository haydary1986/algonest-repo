-- Tasks 27, 28, 31 + FIX-01, FIX-02 (P0)
--
-- Critical security note: every view here is created
--   WITH (security_invoker = true, security_barrier = true)
-- so it executes under the *caller's* RLS context (Postgres 15+). Without
-- this, a view inherits its owner's privileges and silently bypasses RLS on
-- the underlying table — the original task spec had this exact bug.
--
-- Visibility rule (FIX-01):
--   force_show         → ALWAYS visible
--   force_hide         → NEVER visible
--   NULL + is_public=t → visible
--   NULL + is_public=f → hidden

-- ---------------------------------------------------------------------------
-- researchers_public — anon-readable projection of researchers.
-- Strips employee_id, user_id, birthdate, private_*, contact details unless
-- show_public_contact = true.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.researchers_public CASCADE;

CREATE VIEW public.researchers_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT
  r.id,
  r.username,
  r.full_name_en,
  r.full_name_ar,
  r.bio_en,
  r.bio_ar,
  r.profile_image,
  r.degree_en,
  r.degree_ar,
  r.field_of_interest_en,
  r.field_of_interest_ar,
  r.website,
  r.college_id,
  r.department_id,
  r.workplace_type_id,
  r.academic_title_id,
  r.university_center_id,
  r.scopus_h_index,
  r.scopus_publications_count,
  r.scopus_citations_count,
  r.wos_h_index,
  r.wos_publications_count,
  r.wos_citations_count,
  r.openalex_h_index,
  r.openalex_publications_count,
  r.openalex_citations_count,
  CASE WHEN r.show_public_contact THEN r.public_email          END AS public_email,
  CASE WHEN r.show_public_contact THEN r.public_phone          END AS public_phone,
  CASE WHEN r.show_public_contact THEN r.public_office_location END AS public_office_location,
  CASE WHEN r.show_public_contact THEN r.public_office_hours    END AS public_office_hours,
  CASE WHEN r.show_public_contact THEN r.public_mailing_address END AS public_mailing_address,
  r.updated_at
FROM public.researchers r
WHERE r.admin_visibility_override = 'force_show'
   OR (
     r.is_public = true
     AND r.admin_visibility_override IS DISTINCT FROM 'force_hide'
   );

GRANT SELECT ON public.researchers_public TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- researchers_owner — the signed-in user's own row, full columns.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.researchers_owner CASCADE;

CREATE VIEW public.researchers_owner
WITH (security_invoker = true, security_barrier = true) AS
SELECT *
FROM public.researchers
WHERE user_id = auth.uid();

GRANT SELECT ON public.researchers_owner TO authenticated;

-- ---------------------------------------------------------------------------
-- Child-table public views — same security_invoker/security_barrier pattern.
-- Each restricts to rows whose researcher is in the public set.
-- ---------------------------------------------------------------------------

-- Helper macro-style block: same shape, repeated per child table.
DROP VIEW IF EXISTS public.researcher_publications_public           CASCADE;
DROP VIEW IF EXISTS public.researcher_publication_coauthors_public  CASCADE;
DROP VIEW IF EXISTS public.researcher_social_profiles_public        CASCADE;
DROP VIEW IF EXISTS public.researcher_skills_public                 CASCADE;
DROP VIEW IF EXISTS public.researcher_languages_public              CASCADE;
DROP VIEW IF EXISTS public.researcher_education_public              CASCADE;
DROP VIEW IF EXISTS public.researcher_work_experience_public        CASCADE;
DROP VIEW IF EXISTS public.researcher_certifications_public         CASCADE;
DROP VIEW IF EXISTS public.researcher_awards_public                 CASCADE;
DROP VIEW IF EXISTS public.researcher_projects_public               CASCADE;
DROP VIEW IF EXISTS public.researcher_sdg_goals_public              CASCADE;

CREATE VIEW public.researcher_publications_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT p.* FROM public.researcher_publications p
WHERE p.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_publication_coauthors_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT c.* FROM public.researcher_publication_coauthors c
WHERE c.publication_id IN (SELECT id FROM public.researcher_publications_public);

CREATE VIEW public.researcher_social_profiles_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT s.* FROM public.researcher_social_profiles s
WHERE s.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_skills_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT s.* FROM public.researcher_skills s
WHERE s.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_languages_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT l.* FROM public.researcher_languages l
WHERE l.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_education_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT e.* FROM public.researcher_education e
WHERE e.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_work_experience_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT w.* FROM public.researcher_work_experience w
WHERE w.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_certifications_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT c.* FROM public.researcher_certifications c
WHERE c.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_awards_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT a.* FROM public.researcher_awards a
WHERE a.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_projects_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT p.* FROM public.researcher_projects p
WHERE p.researcher_id IN (SELECT id FROM public.researchers_public);

CREATE VIEW public.researcher_sdg_goals_public
WITH (security_invoker = true, security_barrier = true) AS
SELECT g.* FROM public.researcher_sdg_goals g
WHERE g.researcher_id IN (SELECT id FROM public.researchers_public);

GRANT SELECT ON
  public.researcher_publications_public,
  public.researcher_publication_coauthors_public,
  public.researcher_social_profiles_public,
  public.researcher_skills_public,
  public.researcher_languages_public,
  public.researcher_education_public,
  public.researcher_work_experience_public,
  public.researcher_certifications_public,
  public.researcher_awards_public,
  public.researcher_projects_public,
  public.researcher_sdg_goals_public
TO anon, authenticated;
