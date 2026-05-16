import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Get one QHF campaign with its serial_number
  const campId = '69e9fb0d7846aa6c5a0d6f45'; // QHF | KG | Meta | Bath | apr23 | C1 | CC | land
  const campRes = await axios.get(`${BASE}/campaigns/${campId}?api_key=${KEY}`);
  const camp = campRes.data;
  console.log('Campaign serial_number:', camp.serial_number);
  console.log('Campaign source_campaign_id:', camp.source_campaign_id);
  console.log('trackback_url:', camp.trackback_url);
  console.log('source_campaigns:', JSON.stringify(camp.source_campaigns).slice(0, 200));

  const serialNum = camp.serial_number;
  const date_from = '2026-05-13';
  const date_to   = '2026-05-13';
  const base = `${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date`;

  await sleep(400);

  // Test with serial_number
  console.log('\n=== Filter by cid (serial_number) ===');
  try {
    const r = await axios.get(`${base}&cid=${serialNum}`);
    const data = Array.isArray(r.data) ? r.data : [];
    console.log(`lp_views=${data[0]?.lp_views}, cost=${data[0]?.cost}`);
  } catch (e) { console.log('Error:', e.message, e.response?.status); }

  await sleep(400);

  console.log('\n=== Filter by campaign (serial) ===');
  try {
    const r = await axios.get(`${base}&campaign=${serialNum}`);
    const data = Array.isArray(r.data) ? r.data : [];
    console.log(`lp_views=${data[0]?.lp_views}, cost=${data[0]?.cost}`);
  } catch (e) { console.log('Error:', e.message, e.response?.status); }

  await sleep(400);

  // Try the /report2 endpoint
  console.log('\n=== /report2 endpoint ===');
  try {
    const r = await axios.get(`${BASE}/report2?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&campaign_id[]=${campId}`);
    const data = Array.isArray(r.data) ? r.data : [];
    console.log(`Rows: ${data.length}, lp_views=${data[0]?.lp_views}`);
  } catch (e) { console.log('Error:', e.message, e.response?.status); }

  await sleep(400);

  // Try POST to /report
  console.log('\n=== POST /report ===');
  try {
    const r = await axios.post(`${BASE}/report?api_key=${KEY}`, {
      date_from, date_to,
      group_by: ['date'],
      campaign_id: [campId],
    });
    const data = Array.isArray(r.data) ? r.data : [];
    console.log(`Rows: ${data.length}, lp_views=${data[0]?.lp_views}`);
  } catch (e) { console.log('Error:', e.message, e.response?.status); }

  await sleep(400);

  // Try /campaign_stats endpoint
  console.log('\n=== /campaign_stats endpoint ===');
  try {
    const r = await axios.get(`${BASE}/campaign_stats?api_key=${KEY}&campaign_id=${campId}&date_from=${date_from}&date_to=${date_to}`);
    console.log('Response:', JSON.stringify(r.data).slice(0, 300));
  } catch (e) { console.log('Error:', e.message, e.response?.status); }

  await sleep(400);

  // Try /report with group_by[]=campaign and see if campaign name comes through
  console.log('\n=== /report group_by campaign ===');
  try {
    const r = await axios.get(`${BASE}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date&group_by[]=campaign`);
    const data = Array.isArray(r.data) ? r.data : [];
    console.log(`Rows: ${data.length}`);
    data.slice(0, 5).forEach(row => {
      const keys = Object.keys(row).filter(k => ['campaign','campaign_id','campaign_name','lp_views','cost','date'].includes(k));
      const vals = {};
      keys.forEach(k => vals[k] = row[k]);
      console.log(' ', JSON.stringify(vals));
    });
  } catch (e) { console.log('Error:', e.message, e.response?.status); }
}

main().catch(console.error);
