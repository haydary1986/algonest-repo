'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Circle, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { CompletenessResult } from '@/lib/profile/completeness';

interface ProfileCompletenessProps {
  result: CompletenessResult;
  titleLabel: string;
  openDetailsLabel: string;
  tipLabel: string;
}

export function ProfileCompleteness({
  result,
  titleLabel,
  openDetailsLabel,
  tipLabel,
}: ProfileCompletenessProps) {
  const [expanded, setExpanded] = useState(false);
  const locale = useLocale() as 'ar' | 'en';
  const { score, categories, missingCount } = result;

  // Tint: red < 40, amber < 75, green otherwise — gives researchers a
  // quick visual on whether their profile is shippable.
  const tone =
    score >= 75
      ? {
          bar: 'bg-emerald-500',
          text: 'text-emerald-600 dark:text-emerald-400',
          ring: 'ring-emerald-500/30',
        }
      : score >= 40
        ? {
            bar: 'bg-amber-500',
            text: 'text-amber-600 dark:text-amber-400',
            ring: 'ring-amber-500/30',
          }
        : {
            bar: 'bg-rose-500',
            text: 'text-rose-600 dark:text-rose-400',
            ring: 'ring-rose-500/30',
          };

  return (
    <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-full ring-2 ${tone.ring}`}
          >
            <Sparkles className={`size-5 ${tone.text}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">{titleLabel}</p>
            <p className="text-muted-foreground text-xs">{tipLabel}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${tone.text}`}>{score}%</p>
          {missingCount > 0 ? (
            <p className="text-muted-foreground text-[10px]">
              {missingCount} {locale === 'ar' ? 'عنصر ناقص' : 'missing'}
            </p>
          ) : null}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={`h-full ${tone.bar} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Category breakdown chips */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => {
          const pct = c.total === 0 ? 100 : Math.round((c.filled / c.total) * 100);
          const done = c.missing.length === 0;
          return (
            <span
              key={c.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                done
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-muted-foreground/20'
              }`}
            >
              {done ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
              ) : (
                <Circle className="size-3 opacity-40" />
              )}
              {locale === 'ar' ? c.label_ar : c.label_en} — {pct}%
            </span>
          );
        })}
      </div>

      {/* Expandable missing-items checklist */}
      {missingCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
        >
          <ChevronDown
            className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          {openDetailsLabel}
        </button>
      ) : null}

      {expanded && missingCount > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories
            .filter((c) => c.missing.length > 0)
            .map((c) => (
              <div key={c.id} className="space-y-1.5">
                <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                  {locale === 'ar' ? c.label_ar : c.label_en}
                </p>
                <ul className="space-y-1">
                  {c.missing.map((m) => (
                    <li key={m.key} className="flex items-start gap-1.5 text-xs">
                      <Circle className="mt-0.5 size-3 shrink-0 opacity-40" />
                      <span>{locale === 'ar' ? m.label_ar : m.label_en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      ) : null}
    </section>
  );
}
