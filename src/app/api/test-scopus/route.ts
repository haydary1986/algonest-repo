import { NextResponse } from 'next/server';
import { getIntegrationValue } from '@/lib/integrations/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = await getIntegrationValue('integration.scopus.api_key');
  if (!apiKey) return NextResponse.json({ error: 'No Scopus API key configured' });

  const tests: Record<string, unknown> = {};

  // Test 1: Scopus Search — count publications by affiliation name
  try {
    const res = await fetch(
      'https://api.elsevier.com/content/search/scopus?query=AFFILORG(Al-Turath%20University)&count=0',
      {
        headers: { 'X-ELS-APIKey': apiKey, Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    if (res.ok) {
      const d = await res.json();
      tests['scopus_search'] = {
        status: 'ok',
        total: d['search-results']?.['opensearch:totalResults'],
      };
    } else {
      tests['scopus_search'] = { status: res.status, error: (await res.text()).slice(0, 200) };
    }
  } catch (e) {
    tests['scopus_search'] = { error: String(e) };
  }

  // Test 2: Try with AF-ID if we know it
  try {
    const res = await fetch(
      'https://api.elsevier.com/content/search/scopus?query=AF-ID(60264strut)&count=0',
      {
        headers: { 'X-ELS-APIKey': apiKey, Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    if (res.ok) {
      const d = await res.json();
      tests['afid_test'] = {
        status: 'ok',
        total: d['search-results']?.['opensearch:totalResults'],
      };
    } else {
      tests['afid_test'] = { status: res.status };
    }
  } catch (e) {
    tests['afid_test'] = { error: String(e) };
  }

  // Test 3: Simple author search to verify API key works
  try {
    const res = await fetch(
      'https://api.elsevier.com/content/search/scopus?query=AFFILORG(Al-Turath)&count=3&field=dc:title,prism:coverDate',
      {
        headers: { 'X-ELS-APIKey': apiKey, Accept: 'application/json' },
        cache: 'no-store',
      },
    );
    if (res.ok) {
      const d = await res.json();
      const entries = d['search-results']?.entry ?? [];
      tests['sample_works'] = {
        status: 'ok',
        total: d['search-results']?.['opensearch:totalResults'],
        samples: entries.slice(0, 3).map((e: Record<string, unknown>) => ({
          title: e['dc:title'],
          date: e['prism:coverDate'],
        })),
      };
    } else {
      tests['sample_works'] = { status: res.status, error: (await res.text()).slice(0, 200) };
    }
  } catch (e) {
    tests['sample_works'] = { error: String(e) };
  }

  return NextResponse.json(tests);
}
