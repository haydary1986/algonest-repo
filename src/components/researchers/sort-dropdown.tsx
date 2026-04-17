'use client';

import { ArrowUpDown } from 'lucide-react';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { DEFAULT_SORT, SORT_KEYS, type SortKey } from '@/lib/directory/types';

interface SortDropdownProps {
  current: SortKey;
}

export function SortDropdown({ current }: SortDropdownProps) {
  const t = useTranslations('directory.sort');
  const router = useRouter();
  const [, startTransition] = useTransition();

  function pick(key: SortKey) {
    if (key === current) return;
    const params = new URLSearchParams(window.location.search);
    if (key === DEFAULT_SORT) params.delete('sort');
    else params.set('sort', key);
    params.delete('cursor');
    const qs = params.toString();
    startTransition(() => {
      router.replace(`/researchers${qs ? `?${qs}` : ''}`);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <ArrowUpDown className="size-4" />
        <span className="hidden sm:inline">{t('label')}:</span>
        <span>{t(current)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {SORT_KEYS.map((key) => (
          <DropdownMenuItem key={key} onClick={() => pick(key)} data-active={key === current}>
            {t(key)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
