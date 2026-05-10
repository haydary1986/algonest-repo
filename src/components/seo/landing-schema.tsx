import { JsonLd } from './json-ld';
import { siteUrl } from '@/lib/seo/site';

// Extra JSON-LD for the landing page: WebSite with SearchAction (enables
// Google's site-links search box) + a SoftwareApplication description for
// RIS itself (helps Google understand the product) + a FAQPage block.
//
// All three @graph entries are tuned to surface the platform under
// "digital repository" / "institutional repository" / "RIS" / "مستودع رقمي"
// queries in addition to the Algonest brand. Bilingual hints (alternateName,
// AR FAQ entries) help the Arabic search index.

export function LandingSchema() {
  const url = siteUrl();

  const webSite = {
    '@type': 'WebSite',
    '@id': `${url}/#website`,
    url,
    name: 'Algonest Digital Repository',
    alternateName: [
      'Algonest RIS',
      'Algonest Researcher Information System',
      'Algonest Researcher Directory',
      'المستودع الرقمي — Algonest',
      'دليل باحثي Algonest',
      'نظام معلومات الباحثين',
    ],
    description:
      'Bilingual digital repository and Researcher Information System (RIS): researcher directory, academic profiles, publications, analytics, and CV generator.',
    inLanguage: ['en', 'ar'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/en/researchers?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const softwareApplication = {
    '@type': 'SoftwareApplication',
    '@id': `${url}/#app`,
    name: 'Algonest RIS — Digital Repository & Researcher Information System',
    alternateName: [
      'Algonest Digital Repository',
      'مستودع Algonest الرقمي',
      'نظام معلومات الباحثين',
    ],
    applicationCategory: 'EducationalApplication',
    applicationSubCategory: 'Digital Repository',
    operatingSystem: 'Web',
    url,
    description:
      'A bilingual (Arabic / English) institutional digital repository and Researcher Information System. Provides a public, searchable directory of researchers, citable academic profile pages indexed by Google as Person + ProfilePage, publication tracking with Scopus / Web of Science / OpenAlex / ORCID integration, an analytics dashboard, and a one-click CV generator.',
    featureList: [
      'Public digital repository with full-text search',
      'Bilingual researcher directory (Arabic + English) with college and department filters',
      'Citable academic profile pages with Person + ProfilePage structured data',
      'Publication tracking from Scopus, Web of Science, OpenAlex, ORCID, Google Scholar',
      'Analytics dashboard: h-index distribution, citations, SDG alignment, college breakdown',
      'One-click print-ready CV generator synced with profile data',
      'Dynamic OpenGraph images per researcher',
      'Sitemap, hreflang, IndexNow, and Person/Organization JSON-LD baked in',
    ],
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    creator: {
      '@type': 'Organization',
      name: 'Algonest',
      url: 'https://algonest.tech',
    },
  };

  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${url}/#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the Algonest Digital Repository?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Algonest is an institutional digital repository and Researcher Information System (RIS). It is a bilingual (Arabic / English) platform that hosts a public, searchable directory of researchers, citable academic profile pages, publication tracking, an analytics dashboard, and a one-click CV generator. The demo runs at repo.algonest.tech.',
        },
      },
      {
        '@type': 'Question',
        name: 'ما هو المستودع الرقمي Algonest؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Algonest هو مستودع رقمي مؤسسي ونظام معلومات الباحثين (RIS). منصّة ثنائية اللغة (عربي/إنجليزي) تضمّ دليلاً عامّاً قابلاً للبحث للباحثين، وصفحات ملفات أكاديمية قابلة للاستشهاد، وتتبّعاً للمنشورات، ولوحة تحليلات، ومولّد سيرة ذاتية بنقرة واحدة. النسخة التجريبية على repo.algonest.tech.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the platform customizable for our university?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes — design, colors, typography, logo, and the feature set are all fully customizable. Each deployment is tailored to the host university\'s brand identity, fields and forms, departments and colleges hierarchy, and existing systems integration. Contact hello@algonest.tech to discuss a deployment.',
        },
      },
      {
        '@type': 'Question',
        name: 'هل المنصّة قابلة للتخصيص لجامعتنا؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'نعم — التصميم والألوان والخطوط والشعار والمميزات قابلة للتخصيص بالكامل. كل نشر يُكيَّف ليلائم هويّة الجامعة المضيفة، وحقولها ونماذجها، وتدرّج كلياتها وأقسامها، والتكامل مع أنظمتها الحالية. للتواصل: hello@algonest.tech.',
        },
      },
      {
        '@type': 'Question',
        name: 'How is a digital repository different from a regular university website?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A digital repository like Algonest stores structured, queryable, citable data about every researcher and every publication — not just a static list of names. Each researcher gets a stable URL, machine-readable structured data (Person, ProfilePage, ScholarlyArticle), and metrics pulled from Scopus / OpenAlex. That makes the institution discoverable not just on its own site, but also in Google Scholar, ORCID search, and AI assistants that index research output.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does every researcher get an academic profile page?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Every faculty member has a dedicated public profile at /{locale}/researcher/{username}. The profile serves as their citable academic identity, indexed by Google with Person and ProfilePage structured data.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can researchers generate a CV from their profile?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes — the platform includes a one-click CV generator. Researchers maintain their data once (bio, publications, experience, skills) and export a print-ready CV directly from their profile without re-keying anything.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are publications and metrics kept up to date?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Researchers can import publications from Google Scholar, ORCID OAuth, or Scopus by Author ID. Scopus, Web of Science, and OpenAlex metrics (h-index, citations, publication count) are pulled via official APIs and cached.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is the directory bilingual?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. The interface and all profile content support Arabic and English with proper RTL layout, hreflang for both languages, and per-locale canonical URLs for SEO.',
        },
      },
    ],
  };

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [webSite, softwareApplication, faqPage],
      }}
    />
  );
}
