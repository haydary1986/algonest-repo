// One-click Scholar import — receives data from bookmarklet via form POST
// The bookmarklet scrapes Scholar and submits a form to this endpoint.
// After import, redirects back to manage-profile with results.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const publicationItem = z.object({
  title: z.string().min(1).max(1000),
  authors: z.array(z.string().max(200)).max(500).optional(),
  journal_name: z.string().max(500).optional().nullable(),
  publication_year: z.number().int().min(1800).max(2100).optional().nullable(),
  scholar_citations: z.number().int().min(0).optional().nullable(),
  url: z.string().max(2000).optional().nullable(),
});

const envelope = z.object({
  version: z.literal(1),
  provider: z.literal('scholar'),
  publications: z.array(publicationItem).max(2000),
});

export async function POST(request: Request): Promise<Response> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://ris.uoturath.edu.iq';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/en/sign-in`);
  }

  const { data: ownerRow } = await supabase.from('researchers_owner').select('id').maybeSingle();
  if (!ownerRow?.id) {
    return NextResponse.redirect(`${origin}/en/manage-profile?import=no_profile`);
  }

  try {
    const formData = await request.formData();
    const encoded = formData.get('data') as string;
    if (!encoded) {
      return NextResponse.redirect(`${origin}/en/manage-profile?import=scholar_empty`);
    }

    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const json = JSON.parse(decoded);

    if (json.version !== 1) {
      return NextResponse.redirect(`${origin}/en/manage-profile?import=scholar_version`);
    }

    const parsed = envelope.safeParse(json);
    if (!parsed.success) {
      return NextResponse.redirect(`${origin}/en/manage-profile?import=scholar_invalid`);
    }

    const payload = parsed.data.publications.map((p) => ({
      ...p,
      authors: p.authors ?? [],
    }));

    const { data } = await supabase.rpc('update_researcher_publications_google_scholar', {
      p_researcher_id: ownerRow.id,
      p_publications: payload,
    });

    const result = data as { inserted?: number; updated?: number; skipped?: number } | null;
    const params = new URLSearchParams({
      import: 'scholar_ok',
      inserted: String(result?.inserted ?? 0),
      updated: String(result?.updated ?? 0),
    });

    return NextResponse.redirect(`${origin}/en/manage-profile?${params}`);
  } catch {
    return NextResponse.redirect(`${origin}/en/manage-profile?import=scholar_error`);
  }
}
