import { Command } from 'commander';
import { createInterface } from 'readline';
import type { CLIOptions, DevelopmentType } from './types.js';

export function parseArgs(): CLIOptions {
  const program = new Command();

  program
    .name('research-operator')
    .description('Research BTR operator developments for the BTR Directory')
    .argument('<operator-name>', 'Name of the BTR operator to research')
    .option('-w, --website <url>', 'Operator website URL')
    .option('-u, --urls <urls>', 'Comma-separated list of URLs to scrape directly')
    .option('-i, --interactive', 'Interactive mode: paste URLs one at a time')
    .option('-o, --output-dir <dir>', 'Output directory', './output')
    .option('--no-playwright', 'Skip Playwright for JS-rendered pages')
    .option('--type <type>', 'Default development type: Multifamily or "Single Family"', 'Multifamily')
    .option('--max-results <n>', 'Maximum search results to process', '50')
    .parse();

  const operatorName = program.args[0];
  const opts = program.opts();

  return {
    operator: operatorName,
    website: opts.website,
    urls: opts.urls,
    interactive: opts.interactive,
    outputDir: opts.outputDir || './output',
    noPlaywright: opts.playwright === false,
    type: (opts.type === 'Single Family' ? 'Single Family' : 'Multifamily') as DevelopmentType,
    maxResults: parseInt(opts.maxResults, 10) || 50,
  };
}

export async function collectInteractiveUrls(): Promise<string[]> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const urls: string[] = [];

  console.log('\nPaste URLs one per line. Type "done" when finished:\n');

  return new Promise((resolve) => {
    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase() === 'done') {
        rl.close();
        resolve(urls);
        return;
      }
      if (trimmed.startsWith('http')) {
        urls.push(trimmed);
        console.log(`  Added (${urls.length}): ${trimmed}`);
      } else if (trimmed.length > 0) {
        console.log('  Skipped (not a URL): ' + trimmed);
      }
    });
  });
}
