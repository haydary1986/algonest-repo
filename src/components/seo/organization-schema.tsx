import { JsonLd } from './json-ld';
import { siteUrl } from '@/lib/seo/site';

// Task 76 — Organization JSON-LD on the landing page.
export function OrganizationSchema() {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Algonest',
        alternateName: 'عش الخوارزميات',
        url,
        sameAs: ['https://algonest.tech'],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IQ',
          addressLocality: 'Baghdad',
        },
      }}
    />
  );
}
