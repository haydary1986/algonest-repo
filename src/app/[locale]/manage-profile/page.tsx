import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface ManageProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ManageProfilePage({ params }: ManageProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">Manage profile</h1>
      <p className="text-muted-foreground text-sm">Signed in as {user.email}</p>
      <p className="text-muted-foreground text-xs">
        Phase 9 will build the full editor here (task 86).
      </p>
    </main>
  );
}
