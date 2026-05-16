import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

const QHF_CAMPAIGN_IDS = [
  '6986154a6dc8880891603e47',
  '6986192742529dbd418211b6',
  '698619c2cb92634d4fabdf80',
  '69861a51b8734578c97dac80',
  '69b280321b359a8acb59e8e1',
  '69df87091b15b025147b0cda',
  '69e5f8f3a4d9b5135764a734',
  '69e610ee0a796ad258f36be1',
  '69e75bd00e92da321120a32f',
  '69e9f66c7846aa6c5a08afeb',
  '69e9fb0d7846aa6c5a0d6f45',
  '69f3345c574d9d8b4a0fcb48',
  '69f85653a2134b8e5549ab66',
  '69f9c0b529f436e711b0812f',
  '69fdcb836ab8b07391e1d3fb',
  '6a01eaed14aa2f82a8261b0c',
  '6a02fec7b7103bc0f8c7109a',
  '6a05a92f5d73f05db6353b82',
  '6a07183265debd90097b2cc4',
  '6a071aefa6406126a86f57ef',
  '6a07216a36a33020ed3bb6bd',
  '6a0721d4793382a56eafe9de',
];

const QHF_SOURCE_IDS = [
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
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testReport(label, url) {
  try {
    const res = await axios.get(url);
    const data = Array.isArray(res.data) ? res.data : [res.data];
    console.log(`\n=== ${label} ===`);
    console.log(`Rows: ${data.length}`);
    if (data.length > 0) {
      const r = data[0];
      console.log(`  date=${r.date}, lp_views=${r.lp_views}, lp_clicks=${r.lp_clicks}, cost=${r.cost}, lander=${r.lander || '(none)'}`);
      if (data.length > 1) {
        data.slice(0, 5).forEach(row => {
          console.log(`  date=${row.date}, lp_views=${row.lp_views}, cost=${row.cost}, lander=${row.lander || ''}`);
        });
      }
    }
    return data;
  } catch (e) {
    console.log(`\n=== ${label} === ERROR: ${e.message} (${e.response?.status})`);
    return [];
  }
}

async function main() {
  const date_from = '2026-05-13';
  const date_to   = '2026-05-13';
  const baseUrl = `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`;

  // Baseline
  await testReport('Baseline (no filter)', `${baseUrl}&group_by[]=date`);
  await sleep(400);

  // Single campaign filter
  const campId = QHF_CAMPAIGN_IDS[10]; // QHF | KG | Meta | Bath | apr23 | C1 | CC | land
  await testReport(`campaign_id single: ${campId}`,
    `${baseUrl}&group_by[]=date&campaign_id[]=${campId}`);
  await sleep(400);

  // Multiple campaign_id[] params
  const multiCampUrl = baseUrl + '&group_by[]=date&' +
    QHF_CAMPAIGN_IDS.slice(0, 5).map(id => `campaign_id[]=${id}`).join('&');
  await testReport('Multiple campaign_id[] (5 ids)', multiCampUrl);
  await sleep(400);

  // All 22 campaign ids
  const allCampUrl = baseUrl + '&group_by[]=date&' +
    QHF_CAMPAIGN_IDS.map(id => `campaign_id[]=${id}`).join('&');
  await testReport('All 22 QHF campaign_id[]', allCampUrl);
  await sleep(400);

  // Try campaign (singular) param
  await testReport(`campaign= single: ${campId}`,
    `${baseUrl}&group_by[]=date&campaign=${campId}`);
  await sleep(400);

  // Try ts_id[] (traffic source id) with QHF source ids
  const tsUrl = baseUrl + '&group_by[]=date&' +
    QHF_SOURCE_IDS.map(id => `ts_id[]=${id}`).join('&');
  await testReport('All QHF ts_id[] (source filter)', tsUrl);
  await sleep(400);

  // Try with lander group_by and campaign filter
  const landerCampUrl = baseUrl + '&group_by[]=date&group_by[]=lander&' +
    QHF_CAMPAIGN_IDS.map(id => `campaign_id[]=${id}`).join('&');
  await testReport('group_by lander + all QHF campaign_id[]', landerCampUrl);
  await sleep(400);

  // Try campaign report by fetching individual campaign stats via /campaigns/{id}
  console.log(`\n=== Individual campaign stats: /campaigns/${campId} ===`);
  try {
    const r = await axios.get(`${BASE}/campaigns/${campId}?api_key=${KEY}`);
    const stat = r.data?.stat || {};
    console.log('Campaign stat:', JSON.stringify(stat).slice(0, 300));
    console.log('Campaign stat keys:', Object.keys(stat));
  } catch (e) {
    console.log('Error:', e.message, e.response?.status);
  }

  // Try /report with workspace filter
  await sleep(400);
  console.log('\n=== Testing workspace param ===');
  try {
    const r = await axios.get(`${baseUrl}&group_by[]=date&workspace=qhf`);
    const data = Array.isArray(r.data) ? r.data : [];
    console.log(`Rows: ${data.length}, lp_views: ${data[0]?.lp_views}`);
  } catch (e) {
    console.log('Error:', e.message);
  }
}

main().catch(console.error);
