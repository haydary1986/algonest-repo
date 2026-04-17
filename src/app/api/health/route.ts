// Task 206 — Health check endpoint for Coolify + uptime monitors.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  let dbOk = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('app_settings').select('key').limit(1);
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const status = dbOk ? 'ok' : 'degraded';
  const code = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      db: dbOk,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
    },
    { status: code },
  );
}
