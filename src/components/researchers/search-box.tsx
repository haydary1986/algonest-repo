'use client';

import { useEffect, useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';

interface SearchBoxProps {
  initialValue: string;
}

export function SearchBox({ initialValue }: SearchBoxProps) {
  const t = useTranslations('directory');
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (value === initialValue) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value.trim()) params.set('search', value.trim());
      else params.delete('search');
      params.delete('cursor');
      const qs = params.toString();
      startTransition(() => {
        router.replace(`/researchers${qs ? `?${qs}` : ''}`);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [value, initialValue, router]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('search_placeholder')}
        className="ps-9"
        aria-label={t('search_placeholder')}
      />
    </div>
  );
}
