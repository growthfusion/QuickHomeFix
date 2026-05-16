import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

const QHF_SOURCE_IDS = new Set([
  '6973b115cf6f4f9efdaec963',
  '69e726d9a4d9b51357c6304d',
  '69e7279a3bab5180c00c1ac8',
  '69e7279e0a796ad2584aef8e',
  '69e8a55e37d74edb736a4d31',
  '69e8a5bb558d8330b45fddf1',
  '69e8a614a9384a9ddbbb4aaf',
  '6a06ebe3493e29d568fb16e8',
  '6a06ec25493e29d568fb25cc',
  '6a06ec3e65debd90096398d5',
  '6a06ee1b5d73f05db6c5b040',
  '6a06ee1b36a33020ed173d89',
  '6a06ee2065debd900963ee10',
]);

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const LIMIT = 200;
  const TOTAL = 13341;
  const TOTAL_PAGES = Math.ceil(TOTAL / LIMIT);

  console.log(`Scanning ${TOTAL_PAGES} pages of ${LIMIT} campaigns each...`);

  const qhfCampaigns = [];
  let page = 1;

  while (page <= TOTAL_PAGES) {
    await sleep(200);
    try {
      const res = await axios.get(`${BASE}/campaigns?api_key=${KEY}&limit=${LIMIT}&page=${page}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) break;

      const matched = rows.filter(r =>
        QHF_SOURCE_IDS.has(r.source_id) ||
        /quickhomefix/i.test(r.source_title || '') ||
        /\bqhf\b/i.test(r.title || '')
      );

      if (matched.length > 0) {
        qhfCampaigns.push(...matched);
        console.log(`Page ${page}/${TOTAL_PAGES}: +${matched.length} QHF campaigns (total so far: ${qhfCampaigns.length})`);
        matched.forEach(c => console.log(`  id=${c.id} | src=${c.source_id} | src_title="${c.source_title}" | title="${c.title}"`));
      } else if (page % 10 === 0) {
        console.log(`Page ${page}/${TOTAL_PAGES}: checked ${rows.length}, none matched`);
      }

      if (rows.length < LIMIT) break;
      page++;
    } catch (err) {
      console.error(`Page ${page} error: ${err.message}`);
      if (err.response?.status === 429) {
        console.log('Rate limited — waiting 5s...');
        await sleep(5000);
      } else {
        page++;
      }
    }
  }

  console.log(`\n=== DONE: ${qhfCampaigns.length} QHF campaigns found ===`);

  if (qhfCampaigns.length > 0) {
    const ids = qhfCampaigns.map(c => c.id);
    console.log('\nQHF Campaign IDs:');
    ids.forEach(id => console.log(id));

    // Test /report with first campaign ID
    console.log('\n--- Testing /report with campaign_id filter ---');
    await sleep(500);
    const today = new Date().toISOString().slice(0, 10);
    const from30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const testId = ids[0];
    const reportUrl = `${BASE}/report?api_key=${KEY}&date_from=${from30}&date_to=${today}&group_by[]=date&campaign_id[]=${testId}`;
    console.log('Test URL:', reportUrl.replace(/api_key=[^&]+/, 'api_key=***'));

    const rpt = await axios.get(reportUrl);
    const rptRows = Array.isArray(rpt.data) ? rpt.data : [];
    console.log(`Report returned ${rptRows.length} rows`);
    if (rptRows.length > 0) {
      console.log('Sample row:', JSON.stringify(rptRows[0]));
    }
  } else {
    // If none found by source_id, try title-based scan
    console.log('\nNo QHF campaigns found by source_id — check source_title naming');
  }
}

main().catch(console.error);
