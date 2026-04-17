'use client';

import { useMemo, useRef, useEffect } from 'react';
import { ArrowRight, BookOpen, Users, BarChart3, Globe2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

const FLOATING_ICONS = [
  { Icon: BookOpen, x: '10%', y: '20%', delay: 0, size: 32 },
  { Icon: Users, x: '85%', y: '15%', delay: 0.5, size: 28 },
  { Icon: BarChart3, x: '75%', y: '75%', delay: 1, size: 36 },
  { Icon: Globe2, x: '15%', y: '70%', delay: 1.5, size: 30 },
  { Icon: BookOpen, x: '50%', y: '85%', delay: 2, size: 24 },
  { Icon: Users, x: '90%', y: '50%', delay: 0.8, size: 26 },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function Hero() {
  const t = useTranslations('landing.hero');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        w: 2 + seededRandom(i * 7) * 4,
        left: seededRandom(i * 13) * 100,
        top: seededRandom(i * 19) * 100,
        dur: 8 + seededRandom(i * 31) * 12,
        dly: seededRandom(i * 37) * 5,
        op: 0.1 + seededRandom(i * 43) * 0.3,
      })),
    [],
  );

  useEffect(() => {
    const el = sectionRef.current;
    if (el) el.classList.add('hero-mounted');
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-section relative isolate overflow-hidden text-white"
      style={{ minHeight: '85vh' }}
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          background:
            'linear-gradient(-45deg, #0f172a, #1e40af, #0891b2, #0f766e, #1e40af, #0f172a)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.4), transparent 70%)' }}
      />

      {/* Floating animated icons */}
      {FLOATING_ICONS.map(({ Icon, x, y, delay, size }, i) => (
        <div
          key={i}
          className="hero-float-icon absolute opacity-0"
          style={{
            left: x,
            top: y,
            transitionDelay: `${delay}s`,
            animation: `float-icon ${3 + i * 0.5}s ease-in-out infinite ${delay}s`,
          }}
        >
          <Icon size={size} />
        </div>
      ))}

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: `${p.w}px`,
              height: `${p.w}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `particle-rise ${p.dur}s linear infinite ${p.dly}s`,
              opacity: p.op,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24 sm:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="hero-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {tCommon('university')}
          </div>

          {/* Title */}
          <h1
            className="hero-fade-up mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ transitionDelay: '0.2s' }}
          >
            <span className="block">{t('title').split('—')[0]}—</span>
            <span className="bg-gradient-to-r from-cyan-200 via-white to-cyan-200 bg-clip-text text-transparent">
              {t('title').split('—')[1] ?? ''}
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="hero-fade-up mx-auto mt-6 max-w-2xl text-lg text-white/80 sm:text-xl"
            style={{ transitionDelay: '0.4s' }}
          >
            {t('tagline')}
          </p>

          {/* CTAs */}
          <div
            className="hero-fade-up mt-10 flex flex-wrap items-center justify-center gap-4"
            style={{ transitionDelay: '0.5s' }}
          >
            <Link
              href="/researchers"
              className={buttonVariants({
                variant: 'secondary',
                size: 'lg',
                className:
                  'group px-8 py-6 text-base shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30',
              })}
            >
              {t('cta_primary')}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/analytics"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
                className:
                  'px-8 py-6 text-base border-white/30 bg-white/5 text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/15',
              })}
            >
              {t('cta_secondary')}
            </Link>
          </div>

          {/* Stats mini */}
          <div
            className="hero-fade-up mt-16 flex items-center justify-center gap-8 sm:gap-16"
            style={{ transitionDelay: '0.7s' }}
          >
            {[
              { icon: Users, label: locale === 'ar' ? 'باحث' : 'Researchers' },
              { icon: BookOpen, label: locale === 'ar' ? 'منشور' : 'Publications' },
              { icon: BarChart3, label: locale === 'ar' ? 'كلية' : 'Colleges' },
            ].map(({ icon: Ic, label }, i) => (
              <div key={i} className="flex items-center gap-2 text-white/60">
                <Ic className="size-4" />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" className="h-16 w-full sm:h-24">
          <path
            d="M0,60 C360,100 720,20 1080,60 C1260,80 1380,40 1440,60 L1440,100 L0,100 Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}
