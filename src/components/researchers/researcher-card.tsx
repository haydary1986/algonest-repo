import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import type { BilingualLookup, DirectoryRow } from '@/lib/directory/types';

interface ResearcherCardProps {
  researcher: DirectoryRow;
  locale: Locale;
  collegeById: Map<string, BilingualLookup>;
  departmentById: Map<string, BilingualLookup>;
  academicTitleById: Map<string, BilingualLookup>;
}

function pickName(item: BilingualLookup | undefined, locale: Locale): string | null {
  if (!item) return null;
  return locale === 'ar' ? item.name_ar : item.name_en;
}

export async function ResearcherCard({
  researcher,
  locale,
  collegeById,
  departmentById,
  academicTitleById,
}: ResearcherCardProps) {
  const t = await getTranslations('directory.card');
  const name = locale === 'ar' ? researcher.full_name_ar : researcher.full_name_en;
  const title = pickName(
    researcher.academic_title_id ? academicTitleById.get(researcher.academic_title_id) : undefined,
    locale,
  );
  const college = pickName(
    researcher.college_id ? collegeById.get(researcher.college_id) : undefined,
    locale,
  );
  const department = pickName(
    researcher.department_id ? departmentById.get(researcher.department_id) : undefined,
    locale,
  );

  return (
    <Link
      href={`/researcher/${researcher.username}`}
      className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2"
      aria-label={t('view_profile')}
    >
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="flex-row items-center gap-3">
          <Avatar className="size-12">
            {researcher.profile_image ? (
              <AvatarImage src={researcher.profile_image} alt="" />
            ) : null}
            <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-tight">{name}</p>
            <p className="text-muted-foreground truncate text-xs">{title ?? t('no_title')}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(college || department) && (
            <p className="text-muted-foreground truncate text-xs">
              {[department, college].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {researcher.scopus_h_index !== null ? (
              <Badge variant="secondary">
                {t('metrics.h_index', { value: researcher.scopus_h_index })}
              </Badge>
            ) : null}
            {researcher.scopus_publications_count !== null ? (
              <Badge variant="outline">
                {t('metrics.publications', { count: researcher.scopus_publications_count })}
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
