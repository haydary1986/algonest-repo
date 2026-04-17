import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  // Only admins can export
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

  const { data: researchers } = await supabase
    .from('researchers')
    .select(
      'full_name_en, full_name_ar, username, private_email, college_id, department_id, academic_title_id, scopus_h_index, scopus_publications_count, scopus_citations_count, is_public, created_at',
    )
    .order('full_name_en');

  const { data: colleges } = await supabase.from('colleges').select('id, name_en');
  const { data: departments } = await supabase.from('departments').select('id, name_en');
  const { data: titles } = await supabase.from('academic_titles').select('id, name_en');

  const collegeMap = new Map((colleges ?? []).map((c) => [c.id, c.name_en]));
  const deptMap = new Map((departments ?? []).map((d) => [d.id, d.name_en]));
  const titleMap = new Map((titles ?? []).map((t) => [t.id, t.name_en]));

  const header = [
    'Name (EN)',
    'Name (AR)',
    'Username',
    'Email',
    'College',
    'Department',
    'Title',
    'h-index',
    'Publications',
    'Citations',
    'Public',
    'Created',
  ];
  const rows = (researchers ?? []).map((r) => [
    r.full_name_en ?? '',
    r.full_name_ar ?? '',
    r.username ?? '',
    r.private_email ?? '',
    r.college_id ? (collegeMap.get(r.college_id) ?? '') : '',
    r.department_id ? (deptMap.get(r.department_id) ?? '') : '',
    r.academic_title_id ? (titleMap.get(r.academic_title_id) ?? '') : '',
    r.scopus_h_index ?? '',
    r.scopus_publications_count ?? '',
    r.scopus_citations_count ?? '',
    r.is_public ? 'Yes' : 'No',
    r.created_at ? new Date(r.created_at).toLocaleDateString('en') : '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '\uFEFF';

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="researchers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
