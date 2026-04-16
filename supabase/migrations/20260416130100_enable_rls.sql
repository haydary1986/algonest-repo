-- Task 25 — Enable RLS on every public table
--
-- After this migration, EVERY table in the `public` schema rejects all access
-- by default. Subsequent migrations grant back exactly what each role needs.
--
-- Verify with:
--   SELECT relname, relrowsecurity, relforcerowsecurity
--   FROM pg_class
--   WHERE relnamespace = 'public'::regnamespace AND relkind = 'r';

ALTER TABLE public.genders                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_titles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workplace_types                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_centers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.un_sdg_goals                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_types                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publication_sources              ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.researchers                      ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.researcher_social_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_languages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_education             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_work_experience       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_certifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_awards                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_sdg_goals             ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.researcher_publications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_publication_coauthors ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins                           ENABLE ROW LEVEL SECURITY;
