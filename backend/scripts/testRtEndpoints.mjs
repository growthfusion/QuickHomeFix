import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(url) {
  try {
    const res = await axios.get(url);
    const d = res.data;
    if (Array.isArray(d)) return { type: 'array', len: d.length, sample: d[0] };
    if (d && typeof d === 'object') return { type: 'object', keys: Object.keys(d).slice(0, 10), sample: JSON.stringify(d).slice(0, 300) };
    return { type: typeof d, value: String(d).slice(0, 200) };
  } catch (e) {
    return { error: e.message, status: e.response?.status, data: JSON.stringify(e.response?.data || '').slice(0, 200) };
  }
}

const date_from = '2026-05-13';
const date_to   = '2026-05-13';

async function main() {
  // Test 1: lander report with different date (known working date)
  console.log('=== 1. Lander report (known working date) ===');
  const r1 = await get(`${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date&group_by[]=lander`);
  console.log(JSON.stringify(r1, null, 2));

  await sleep(500);
  // Test 2: What does a single lander row look like?
  if (r1.len > 0) {
    console.log('\nLander row fields:', Object.keys(r1.sample));
    console.log('Lander row sample:', JSON.stringify(r1.sample));
  }

  await sleep(500);
  // Test 3: Try /report with just lander group_by (no date)
  console.log('\n=== 2. Report group_by lander only ===');
  const r2 = await get(`${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=lander`);
  console.log(JSON.stringify(r2, null, 2));

  await sleep(500);
  // Test 4: Try /stats endpoint
  console.log('\n=== 3. /stats endpoint ===');
  const r3 = await get(`${BASE}/stats?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`);
  console.log(JSON.stringify(r3, null, 2));

  await sleep(500);
  // Test 5: Try /landers endpoint
  console.log('\n=== 4. /landers endpoint ===');
  const r4 = await get(`${BASE}/landers?api_key=${KEY}&limit=50`);
  console.log(JSON.stringify(r4, null, 2));

  await sleep(500);
  // Test 6: offers endpoint
  console.log('\n=== 5. /offers endpoint ===');
  const r5 = await get(`${BASE}/offers?api_key=${KEY}&limit=50`);
  console.log(JSON.stringify(r5, null, 2));
  if (r5.len > 0) {
    console.log('Offer fields:', Object.keys(r5.sample));
    console.log('First offer:', JSON.stringify(r5.sample).slice(0, 500));
  }

  await sleep(500);
  // Test 7: report with offer_id grouping
  console.log('\n=== 6. Report group_by offer ===');
  const r6 = await get(`${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date&group_by[]=offer`);
  console.log(JSON.stringify(r6, null, 2));

  await sleep(500);
  // Test 8: report with sub1 (lander sub-parameter)
  console.log('\n=== 7. Report group_by sub1 ===');
  const r7 = await get(`${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date&group_by[]=sub1`);
  console.log(JSON.stringify(r7, null, 2));

  await sleep(500);
  // Test 9: /report2 or /analytics
  console.log('\n=== 8. /analytics endpoint ===');
  const r8 = await get(`${BASE}/analytics?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`);
  console.log(JSON.stringify(r8, null, 2));

  await sleep(500);
  // Test 10: /clicks endpoint
  console.log('\n=== 9. /clicks endpoint ===');
  const r9 = await get(`${BASE}/clicks?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&limit=10`);
  console.log(JSON.stringify(r9, null, 2));
}

main().catch(console.error);
