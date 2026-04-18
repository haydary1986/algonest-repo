import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

const OPENALEX_INSTITUTION_ID = 'I2801460691';

interface Props {
  params: Promise<{ locale: string }>;
}

interface RetractedWork {
  title: string;
  publication_year: number | null;
  doi: string | null;
  cited_by_count: number;
  authorships: Array<{
    author: { id: string; display_name: string };
    institutions: Array<{ display_name: string }>;
  }>;
  primary_location?: { source?: { display_name: string } } | null;
}

export default async function RetractedPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === 'ar';

  const res = await fetch(
    `https://api.openalex.org/works?filter=institutions.id:${OPENALEX_INSTITUTION_ID},is_retracted:true&per_page=100&sort=cited_by_count:desc&select=title,publication_year,doi,cited_by_count,authorships,primary_location`,
    { next: { revalidate: 3600 } },
  );

  let works: RetractedWork[] = [];
  let total = 0;
  if (res.ok) {
    const d = await res.json();
    total = d.meta?.count ?? 0;
    works = (d.results ?? []) as RetractedWork[];
  }

  // Count retractions per author
  const authorCounts: Record<string, { name: string; count: number }> = {};
  for (const w of works) {
    for (const a of w.authorships ?? []) {
      const id = a.author?.id ?? '';
      const name = a.author?.display_name ?? '';
      if (!id || !name) continue;
      if (!authorCounts[id]) authorCounts[id] = { name, count: 0 };
      authorCounts[id]!.count++;
    }
  }

  const topAuthors = Object.values(authorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // Count by year
  const byYear: Record<number, number> = {};
  for (const w of works) {
    if (w.publication_year) byYear[w.publication_year] = (byYear[w.publication_year] ?? 0) + 1;
  }
  const yearEntries = Object.entries(byYear)
    .map(([y, c]) => ({ year: Number(y), count: c }))
    .sort((a, b) => b.year - a.year);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <AlertTriangle className="size-6 text-red-500" />
          {isAr ? 'البحوث المسحوبة (Retracted)' : 'Retracted Publications'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr
            ? 'هذه البحوث مخفية من الصفحات العامة. تظهر هنا فقط للأدمن.'
            : 'These publications are hidden from public pages. Visible to admins only.'}
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-600">{total}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'بحث مسحوب' : 'Retracted'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{topAuthors.length}</p>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'باحث متأثر' : 'Authors involved'}
            </p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold">{works.reduce((s, w) => s + w.cited_by_count, 0)}</p>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'اقتباسات متأثرة' : 'Affected citations'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top authors with retractions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="size-4 text-red-500" />
              {isAr ? 'الباحثون الأكثر سحباً' : 'Authors with Most Retractions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topAuthors.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2"
              >
                <span className="text-xs font-medium">{a.name}</span>
                <Badge variant="destructive" className="text-[10px]">
                  {a.count}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* By year */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{isAr ? 'حسب السنة' : 'By Year'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {yearEntries.map((y) => (
              <div key={y.year} className="flex items-center justify-between text-xs">
                <span className="tabular-nums">{y.year}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 rounded-full bg-red-400"
                    style={{ width: `${Math.max(y.count * 8, 8)}px` }}
                  />
                  <span className="text-muted-foreground tabular-nums w-6 text-end">{y.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Full list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{isAr ? 'القائمة الكاملة' : 'Full List'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-start font-medium">{isAr ? 'العنوان' : 'Title'}</th>
                  <th className="px-4 py-2 text-start font-medium w-16">
                    {isAr ? 'السنة' : 'Year'}
                  </th>
                  <th className="px-4 py-2 text-start font-medium w-20">
                    {isAr ? 'اقتباسات' : 'Cit.'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {works.map((w, i) => {
                  const doiUrl = w.doi
                    ? `https://doi.org/${w.doi.replace('https://doi.org/', '')}`
                    : null;
                  const authors = (w.authorships ?? [])
                    .slice(0, 2)
                    .map((a) => a.author?.display_name)
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={i} className="hover:bg-red-50/50 dark:hover:bg-red-950/10">
                      <td className="px-4 py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium leading-snug">{w.title}</p>
                          <p className="text-[10px] text-muted-foreground italic">
                            {authors}
                            {(w.authorships?.length ?? 0) > 2 ? ' et al.' : ''}
                          </p>
                          {doiUrl && (
                            <a
                              href={doiUrl}
                              target="_blank"
                              rel="noopener"
                              className="text-primary inline-flex items-center gap-0.5 text-[9px] hover:underline"
                            >
                              <ExternalLink className="size-2.5" /> DOI
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs tabular-nums text-muted-foreground">
                        {w.publication_year ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-xs tabular-nums text-muted-foreground">
                        {w.cited_by_count}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
