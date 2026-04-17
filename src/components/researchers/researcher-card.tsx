import { getTranslations } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { BookOpen, Quote, TrendingUp, Building2 } from 'lucide-react';
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

  const hIndex = researcher.scopus_h_index ?? researcher.wos_h_index;
  const pubCount = researcher.scopus_publications_count ?? researcher.wos_publications_count;
  const hasMetrics = hIndex !== null || pubCount !== null;

  return (
    <Link
      href={`/researcher/${researcher.username}`}
      className="group focus-visible:ring-ring rounded-xl focus-visible:ring-2 outline-none"
      aria-label={t('view_profile')}
    >
      <Card className="h-full overflow-hidden border-transparent bg-gradient-to-b from-card to-card transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5 group-hover:-translate-y-0.5">
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 transition-opacity group-hover:opacity-100" />

        <CardContent className="flex flex-col items-center gap-4 px-5 pb-5 pt-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="size-20 ring-2 ring-border transition-all group-hover:ring-primary/40 group-hover:ring-4">
              {researcher.profile_image ? (
                <AvatarImage src={researcher.profile_image} alt="" className="object-cover" />
              ) : null}
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {hIndex !== null && hIndex > 0 ? (
              <div className="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-md">
                {hIndex}
              </div>
            ) : null}
          </div>

          {/* Name & Title */}
          <div className="w-full text-center space-y-1">
            <h3 className="text-sm font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">
              {name}
            </h3>
            {title ? <p className="text-xs text-muted-foreground">{title}</p> : null}
          </div>

          {/* College & Department */}
          {(college || department) && (
            <div className="flex items-center gap-1.5 text-center">
              <Building2 className="size-3 shrink-0 text-muted-foreground/60" />
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                {department ?? college}
              </p>
            </div>
          )}

          {/* Metrics */}
          {hasMetrics ? (
            <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
              {hIndex !== null ? (
                <div className="flex items-center gap-1 text-[11px]">
                  <TrendingUp className="size-3 text-primary" />
                  <span className="font-semibold tabular-nums">{hIndex}</span>
                  <span className="text-muted-foreground">h</span>
                </div>
              ) : null}
              {pubCount !== null ? (
                <div className="flex items-center gap-1 text-[11px]">
                  <BookOpen className="size-3 text-primary" />
                  <span className="font-semibold tabular-nums">{pubCount}</span>
                  <span className="text-muted-foreground">{locale === 'ar' ? 'بحث' : 'pubs'}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
