import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

interface HomepageStats {
  researchers: number;
  colleges: number;
  departments: number;
}

async function fetchStats(): Promise<HomepageStats | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_homepage_stats');
    if (error || !data) return null;
    const d = data as HomepageStats & { publications?: number };
    return {
      researchers: d.researchers ?? 0,
      colleges: d.colleges ?? 0,
      departments: d.departments ?? 0,
    };
  } catch {
    return null;
  }
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export async function Stats({ locale }: { locale: string }) {
  const t = await getTranslations('landing.stats');
  const stats = await fetchStats();

  // Publications tile removed — neither the DB count (imports-only) nor
  // OpenAlex (aggregation accuracy concerns) matched expectations. Will
  // return as a per-researcher Scopus/ORCID-backed figure once Author IDs
  // are collected across the directory.
  const items: Array<{ key: keyof HomepageStats; label: string }> = [
    { key: 'researchers', label: t('researchers') },
    { key: 'colleges', label: t('colleges') },
    { key: 'departments', label: t('departments') },
  ];

  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('title')}
        </h2>
        <dl className="grid grid-cols-3 gap-6">
          {items.map((item) => {
            const value = stats?.[item.key];
            return (
              <div key={item.key} className="text-center">
                <dt className="text-muted-foreground text-sm uppercase tracking-wider">
                  {item.label}
                </dt>
                <dd className="mt-2 text-3xl font-semibold tabular-nums sm:text-4xl">
                  {value === undefined ? '—' : formatNumber(value, locale)}
                </dd>
              </div>
            );
          })}
        </dl>
        {!stats ? (
          <p className="text-muted-foreground mt-6 text-center text-xs">{t('empty')}</p>
        ) : null}
      </div>
    </section>
  );
}
