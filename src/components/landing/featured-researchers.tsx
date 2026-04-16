import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import type { Locale } from '@/i18n/routing';
import {
  FeaturedResearchersCarousel,
  type FeaturedResearcher,
} from './featured-researchers-carousel';

async function fetchFeatured(): Promise<FeaturedResearcher[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_researchers_page', {
      p_size: 6,
      p_sort: 'scopus_h_desc',
    });
    if (error || !data) return [];
    type Row = {
      id: string;
      username: string;
      full_name_en: string;
      full_name_ar: string;
      profile_image: string | null;
      scopus_h_index: number | null;
      scopus_publications_count: number | null;
    };
    const rows = ((data as { data?: Row[] }).data ?? []) as Row[];
    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      fullNameEn: r.full_name_en,
      fullNameAr: r.full_name_ar,
      profileImage: r.profile_image,
      hIndex: r.scopus_h_index,
      publicationsCount: r.scopus_publications_count,
    }));
  } catch {
    return [];
  }
}

export async function FeaturedResearchers({ locale }: { locale: Locale }) {
  const t = await getTranslations('landing.featured');
  const researchers = await fetchFeatured();

  return (
    <section className="border-b">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{t('subtitle')}</p>
        </div>
        {researchers.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm">{t('empty')}</p>
        ) : (
          <FeaturedResearchersCarousel researchers={researchers} locale={locale} />
        )}
      </div>
    </section>
  );
}
