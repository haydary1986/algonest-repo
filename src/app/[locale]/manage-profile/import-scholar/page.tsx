// Task 99 — Publication import landing.
// Three providers in one page so the user picks whichever they prefer.

import { setRequestLocale, getTranslations } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';
import { ScholarSection } from '@/components/import/scholar-section';
import { OrcidSection } from '@/components/import/orcid-section';
import { ScopusSection } from '@/components/import/scopus-section';
import { SCHOLAR_CONSOLE_SCRIPT } from '@/lib/import/scholar-console-script';

export const dynamic = 'force-dynamic';

interface ImportPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ImportPage({ params }: ImportPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const t = await getTranslations('import');

  // Check config from DB (admin integrations page) OR env vars as fallback
  let orcidConfigured = Boolean(process.env.ORCID_CLIENT_ID);
  let scopusConfigured = Boolean(process.env.SCOPUS_API_KEY);
  try {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['integration.orcid.client_id', 'integration.scopus.api_key']);
    for (const s of settings ?? []) {
      const val = typeof s.value === 'string' ? s.value.replace(/^"|"$/g, '') : '';
      if (s.key === 'integration.orcid.client_id' && val) orcidConfigured = true;
      if (s.key === 'integration.scopus.api_key' && val) scopusConfigured = true;
    }
  } catch {}

  return (
    <main className="container mx-auto flex flex-col gap-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <ScholarSection consoleScript={SCHOLAR_CONSOLE_SCRIPT} />
      <OrcidSection configured={orcidConfigured} />
      <ScopusSection configured={scopusConfigured} />
    </main>
  );
}
