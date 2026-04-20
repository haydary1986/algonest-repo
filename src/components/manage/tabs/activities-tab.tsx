'use client';

import { useState, useTransition } from 'react';
import { Pencil, Plus, Trash } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { translateFieldName, translateErrorMessage } from '@/lib/manage/error-messages';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveActivity, deleteActivity } from '@/lib/manage/actions';
import type { ActivityRow, ActivityType } from '@/lib/profile/types';

interface ActivitiesTabProps {
  activities: ActivityRow[];
}

// Map of activity type → section order, so the UI always lists the three
// buckets (editorial / conferences / memberships) in the same order even
// when any is empty.
const TYPE_ORDER: ActivityType[] = ['editorial_board', 'conference', 'membership'];

export function ActivitiesTab({ activities }: ActivitiesTabProps) {
  const t = useTranslations('manage.activities');

  const byType: Record<ActivityType, ActivityRow[]> = {
    editorial_board: [],
    conference: [],
    membership: [],
  };
  for (const a of activities) {
    byType[a.type].push(a);
  }

  return (
    <div className="space-y-6">
      {TYPE_ORDER.map((type) => (
        <ActivitySection key={type} type={type} items={byType[type]} sectionLabel={t(type)} />
      ))}
    </div>
  );
}

interface ActivitySectionProps {
  type: ActivityType;
  items: ActivityRow[];
  sectionLabel: string;
}

function ActivitySection({ type, items, sectionLabel }: ActivitySectionProps) {
  const t = useTranslations('manage.activities');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [editing, setEditing] = useState<Partial<ActivityRow> | null>(null);
  const [open, setOpen] = useState(false);

  function openAdd() {
    setEditing({
      type,
      title_en: '',
      title_ar: '',
      role_en: '',
      role_ar: '',
      organization_en: '',
      organization_ar: '',
      location: '',
      start_year: null,
      end_year: null,
      url: '',
      description_en: '',
      description_ar: '',
    });
    setOpen(true);
  }
  function openEdit(item: ActivityRow) {
    setEditing(item);
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setEditing(null);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm uppercase tracking-wide">{sectionLabel}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          {t('add')}
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        ) : (
          <ul className="divide-y">
            {items.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {isAr ? a.title_ar || a.title_en : a.title_en}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {(isAr ? a.role_ar || a.role_en : a.role_en) ?? ''}
                    {(a.role_en || a.role_ar) && (a.organization_en || a.organization_ar)
                      ? ' · '
                      : ''}
                    {isAr ? a.organization_ar || a.organization_en : a.organization_en}
                    {yearRange(a.start_year, a.end_year)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => openEdit(a)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <DeleteButton id={a.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(v) : close())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{sectionLabel}</DialogTitle>
          </DialogHeader>
          {editing ? <ActivityForm initial={editing} onClose={close} /> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function yearRange(start: number | null, end: number | null): string {
  if (!start && !end) return '';
  if (start && end) return ` · ${start}–${end}`;
  if (start) return ` · ${start}–`;
  return ` · –${end ?? ''}`;
}

function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const r = await deleteActivity(id);
          if (!r.ok) toast.error('Delete failed');
        })
      }
    >
      <Trash className="text-destructive size-3.5" />
    </Button>
  );
}

interface ActivityFormProps {
  initial: Partial<ActivityRow>;
  onClose: () => void;
}

function ActivityForm({ initial, onClose }: ActivityFormProps) {
  const t = useTranslations('manage.activities');
  const tManage = useTranslations('manage');
  const locale = useLocale();
  const [values, setValues] = useState<Partial<ActivityRow>>(initial);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ActivityRow>(k: K, v: ActivityRow[K] | null): void {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function submit() {
    startTransition(async () => {
      const r = await saveActivity(values as Parameters<typeof saveActivity>[0]);
      if (!r.ok) {
        toast.error(
          r.error ??
            Object.entries(r.fieldErrors ?? {})
              .map(
                ([f, m]) => translateFieldName(f, locale) + ': ' + translateErrorMessage(m, locale),
              )
              .join(' | '),
        );
        return;
      }
      toast.success(tManage('saved'));
      onClose();
    });
  }

  const type = values.type ?? 'editorial_board';

  return (
    <div className="space-y-3">
      <Select value={type} onValueChange={(v) => update('type', v as ActivityType)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="editorial_board">{t('editorial_board')}</SelectItem>
          <SelectItem value="conference">{t('conference')}</SelectItem>
          <SelectItem value="membership">{t('membership')}</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder={t('placeholder_title_en')}
        value={String(values.title_en ?? '')}
        onChange={(e) => update('title_en', e.target.value)}
      />
      <Input
        placeholder={t('placeholder_title_ar')}
        dir="rtl"
        value={String(values.title_ar ?? '')}
        onChange={(e) => update('title_ar', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder={t('placeholder_role_en')}
          value={String(values.role_en ?? '')}
          onChange={(e) => update('role_en', e.target.value)}
        />
        <Input
          placeholder={t('placeholder_role_ar')}
          dir="rtl"
          value={String(values.role_ar ?? '')}
          onChange={(e) => update('role_ar', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder={t('placeholder_org_en')}
          value={String(values.organization_en ?? '')}
          onChange={(e) => update('organization_en', e.target.value)}
        />
        <Input
          placeholder={t('placeholder_org_ar')}
          dir="rtl"
          value={String(values.organization_ar ?? '')}
          onChange={(e) => update('organization_ar', e.target.value)}
        />
      </div>

      <Input
        placeholder={t('placeholder_location')}
        value={String(values.location ?? '')}
        onChange={(e) => update('location', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          inputMode="numeric"
          placeholder={t('placeholder_start_year')}
          value={values.start_year ?? ''}
          onChange={(e) => update('start_year', e.target.value ? Number(e.target.value) : null)}
        />
        <Input
          type="number"
          inputMode="numeric"
          placeholder={t('placeholder_end_year')}
          value={values.end_year ?? ''}
          onChange={(e) => update('end_year', e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      <Input
        placeholder={t('placeholder_url')}
        type="url"
        value={String(values.url ?? '')}
        onChange={(e) => update('url', e.target.value)}
      />

      <Textarea
        placeholder={t('placeholder_desc_en')}
        rows={2}
        value={String(values.description_en ?? '')}
        onChange={(e) => update('description_en', e.target.value)}
      />
      <Textarea
        placeholder={t('placeholder_desc_ar')}
        rows={2}
        dir="rtl"
        value={String(values.description_ar ?? '')}
        onChange={(e) => update('description_ar', e.target.value)}
      />

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {tManage('discard')}
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending ? tManage('saving') : tManage('save')}
        </Button>
      </DialogFooter>
    </div>
  );
}
