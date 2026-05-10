// Demo deployment — Algonest is a company, not a university, so it has no
// OpenAlex institution record. When showcasing the platform to a specific
// university, set NEXT_PUBLIC_OPENALEX_INSTITUTION_ID to that university's
// OpenAlex ID (look it up at https://api.openalex.org/institutions?search=...).
// Without an override the fetch returns null and the related cards on the
// landing page hide gracefully.
const OPENALEX_INSTITUTION_ID = process.env.NEXT_PUBLIC_OPENALEX_INSTITUTION_ID || '';
const CACHE_TTL = 3600_000; // 1 hour

interface InstitutionStats {
  name: string;
  worksCount: number;
  citedByCount: number;
  hIndex: number;
  i10Index: number;
  meanCitedness: number;
  countsByYear: Array<{ year: number; works: number; citations: number }>;
  fetchedAt: number;
}

let cached: InstitutionStats | null = null;

export async function getInstitutionStats(): Promise<InstitutionStats | null> {
  if (!OPENALEX_INSTITUTION_ID) return null;
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached;

  try {
    const res = await fetch(`https://api.openalex.org/institutions/${OPENALEX_INSTITUTION_ID}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return cached;

    const d = await res.json();
    const stats: InstitutionStats = {
      name: d.display_name ?? 'Algonest',
      worksCount: d.works_count ?? 0,
      citedByCount: d.cited_by_count ?? 0,
      hIndex: d.summary_stats?.h_index ?? 0,
      i10Index: d.summary_stats?.i10_index ?? 0,
      meanCitedness: d.summary_stats?.['2yr_mean_citedness'] ?? 0,
      countsByYear: (d.counts_by_year ?? [])
        .slice(0, 6)
        .map((y: { year: number; works_count: number; cited_by_count: number }) => ({
          year: y.year,
          works: y.works_count,
          citations: y.cited_by_count,
        })),
      fetchedAt: Date.now(),
    };
    cached = stats;
    return stats;
  } catch {
    return cached;
  }
}
