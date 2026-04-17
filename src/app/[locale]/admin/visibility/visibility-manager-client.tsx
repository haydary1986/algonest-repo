'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { setVisibilityOverride } from '@/lib/admin/actions';

interface Researcher {
  id: string;
  full_name_en: string | null;
  full_name_ar: string | null;
  username: string | null;
  is_public: boolean;
  admin_visibility_override: string | null;
}

interface Translations {
  name: string;
  username: string;
  status: string;
  override: string;
  none: string;
  forceShow: string;
  forceHide: string;
  public: string;
  private: string;
  success: string;
  error: string;
  noResearchers: string;
}

interface VisibilityManagerClientProps {
  researchers: Researcher[];
  translations: Translations;
}

export function VisibilityManagerClient({
  researchers,
  translations: t,
}: VisibilityManagerClientProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(id: string, value: string | null) {
    if (value === null) return;
    const override = value === '__null__' ? null : (value as 'force_show' | 'force_hide');
    startTransition(async () => {
      const result = await setVisibilityOverride(id, override);
      if (result.ok) {
        toast.success(t.success);
      } else {
        toast.error(result.error ?? t.error);
      }
    });
  }

  if (researchers.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.noResearchers}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-start font-medium">{t.name}</th>
            <th className="px-4 py-2 text-start font-medium">{t.username}</th>
            <th className="px-4 py-2 text-start font-medium">{t.status}</th>
            <th className="px-4 py-2 text-start font-medium">{t.override}</th>
          </tr>
        </thead>
        <tbody>
          {researchers.map((r) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className="px-4 py-2">{r.full_name_en ?? r.full_name_ar ?? '—'}</td>
              <td className="px-4 py-2 text-muted-foreground">{r.username ?? '—'}</td>
              <td className="px-4 py-2">
                <Badge variant={r.is_public ? 'default' : 'secondary'}>
                  {r.is_public ? t.public : t.private}
                </Badge>
              </td>
              <td className="px-4 py-2">
                <OverrideSelect
                  researcherId={r.id}
                  initial={r.admin_visibility_override}
                  translations={t}
                  disabled={isPending}
                  onSave={handleChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const OVERRIDE_LABELS: Record<
  string,
  keyof Pick<Translations, 'none' | 'forceShow' | 'forceHide'>
> = {
  __null__: 'none',
  force_show: 'forceShow',
  force_hide: 'forceHide',
};

function OverrideSelect({
  researcherId,
  initial,
  translations: t,
  disabled,
  onSave,
}: {
  researcherId: string;
  initial: string | null;
  translations: Translations;
  disabled: boolean;
  onSave: (id: string, value: string | null) => void;
}) {
  const [value, setValue] = useState(initial ?? '__null__');

  function handleChange(v: string | null) {
    const next = v ?? '__null__';
    setValue(next);
    onSave(researcherId, v);
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger size="sm">
        <span className="flex flex-1 text-start">{t[OVERRIDE_LABELS[value] ?? 'none']}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__null__">{t.none}</SelectItem>
        <SelectItem value="force_show">{t.forceShow}</SelectItem>
        <SelectItem value="force_hide">{t.forceHide}</SelectItem>
      </SelectContent>
    </Select>
  );
}
