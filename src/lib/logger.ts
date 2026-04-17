'use server';

import { createAdminClient } from '@/lib/supabase/admin';

type LogLevel = 'error' | 'warn' | 'info';

export async function logError(
  source: string,
  message: string,
  details?: Record<string, unknown>,
  userId?: string,
  url?: string,
) {
  return logEntry('error', source, message, details, userId, url);
}

export async function logWarn(source: string, message: string, details?: Record<string, unknown>) {
  return logEntry('warn', source, message, details);
}

async function logEntry(
  level: LogLevel,
  source: string,
  message: string,
  details?: Record<string, unknown>,
  userId?: string,
  url?: string,
) {
  try {
    const supabase = createAdminClient();
    await supabase.from('error_log').insert({
      level,
      source,
      message,
      details: details ?? null,
      user_id: userId ?? null,
      url: url ?? null,
    });
  } catch {
    // Don't throw from logger — avoid infinite loops
    console.error(`[RIS Logger] Failed to log: ${source}: ${message}`);
  }
}
