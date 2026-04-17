import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

const LEVEL_CONFIG = {
  error: { icon: AlertCircle, variant: 'destructive' as const, color: 'text-red-600' },
  warn: { icon: AlertTriangle, variant: 'secondary' as const, color: 'text-yellow-600' },
  info: { icon: Info, variant: 'outline' as const, color: 'text-blue-600' },
};

export default async function ErrorLogPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === 'ar';
  const supabase = createAdminClient();

  const { data: logs } = await supabase
    .from('error_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const entries = (logs ?? []) as Array<{
    id: string;
    level: 'error' | 'warn' | 'info';
    source: string;
    message: string;
    details: Record<string, unknown> | null;
    user_id: string | null;
    url: string | null;
    created_at: string;
  }>;

  const errorCount = entries.filter((e) => e.level === 'error').length;
  const warnCount = entries.filter((e) => e.level === 'warn').length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? 'سجل الأخطاء' : 'Error Log'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAr
            ? 'جميع الأخطاء والتحذيرات المسجّلة في النظام'
            : 'All errors and warnings logged by the system'}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-red-600">{errorCount}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'أخطاء' : 'Errors'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{warnCount}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'تحذيرات' : 'Warnings'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">{isAr ? 'إجمالي' : 'Total'}</p>
          </CardContent>
        </Card>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {isAr ? 'لا توجد أخطاء مسجّلة' : 'No errors logged yet'}
        </p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-start font-medium w-20">
                  {isAr ? 'المستوى' : 'Level'}
                </th>
                <th className="px-4 py-2 text-start font-medium w-24">
                  {isAr ? 'المصدر' : 'Source'}
                </th>
                <th className="px-4 py-2 text-start font-medium">{isAr ? 'الرسالة' : 'Message'}</th>
                <th className="px-4 py-2 text-start font-medium w-40">{isAr ? 'الوقت' : 'Time'}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((e) => {
                const config = LEVEL_CONFIG[e.level] ?? LEVEL_CONFIG.error;
                const Icon = config.icon;
                return (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <Badge variant={config.variant} className="text-[10px]">
                        <Icon className="size-3 me-1" />
                        {e.level}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-xs font-mono text-muted-foreground">
                      {e.source}
                    </td>
                    <td className="px-4 py-2">
                      <p className="text-xs">{e.message}</p>
                      {e.url ? (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {e.url}
                        </p>
                      ) : null}
                      {e.details ? (
                        <details className="mt-1">
                          <summary className="text-[10px] text-muted-foreground cursor-pointer">
                            {isAr ? 'تفاصيل' : 'Details'}
                          </summary>
                          <pre className="mt-1 text-[9px] text-muted-foreground bg-muted rounded p-1 overflow-auto max-h-20">
                            {JSON.stringify(e.details, null, 2)}
                          </pre>
                        </details>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums">
                      {new Date(e.created_at).toLocaleString(locale, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
