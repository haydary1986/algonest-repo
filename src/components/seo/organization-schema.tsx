import { JsonLd } from './json-ld';
import { siteUrl } from '@/lib/seo/site';

// Task 76 — Organization JSON-LD on the landing page.
export function OrganizationSchema() {
  const url = siteUrl();
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'CollegeOrUniversity',
        name: 'Al-Iraqia University',
        alternateName: 'الجامعة العراقية',
        url,
        sameAs: ['https://aliraqia.edu.iq', 'https://aliraqia.edu.iq'],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'IQ',
          addressLocality: 'Baghdad',
        },
      }}
    />
  );
}
