import { ExternalLink } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import type { ActivityRow, ActivityType, ProfilePayload } from '@/lib/profile/types';

interface TabActivitiesProps {
  payload: ProfilePayload;
}

const TYPE_ORDER: ActivityType[] = ['editorial_board', 'conference', 'membership'];

export async function TabActivities({ payload }: TabActivitiesProps) {
  const t = await getTranslations('profile.activities');
  const locale = (await getLocale()) as 'ar' | 'en';
  const activities = payload.activities ?? [];

  const byType: Record<ActivityType, ActivityRow[]> = {
    editorial_board: [],
    conference: [],
    membership: [],
  };
  for (const a of activities) {
    byType[a.type].push(a);
  }

  const sectionLabels: Record<ActivityType, string> = {
    editorial_board: t('editorial'),
    conference: t('conferences'),
    membership: t('memberships'),
  };

  return (
    <div className="space-y-6">
      {TYPE_ORDER.map((type) => {
        const items = byType[type];
        return (
          <section key={type}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">
              {sectionLabels[type]}
            </h3>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('empty')}</p>
            ) : (
              <ul className="divide-y">
                {items.map((a) => {
                  const title = locale === 'ar' ? a.title_ar || a.title_en : a.title_en;
                  const role = locale === 'ar' ? a.role_ar || a.role_en : a.role_en || a.role_ar;
                  const org =
                    locale === 'ar'
                      ? a.organization_ar || a.organization_en
                      : a.organization_en || a.organization_ar;
                  const description =
                    locale === 'ar'
                      ? a.description_ar || a.description_en
                      : a.description_en || a.description_ar;
                  return (
                    <li key={a.id} className="space-y-1 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{title}</p>
                          {role || org ? (
                            <p className="text-muted-foreground text-xs">
                              {role}
                              {role && org ? ' · ' : ''}
                              {org}
                              {a.location ? ` · ${a.location}` : ''}
                            </p>
                          ) : null}
                        </div>
                        {a.url ? (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener"
                            className="text-primary shrink-0 text-xs"
                            aria-label="External link"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        ) : null}
                      </div>
                      {a.start_year || a.end_year ? (
                        <p className="text-muted-foreground text-[11px] tabular-nums">
                          {a.start_year ?? ''}
                          {a.start_year && a.end_year ? '–' : ''}
                          {a.end_year ?? (a.start_year ? '—' : '')}
                        </p>
                      ) : null}
                      {description ? (
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {description}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
