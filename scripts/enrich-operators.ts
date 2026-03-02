/**
 * BTR Directory — Operator Website & Description Enrichment
 *
 * Finds official websites and generates short company bios for operators
 * that are missing this data. Uses SerpAPI for web search, Cheerio for
 * HTML parsing, and Claude API for bio generation.
 *
 * Outputs SQL UPDATE statements to scripts/output/operator_enrichment.sql
 *
 * Usage:
 *   cd scripts && npx tsx enrich-operators.ts
 *   cd scripts && npx tsx enrich-operators.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env'), override: true });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const DELAY_MS = 1500; // between operators to respect rate limits
const dryRun = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in scripts/.env');
  process.exit(1);
}
if (!SERPAPI_KEY) {
  console.error('ERROR: SERPAPI_KEY must be set in scripts/.env');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY must be set in scripts/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Types ───

interface OperatorRow {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  description: string | null;
}

interface EnrichmentResult {
  operator: OperatorRow;
  website: string | null;
  description: string | null;
  success: boolean;
  reason?: string;
}

// ─── Fetch operators needing enrichment ───

async function fetchOperatorsToEnrich(): Promise<OperatorRow[]> {
  const { data, error } = await supabase
    .from('operators')
    .select('id, name, slug, website, description')
    .order('name');

  if (error) {
    console.error('Supabase query error:', error.message);
    process.exit(1);
  }

  // Only include operators missing website OR description
  return (data || []).filter(
    (op: OperatorRow) => !op.website || !op.description
  );
}

// ─── SerpAPI search ───

async function searchOperator(name: string): Promise<{ url: string; snippet: string } | null> {
  const query = `"${name}" build to rent`;
  const params = new URLSearchParams({
    q: query,
    api_key: SERPAPI_KEY,
    engine: 'google',
    num: '5',
    gl: 'uk',
    hl: 'en',
  });

  try {
    const resp = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!resp.ok) {
      console.error(`    SerpAPI returned ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const results = data.organic_results || [];

    if (results.length === 0) return null;

    // Skip common non-operator sites
    const skipDomains = [
      'linkedin.com', 'facebook.com', 'twitter.com', 'instagram.com',
      'youtube.com', 'wikipedia.org', 'companieshouse.gov.uk', 'gov.uk',
      'rightmove.co.uk', 'zoopla.co.uk', 'openrent.com', 'indeed.co.uk',
      'glassdoor.co.uk', 'reddit.com', 'tiktok.com',
      'buildtorentdirectory.co.uk', 'www.buildtorentdirectory.co.uk', // skip our own site
    ];

    // First try: find a result whose domain contains the operator name
    const nameParts = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const result of results) {
      const url: string = result.link || '';
      const domain = new URL(url).hostname.toLowerCase();

      if (skipDomains.some(skip => domain.includes(skip))) continue;

      // Check if domain contains any significant word from the operator name
      const significantParts = nameParts.filter(p => p.length > 2);
      if (significantParts.some(part => domain.includes(part))) {
        return { url, snippet: result.snippet || '' };
      }
    }

    // Second try: just take the first non-skip result
    for (const result of results) {
      const url: string = result.link || '';
      const domain = new URL(url).hostname.toLowerCase();
      if (skipDomains.some(skip => domain.includes(skip))) continue;
      return { url, snippet: result.snippet || '' };
    }

    return null;
  } catch (err) {
    console.error(`    SerpAPI error: ${err}`);
    return null;
  }
}

// ─── Fetch & parse homepage ───

async function fetchHomepageText(url: string): Promise<string> {
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    if (!resp.ok) return '';

    const html = await resp.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav, footer elements
    $('script, style, nav, footer, header, noscript, iframe, svg').remove();

    // Get text content
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to ~8000 chars for Claude
    return text.substring(0, 8000);
  } catch (err) {
    return '';
  }
}

// ─── Claude API for bio generation ───

async function generateBio(
  operatorName: string,
  homepageText: string,
  searchSnippet: string
): Promise<string | null> {
  const content = homepageText || searchSnippet;
  if (!content || content.length < 50) return null;

  const prompt = `Based on the following website content for "${operatorName}", write a concise 2-3 sentence company description suitable for a property directory listing. Focus on: what they do, their approach to build-to-rent, and any notable facts (e.g. portfolio size, locations, parent company). Keep it factual and professional. Do NOT include any quotes or marketing slogans.

If the content does not appear to be about "${operatorName}" or a property/BTR company, respond with just "SKIP".

Website content:
${content}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`    Claude API error ${resp.status}: ${errText.substring(0, 200)}`);
      return null;
    }

    const data = await resp.json();
    const text = data.content?.[0]?.text?.trim() || '';

    if (text === 'SKIP' || text.length < 20) return null;

    return text;
  } catch (err) {
    console.error(`    Claude API error: ${err}`);
    return null;
  }
}

// ─── Extract base domain for website URL ───

function cleanWebsiteUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Return just the origin (protocol + domain)
    return parsed.origin;
  } catch {
    return url;
  }
}

// ─── Generate SQL output ───

function generateSQL(results: EnrichmentResult[]): string {
  const successful = results.filter(r => r.success && (r.website || r.description));
  if (successful.length === 0) return '-- No operators to update.\n';

  let sql = `-- BTR Directory — Operator Enrichment\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- ${successful.length} operators to update\n\n`;

  for (const r of successful) {
    const setClauses: string[] = [];
    const conditions: string[] = [`slug = '${r.operator.slug}'`];

    if (r.website && !r.operator.website) {
      setClauses.push(`website = '${r.website.replace(/'/g, "''")}'`);
    }
    if (r.description && !r.operator.description) {
      setClauses.push(`description = '${r.description.replace(/'/g, "''")}'`);
    }

    if (setClauses.length === 0) continue;

    setClauses.push(`updated_at = NOW()`);

    sql += `-- Operator: ${r.operator.name}\n`;
    sql += `UPDATE operators\nSET ${setClauses.join(',\n    ')}\nWHERE ${conditions.join(' AND ')};\n\n`;
  }

  return sql;
}

// ─── Sleep helper ───

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main ───

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('BTR Directory — Operator Enrichment');
  console.log('='.repeat(60));
  if (dryRun) console.log('  MODE: DRY RUN (no file output)');
  console.log('');

  // Step 1: Fetch operators
  console.log('Step 1: Fetching operators needing enrichment...');
  const operators = await fetchOperatorsToEnrich();
  console.log(`  Found ${operators.length} operators needing website and/or description`);

  if (operators.length === 0) {
    console.log('  Nothing to do — all operators already have website and description.');
    return;
  }

  // Step 2: Enrich each operator
  console.log('');
  console.log('Step 2: Enriching operators via SerpAPI + Claude...');

  const results: EnrichmentResult[] = [];

  for (let i = 0; i < operators.length; i++) {
    const op = operators[i];

    if (i > 0) await sleep(DELAY_MS);

    console.log(`  [${i + 1}/${operators.length}] ${op.name}...`);

    // Search for operator
    const searchResult = await searchOperator(op.name);

    if (!searchResult) {
      console.log(`    ✗ No search results found`);
      results.push({ operator: op, website: null, description: null, success: false, reason: 'No search results' });
      continue;
    }

    const websiteUrl = cleanWebsiteUrl(searchResult.url);
    console.log(`    Found: ${websiteUrl}`);

    // Fetch homepage content
    const homepageText = await fetchHomepageText(searchResult.url);
    const hasContent = homepageText.length > 100;
    if (!hasContent) {
      console.log(`    ⚠ Could not fetch homepage content`);
    }

    // Generate bio
    let bio: string | null = null;
    if (!op.description) {
      bio = await generateBio(op.name, homepageText, searchResult.snippet);
      if (bio) {
        console.log(`    ✓ Bio: ${bio.substring(0, 80)}...`);
      } else {
        console.log(`    ⚠ Could not generate bio`);
      }
    } else {
      console.log(`    ✓ Already has description, skipping bio`);
    }

    const gotWebsite = !op.website && websiteUrl;
    const gotBio = !op.description && bio;

    results.push({
      operator: op,
      website: gotWebsite ? websiteUrl : null,
      description: gotBio ? bio : null,
      success: Boolean(gotWebsite || gotBio),
      reason: (!gotWebsite && !gotBio) ? 'No new data extracted' : undefined,
    });

    if (gotWebsite || gotBio) {
      console.log(`    ✓ Success`);
    } else {
      console.log(`    – No new data needed or extracted`);
    }
  }

  // Step 3: Output
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total operators processed: ${operators.length}`);
  console.log(`  Successfully enriched:     ${successful.length}`);
  console.log(`  No data found:             ${failed.length}`);

  if (failed.length > 0) {
    console.log('');
    console.log('  Operators needing manual attention:');
    for (const f of failed) {
      console.log(`    - ${f.operator.name}: ${f.reason}`);
    }
  }

  if (!dryRun && successful.length > 0) {
    const sql = generateSQL(results);
    const outputDir = resolve(__dirname, 'output');
    mkdirSync(outputDir, { recursive: true });
    const outputPath = resolve(outputDir, 'operator_enrichment.sql');
    writeFileSync(outputPath, sql, 'utf-8');
    console.log('');
    console.log(`  SQL written to: ${outputPath}`);
    console.log('  Review the file, then paste into Supabase SQL Editor to apply.');
  } else if (dryRun) {
    console.log('');
    console.log('  DRY RUN — no files written.');
  }

  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
