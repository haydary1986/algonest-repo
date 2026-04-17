import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { buildLanguageAlternates, canonicalForLocale } from '@/lib/seo/site';
import { getInstitutionAnalytics } from '@/lib/openalex/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Quote, Users, TrendingUp, Unlock, Lock } from 'lucide-react';

export const revalidate = 1800;

interface AnalyticsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'analytics' });
  const alts = buildLanguageAlternates('/analytics');
  return {
    title: t('title'),
    alternates: {
      canonical: canonicalForLocale(locale as Locale, '/analytics'),
      languages: alts.languages,
    },
  };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === 'ar';
  const data = await getInstitutionAnalytics();

  if (!data) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">
          {isAr ? 'لا تتوفر بيانات حالياً' : 'No data available'}
        </p>
      </main>
    );
  }

  const oaPercent =
    data.totalWorks > 0 ? Math.round((data.openAccessCount / data.totalWorks) * 100) : 0;

  const kpis = [
    {
      icon: BookOpen,
      value: data.totalWorks.toLocaleString(locale),
      label: isAr ? 'منشور بحثي' : 'Publications',
    },
    {
      icon: Quote,
      value: data.totalCitations.toLocaleString(locale),
      label: isAr ? 'اقتباس' : 'Citations',
    },
    { icon: TrendingUp, value: String(data.hIndex), label: 'H-Index' },
    {
      icon: Users,
      value: data.totalAuthors.toLocaleString(locale),
      label: isAr ? 'باحث' : 'Researchers',
    },
  ];

  return (
    <main className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? 'التحليلات والإحصائيات' : 'Analytics & Statistics'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? 'الإنتاج البحثي لجامعة التراث — بيانات من OpenAlex'
            : 'AL-Turath University research output — Data from OpenAlex'}
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-3 py-5">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Publications by Year */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">
              {isAr ? 'المنشورات حسب السنة' : 'Publications by Year'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-1 sm:gap-2">
              {data.byYear.map((y) => {
                const maxCount = Math.max(...data.byYear.map((c) => c.count));
                const height = maxCount > 0 ? (y.count / maxCount) * 160 : 0;
                return (
                  <div key={y.year} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium tabular-nums">{y.count}</span>
                    <div
                      className="w-8 rounded-t bg-primary/80 transition hover:bg-primary sm:w-12"
                      style={{ height: `${Math.max(height, 4)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground tabular-nums">{y.year}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Publications by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{isAr ? 'حسب النوع' : 'By Type'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byType.map((t) => {
              const pct = data.totalWorks > 0 ? (t.count / data.totalWorks) * 100 : 0;
              return (
                <div key={t.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{t.type}</span>
                    <span className="text-muted-foreground tabular-nums">{t.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Open Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{isAr ? 'الوصول المفتوح' : 'Open Access'}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative flex size-32 items-center justify-center">
              <svg className="size-32 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-green-500"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${oaPercent}, 100`}
                />
              </svg>
              <span className="absolute text-2xl font-bold">{oaPercent}%</span>
            </div>
            <div className="flex gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <Unlock className="size-3.5 text-green-500" />
                <span>
                  {isAr ? 'مفتوح' : 'Open'}: {data.openAccessCount.toLocaleString(locale)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" />
                <span>
                  {isAr ? 'مغلق' : 'Closed'}: {data.closedAccessCount.toLocaleString(locale)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        {isAr
          ? 'مصدر البيانات: OpenAlex — تُحدّث تلقائياً كل ساعة'
          : 'Data source: OpenAlex — auto-refreshed hourly'}
      </p>
    </main>
  );
}
