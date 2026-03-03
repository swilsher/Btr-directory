#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(import.meta.dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data } = await supabase
    .from('developments')
    .select('city, region')
    .eq('is_published', true)
    .not('city', 'is', null);

  const cityMap = new Map<string, { count: number; region: string }>();

  (data || []).forEach((d) => {
    if (!d.city) return;
    const ex = cityMap.get(d.city);
    if (ex) {
      ex.count++;
      if (d.region && !ex.region) ex.region = d.region;
    } else {
      cityMap.set(d.city, { count: 1, region: d.region || '' });
    }
  });

  const sorted = Array.from(cityMap.entries()).sort((a, b) => b[1].count - a[1].count);
  console.log('City'.padEnd(30) + 'DB Region'.padEnd(35) + 'Count');
  console.log('-'.repeat(75));
  for (const [city, info] of sorted) {
    console.log(
      city.padEnd(30) +
      (info.region || '(none)').padEnd(35) +
      String(info.count)
    );
  }
}

main();
