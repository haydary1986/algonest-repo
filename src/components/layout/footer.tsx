import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function Footer() {
  const tFooter = await getTranslations('footer');
  const tNav = await getTranslations('navigation');
  const tCommon = await getTranslations('common');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 mt-auto border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="text-base font-semibold">{tCommon('app_full_name')}</p>
            <p className="text-muted-foreground mt-2 text-sm">{tFooter('address')}</p>
          </div>

          <nav className="text-sm">
            <p className="mb-3 text-xs font-semibold tracking-wider uppercase">{tNav('home')}</p>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <Link href="/researchers" className="hover:text-foreground">
                  {tNav('researchers')}
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="hover:text-foreground">
                  {tNav('analytics')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="text-sm">
            <p className="mb-3 text-xs font-semibold tracking-wider uppercase">
              {tFooter('about')}
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  {tFooter('about')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  {tFooter('contact')}
                </Link>
              </li>
            </ul>
          </nav>

          <nav className="text-sm">
            <p className="mb-3 text-xs font-semibold tracking-wider uppercase">
              {tFooter('privacy')}
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  {tFooter('privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground">
                  {tFooter('terms')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="text-muted-foreground mt-8 border-t pt-6 text-center text-xs">
          {tFooter('copyright', { year })}
        </p>
      </div>
    </footer>
  );
}
