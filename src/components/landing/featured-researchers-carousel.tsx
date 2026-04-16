'use client';

import { useTranslations } from 'next-intl';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

export interface FeaturedResearcher {
  id: string;
  username: string;
  fullNameEn: string;
  fullNameAr: string;
  profileImage: string | null;
  hIndex: number | null;
  publicationsCount: number | null;
}

interface Props {
  researchers: FeaturedResearcher[];
  locale: Locale;
}

export function FeaturedResearchersCarousel({ researchers, locale }: Props) {
  const t = useTranslations('landing.featured');
  const isRtl = locale === 'ar';

  return (
    <Carousel
      opts={{ align: 'start', loop: false, direction: isRtl ? 'rtl' : 'ltr' }}
      className="mx-auto max-w-5xl"
    >
      <CarouselContent>
        {researchers.map((r) => {
          const name = locale === 'ar' ? r.fullNameAr : r.fullNameEn;
          const initial = name.slice(0, 1);
          return (
            <CarouselItem key={r.id} className="md:basis-1/2 lg:basis-1/3">
              <Card className="h-full">
                <CardHeader className="items-center text-center">
                  <Avatar className="size-20">
                    {r.profileImage ? <AvatarImage src={r.profileImage} alt="" /> : null}
                    <AvatarFallback className="text-lg">{initial}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="mt-3 text-base">{name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3">
                  <div className="flex flex-wrap justify-center gap-2">
                    {r.hIndex !== null ? (
                      <Badge variant="secondary">{t('h_index', { value: r.hIndex })}</Badge>
                    ) : null}
                    {r.publicationsCount !== null ? (
                      <Badge variant="outline">
                        {t('publications_count', { count: r.publicationsCount })}
                      </Badge>
                    ) : null}
                  </div>
                  <Link
                    href={`/researcher/${r.username}`}
                    className={buttonVariants({
                      variant: 'outline',
                      size: 'sm',
                      className: 'w-full',
                    })}
                  >
                    {t('view_profile')}
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
