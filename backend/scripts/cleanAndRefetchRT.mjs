import { createClient } from '@clickhouse/client';
import { fetchRedTrack } from '../jobs/fetchRedTrack.js';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });

const ch = createClient({
  url: process.env.CLICKHOUSE_HOST,
  database: process.env.CLICKHOUSE_DATABASE || 'default',
  username: process.env.CLICKHOUSE_USERNAME || 'default',
  password: process.env.CLICKHOUSE_PASSWORD || '',
  request_timeout: 60000,
});

async function main() {
  // Check current state
  const before = await ch.query({ query: 'SELECT count() as cnt, min(date) as min_d, max(date) as max_d FROM redtrack_stats', format: 'JSONEachRow' });
  const beforeRows = await before.json();
  console.log('Before:', beforeRows[0]);

  // Truncate
  console.log('\nTruncating redtrack_stats...');
  await ch.command({ query: 'TRUNCATE TABLE redtrack_stats' });
  console.log('Table truncated.');

  await ch.close();

  // Re-fetch with correct QHF-only params
  console.log('\nFetching fresh QHF data from RedTrack...');
  await fetchRedTrack();
  console.log('Done!');

  // Verify
  const ch2 = createClient({
    url: process.env.CLICKHOUSE_HOST,
    database: process.env.CLICKHOUSE_DATABASE || 'default',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    request_timeout: 60000,
  });

  await new Promise(r => setTimeout(r, 2000)); // give CH time to settle

  const after = await ch2.query({
    query: 'SELECT breakdown_type, count() as cnt, sum(lp_views) as lp_views, sum(cost) as cost FROM redtrack_stats GROUP BY breakdown_type',
    format: 'JSONEachRow'
  });
  const afterRows = await after.json();
  console.log('\nAfter re-fetch:');
  afterRows.forEach(r => console.log(' ', JSON.stringify(r)));

  await ch2.close();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
