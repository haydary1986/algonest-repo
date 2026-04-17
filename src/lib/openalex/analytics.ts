const OPENALEX_INSTITUTION_ID = 'I2801460691';

export interface InstitutionAnalytics {
  totalWorks: number;
  totalCitations: number;
  hIndex: number;
  totalAuthors: number;
  byYear: Array<{ year: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  openAccessCount: number;
  closedAccessCount: number;
}

export async function getInstitutionAnalytics(): Promise<InstitutionAnalytics | null> {
  try {
    const [instRes, yearRes, typeRes, oaRes, authorRes] = await Promise.all([
      fetch(`https://api.openalex.org/institutions/${OPENALEX_INSTITUTION_ID}`, {
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://api.openalex.org/works?filter=institutions.id:${OPENALEX_INSTITUTION_ID}&group_by=publication_year`,
        { next: { revalidate: 3600 } },
      ),
      fetch(
        `https://api.openalex.org/works?filter=institutions.id:${OPENALEX_INSTITUTION_ID}&group_by=type`,
        { next: { revalidate: 3600 } },
      ),
      fetch(
        `https://api.openalex.org/works?filter=institutions.id:${OPENALEX_INSTITUTION_ID}&group_by=open_access.is_oa`,
        { next: { revalidate: 3600 } },
      ),
      fetch(
        `https://api.openalex.org/authors?filter=last_known_institutions.id:${OPENALEX_INSTITUTION_ID}&per_page=1`,
        { next: { revalidate: 3600 } },
      ),
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

    return {
      totalWorks: inst.works_count ?? 0,
      totalCitations: inst.cited_by_count ?? 0,
      hIndex: inst.summary_stats?.h_index ?? 0,
      totalAuthors: authorData.meta?.count ?? 0,
      byYear,
      byType,
      openAccessCount,
      closedAccessCount,
    };
  } catch {
    return null;
  }
}
