'use client';

import { useEffect, useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';

interface SearchInputProps {
  initialValue: string;
}

export function SearchInput({ initialValue }: SearchInputProps) {
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
      if (value.trim()) params.set('q', value.trim());
      else params.delete('q');
      const qs = params.toString();
      startTransition(() => {
        router.replace(`/search${qs ? `?${qs}` : ''}`);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [value, initialValue, router]);

  return (
    <div className="relative w-full max-w-lg">
      <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search researchers by name or bio..."
        className="ps-9"
        aria-label="Search researchers"
      />
    </div>
  );
}
