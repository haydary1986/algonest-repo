'use client';

import { useEffect, useRef, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';

export interface CollegeWithDepts {
  slug: string;
  name_en: string;
  name_ar: string;
  departments: Array<{
    slug: string;
    name_en: string;
    name_ar: string;
  }>;
}

interface CollegesMegaMenuProps {
  label: string;
  seeAllLabel: string;
  departmentsLabel: string;
  colleges: CollegeWithDepts[];
  locale: 'ar' | 'en';
}

export function CollegesMegaMenu({
  label,
  seeAllLabel,
  departmentsLabel,
  colleges,
  locale,
}: CollegesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Close the panel whenever navigation happens (clicking any link inside).
  // Reset-on-prop-change pattern instead of an effect so we don't trip the
  // set-state-in-effect rule.
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    if (open) setOpen(false);
  }

  // Close on Esc and on click outside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }
  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`fixed left-1/2 top-16 z-40 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 origin-top transition-all duration-200 ${
          open
            ? 'pointer-events-auto scale-100 opacity-100 translate-y-0'
            : 'pointer-events-none scale-95 opacity-0 -translate-y-2'
        }`}
        role="menu"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <div className="bg-background/95 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-lg">
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="from-primary/20 to-primary/5 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br">
                  <Building2 className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">
                    {colleges.length} · {departmentsLabel}
                  </p>
                </div>
              </div>
              <Link
                href="/colleges"
                className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
              >
                {seeAllLabel} →
              </Link>
            </div>
          </div>

          <div className="grid max-h-[60vh] gap-x-6 gap-y-5 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
            {colleges.map((c, idx) => {
              const collegeName = locale === 'ar' ? c.name_ar || c.name_en : c.name_en || c.name_ar;
              return (
                <div
                  key={c.slug}
                  className="group space-y-2"
                  style={{
                    animation: open ? `megaMenuFadeIn 280ms ${idx * 30}ms both` : undefined,
                  }}
                >
                  <Link
                    href={`/college/${c.slug}`}
                    className="group-hover:text-primary hover:text-primary inline-flex items-center gap-2 text-sm font-semibold tracking-tight transition-colors"
                  >
                    <span className="bg-primary/70 group-hover:bg-primary block size-1.5 rounded-full transition-colors" />
                    {collegeName}
                  </Link>
                  {c.departments.length > 0 ? (
                    <ul className="ms-3.5 space-y-1 border-s ps-3">
                      {c.departments.map((d) => {
                        const deptName =
                          locale === 'ar' ? d.name_ar || d.name_en : d.name_en || d.name_ar;
                        return (
                          <li key={d.slug}>
                            <Link
                              href={`/department/${d.slug}`}
                              className="text-muted-foreground hover:text-foreground block truncate text-xs transition-colors hover:translate-x-0.5 rtl:hover:-translate-x-0.5"
                            >
                              {deptName}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes megaMenuFadeIn {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
