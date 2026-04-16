-- Tasks 33, 34 + FIX-04 (P0) + FIX-09 (P1)
--
-- Two RPCs that the public app consumes:
--   * get_researchers_page  — keyset pagination with sort enum (no SQL inj)
--   * get_researchers_count — cheap total, can be cached for 5 min
--   * get_homepage_stats    — counts for the landing page (task 46)
--   * get_analytics_summary — KPI bundle for /analytics (task 34)
--
-- All use SECURITY INVOKER so RLS still applies to the caller — anon hitting
-- these only sees what `researchers_public` exposes.

-- ---------------------------------------------------------------------------
-- Sort key enum (FIX-09): closes the SQL-injection hole in the original spec.
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.researcher_sort_key AS ENUM (
    'name_asc', 'scopus_h_desc', 'wos_h_desc',
    'pubs_desc', 'citations_desc', 'recent'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- get_researchers_page — keyset (cursor) pagination.
-- Cursor shape: { "v": <last sort value, jsonb>, "id": "<last uuid>" }
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_researchers_page(jsonb, integer, uuid, uuid, text, public.researcher_sort_key);

CREATE OR REPLACE FUNCTION public.get_researchers_page(
  p_cursor      jsonb DEFAULT NULL,
  p_size        integer DEFAULT 20,
  p_college     uuid DEFAULT NULL,
  p_department  uuid DEFAULT NULL,
  p_search      text DEFAULT NULL,
  p_sort        public.researcher_sort_key DEFAULT 'name_asc'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_size integer := least(greatest(coalesce(p_size, 20), 1), 100);
  v_rows jsonb;
  v_count integer;
  v_next  jsonb;
BEGIN
  -- Each branch builds the same shape: rows (limited to v_size + 1) so we
  -- can detect whether a next page exists without a second query.
  IF p_sort = 'name_asc' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college    IS NULL OR r.college_id    = p_college)
        AND (p_department IS NULL OR r.department_id = p_department)
        AND (p_search     IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (r.full_name_en, r.id)
                              > (p_cursor->>'v', (p_cursor->>'id')::uuid))
      ORDER BY r.full_name_en, r.id
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;

  ELSIF p_sort = 'scopus_h_desc' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college    IS NULL OR r.college_id    = p_college)
        AND (p_department IS NULL OR r.department_id = p_department)
        AND (p_search     IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (coalesce(r.scopus_h_index, 0), r.id)
                              < ((p_cursor->>'v')::integer, (p_cursor->>'id')::uuid))
      ORDER BY r.scopus_h_index DESC NULLS LAST, r.id DESC
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;

  ELSIF p_sort = 'wos_h_desc' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college    IS NULL OR r.college_id    = p_college)
        AND (p_department IS NULL OR r.department_id = p_department)
        AND (p_search     IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (coalesce(r.wos_h_index, 0), r.id)
                              < ((p_cursor->>'v')::integer, (p_cursor->>'id')::uuid))
      ORDER BY r.wos_h_index DESC NULLS LAST, r.id DESC
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;

  ELSIF p_sort = 'pubs_desc' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college    IS NULL OR r.college_id    = p_college)
        AND (p_department IS NULL OR r.department_id = p_department)
        AND (p_search     IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (coalesce(r.scopus_publications_count, 0), r.id)
                              < ((p_cursor->>'v')::integer, (p_cursor->>'id')::uuid))
      ORDER BY r.scopus_publications_count DESC NULLS LAST, r.id DESC
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;

  ELSIF p_sort = 'citations_desc' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college    IS NULL OR r.college_id    = p_college)
        AND (p_department IS NULL OR r.department_id = p_department)
        AND (p_search     IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (coalesce(r.scopus_citations_count, 0), r.id)
                              < ((p_cursor->>'v')::integer, (p_cursor->>'id')::uuid))
      ORDER BY r.scopus_citations_count DESC NULLS LAST, r.id DESC
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;

  ELSIF p_sort = 'recent' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college    IS NULL OR r.college_id    = p_college)
        AND (p_department IS NULL OR r.department_id = p_department)
        AND (p_search     IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (r.updated_at, r.id)
                              < ((p_cursor->>'v')::timestamptz, (p_cursor->>'id')::uuid))
      ORDER BY r.updated_at DESC, r.id DESC
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;
  END IF;

  -- Build next cursor from the last item if we got more than v_size rows.
  IF v_count > v_size THEN
    v_next := CASE p_sort
      WHEN 'name_asc'        THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'full_name_en',                 'id', v_rows->(v_size - 1)->>'id')
      WHEN 'scopus_h_desc'   THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'scopus_h_index',               'id', v_rows->(v_size - 1)->>'id')
      WHEN 'wos_h_desc'      THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'wos_h_index',                  'id', v_rows->(v_size - 1)->>'id')
      WHEN 'pubs_desc'       THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'scopus_publications_count',    'id', v_rows->(v_size - 1)->>'id')
      WHEN 'citations_desc'  THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'scopus_citations_count',       'id', v_rows->(v_size - 1)->>'id')
      WHEN 'recent'          THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'updated_at',                   'id', v_rows->(v_size - 1)->>'id')
    END;
    -- Trim the +1 row off
    SELECT jsonb_agg(elem) INTO v_rows
    FROM jsonb_array_elements(v_rows) WITH ORDINALITY t(elem, ord)
    WHERE ord <= v_size;
  ELSE
    v_next := NULL;
  END IF;

  RETURN jsonb_build_object(
    'data',        coalesce(v_rows, '[]'::jsonb),
    'next_cursor', v_next,
    'page_size',   v_size,
    'sort',        p_sort::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_researchers_page(jsonb, integer, uuid, uuid, text, public.researcher_sort_key) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_researchers_page(jsonb, integer, uuid, uuid, text, public.researcher_sort_key) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_researchers_count — separate so the UI can cache it (FIX-09 note).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_researchers_count(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.get_researchers_count(
  p_college    uuid DEFAULT NULL,
  p_department uuid DEFAULT NULL,
  p_search     text DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::integer
  FROM public.researchers_public r
  WHERE (p_college    IS NULL OR r.college_id    = p_college)
    AND (p_department IS NULL OR r.department_id = p_department)
    AND (p_search     IS NULL
         OR r.full_name_en ILIKE '%' || p_search || '%'
         OR r.full_name_ar ILIKE '%' || p_search || '%');
$$;

REVOKE ALL ON FUNCTION public.get_researchers_count(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_researchers_count(uuid, uuid, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_homepage_stats — used by the landing page Stats section (task 46).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_homepage_stats();

CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'researchers',  (SELECT count(*) FROM public.researchers_public),
    'colleges',     (SELECT count(DISTINCT college_id) FROM public.researchers_public WHERE college_id IS NOT NULL),
    'departments',  (SELECT count(DISTINCT department_id) FROM public.researchers_public WHERE department_id IS NOT NULL),
    'publications', (SELECT count(*) FROM public.researcher_publications_public)
  );
$$;

REVOKE ALL ON FUNCTION public.get_homepage_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_homepage_stats() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Task 34 — get_analytics_summary
-- KPIs: total_researchers, total_publications, total_citations, avg_h_index,
-- by_year, by_source, by_type, by_college, sdg_alignment.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_analytics_summary(integer, integer, uuid);

CREATE OR REPLACE FUNCTION public.get_analytics_summary(
  p_year_from integer DEFAULT NULL,
  p_year_to   integer DEFAULT NULL,
  p_college   uuid    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
  v_min_year int := coalesce(p_year_from, 1900);
  v_max_year int := coalesce(p_year_to,   2100);
BEGIN
  WITH r AS (
    SELECT * FROM public.researchers_public
    WHERE (p_college IS NULL OR college_id = p_college)
  ),
  p AS (
    SELECT pp.*
    FROM public.researcher_publications_public pp
    JOIN r ON r.id = pp.researcher_id
    WHERE pp.publication_year BETWEEN v_min_year AND v_max_year
  )
  SELECT jsonb_build_object(
    'kpis', jsonb_build_object(
      'total_researchers',  (SELECT count(*) FROM r),
      'total_publications', (SELECT count(*) FROM p),
      'total_citations',    (SELECT coalesce(sum(coalesce(scopus_citations,0) + coalesce(wos_citations,0)),0) FROM p),
      'avg_h_index',        (SELECT coalesce(round(avg(coalesce(scopus_h_index, wos_h_index, 0))::numeric, 2), 0) FROM r)
    ),
    'by_year',  (SELECT coalesce(jsonb_object_agg(year, cnt), '{}'::jsonb)
                 FROM (SELECT publication_year AS year, count(*) AS cnt FROM p GROUP BY publication_year ORDER BY publication_year) t),
    'by_source',(SELECT coalesce(jsonb_object_agg(name, cnt), '{}'::jsonb)
                 FROM (
                   SELECT s.name, count(*) AS cnt
                   FROM p
                   LEFT JOIN public.publication_sources s ON s.id = p.source_id
                   GROUP BY s.name
                 ) t),
    'by_type',  (SELECT coalesce(jsonb_object_agg(name, cnt), '{}'::jsonb)
                 FROM (
                   SELECT t.name_en AS name, count(*) AS cnt
                   FROM p
                   LEFT JOIN public.publication_types t ON t.id = p.publication_type_id
                   GROUP BY t.name_en
                 ) tt),
    'by_college', (SELECT coalesce(jsonb_object_agg(name, cnt), '{}'::jsonb)
                   FROM (
                     SELECT c.name_en AS name, count(*) AS cnt
                     FROM r
                     LEFT JOIN public.colleges c ON c.id = r.college_id
                     GROUP BY c.name_en
                   ) cc),
    'sdg_alignment', (SELECT coalesce(jsonb_object_agg(num, cnt), '{}'::jsonb)
                      FROM (
                        SELECT g.number AS num, count(DISTINCT s.researcher_id) AS cnt
                        FROM public.researcher_sdg_goals s
                        JOIN public.un_sdg_goals g ON g.id = s.sdg_goal_id
                        WHERE s.researcher_id IN (SELECT id FROM r)
                        GROUP BY g.number
                      ) ss)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_analytics_summary(integer, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(integer, integer, uuid) TO anon, authenticated;
