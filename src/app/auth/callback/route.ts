import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';
import { autoImportForUser, autoImportFromOrcid } from '@/lib/import/auto-import';
import { checkProfileComplete } from '@/lib/profile/is-complete';

const SAFE_NEXT = /^\/(en|ar)\/[a-zA-Z0-9_\-/]*$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next');

  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const defaultLocale = routing.defaultLocale;

  const next =
    requestedNext && SAFE_NEXT.test(requestedNext)
      ? requestedNext
      : `/${defaultLocale}/manage-profile`;

  if (!code) {
    return NextResponse.redirect(new URL(`/${defaultLocale}/sign-in?error=missing_code`, origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}/sign-in?error=exchange_failed`, origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    Promise.all([
      autoImportFromOrcid(user.id, user.email),
      autoImportForUser(user.id, user.email),
    ]).catch(() => {});
  }

  // Check if profile exists and is complete
  const { data: profile } = await supabase
    .from('researchers_owner')
    .select('college_id, department_id, academic_title_id, full_name_en, full_name_ar')
    .maybeSingle();

  if (!profile) {
    // No researcher record — try to create one manually
    if (user) {
      const emailLocal = (user.email ?? '').split('@')[0]?.toLowerCase() ?? 'user';
      const username = emailLocal.replace(/[^a-z0-9-]/g, '-');
      const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? emailLocal;
      await supabase
        .from('researchers')
        .insert({
          user_id: user.id,
          username,
          full_name_en: fullName,
          full_name_ar: fullName,
          private_email: user.email,
          is_public: false,
        })
        .select('id')
        .maybeSingle();
    }
    return NextResponse.redirect(new URL(`/${defaultLocale}/complete-profile`, origin));
  }

  const check = checkProfileComplete(profile);
  if (!check.complete) {
    return NextResponse.redirect(new URL(`/${defaultLocale}/complete-profile`, origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
