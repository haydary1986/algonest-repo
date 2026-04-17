'use client';

import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { translateFieldName, translateErrorMessage } from '@/lib/manage/error-messages';

export interface FieldErrorEntry {
  field: string;
  message: string;
}

interface ErrorsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: FieldErrorEntry[];
}

export function ErrorsDialog({ open, onOpenChange, errors }: ErrorsDialogProps) {
  const t = useTranslations('manage');
  const locale = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            {t('errors_title')}
          </DialogTitle>
          <DialogDescription>{t('errors_body')}</DialogDescription>
        </DialogHeader>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {errors.map((e, i) => (
            <li
              key={`${e.field}-${i}`}
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              <div>
                <span className="text-sm font-medium">{translateFieldName(e.field, locale)}</span>
                <span className="text-sm text-destructive">
                  {' '}
                  — {translateErrorMessage(e.message, locale)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
