import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

const QHF_CAMPAIGN_IDS = [
  '6986154a6dc8880891603e47','6986192742529dbd418211b6','698619c2cb92634d4fabdf80',
  '69861a51b8734578c97dac80','69b280321b359a8acb59e8e1','69df87091b15b025147b0cda',
  '69e5f8f3a4d9b5135764a734','69e610ee0a796ad258f36be1','69e75bd00e92da321120a32f',
  '69e9f66c7846aa6c5a08afeb','69e9fb0d7846aa6c5a0d6f45','69f3345c574d9d8b4a0fcb48',
  '69f85653a2134b8e5549ab66','69f9c0b529f436e711b0812f','69fdcb836ab8b07391e1d3fb',
  '6a01eaed14aa2f82a8261b0c','6a02fec7b7103bc0f8c7109a','6a05a92f5d73f05db6353b82',
  '6a07183265debd90097b2cc4','6a071aefa6406126a86f57ef','6a07216a36a33020ed3bb6bd',
  '6a0721d4793382a56eafe9de',
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(label, url) {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const data = res.data;
    if (Array.isArray(data)) {
      console.log(`\n=== ${label} ===`);
      console.log(`Rows: ${data.length}`);
      data.slice(0, 5).forEach(r => {
        const keys = ['date','lp_views','lp_clicks','cost','revenue','lander','campaign','title','stat'];
        const vals = {};
        keys.forEach(k => { if (r[k] !== undefined) vals[k] = r[k]; });
        console.log(' ', JSON.stringify(vals).slice(0, 300));
      });
    } else if (typeof data === 'object') {
      console.log(`\n=== ${label} ===`);
      console.log(JSON.stringify(data).slice(0, 400));
    } else {
      console.log(`\n=== ${label} === ${String(data).slice(0, 100)}`);
    }
    return data;
  } catch (e) {
    console.log(`\n=== ${label} === ERROR ${e.response?.status}: ${e.message}`);
    return null;
  }
}

async function main() {
  const date_from = '2026-05-13';
  const date_to   = '2026-05-13';
  const campId = QHF_CAMPAIGN_IDS[10]; // QHF | KG | Meta | Bath | apr23 | C1 | CC | land

  // 1. Report with group=lander (correct param per Swagger)
  await get('report group=lander (no filter)',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group=lander`);
  await sleep(500);

  // 2. Report with group=date,lander and campaign_id filter (no brackets)
  await get('report group=lander + campaign_id (single)',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group=lander&campaign_id=${campId}`);
  await sleep(500);

  // 3. Report with group=date and campaign_id filter
  await get('report group=date + campaign_id (single)',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group=date&campaign_id=${campId}`);
  await sleep(500);

  // 4. Report with group=date and ALL QHF campaign_ids (comma-separated)
  const campIds = QHF_CAMPAIGN_IDS.join(',');
  await get('report group=date + ALL QHF campaign_ids (comma)',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group=date&campaign_id=${campIds}`);
  await sleep(500);

  // 5. campaigns/v2 with QHF ids and date range
  await get('campaigns/v2 with QHF ids + date range',
    `${BASE}/campaigns/v2?api_key=${KEY}&ids=${campIds}&date_from=${date_from}&date_to=${date_to}`);
  await sleep(500);

  // 6. landings with total_stat
  await get('landings with total_stat',
    `${BASE}/landings?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&total_stat=true&per=50`);
  await sleep(500);

  // 7. sources filter on report (comma-separated source ids)
  const QHF_SRC_IDS = [
    '6973b115cf6f4f9efdaec963','69e726d9a4d9b51357c6304d','69e7279a3bab5180c00c1ac8',
    '69e7279e0a796ad2584aef8e','69e8a55e37d74edb736a4d31','69e8a5bb558d8330b45fddf1',
    '69e8a614a9384a9ddbbb4aaf','6a06ebe3493e29d568fb16e8','6a06ec25493e29d568fb25cc',
    '6a06ec3e65debd90096398d5','6a06ee1b5d73f05db6c5b040','6a06ee1b36a33020ed173d89',
    '6a06ee2065debd900963ee10',
  ].join(',');
  await get('report group=date + source_id (all QHF, comma)',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group=date&source_id=${QHF_SRC_IDS}`);
  await sleep(500);

  // 8. report for 5 recent days with campaign filter
  const date_from5 = '2026-05-09';
  await get('report group=date (5 days) + all QHF campaigns',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from5}&date_to=${date_to}&group=date&campaign_id=${campIds}`);
}

main().catch(e => console.error('Fatal:', e.message));
