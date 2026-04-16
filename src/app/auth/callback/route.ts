// Task 39 — OAuth callback route.
//
// Lives outside [locale] because Supabase redirects here with a fixed URL
// (configured in the OAuth provider). The matcher in src/proxy.ts excludes
// /auth/* so this handler runs without the locale middleware adding a prefix.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';

const SAFE_NEXT = /^\/(en|ar)\/[a-zA-Z0-9_\-/]*$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedNext = url.searchParams.get('next');

  // Default + allow-list the next param to prevent open-redirect.
  const next =
    requestedNext && SAFE_NEXT.test(requestedNext)
      ? requestedNext
      : `/${routing.defaultLocale}/manage-profile`;

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${routing.defaultLocale}/sign-in?error=missing_code`, url.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${routing.defaultLocale}/sign-in?error=exchange_failed`, url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
