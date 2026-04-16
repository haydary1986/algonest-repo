import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// Official UN SDG colours.
const SDG_COLORS: Record<number, string> = {
  1: '#E5243B',
  2: '#DDA63A',
  3: '#4C9F38',
  4: '#C5192D',
  5: '#FF3A21',
  6: '#26BDE2',
  7: '#FCC30B',
  8: '#A21942',
  9: '#FD6925',
  10: '#DD1367',
  11: '#FD9D24',
  12: '#BF8B2E',
  13: '#3F7E44',
  14: '#0A97D9',
  15: '#56C02B',
  16: '#00689D',
  17: '#19486A',
};

export async function SdgGrid() {
  const t = await getTranslations('landing.sdg');

  return (
    <section>
      <div className="container mx-auto px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{t('subtitle')}</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-9">
          {Array.from({ length: 17 }, (_, i) => i + 1).map((number) => {
            const color = SDG_COLORS[number] ?? '#666';
            const goalKey = String(number) as
              | '1'
              | '2'
              | '3'
              | '4'
              | '5'
              | '6'
              | '7'
              | '8'
              | '9'
              | '10'
              | '11'
              | '12'
              | '13'
              | '14'
              | '15'
              | '16'
              | '17';
            return (
              <li key={number}>
                <Link
                  href={`/sdg/${number}`}
                  aria-label={t('explore', { number })}
                  className="group focus-visible:ring-ring relative block aspect-square overflow-hidden rounded-lg p-3 text-white transition-transform hover:scale-[1.04] focus-visible:ring-2"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-xl font-bold">{number}</span>
                  <span className="absolute inset-x-2 bottom-2 text-[10px] leading-tight font-medium opacity-90 group-hover:opacity-100">
                    {t(`goals.${goalKey}`)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
