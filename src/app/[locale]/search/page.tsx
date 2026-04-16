import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildLanguageAlternates, canonicalForLocale } from '@/lib/seo/site';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { SearchInput } from './search-input';

/*
 * When EMBEDDING_API_KEY is configured, this page should call an edge function
 * to generate a 768-dim vector from `q` and use the semantic_search RPC instead
 * of the ILIKE text search below. The semantic_search RPC accepts a 768-dim
 * vector and returns ranked results by cosine similarity.
 */

export const revalidate = 0;

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const alts = buildLanguageAlternates('/search');
  return {
    title: 'Search',
    alternates: {
      canonical: canonicalForLocale(locale as Locale, '/search'),
      languages: alts.languages,
    },
    openGraph: { type: 'website', title: 'Search', locale },
  };
}

interface SearchResult {
  id: string;
  username: string;
  full_name_en: string;
  full_name_ar: string;
  bio_en: string | null;
  bio_ar: string | null;
  profile_image: string | null;
  scopus_h_index: number | null;
}

async function searchResearchers(query: string): Promise<readonly SearchResult[]> {
  try {
    const supabase = await createClient();
    const pattern = `%${query}%`;

    const { data, error } = await supabase
      .from('researchers_public')
      .select(
        'id, username, full_name_en, full_name_ar, bio_en, bio_ar, profile_image, scopus_h_index',
      )
      .or(
        `full_name_en.ilike.${pattern},full_name_ar.ilike.${pattern},bio_en.ilike.${pattern},bio_ar.ilike.${pattern}`,
      )
      .limit(20);

    if (error) return [];
    return (data ?? []) as readonly SearchResult[];
  } catch {
    return [];
  }
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const typedLocale = locale as Locale;

  const results = query.length > 0 ? await searchResearchers(query) : [];

  return (
    <main className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>

      <SearchInput initialValue={query} />

      {query.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {query.length > 0 && results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No results found</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Try a different search term or check the spelling.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((r) => {
            const name = typedLocale === 'ar' ? r.full_name_ar : r.full_name_en;
            const bio = typedLocale === 'ar' ? r.bio_ar : r.bio_en;

            return (
              <Link
                key={r.id}
                href={`/researcher/${r.username}`}
                className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2"
              >
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardHeader className="flex-row items-center gap-3">
                    <Avatar className="size-10">
                      {r.profile_image ? <AvatarImage src={r.profile_image} alt="" /> : null}
                      <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold leading-tight">{name}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bio ? (
                      <p className="text-muted-foreground line-clamp-2 text-xs">{bio}</p>
                    ) : null}
                    {r.scopus_h_index !== null ? (
                      <Badge variant="secondary">h-index {r.scopus_h_index}</Badge>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
