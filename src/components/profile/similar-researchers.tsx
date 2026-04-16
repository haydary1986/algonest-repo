import { createClient } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

interface SimilarRow {
  id: string;
  username: string;
  full_name_en: string;
  full_name_ar: string;
  profile_image: string | null;
  similarity: number;
}

interface SimilarResearchersProps {
  researcherId: string;
  locale: Locale;
}

export async function SimilarResearchers({ researcherId, locale }: SimilarResearchersProps) {
  let rows: readonly SimilarRow[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc('find_similar_researchers', {
      p_researcher_id: researcherId,
      match_limit: 5,
    });
    rows = (data ?? []) as readonly SimilarRow[];
  } catch {
    return null;
  }

  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold">Similar researchers</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {rows.map((r) => {
          const name = locale === 'ar' ? r.full_name_ar : r.full_name_en;
          const pct = Math.round(r.similarity * 100);

          return (
            <Link
              key={r.id}
              href={`/researcher/${r.username}`}
              className="flex min-w-[140px] flex-col items-center gap-2 rounded-lg border p-3 transition-shadow hover:shadow-sm"
            >
              <Avatar className="size-12">
                {r.profile_image ? <AvatarImage src={r.profile_image} alt="" /> : null}
                <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <p className="max-w-[120px] truncate text-sm font-medium">{name}</p>
              <Badge variant="secondary">{pct}% match</Badge>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
