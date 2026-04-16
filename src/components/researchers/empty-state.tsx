'use client';

import { SearchX } from 'lucide-react';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

export function EmptyState() {
  const t = useTranslations('directory.empty');
  const router = useRouter();
  const [, startTransition] = useTransition();

  function clearAll() {
    startTransition(() => {
      router.replace('/researchers');
    });
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <SearchX className="text-muted-foreground size-10" />
      <h3 className="text-lg font-semibold">{t('title')}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{t('body')}</p>
      <Button variant="outline" size="sm" onClick={clearAll}>
        {t('cta')}
      </Button>
    </div>
  );
}
