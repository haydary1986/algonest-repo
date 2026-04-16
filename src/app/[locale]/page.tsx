import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/landing/hero';
import { Stats } from '@/components/landing/stats';
import { FeaturedResearchers } from '@/components/landing/featured-researchers';
import { Mission } from '@/components/landing/mission';
import { SdgGrid } from '@/components/landing/sdg-grid';
import { hasLocale } from 'next-intl';
import { routing, type Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';

// ISR — landing data refreshes every 5 minutes (Task 159 caching policy).
export const revalidate = 300;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const typedLocale = locale as Locale;

  return (
    <>
      <Hero />
      <Stats locale={typedLocale} />
      <FeaturedResearchers locale={typedLocale} />
      <Mission />
      <SdgGrid />
    </>
  );
}
