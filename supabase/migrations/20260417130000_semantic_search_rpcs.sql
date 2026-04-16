-- Tasks 135, 137 — Semantic search + similar researchers RPCs.
--
-- Both depend on bio_embedding vector(768) populated by the Python embedding
-- pipeline (Phase 15 task 145). Until then, these RPCs return empty results
-- (no embedding → excluded by the WHERE clause).
--
-- Uses cosine distance (<=> operator) for multilingual-e5-base normalised vectors.

-- 135 — semantic_search: find researchers by query embedding
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_embedding vector(768),
  match_limit int DEFAULT 10,
  similarity_threshold float DEFAULT 0.3
)
RETURNS TABLE (
  id uuid,
  username text,
  full_name_en text,
  full_name_ar text,
  profile_image text,
  bio_en text,
  bio_ar text,
  college_id uuid,
  department_id uuid,
  academic_title_id uuid,
  scopus_h_index integer,
  scopus_publications_count integer,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
    SELECT
      r.id, r.username, r.full_name_en, r.full_name_ar,
      r.profile_image, r.bio_en, r.bio_ar,
      r.college_id, r.department_id, r.academic_title_id,
      r.scopus_h_index, r.scopus_publications_count,
      1.0 - (r.bio_embedding <=> query_embedding)::float AS similarity
    FROM public.researchers r
    WHERE r.bio_embedding IS NOT NULL
      AND r.is_public = true
      AND r.admin_visibility_override IS DISTINCT FROM 'force_hide'
      AND 1.0 - (r.bio_embedding <=> query_embedding) > similarity_threshold
    ORDER BY r.bio_embedding <=> query_embedding
    LIMIT match_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.semantic_search(vector(768), int, float) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.semantic_search(vector(768), int, float) TO anon, authenticated;

-- 137 — find_similar_researchers: given a researcher id, find the most similar
CREATE OR REPLACE FUNCTION public.find_similar_researchers(
  p_researcher_id uuid,
  match_limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  username text,
  full_name_en text,
  full_name_ar text,
  profile_image text,
  college_id uuid,
  academic_title_id uuid,
  scopus_h_index integer,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_embedding vector(768);
BEGIN
  SELECT r.bio_embedding INTO v_embedding
    FROM public.researchers r
   WHERE r.id = p_researcher_id;

  IF v_embedding IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      r.id, r.username, r.full_name_en, r.full_name_ar,
      r.profile_image, r.college_id, r.academic_title_id,
      r.scopus_h_index,
      1.0 - (r.bio_embedding <=> v_embedding)::float AS similarity
    FROM public.researchers r
    WHERE r.bio_embedding IS NOT NULL
      AND r.id <> p_researcher_id
      AND r.is_public = true
      AND r.admin_visibility_override IS DISTINCT FROM 'force_hide'
    ORDER BY r.bio_embedding <=> v_embedding
    LIMIT match_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.find_similar_researchers(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_similar_researchers(uuid, int) TO anon, authenticated;

-- Co-authorship graph data (Task 138)
CREATE OR REPLACE FUNCTION public.get_coauthorship_graph(
  p_limit int DEFAULT 200
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH edges AS (
    SELECT DISTINCT
      c.linked_researcher_id AS source_id,
      p.researcher_id AS target_id
    FROM public.researcher_publication_coauthors c
    JOIN public.researcher_publications_public p ON p.id = c.publication_id
    WHERE c.linked_researcher_id IS NOT NULL
      AND c.linked_researcher_id <> p.researcher_id
    LIMIT p_limit
  ),
  node_ids AS (
    SELECT source_id AS id FROM edges
    UNION
    SELECT target_id AS id FROM edges
  ),
  nodes AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', r.id,
      'username', r.username,
      'name', r.full_name_en,
      'college_id', r.college_id,
      'h_index', r.scopus_h_index
    )) AS arr
    FROM public.researchers_public r
    WHERE r.id IN (SELECT id FROM node_ids)
  ),
  links AS (
    SELECT jsonb_agg(jsonb_build_object(
      'source', source_id,
      'target', target_id
    )) AS arr
    FROM edges
  )
  SELECT jsonb_build_object(
    'nodes', coalesce((SELECT arr FROM nodes), '[]'::jsonb),
    'links', coalesce((SELECT arr FROM links), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_coauthorship_graph(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_coauthorship_graph(int) TO anon, authenticated;
