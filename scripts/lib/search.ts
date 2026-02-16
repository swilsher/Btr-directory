import type { SearchResult } from './types.js';
import { extractDomain } from './utils.js';

// Domains to exclude from search results
const EXCLUDED_DOMAINS = [
  'youtube.com', 'linkedin.com', 'twitter.com', 'x.com',
  'facebook.com', 'instagram.com', 'tiktok.com',
  'pinterest.com', 'reddit.com',
  'companieshouse.gov.uk',
];

export function buildSearchQueries(operatorName: string, website?: string): string[] {
  const queries = [
    `"${operatorName}" BTR developments UK`,
    `"${operatorName}" build to rent UK properties`,
    `"${operatorName}" build to rent developments`,
    `"${operatorName}" build to rent planning application UK`,
  ];

  if (website) {
    const domain = extractDomain(website);
    if (domain) {
      queries.push(`site:${domain} developments`);
      queries.push(`site:${domain} locations OR neighbourhoods OR homes`);
    }
  }

  // Industry-specific searches
  queries.push(`"${operatorName}" site:btrnews.co.uk`);

  return queries;
}

export async function searchWithSerpApi(
  queries: string[],
  maxResults: number,
  onProgress?: (query: string, index: number, total: number) => void
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error('SERPAPI_KEY not found in environment');
  }

  let serpapi: { getJson: Function };
  try {
    serpapi = await import('serpapi');
  } catch {
    throw new Error('serpapi package not installed. Run: npm install serpapi');
  }

  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    if (onProgress) onProgress(query, i + 1, queries.length);

    try {
      const response = await serpapi.getJson({
        engine: 'google',
        q: query,
        location: 'United Kingdom',
        google_domain: 'google.co.uk',
        gl: 'uk',
        hl: 'en',
        num: 20,
        api_key: apiKey,
      });

      const organic = response.organic_results || [];
      for (const result of organic) {
        const url = result.link;
        if (!url || seenUrls.has(url)) continue;

        // Filter excluded domains
        const domain = extractDomain(url);
        if (EXCLUDED_DOMAINS.some(d => domain.includes(d))) continue;

        seenUrls.add(url);
        allResults.push({
          title: result.title || '',
          url,
          snippet: result.snippet || '',
          source: 'serpapi',
          query,
        });

        if (allResults.length >= maxResults) break;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`  Search query failed: "${query}" - ${message}`);
    }

    if (allResults.length >= maxResults) break;
  }

  return allResults;
}

export function parseManualUrls(urlString: string): SearchResult[] {
  return urlString
    .split(',')
    .map(u => u.trim())
    .filter(u => u.startsWith('http'))
    .map(url => ({
      title: '',
      url,
      snippet: '',
      source: 'manual' as const,
    }));
}

// Prioritize URLs by source quality
export function prioritizeUrls(results: SearchResult[], operatorDomain?: string): SearchResult[] {
  const priority = (r: SearchResult): number => {
    const domain = extractDomain(r.url);
    if (operatorDomain && domain.includes(operatorDomain)) return 0; // highest
    if (domain.includes('btrnews')) return 1;
    if (domain.includes('urbanliving')) return 1;
    if (domain.includes('reactnews')) return 2;
    if (domain.includes('egi.co') || domain.includes('estatesgazette')) return 2;
    if (domain.includes('propertyweek')) return 2;
    if (domain.includes('rightmove') || domain.includes('zoopla')) return 3;
    if (domain.includes('planning')) return 4;
    return 5;
  };

  return [...results].sort((a, b) => priority(a) - priority(b));
}
