// Probe: can the RedTrack API return per-conversion-type counts (ViewContent / AddtoCart)?
// Read-only. Masks the API key in any printed URL.
import 'dotenv/config';
import axios from 'axios';

const RT_BASE = 'https://api.redtrack.io';
const apiKey = process.env.REDTRACK_API_KEY;
if (!apiKey) { console.error('No REDTRACK_API_KEY'); process.exit(1); }

const today = new Date().toISOString().slice(0, 10);
// Look back a few days to be safe around the test conversions.
const from = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);

const mask = (u) => u.replace(/api_key=[^&]+/, 'api_key=***');

async function get(path) {
  const url = `${RT_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}`;
  try {
    const res = await axios.get(url);
    return { ok: true, data: res.data };
  } catch (e) {
    return { ok: false, status: e.response?.status, msg: e.message, body: e.response?.data };
  }
}

(async () => {
  console.log(`Date range: ${from} .. ${today}\n`);

  // 1. Plain report grouped by date — show ALL field names returned (what metrics exist).
  console.log('=== 1) /report group=date — available fields ===');
  let r = await get(`/report?date_from=${from}&date_to=${today}&group=date`);
  if (r.ok && Array.isArray(r.data) && r.data.length) {
    console.log('row keys:', Object.keys(r.data[0]).join(', '));
    console.log('sample row:', JSON.stringify(r.data[0]));
  } else {
    console.log('result:', JSON.stringify(r).slice(0, 500));
  }

  // 2. Report filtered by conversion type — does &conversion_type=... work?
  for (const t of ['ViewContent', 'AddtoCart', 'AddToCart']) {
    console.log(`\n=== 2) /report group=date &conversion_type=${t} ===`);
    r = await get(`/report?date_from=${from}&date_to=${today}&group=date&conversion_type=${encodeURIComponent(t)}`);
    if (r.ok && Array.isArray(r.data)) {
      const conv = r.data.reduce((s, x) => s + (Number(x.conversions) || 0), 0);
      console.log(`rows=${r.data.length} total conversions=${conv}`);
    } else {
      console.log('result:', JSON.stringify(r).slice(0, 300));
    }
  }

  // 3. Group by conversion type directly?
  console.log('\n=== 3) /report group=conversion_type ===');
  r = await get(`/report?date_from=${from}&date_to=${today}&group=conversion_type`);
  console.log('result:', JSON.stringify(r.data || r).slice(0, 600));

  // 4. /conversions endpoint with a type filter — raw conversion list.
  console.log('\n=== 4) /conversions?type=ViewContent ===');
  r = await get(`/conversions?date_from=${from}&date_to=${today}&type=ViewContent&per=5`);
  if (r.ok) {
    const arr = Array.isArray(r.data) ? r.data : (r.data?.items || r.data?.data || []);
    console.log(`count=${Array.isArray(arr) ? arr.length : 'n/a'}`);
    if (Array.isArray(arr) && arr.length) console.log('first keys:', Object.keys(arr[0]).join(', '));
    else console.log('body:', JSON.stringify(r.data).slice(0, 400));
  } else {
    console.log('result:', JSON.stringify(r).slice(0, 300));
  }
})();
