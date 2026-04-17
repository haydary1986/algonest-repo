// Admin Setup Guide — shows which services are configured + how to configure them.
// Reads env vars server-side and renders status badges.

import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Key,
  Globe,
  Shield,
  Database,
  BarChart3,
  BookOpen,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

interface ServiceCheck {
  name: string;
  nameAr: string;
  icon: React.ReactNode;
  configured: boolean;
  required: boolean;
  envVars: string[];
  steps: string[];
  stepsAr: string[];
  link?: string;
  linkLabel?: string;
}

function getServices(): ServiceCheck[] {
  return [
    {
      name: 'Supabase (Database + Auth + Storage)',
      nameAr: 'Supabase (قاعدة البيانات + المصادقة + التخزين)',
      icon: <Database className="size-5" />,
      configured: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
      required: true,
      envVars: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
      ],
      steps: [
        'In Coolify → Resources → Deploy from template → Supabase (self-hosted).',
        'Set POSTGRES_PASSWORD (generate: openssl rand -hex 24).',
        'Set JWT_SECRET (generate: openssl rand -hex 24).',
        'Set SITE_URL = https://yourdomain.com.',
        'Set API_EXTERNAL_URL = https://api-ris.yourdomain.com.',
        'Deploy — ANON_KEY and SERVICE_ROLE_KEY are auto-generated.',
        "Copy the 3 keys to this app's Coolify environment variables.",
        'Apply SQL migrations: run each file in supabase/migrations/ in order.',
      ],
      stepsAr: [
        'في Coolify → Resources → Deploy from template → Supabase (self-hosted).',
        'عيّن POSTGRES_PASSWORD (ولّده بـ openssl rand -hex 24).',
        'عيّن JWT_SECRET (ولّده بـ openssl rand -hex 24).',
        'عيّن SITE_URL = https://yourdomain.com.',
        'عيّن API_EXTERNAL_URL = https://api-ris.yourdomain.com.',
        'انشر — ANON_KEY و SERVICE_ROLE_KEY تُولَّد تلقائياً.',
        'انسخ المفاتيح الثلاثة إلى متغيرات بيئة هذا التطبيق في Coolify.',
        'طبّق الـ SQL migrations: شغّل كل ملف في supabase/migrations/ بالترتيب.',
      ],
    },
    {
      name: 'Google OAuth (Sign-in with Google)',
      nameAr: 'مصادقة Google (تسجيل الدخول بـ Google)',
      icon: <Globe className="size-5" />,
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      required: true,
      envVars: ['(configured in Supabase Auth dashboard, not as app env vars)'],
      steps: [
        'Go to Google Cloud Console → APIs & Services → Credentials.',
        'Create OAuth 2.0 Client ID (Web application).',
        'Authorized redirect URI: https://api-ris.yourdomain.com/auth/v1/callback',
        'Copy Client ID + Client Secret.',
        'In Supabase Studio → Authentication → Providers → Google → Enable → paste keys.',
        'In URL Configuration → Site URL: https://yourdomain.com',
        'Add redirect URLs: https://yourdomain.com/auth/callback',
      ],
      stepsAr: [
        'افتح Google Cloud Console → APIs & Services → Credentials.',
        'أنشئ OAuth 2.0 Client ID (نوع Web application).',
        'Authorized redirect URI: https://api-ris.yourdomain.com/auth/v1/callback',
        'انسخ Client ID و Client Secret.',
        'في Supabase Studio → Authentication → Providers → Google → فعّل وألصق المفاتيح.',
        'في URL Configuration → Site URL: https://yourdomain.com',
        'أضف redirect URLs: https://yourdomain.com/auth/callback',
      ],
      link: 'https://console.cloud.google.com/apis/credentials',
      linkLabel: 'Google Cloud Console',
    },
    {
      name: 'Sentry (Error monitoring)',
      nameAr: 'Sentry (مراقبة الأخطاء)',
      icon: <Shield className="size-5" />,
      configured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
      required: false,
      envVars: ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_ORG', 'SENTRY_PROJECT', 'SENTRY_AUTH_TOKEN'],
      steps: [
        'Sign up at sentry.io (free tier is sufficient) — or self-host Sentry.',
        'Create a Next.js project.',
        'Copy the DSN from Project Settings → Client Keys.',
        'Create an Auth Token from Settings → User Auth Tokens (for source maps).',
        'Add all 4 env vars to Coolify.',
      ],
      stepsAr: [
        'سجّل في sentry.io (الخطة المجانية كافية) — أو ثبّت Sentry محلياً.',
        'أنشئ مشروع Next.js.',
        'انسخ DSN من Project Settings → Client Keys.',
        'أنشئ Auth Token من Settings → User Auth Tokens (لرفع source maps).',
        'أضف المتغيرات الأربعة إلى Coolify.',
      ],
      link: 'https://sentry.io',
      linkLabel: 'Sentry',
    },
    {
      name: 'ORCID (Publication import from ORCID)',
      nameAr: 'ORCID (استيراد المنشورات من ORCID)',
      icon: <BookOpen className="size-5" />,
      configured: Boolean(process.env.ORCID_CLIENT_ID && process.env.ORCID_CLIENT_SECRET),
      required: false,
      envVars: ['ORCID_CLIENT_ID', 'ORCID_CLIENT_SECRET'],
      steps: [
        'Sign up at orcid.org/developer-tools (free for public API).',
        'Register an app.',
        'Redirect URI: https://yourdomain.com/api/auth/orcid/callback',
        'Scope: /read-limited',
        'Copy Client ID + Client Secret → add to Coolify env vars.',
      ],
      stepsAr: [
        'سجّل في orcid.org/developer-tools (مجاني للـ API العام).',
        'أنشئ تطبيقاً.',
        'Redirect URI: https://yourdomain.com/api/auth/orcid/callback',
        'Scope: /read-limited',
        'انسخ Client ID و Client Secret → أضفهما لمتغيرات Coolify.',
      ],
      link: 'https://orcid.org/developer-tools',
      linkLabel: 'ORCID Developer Portal',
    },
    {
      name: 'Scopus API (Publication import from Scopus)',
      nameAr: 'Scopus API (استيراد المنشورات من Scopus)',
      icon: <BarChart3 className="size-5" />,
      configured: Boolean(process.env.SCOPUS_API_KEY),
      required: false,
      envVars: ['SCOPUS_API_KEY'],
      steps: [
        'Sign up at dev.elsevier.com (free for academic use).',
        'Create an API Key.',
        'Limits: 20,000 queries/week (institutional), 9 req/sec.',
        'Add SCOPUS_API_KEY to Coolify env vars.',
      ],
      stepsAr: [
        'سجّل في dev.elsevier.com (مجاني للاستخدام الأكاديمي).',
        'أنشئ API Key.',
        'الحدود: 20,000 استعلام/أسبوع (مؤسسي)، 9 طلب/ثانية.',
        'أضف SCOPUS_API_KEY لمتغيرات Coolify.',
      ],
      link: 'https://dev.elsevier.com/',
      linkLabel: 'Elsevier Developer Portal',
    },
    {
      name: 'Google Search Console (SEO indexing)',
      nameAr: 'Google Search Console (فهرسة SEO)',
      icon: <Search className="size-5" />,
      configured: Boolean(process.env.GOOGLE_SITE_VERIFICATION),
      required: false,
      envVars: ['GOOGLE_SITE_VERIFICATION'],
      steps: [
        'Go to search.google.com/search-console.',
        'Add a property for your domain.',
        'Choose HTML tag verification.',
        'Copy the content="..." value.',
        'Add as GOOGLE_SITE_VERIFICATION env var.',
        'Submit sitemap: https://yourdomain.com/sitemap.xml',
      ],
      stepsAr: [
        'افتح search.google.com/search-console.',
        'أضف property للنطاق.',
        'اختر التحقق بـ HTML tag.',
        'انسخ قيمة content="..." من الـ meta tag.',
        'أضفها كمتغير GOOGLE_SITE_VERIFICATION.',
        'قدّم sitemap: https://yourdomain.com/sitemap.xml',
      ],
      link: 'https://search.google.com/search-console',
      linkLabel: 'Google Search Console',
    },
    {
      name: 'IndexNow (Bing/Yandex fast indexing)',
      nameAr: 'IndexNow (فهرسة سريعة لـ Bing/Yandex)',
      icon: <Key className="size-5" />,
      configured: Boolean(process.env.INDEXNOW_KEY),
      required: false,
      envVars: ['INDEXNOW_KEY'],
      steps: [
        'Generate a key: openssl rand -hex 16',
        'Create a file public/{key}.txt containing only the key.',
        'Add INDEXNOW_KEY env var with the same value.',
      ],
      stepsAr: [
        'ولّد مفتاحاً: openssl rand -hex 16',
        'أنشئ ملف public/{key}.txt يحتوي المفتاح فقط.',
        'أضف متغير INDEXNOW_KEY بنفس القيمة.',
      ],
    },
  ];
}

interface SetupPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const isAr = locale === 'ar';
  const services = getServices();
  const configuredCount = services.filter((s) => s.configured).length;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAr ? 'دليل إعداد الخدمات' : 'Service Setup Guide'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? `${configuredCount} من ${services.length} خدمات مُهيّأة. الخدمات المطلوبة مُعلَّمة.`
            : `${configuredCount} of ${services.length} services configured. Required services are marked.`}
        </p>
        <div className="flex gap-2">
          <Badge variant={configuredCount === services.length ? 'default' : 'secondary'}>
            {configuredCount}/{services.length}
          </Badge>
        </div>
      </header>

      <div className="space-y-4">
        {services.map((s) => (
          <ServiceCard key={s.name} service={s} isAr={isAr} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ service, isAr }: { service: ServiceCheck; isAr: boolean }) {
  const name = isAr ? service.nameAr : service.name;
  const steps = isAr ? service.stepsAr : service.steps;

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <div
          className={`inline-flex size-10 items-center justify-center rounded-full ${
            service.configured
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {service.configured ? <CheckCircle className="size-5" /> : service.icon}
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="flex items-center gap-2 text-base">
            {name}
            {service.required ? (
              <Badge variant="destructive" className="text-[10px]">
                {isAr ? 'مطلوب' : 'Required'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                {isAr ? 'اختياري' : 'Optional'}
              </Badge>
            )}
          </CardTitle>
          <div className="mt-1 flex items-center gap-2">
            {service.configured ? (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                ✓ {isAr ? 'مُهيّأ' : 'Configured'}
              </span>
            ) : (
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                ✗ {isAr ? 'غير مُهيّأ' : 'Not configured'}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {!service.configured && (
        <CardContent className="space-y-3 border-t pt-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? 'المتغيرات المطلوبة' : 'Required env vars'}
            </p>
            <div className="flex flex-wrap gap-1">
              {service.envVars.map((v) => (
                <code key={v} className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                  {v}
                </code>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isAr ? 'خطوات الإعداد' : 'Setup steps'}
            </p>
            <ol className="text-muted-foreground ms-5 list-decimal space-y-1 text-sm">
              {steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {service.link && (
            <a
              href={service.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
            >
              <ExternalLink className="size-3.5" />
              {service.linkLabel}
            </a>
          )}
        </CardContent>
      )}
    </Card>
  );
}
