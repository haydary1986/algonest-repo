'use client';

import { useRef, useState, useTransition } from 'react';
import { ExternalLink, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type UploadResponse = {
  ok?: boolean;
  error?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  count?: number;
  warnings?: string[];
};

export function ScholarSection() {
  const t = useTranslations('import.scholar');
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [scholarId, setScholarId] = useState('');

  function openScholarProfile() {
    const trimmed = scholarId.trim();
    const url = trimmed
      ? `https://scholar.google.com/citations?user=${encodeURIComponent(trimmed)}&hl=en`
      : 'https://scholar.google.com/';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function uploadCsv(file: File) {
    startTransition(async () => {
      const text = await file.text();
      const res = await fetch('/api/import/scholar-csv', { method: 'POST', body: text });
      const json = (await res.json().catch(() => ({}))) as UploadResponse;
      if (!res.ok || !json.ok) {
        toast.error(json.error === 'empty' ? t('upload.error_empty') : t('upload.error_format'));
        return;
      }
      toast.success(
        t('upload.ok', {
          inserted: json.inserted ?? 0,
          updated: json.updated ?? 0,
          skipped: json.skipped ?? 0,
        }),
      );
      if (json.warnings && json.warnings.length > 0) {
        toast.warning(
          t('upload.warnings', {
            count: json.warnings.length,
            first: json.warnings[0] ?? '',
          }),
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground text-sm">{t('intro')}</p>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">{t('open_profile.title')}</h3>
          <p className="text-muted-foreground text-xs">{t('open_profile.intro')}</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              inputMode="text"
              value={scholarId}
              onChange={(e) => setScholarId(e.target.value)}
              placeholder={t('open_profile.id_placeholder')}
              className="border-input bg-background min-w-0 flex-1 rounded-md border px-3 py-1.5 text-sm"
            />
            <Button type="button" variant="outline" size="sm" onClick={openScholarProfile}>
              <ExternalLink className="size-4" />
              {t('open_profile.open')}
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet
              className="text-emerald-600 dark:text-emerald-400 size-5"
              aria-hidden
            />
            <h3 className="text-sm font-semibold">{t('csv.title')}</h3>
          </div>
          <p className="text-muted-foreground text-sm">{t('csv.intro')}</p>
          <ol className="text-muted-foreground ms-5 list-decimal space-y-1 text-sm">
            <li>{t('csv.step_1')}</li>
            <li>{t('csv.step_2')}</li>
            <li>{t('csv.step_3')}</li>
            <li>{t('csv.step_4')}</li>
          </ol>
          <input
            ref={csvFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCsv(f);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isPending}
            onClick={() => csvFileRef.current?.click()}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            {isPending ? t('upload.uploading') : t('csv.upload_button')}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
