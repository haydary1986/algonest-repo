import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      source?: string;
      message?: string;
      details?: Record<string, unknown>;
      url?: string;
    };

    if (!body.message) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    } catch {}

    await logError(body.source ?? 'client', body.message, body.details, userId, body.url);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
