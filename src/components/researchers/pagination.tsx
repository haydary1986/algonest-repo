'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import type { DirectoryCursor } from '@/lib/directory/types';
import { encodeCursor } from '@/lib/directory/url';

interface PaginationProps {
  hasPrevious: boolean;
  nextCursor: DirectoryCursor | null;
}

export function Pagination({ hasPrevious, nextCursor }: PaginationProps) {
  const t = useTranslations('directory.pagination');
  const router = useRouter();
  const [, startTransition] = useTransition();

  function goNext() {
    if (!nextCursor) return;
    const params = new URLSearchParams(window.location.search);
    params.set('cursor', encodeCursor(nextCursor));
    startTransition(() => {
      router.replace(`/researchers?${params.toString()}`);
    });
  }

  function goPrevious() {
    if (typeof window === 'undefined') return;
    window.history.back();
  }

  if (!hasPrevious && !nextCursor) return null;

  return (
    <nav className="mt-8 flex items-center justify-between gap-2" aria-label="Pagination">
      <Button variant="outline" size="sm" onClick={goPrevious} disabled={!hasPrevious}>
        <ChevronLeft className="size-4 rtl:rotate-180" />
        {t('previous')}
      </Button>
      <Button variant="outline" size="sm" onClick={goNext} disabled={!nextCursor}>
        {t('next')}
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
    </nav>
  );
}
