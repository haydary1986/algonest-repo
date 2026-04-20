import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildLanguageAlternates, canonicalForLocale } from '@/lib/seo/site';
import { Breadcrumbs, type BreadcrumbItem } from '@/components/seo/breadcrumbs';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Quote, ExternalLink, Building2, TrendingUp } from 'lucide-react';

export const revalidate = 3600;

interface DepartmentPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

interface ResearcherRow {
  id: string;
  username: string;
  full_name_en: string;
  full_name_ar: string;
  profile_image: string | null;
  scopus_h_index: number | null;
  scopus_publications_count: number | null;
  scopus_citations_count: number | null;
  field_of_interest_en: string | null;
  field_of_interest_ar: string | null;
}

interface PublicationRow {
  id: string;
  title: string;
  publication_year: number | null;
  journal_name: string | null;
  doi: string | null;
  scopus_citations: number | null;
  scholar_citations: number | null;
  is_open_access: boolean | null;
}

interface SiblingDept {
  slug: string;
  name_en: string;
  name_ar: string;
}

async function fetchDepartmentWithCollege(slug: string) {
  const supabase = await createClient();
  const { data: dept } = await supabase
    .from('departments')
    .select('id, slug, name_en, name_ar, college_id')
    .eq('slug', slug)
    .maybeSingle();
  if (!dept) return null;

  const { data: college } = await supabase
    .from('colleges')
    .select('id, slug, name_en, name_ar')
    .eq('id', dept.college_id)
    .maybeSingle();

  return { dept, college };
}

async function fetchResearchers(departmentId: string): Promise<ResearcherRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('researchers_public')
    .select(
      'id, username, full_name_en, full_name_ar, profile_image, scopus_h_index, scopus_publications_count, scopus_citations_count, field_of_interest_en, field_of_interest_ar',
    )
    .eq('department_id', departmentId)
    .order('scopus_h_index', { ascending: false, nullsFirst: false })
    .limit(100);
  return (data ?? []) as ResearcherRow[];
}

async function fetchTopPublications(researcherIds: string[]): Promise<PublicationRow[]> {
  if (researcherIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('researcher_publications_public')
    .select(
      'id, title, publication_year, journal_name, doi, scopus_citations, scholar_citations, is_open_access',
    )
    .in('researcher_id', researcherIds)
    .order('scopus_citations', { ascending: false, nullsFirst: false })
    .limit(8);
  return (data ?? []) as PublicationRow[];
}

async function fetchSiblingDepartments(
  collegeId: string,
  currentDeptId: string,
): Promise<SiblingDept[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('departments')
    .select('id, slug, name_en, name_ar')
    .eq('college_id', collegeId)
    .neq('id', currentDeptId)
    .order('name_en', { ascending: true })
    .limit(20);
  return (data ?? []) as SiblingDept[];
}

function computeKpis(researchers: ResearcherRow[]) {
  let publications = 0;
  let citations = 0;
  let hSum = 0;
  let hCount = 0;
  for (const r of researchers) {
    publications += r.scopus_publications_count ?? 0;
    citations += r.scopus_citations_count ?? 0;
    if (r.scopus_h_index != null) {
      hSum += r.scopus_h_index;
      hCount += 1;
    }
  }
  return {
    researcherCount: researchers.length,
    publications,
    citations,
    avgHIndex: hCount > 0 ? Math.round((hSum / hCount) * 10) / 10 : 0,
  };
}

export async function generateMetadata({ params }: DepartmentPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const result = await fetchDepartmentWithCollege(slug);
  if (!result) return { title: '404' };

  const typedLocale = locale as Locale;
  const name = typedLocale === 'ar' ? result.dept.name_ar : result.dept.name_en;
  const path = `/department/${slug}`;
  const alts = buildLanguageAlternates(path);

  return {
    title: name,
    alternates: {
      canonical: canonicalForLocale(typedLocale, path),
      languages: alts.languages,
    },
    openGraph: { type: 'website', title: name, locale },
  };
}

export default async function DepartmentPage({ params }: DepartmentPageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const result = await fetchDepartmentWithCollege(slug);
  if (!result) notFound();

  const typedLocale = locale as Locale;
  const isAr = typedLocale === 'ar';
  const { dept, college } = result;
  const deptName = isAr ? dept.name_ar : dept.name_en;
  const collegeName = college ? (isAr ? college.name_ar : college.name_en) : '';

  let researchers: ResearcherRow[] = [];
  try {
    researchers = await fetchResearchers(dept.id);
  } catch {
    /* Supabase unreachable */
  }

  const kpis = computeKpis(researchers);

  const researcherIds = researchers.map((r) => r.id);
  const [topPublications, siblings] = await Promise.all([
    fetchTopPublications(researcherIds).catch(() => [] as PublicationRow[]),
    college
      ? fetchSiblingDepartments(college.id, dept.id).catch(() => [] as SiblingDept[])
      : Promise.resolve([] as SiblingDept[]),
  ]);

  const t = await getTranslations('directory');
  const breadcrumbs: BreadcrumbItem[] = [
    { href: '/researchers', label: 'researchers' },
    ...(college ? [{ href: `/college/${college.slug}`, label: collegeName }] : []),
    { label: deptName },
  ];

  const kpiCards = [
    {
      icon: Users,
      value: kpis.researcherCount.toLocaleString(locale),
      label: isAr ? 'باحث' : 'Researchers',
    },
    {
      icon: BookOpen,
      value: kpis.publications.toLocaleString(locale),
      label: isAr ? 'منشور' : 'Publications',
    },
    {
      icon: Quote,
      value: kpis.citations.toLocaleString(locale),
      label: isAr ? 'اقتباس' : 'Citations',
    },
    {
      icon: TrendingUp,
      value: kpis.avgHIndex ? kpis.avgHIndex.toLocaleString(locale) : '—',
      label: isAr ? 'متوسط H-index' : 'Avg H-index',
    },
  ];

  return (
    <main className="container mx-auto flex flex-col gap-8 px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header with college link */}
      <div className="from-primary/10 to-primary/5 rounded-xl bg-gradient-to-br p-6">
        {college ? (
          <Link
            href={`/college/${college.slug}`}
            className="text-primary hover:underline inline-flex items-center gap-1.5 text-xs font-medium"
          >
            <Building2 className="size-3.5" />
            {isAr ? 'جزء من ' : 'Part of '}
            {collegeName}
          </Link>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{deptName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('subtitle', { count: researchers.length })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold tabular-nums">{kpi.value}</p>
                  <p className="text-muted-foreground truncate text-xs">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Researchers */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">{isAr ? 'الباحثون' : 'Researchers'}</h2>
        {researchers.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              {t('noResults')}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {researchers.map((r) => {
              const name = isAr ? r.full_name_ar : r.full_name_en;
              const interests = isAr
                ? r.field_of_interest_ar || r.field_of_interest_en
                : r.field_of_interest_en || r.field_of_interest_ar;
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <Link key={r.id} href={`/researcher/${r.username}`} className="group">
                  <Card className="hover:border-primary/40 h-full transition-colors">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          <AvatarImage src={r.profile_image ?? undefined} alt={name} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="group-hover:text-primary truncate font-medium transition-colors">
                            {name}
                          </p>
                          {r.scopus_h_index !== null ? (
                            <p className="text-muted-foreground text-xs">
                              h-index: {r.scopus_h_index}
                              {r.scopus_publications_count
                                ? ` · ${r.scopus_publications_count} ${isAr ? 'منشور' : 'pubs'}`
                                : ''}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {interests ? (
                        <p className="text-muted-foreground line-clamp-2 text-xs">{interests}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Top publications */}
      {topPublications.length > 0 ? (
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            {isAr ? 'أبرز منشورات القسم' : 'Top Publications'}
          </h2>
          <div className="space-y-2">
            {topPublications.map((p) => {
              const doiUrl = p.doi
                ? `https://doi.org/${p.doi.replace(/^https?:\/\/doi\.org\//i, '')}`
                : null;
              const citations = p.scopus_citations ?? p.scholar_citations ?? 0;
              return (
                <a
                  key={p.id}
                  href={doiUrl ?? '#'}
                  target={doiUrl ? '_blank' : undefined}
                  rel={doiUrl ? 'noopener' : undefined}
                  className="block"
                >
                  <Card className="hover:border-primary/40 transition-all hover:shadow-sm">
                    <CardContent className="space-y-1 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-medium leading-snug">{p.title}</h3>
                        {p.publication_year ? (
                          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                            {p.publication_year}
                          </span>
                        ) : null}
                      </div>
                      {p.journal_name ? (
                        <p className="text-muted-foreground text-xs italic">{p.journal_name}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        {citations > 0 ? (
                          <Badge variant="secondary" className="text-[10px]">
                            <Quote className="me-1 size-2.5" />
                            {citations}
                          </Badge>
                        ) : null}
                        {p.is_open_access ? (
                          <Badge
                            variant="outline"
                            className="border-green-300 text-[10px] text-green-600"
                          >
                            OA
                          </Badge>
                        ) : null}
                        {doiUrl ? (
                          <span className="text-primary inline-flex items-center gap-1 text-[10px]">
                            <ExternalLink className="size-2.5" />
                            DOI
                          </span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Sibling departments in the same college */}
      {siblings.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
            {isAr ? 'أقسام أخرى في' : 'Other departments in'} {collegeName}
          </h2>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/department/${s.slug}`}
                className="hover:bg-accent hover:border-primary/40 inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors"
              >
                {isAr ? s.name_ar || s.name_en : s.name_en || s.name_ar}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
