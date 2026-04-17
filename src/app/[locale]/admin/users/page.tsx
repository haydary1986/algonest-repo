import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { UsersTable } from './users-table';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function UsersPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === 'ar';
  const supabase = await createClient();

  const adminSupa = createAdminClient();
  const {
    data: { users },
  } = await adminSupa.auth.admin.listUsers({ perPage: 500 });

  const { data: researchers } = await supabase
    .from('researchers')
    .select('id, user_id, username, full_name_en, full_name_ar, is_public, college_id')
    .order('full_name_en');

  const { data: admins } = await supabase.from('admins').select('user_id, role');

  const { data: colleges } = await supabase
    .from('colleges')
    .select('id, name_en, name_ar')
    .order('name_en');

  const collegeMap = new Map((colleges ?? []).map((c) => [c.id, c]));

  const enrichedUsers = (users ?? []).map((u) => {
    const researcher = (researchers ?? []).find((r) => r.user_id === u.id);
    const admin = (admins ?? []).find((a) => a.user_id === u.id);
    const college = researcher?.college_id ? collegeMap.get(researcher.college_id) : null;
    return {
      id: u.id,
      email: u.email ?? '',
      fullName:
        researcher?.full_name_en ?? u.user_metadata?.full_name ?? u.user_metadata?.name ?? '',
      avatarUrl: (u.user_metadata?.avatar_url as string) ?? '',
      isPublic: researcher?.is_public ?? false,
      hasProfile: Boolean(researcher),
      role: admin?.role ?? null,
      collegeName: college ? (isAr ? college.name_ar : college.name_en) : null,
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? 'إدارة المستخدمين' : 'User Management'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr
            ? `${enrichedUsers.length} مستخدم مسجّل`
            : `${enrichedUsers.length} registered users`}
        </p>
      </header>
      <UsersTable users={enrichedUsers} locale={locale} />
    </div>
  );
}
