import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { routing, type Locale } from '@/i18n/routing';
import { buildLanguageAlternates, canonicalForLocale } from '@/lib/seo/site';
import { CoauthorshipGraphClient } from './coauthorship-graph-client';

export const dynamic = 'force-dynamic';

interface CollaborationsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const alts = buildLanguageAlternates('/collaborations');
  return {
    title: 'Collaborations',
    alternates: {
      canonical: canonicalForLocale(locale as Locale, '/collaborations'),
      languages: alts.languages,
    },
    openGraph: { type: 'website', title: 'Collaborations', locale },
  };
}

export interface GraphNode {
  id: string;
  username: string;
  name: string;
  college_id: string | null;
  h_index: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: readonly GraphNode[];
  links: readonly GraphLink[];
}

async function fetchGraph(): Promise<GraphData> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_coauthorship_graph');
    if (error || !data) return { nodes: [], links: [] };
    return data as GraphData;
  } catch {
    return { nodes: [], links: [] };
  }
}

export default async function CollaborationsPage({ params }: CollaborationsPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const graph = await fetchGraph();
  const isEmpty = graph.nodes.length === 0;

  return (
    <main className="container mx-auto flex flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Collaborations</h1>
      <p className="text-muted-foreground text-sm">Co-authorship network across researchers.</p>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No collaboration data yet</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Co-authorship links will appear here once publication data is indexed.
          </p>
        </div>
      ) : (
        <CoauthorshipGraphClient nodes={graph.nodes} links={graph.links} />
      )}
    </main>
  );
}
