import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: adminRow } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: pubs } = await supabase
    .from('researcher_publications')
    .select(
      'title, journal_name, conference_name, publisher, publication_year, doi, url, is_scopus, is_wos, is_open_access, scopus_citations, wos_citations, scholar_citations, researcher_id',
    )
    .order('publication_year', { ascending: false });

  const { data: researchers } = await supabase.from('researchers').select('id, full_name_en');
  const resMap = new Map((researchers ?? []).map((r) => [r.id, r.full_name_en]));

  const header = [
    'Title',
    'Researcher',
    'Journal',
    'Year',
    'DOI',
    'Scopus',
    'WoS',
    'OA',
    'Scopus Citations',
    'WoS Citations',
    'Scholar Citations',
  ];
  const rows = (pubs ?? []).map((p) => [
    p.title ?? '',
    p.researcher_id ? (resMap.get(p.researcher_id) ?? '') : '',
    p.journal_name ?? p.conference_name ?? p.publisher ?? '',
    p.publication_year ?? '',
    p.doi ?? '',
    p.is_scopus ? 'Yes' : 'No',
    p.is_wos ? 'Yes' : 'No',
    p.is_open_access ? 'Yes' : 'No',
    p.scopus_citations ?? '',
    p.wos_citations ?? '',
    p.scholar_citations ?? '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '\uFEFF';

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="publications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
