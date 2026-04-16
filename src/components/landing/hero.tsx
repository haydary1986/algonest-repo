import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export async function Hero() {
  const t = await getTranslations('landing.hero');
  const tCommon = await getTranslations('common');

  return (
    <section
      className="relative isolate overflow-hidden text-white"
      style={{ background: 'var(--gradient-primary)' }}
    >
      <div className="container mx-auto px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-widest opacity-80">{tCommon('university')}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg opacity-90">{t('tagline')}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/researchers"
              className={buttonVariants({ variant: 'secondary', size: 'lg' })}
            >
              {t('cta_primary')}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/about"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className: 'border-white/30 bg-transparent text-white hover:bg-white/10',
              })}
            >
              {t('cta_secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
