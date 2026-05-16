import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

const QHF_SRC_IDS = [
  '6973b115cf6f4f9efdaec963','69d5f3af8c110c9036eb014e','69dd2c224aed14986dd1bde8',
  '69e726d9a4d9b51357c6304d','69e7279a3bab5180c00c1ac8','69e7279e0a796ad2584aef8e',
  '69e8a55e37d74edb736a4d31','69e8a5bb558d8330b45fddf1','69e8a614a9384a9ddbbb4aaf',
  '6a06ebe3493e29d568fb16e8','6a06ec25493e29d568fb25cc','6a06ec3e65debd90096398d5',
  '6a06ee1b5d73f05db6c5b040','6a06ee1b36a33020ed173d89','6a06ee2065debd900963ee10',
].join(',');

const QHF_CAMP_IDS = [
  '6986154a6dc8880891603e47','6986192742529dbd418211b6','698619c2cb92634d4fabdf80',
  '69861a51b8734578c97dac80','69df87091b15b025147b0cda','69e5f8f3a4d9b5135764a734',
  '69e610ee0a796ad258f36be1','69e75bd00e92da321120a32f','69e9f66c7846aa6c5a08afeb',
  '69e9fb0d7846aa6c5a0d6f45','69f3345c574d9d8b4a0fcb48','69f85653a2134b8e5549ab66',
  '69f9c0b529f436e711b0812f','69fdcb836ab8b07391e1d3fb','6a01eaed14aa2f82a8261b0c',
  '6a02fec7b7103bc0f8c7109a','6a05a92f5d73f05db6353b82','6a07183265debd90097b2cc4',
  '6a071aefa6406126a86f57ef','6a07216a36a33020ed3bb6bd','6a0721d4793382a56eafe9de',
].join(',');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(label, url) {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const data = Array.isArray(res.data) ? res.data : [res.data];
    console.log(`\n=== ${label} ===`);
    console.log(`Rows: ${data.length}`);
    data.slice(0, 8).forEach(r => {
      const show = {};
      ['date','source','source_title','lander','campaign','campaign_title','title',
       'lp_views','lp_clicks','cost','revenue','lp_ctr'].forEach(k => {
        if (r[k] !== undefined && r[k] !== null && r[k] !== '') show[k] = r[k];
      });
      console.log(' ', JSON.stringify(show).slice(0, 300));
    });
    return data;
  } catch (e) {
    console.log(`\n=== ${label} === ERROR ${e.response?.status}: ${e.message}`);
    return null;
  }
}

async function main() {
  const date_from = '2026-05-13';
  const date_to   = '2026-05-13';
  const base = `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`;

  // Test different group values with source_id filter
  const groupValues = ['source', 'lander', 'campaign', 'offer', 'domain', 'ts'];
  for (const g of groupValues) {
    await sleep(600);
    await get(`group=${g} + source_id filter`,
      `${base}&group=${g}&source_id=${QHF_SRC_IDS}`);
  }

  // Test date+source combo
  await sleep(600);
  await get('group=date,source + source_id filter',
    `${base}&group=date,source&source_id=${QHF_SRC_IDS}`);

  // Test 30 days with correct params
  await sleep(600);
  const date_from30 = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
  await get('30 days group=date + source_id filter',
    `${BASE}/report?api_key=${KEY}&date_from=${date_from30}&date_to=2026-05-15&group=date&source_id=${QHF_SRC_IDS}`);
}

main().catch(e => console.error('Fatal:', e.message));
