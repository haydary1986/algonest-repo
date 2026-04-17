import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { getOrcidClientId } from '@/lib/integrations/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ORCID_AUTHORIZE = 'https://orcid.org/oauth/authorize';
const COOKIE_TTL = 600;

function base64url(buf: Buffer): string {
  return buf.toString('base64url');
}

export async function GET(request: Request): Promise<Response> {
  const clientId = await getOrcidClientId();
  if (!clientId) {
    return NextResponse.json({ error: 'orcid_not_configured' }, { status: 503 });
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? new URL(request.url).origin;
  const callback = `${origin}/api/auth/orcid/callback`;

  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash('sha256').update(codeVerifier).digest());
  const state = base64url(crypto.randomBytes(32));

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_TTL,
    path: '/',
  };
  cookieStore.set('orcid_verifier', codeVerifier, cookieOpts);
  cookieStore.set('orcid_state', state, cookieOpts);

  const url = new URL(ORCID_AUTHORIZE);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', '/read-limited');
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return NextResponse.redirect(url.toString());
}
