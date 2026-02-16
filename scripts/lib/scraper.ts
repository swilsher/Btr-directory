import * as cheerio from 'cheerio';
import type { ScrapedPage } from './types.js';
import { sleep } from './utils.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Tier 1: Static fetch + cheerio
async function scrapeStatic(url: string): Promise<ScrapedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        url,
        title: '',
        bodyText: '',
        html: '',
        method: 'static',
        error: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      url,
      title: $('title').text().trim(),
      bodyText,
      html,
      method: 'static',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      url,
      title: '',
      bodyText: '',
      html: '',
      method: 'static',
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Tier 2: Playwright for JS-rendered pages
async function scrapeDynamic(url: string): Promise<ScrapedPage> {
  let browser;
  try {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: USER_AGENT,
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);
    const title = await page.title();

    return {
      url,
      title,
      bodyText: text.replace(/\s+/g, ' ').trim(),
      html,
      method: 'dynamic',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      url,
      title: '',
      bodyText: '',
      html: '',
      method: 'dynamic',
      error: message,
    };
  } finally {
    if (browser) await browser.close();
  }
}

// Domains that are known to need JS rendering
const JS_RENDERED_PATTERNS = [
  /vercel\.app/,
  /netlify\.app/,
  /wixsite\.com/,
];

export interface ScrapeOptions {
  usePlaywright: boolean;
  operatorDomain?: string;
  delayMs?: number;
  onProgress?: (current: number, total: number, url: string) => void;
}

export async function scrapeUrls(
  urls: string[],
  options: ScrapeOptions
): Promise<ScrapedPage[]> {
  const results: ScrapedPage[] = [];
  const delay = options.delayMs ?? 2000;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (options.onProgress) {
      options.onProgress(i + 1, urls.length, url);
    }

    // Tier 1: try static first
    let page = await scrapeStatic(url);

    // Tier 2: fall back to Playwright if static gave little content or errored
    const isOperatorSite = options.operatorDomain && url.includes(options.operatorDomain);
    const needsDynamic =
      options.usePlaywright &&
      (
        page.error ||
        page.bodyText.length < 200 ||
        isOperatorSite ||
        JS_RENDERED_PATTERNS.some(p => p.test(url))
      );

    if (needsDynamic) {
      const dynamicPage = await scrapeDynamic(url);
      if (!dynamicPage.error && dynamicPage.bodyText.length > (page.bodyText?.length || 0)) {
        page = dynamicPage;
      }
    }

    results.push(page);

    // Rate limiting delay between requests
    if (i < urls.length - 1) {
      await sleep(delay);
    }
  }

  return results;
}
