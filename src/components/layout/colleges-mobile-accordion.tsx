'use client';

import { useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { CollegeWithDepts } from './colleges-mega-menu';

interface CollegesMobileAccordionProps {
  label: string;
  colleges: CollegeWithDepts[];
  locale: 'ar' | 'en';
}

export function CollegesMobileAccordion({ label, colleges, locale }: CollegesMobileAccordionProps) {
  const [openTop, setOpenTop] = useState(false);
  const [openCollege, setOpenCollege] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpenTop((v) => !v)}
        className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
        aria-expanded={openTop}
      >
        <Building2 className="size-4 opacity-60" />
        <span className="flex-1 text-start">{label}</span>
        <ChevronDown className={`size-4 transition-transform ${openTop ? 'rotate-180' : ''}`} />
      </button>

      {openTop ? (
        <ul className="ms-3 space-y-0.5 border-s ps-2">
          {colleges.map((c) => {
            const collegeName = locale === 'ar' ? c.name_ar || c.name_en : c.name_en || c.name_ar;
            const isOpen = openCollege === c.slug;
            return (
              <li key={c.slug}>
                <div className="flex items-center">
                  <Link
                    href={`/college/${c.slug}`}
                    className="hover:bg-accent flex-1 rounded-md px-2 py-1.5 text-xs font-medium"
                  >
                    {collegeName}
                  </Link>
                  {c.departments.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setOpenCollege(isOpen ? null : c.slug)}
                      className="hover:bg-accent rounded-md p-1.5"
                      aria-expanded={isOpen}
                      aria-label={collegeName}
                    >
                      <ChevronDown
                        className={`size-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  ) : null}
                </div>
                {isOpen ? (
                  <ul className="ms-3 space-y-0.5 border-s ps-2 pb-1">
                    {c.departments.map((d) => {
                      const deptName =
                        locale === 'ar' ? d.name_ar || d.name_en : d.name_en || d.name_ar;
                      return (
                        <li key={d.slug}>
                          <Link
                            href={`/department/${d.slug}`}
                            className="text-muted-foreground hover:bg-accent hover:text-foreground block truncate rounded-md px-2 py-1 text-xs"
                          >
                            {deptName}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
