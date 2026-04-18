const OPENALEX_INSTITUTION_ID = 'I2801460691';

export interface TopAuthor {
  name: string;
  works: number;
  citations: number;
  hIndex: number;
}

export interface RecentWork {
  title: string;
  year: number | null;
  doi: string | null;
  citations: number;
  journal: string | null;
  authors: string[];
  isOa: boolean;
}

export interface TopicEntry {
  name: string;
  count: number;
}

export interface InstitutionAnalytics {
  totalWorks: number;
  totalCitations: number;
  hIndex: number;
  totalAuthors: number;
  byYear: Array<{ year: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  openAccessCount: number;
  closedAccessCount: number;
  topAuthors: TopAuthor[];
  recentWorks: RecentWork[];
  topTopics: TopicEntry[];
}

export async function getInstitutionAnalytics(): Promise<InstitutionAnalytics | null> {
  try {
    const opts = { next: { revalidate: 3600 } };
    const base = `https://api.openalex.org`;
    const instFilter = `institutions.id:${OPENALEX_INSTITUTION_ID},is_retracted:false`;

    const [instRes, yearRes, typeRes, oaRes, authorRes, topAuthorsRes, recentRes, topicsRes] =
      await Promise.all([
        fetch(`${base}/institutions/${OPENALEX_INSTITUTION_ID}`, opts),
        fetch(`${base}/works?filter=${instFilter}&group_by=publication_year`, opts),
        fetch(`${base}/works?filter=${instFilter}&group_by=type`, opts),
        fetch(`${base}/works?filter=${instFilter}&group_by=open_access.is_oa`, opts),
        fetch(
          `${base}/authors?filter=last_known_institutions.id:${OPENALEX_INSTITUTION_ID}&per_page=1`,
          opts,
        ),
        fetch(
          `${base}/authors?filter=last_known_institutions.id:${OPENALEX_INSTITUTION_ID}&per_page=10&sort=cited_by_count:desc&select=display_name,works_count,cited_by_count,summary_stats`,
          opts,
        ),
        fetch(
          `${base}/works?filter=${instFilter}&per_page=10&sort=publication_date:desc&select=title,publication_year,doi,cited_by_count,authorships,primary_location,open_access`,
          opts,
        ),
        fetch(`${base}/works?filter=${instFilter}&group_by=topics.id`, opts),
      ]);

    if (!instRes.ok) return null;

    const inst = await instRes.json();
    const yearData = await yearRes.json();
    const typeData = await typeRes.json();
    const oaData = await oaRes.json();
    const authorData = await authorRes.json();

    const byYear = ((yearData.group_by ?? []) as Array<{ key: string; count: number }>)
      .filter((g) => Number(g.key) >= 2015)
      .sort((a, b) => Number(a.key) - Number(b.key))
      .map((g) => ({ year: g.key, count: g.count }));

    const byType = ((typeData.group_by ?? []) as Array<{ key_display_name: string; count: number }>)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((g) => ({ type: g.key_display_name, count: g.count }));

    const oaGroups = (oaData.group_by ?? []) as Array<{ key: string; count: number }>;
    const openAccessCount = oaGroups.find((g) => g.key === 'true')?.count ?? 0;
    const closedAccessCount = oaGroups.find((g) => g.key === 'false')?.count ?? 0;

    // Top authors
    const topAuthorsData = topAuthorsRes.ok ? await topAuthorsRes.json() : { results: [] };
    const topAuthors: TopAuthor[] = (
      (topAuthorsData.results ?? []) as Array<{
        display_name: string;
        works_count: number;
        cited_by_count: number;
        summary_stats?: { h_index?: number };
      }>
    ).map((a) => ({
      name: a.display_name,
      works: a.works_count,
      citations: a.cited_by_count,
      hIndex: a.summary_stats?.h_index ?? 0,
    }));

    // Recent works
    const recentData = recentRes.ok ? await recentRes.json() : { results: [] };
    const recentWorks: RecentWork[] = (
      (recentData.results ?? []) as Array<{
        title?: string;
        publication_year?: number;
        doi?: string;
        cited_by_count?: number;
        authorships?: Array<{ author?: { display_name?: string } }>;
        primary_location?: { source?: { display_name?: string } };
        open_access?: { is_oa?: boolean };
      }>
    ).map((w) => ({
      title: w.title ?? '',
      year: w.publication_year ?? null,
      doi: w.doi ?? null,
      citations: w.cited_by_count ?? 0,
      journal: w.primary_location?.source?.display_name ?? null,
      authors: (w.authorships ?? [])
        .slice(0, 3)
        .map((a) => a.author?.display_name ?? '')
        .filter(Boolean),
      isOa: w.open_access?.is_oa ?? false,
    }));

    // Top topics
    const topicsData = topicsRes.ok ? await topicsRes.json() : { group_by: [] };
    const topTopics: TopicEntry[] = (
      (topicsData.group_by ?? []) as Array<{ key_display_name: string; count: number }>
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map((t) => ({ name: t.key_display_name, count: t.count }));

    return {
      totalWorks: inst.works_count ?? 0,
      totalCitations: inst.cited_by_count ?? 0,
      hIndex: inst.summary_stats?.h_index ?? 0,
      totalAuthors: authorData.meta?.count ?? 0,
      byYear,
      byType,
      openAccessCount,
      closedAccessCount,
      topAuthors,
      recentWorks,
      topTopics,
    };
  } catch {
    return null;
  }
}
