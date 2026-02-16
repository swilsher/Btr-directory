#!/usr/bin/env node

import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { parseArgs, collectInteractiveUrls } from './lib/cli.js';
import { buildSearchQueries, searchWithSerpApi, parseManualUrls, prioritizeUrls } from './lib/search.js';
import { scrapeUrls } from './lib/scraper.js';
import { extractFromPage } from './lib/extractor.js';
import { deduplicateAndMerge } from './lib/deduplicator.js';
import { generateCSV } from './lib/output-csv.js';
import { generateSQL } from './lib/output-sql.js';
import { generateSlug, extractDomain } from './lib/utils.js';
import type { SearchResult, PartialDevelopment } from './lib/types.js';

async function main() {
  const options = parseArgs();
  const operatorSlug = generateSlug(options.operator);
  const operatorDomain = options.website ? extractDomain(options.website) : undefined;

  console.log('');
  console.log(chalk.bold(`BTR Operator Research Tool`));
  console.log(chalk.gray(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(`  Operator:  ${chalk.cyan(options.operator)}`);
  if (options.website) console.log(`  Website:   ${chalk.cyan(options.website)}`);
  console.log(`  Type:      ${chalk.cyan(options.type)}`);
  console.log(`  Output:    ${chalk.cyan(options.outputDir)}`);
  console.log('');

  // Ensure output directory exists
  const outputDir = resolve(options.outputDir);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // ── Step 1: Gather URLs ──────────────────────────────────────────

  let searchResults: SearchResult[] = [];

  if (options.urls) {
    // Manual URL mode
    console.log(chalk.blue('Mode: Manual URL input'));
    searchResults = parseManualUrls(options.urls);
    console.log(`  ${searchResults.length} URLs provided`);
  } else if (options.interactive) {
    // Interactive mode
    console.log(chalk.blue('Mode: Interactive'));
    const urls = await collectInteractiveUrls();
    searchResults = urls.map(url => ({
      title: '',
      url,
      snippet: '',
      source: 'manual' as const,
    }));
    console.log(`\n  ${searchResults.length} URLs collected`);
  } else if (process.env.SERPAPI_KEY) {
    // Automated search mode
    console.log(chalk.blue('Mode: Automated search (SerpAPI)'));
    const queries = buildSearchQueries(options.operator, options.website);
    console.log(`  Running ${queries.length} search queries...`);

    const spinner = ora('Searching...').start();
    try {
      searchResults = await searchWithSerpApi(
        queries,
        options.maxResults,
        (query, index, total) => {
          spinner.text = `Search ${index}/${total}: ${query.substring(0, 50)}...`;
        }
      );
      spinner.succeed(`Found ${searchResults.length} unique URLs from search`);
    } catch (err: unknown) {
      spinner.fail('Search failed');
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(chalk.red(`  ${message}`));
      console.log('');
      console.log(chalk.yellow('Tip: Try using --urls or --interactive mode instead'));
      process.exit(1);
    }
  } else {
    console.log(chalk.yellow('No SERPAPI_KEY found and no URLs provided.'));
    console.log('');
    console.log('Usage options:');
    console.log(`  ${chalk.green('1.')} Set SERPAPI_KEY in scripts/.env for automated search`);
    console.log(`  ${chalk.green('2.')} Use ${chalk.cyan('--urls "url1,url2"')} to provide URLs directly`);
    console.log(`  ${chalk.green('3.')} Use ${chalk.cyan('--interactive')} to paste URLs one at a time`);
    console.log('');
    console.log('Get a free SerpAPI key at: https://serpapi.com');
    process.exit(1);
  }

  if (searchResults.length === 0) {
    console.log(chalk.red('No URLs to process. Exiting.'));
    process.exit(1);
  }

  // Prioritize URLs
  searchResults = prioritizeUrls(searchResults, operatorDomain);

  // ── Step 2: Scrape pages ─────────────────────────────────────────

  console.log('');
  const scrapeSpinner = ora(`Scraping ${searchResults.length} pages...`).start();

  const pages = await scrapeUrls(
    searchResults.map(r => r.url),
    {
      usePlaywright: !options.noPlaywright,
      operatorDomain,
      delayMs: 2000,
      onProgress: (current, total, url) => {
        const domain = extractDomain(url);
        scrapeSpinner.text = `Scraping ${current}/${total}: ${domain}`;
      },
    }
  );

  const successfulPages = pages.filter(p => !p.error && p.bodyText.length > 50);
  const failedPages = pages.filter(p => p.error);

  scrapeSpinner.succeed(
    `Scraped ${successfulPages.length} pages successfully` +
    (failedPages.length > 0 ? chalk.yellow(` (${failedPages.length} failed)`) : '')
  );

  if (failedPages.length > 0) {
    for (const p of failedPages) {
      console.log(chalk.gray(`  Failed: ${extractDomain(p.url)} - ${p.error}`));
    }
  }

  // ── Step 3: Extract development data ─────────────────────────────

  console.log('');
  const extractSpinner = ora('Extracting development data...').start();

  const allPartials: PartialDevelopment[] = [];

  for (const page of successfulPages) {
    try {
      const extracted = extractFromPage(page, options.operator, operatorDomain, options.type);
      allPartials.push(...extracted);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(chalk.gray(`  Extraction error on ${extractDomain(page.url)}: ${message}`));
    }
  }

  extractSpinner.succeed(`Extracted ${allPartials.length} development references`);

  if (allPartials.length === 0) {
    console.log('');
    console.log(chalk.yellow('No developments found. This could mean:'));
    console.log('  - The search results did not contain development pages');
    console.log('  - The operator website uses a non-standard layout');
    console.log('  - Try providing direct URLs with --urls or --interactive');
    process.exit(0);
  }

  // ── Step 4: Deduplicate and merge ────────────────────────────────

  const dedupeSpinner = ora('Deduplicating and scoring...').start();

  const developments = deduplicateAndMerge(
    allPartials,
    options.operator,
    options.type,
    operatorDomain
  );

  const highCount = developments.filter(d => d.confidence.level === 'HIGH').length;
  const medCount = developments.filter(d => d.confidence.level === 'MEDIUM').length;
  const lowCount = developments.filter(d => d.confidence.level === 'LOW').length;

  dedupeSpinner.succeed(`${developments.length} unique developments after deduplication`);

  // ── Step 5: Generate output files ────────────────────────────────

  console.log('');
  const csvContent = generateCSV(developments);
  const csvPath = join(outputDir, `${operatorSlug}_review.csv`);
  writeFileSync(csvPath, csvContent, 'utf-8');

  const sqlContent = generateSQL(developments, options.operator, options.website);
  const sqlPath = join(outputDir, `${operatorSlug}_upload.sql`);
  writeFileSync(sqlPath, sqlContent, 'utf-8');

  // ── Summary ──────────────────────────────────────────────────────

  console.log(chalk.bold(`Results for ${options.operator}`));
  console.log(chalk.gray(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(`  Found ${chalk.bold(String(developments.length))} developments across ${chalk.bold(String(successfulPages.length))} sources`);
  console.log('');

  if (highCount > 0) console.log(`  ${chalk.green('■')} ${highCount} HIGH confidence`);
  if (medCount > 0)  console.log(`  ${chalk.yellow('■')} ${medCount} MEDIUM confidence`);
  if (lowCount > 0)  console.log(`  ${chalk.red('■')} ${lowCount} LOW confidence`);

  console.log('');
  console.log(`  Files generated:`);
  console.log(`    ${chalk.cyan('→')} ${csvPath} ${chalk.gray('(open this to review data)')}`);
  console.log(`    ${chalk.cyan('→')} ${sqlPath} ${chalk.gray('(paste into Supabase after review)')}`);
  console.log('');

  // List developments
  for (const dev of developments) {
    const color = dev.confidence.level === 'HIGH' ? chalk.green
      : dev.confidence.level === 'MEDIUM' ? chalk.yellow
      : chalk.red;
    const units = dev.numberOfUnits ? `${dev.numberOfUnits} units` : 'units unknown';
    const location = [dev.area, dev.region].filter(Boolean).join(', ');
    console.log(`  ${color('●')} ${dev.name} ${chalk.gray(`- ${location} - ${units} - ${dev.status || 'status unknown'}`)}`);
  }

  console.log('');
}

main().catch(err => {
  console.error(chalk.red('Fatal error:'), err.message);
  process.exit(1);
});
