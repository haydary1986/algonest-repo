-- Extends get_researchers_page + get_researchers_count with two more filters
-- (workplace_type, academic_title) needed by the directory FilterSidebar
-- (Phase 6 task 52). Same FIX-04 + FIX-09 hardening as the original RPC:
-- SECURITY INVOKER, SET search_path, sort enum.

-- Drop the old signatures so the new ones aren't shadowed by overloads.
DROP FUNCTION IF EXISTS public.get_researchers_page(jsonb, integer, uuid, uuid, text, public.researcher_sort_key);
DROP FUNCTION IF EXISTS public.get_researchers_count(uuid, uuid, text);

-- ---------------------------------------------------------------------------
-- get_researchers_page (extended)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_researchers_page(
  p_cursor          jsonb DEFAULT NULL,
  p_size            integer DEFAULT 20,
  p_college         uuid DEFAULT NULL,
  p_department      uuid DEFAULT NULL,
  p_workplace_type  uuid DEFAULT NULL,
  p_academic_title  uuid DEFAULT NULL,
  p_search          text DEFAULT NULL,
  p_sort            public.researcher_sort_key DEFAULT 'name_asc'
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
  IF p_sort = 'name_asc' THEN
    WITH page AS (
      SELECT r.*
      FROM public.researchers_public r
      WHERE (p_college         IS NULL OR r.college_id         = p_college)
        AND (p_department      IS NULL OR r.department_id      = p_department)
        AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
        AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
        AND (p_search          IS NULL
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
      WHERE (p_college         IS NULL OR r.college_id         = p_college)
        AND (p_department      IS NULL OR r.department_id      = p_department)
        AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
        AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
        AND (p_search          IS NULL
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
      WHERE (p_college         IS NULL OR r.college_id         = p_college)
        AND (p_department      IS NULL OR r.department_id      = p_department)
        AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
        AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
        AND (p_search          IS NULL
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
      WHERE (p_college         IS NULL OR r.college_id         = p_college)
        AND (p_department      IS NULL OR r.department_id      = p_department)
        AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
        AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
        AND (p_search          IS NULL
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
      WHERE (p_college         IS NULL OR r.college_id         = p_college)
        AND (p_department      IS NULL OR r.department_id      = p_department)
        AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
        AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
        AND (p_search          IS NULL
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
      WHERE (p_college         IS NULL OR r.college_id         = p_college)
        AND (p_department      IS NULL OR r.department_id      = p_department)
        AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
        AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
        AND (p_search          IS NULL
             OR r.full_name_en ILIKE '%' || p_search || '%'
             OR r.full_name_ar ILIKE '%' || p_search || '%')
        AND (p_cursor IS NULL OR (r.updated_at, r.id)
                              < ((p_cursor->>'v')::timestamptz, (p_cursor->>'id')::uuid))
      ORDER BY r.updated_at DESC, r.id DESC
      LIMIT v_size + 1
    )
    SELECT jsonb_agg(row_to_json(page)::jsonb), count(*) INTO v_rows, v_count FROM page;
  END IF;

  IF v_count > v_size THEN
    v_next := CASE p_sort
      WHEN 'name_asc'        THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'full_name_en',                 'id', v_rows->(v_size - 1)->>'id')
      WHEN 'scopus_h_desc'   THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'scopus_h_index',               'id', v_rows->(v_size - 1)->>'id')
      WHEN 'wos_h_desc'      THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'wos_h_index',                  'id', v_rows->(v_size - 1)->>'id')
      WHEN 'pubs_desc'       THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'scopus_publications_count',    'id', v_rows->(v_size - 1)->>'id')
      WHEN 'citations_desc'  THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'scopus_citations_count',       'id', v_rows->(v_size - 1)->>'id')
      WHEN 'recent'          THEN jsonb_build_object('v', v_rows->(v_size - 1)->>'updated_at',                   'id', v_rows->(v_size - 1)->>'id')
    END;

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

REVOKE ALL ON FUNCTION public.get_researchers_page(jsonb, integer, uuid, uuid, uuid, uuid, text, public.researcher_sort_key) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_researchers_page(jsonb, integer, uuid, uuid, uuid, uuid, text, public.researcher_sort_key) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_researchers_count (extended)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_researchers_count(
  p_college         uuid DEFAULT NULL,
  p_department      uuid DEFAULT NULL,
  p_workplace_type  uuid DEFAULT NULL,
  p_academic_title  uuid DEFAULT NULL,
  p_search          text DEFAULT NULL
)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT count(*)::integer
  FROM public.researchers_public r
  WHERE (p_college         IS NULL OR r.college_id         = p_college)
    AND (p_department      IS NULL OR r.department_id      = p_department)
    AND (p_workplace_type  IS NULL OR r.workplace_type_id  = p_workplace_type)
    AND (p_academic_title  IS NULL OR r.academic_title_id  = p_academic_title)
    AND (p_search          IS NULL
         OR r.full_name_en ILIKE '%' || p_search || '%'
         OR r.full_name_ar ILIKE '%' || p_search || '%');
$$;

REVOKE ALL ON FUNCTION public.get_researchers_count(uuid, uuid, uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_researchers_count(uuid, uuid, uuid, uuid, text) TO anon, authenticated;
