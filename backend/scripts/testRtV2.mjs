import axios from 'axios';

const KEY = 'hryEZN8985CISCtjMpn1';
const date_from = '2026-05-13';
const date_to   = '2026-05-13';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(label, url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data;
    if (Array.isArray(data)) {
      console.log(`${label}: array[${data.length}] lp_views=${data[0]?.lp_views || data[0]?.lp_view || 'N/A'}`);
    } else {
      console.log(`${label}: ${JSON.stringify(data).slice(0, 200)}`);
    }
  } catch (e) {
    console.log(`${label}: ${e.message} (${e.response?.status})`);
  }
  await sleep(300);
}

async function main() {
  // Try different RT API base URLs / versions
  const campaignId = '69e9fb0d7846aa6c5a0d6f45';
  const queries = `date_from=${date_from}&date_to=${date_to}&group_by[]=date&campaign_id[]=${campaignId}`;

  await get('api.redtrack.io/v1/report', `https://api.redtrack.io/v1/report?api_key=${KEY}&${queries}`);
  await get('api.redtrack.io/v2/report', `https://api.redtrack.io/v2/report?api_key=${KEY}&${queries}`);
  await get('api.redtrack.io/api/report', `https://api.redtrack.io/api/report?api_key=${KEY}&${queries}`);

  // Check if there's a workspace-specific endpoint
  await get('/workspaces', `https://api.redtrack.io/workspaces?api_key=${KEY}`);
  await get('/workspace', `https://api.redtrack.io/workspace?api_key=${KEY}`);
  await get('/account', `https://api.redtrack.io/account?api_key=${KEY}`);
  await get('/me', `https://api.redtrack.io/me?api_key=${KEY}`);
  await get('/user', `https://api.redtrack.io/user?api_key=${KEY}`);

  // Check /campaign/{id}/report
  await get(`/campaigns/${campaignId}/report`,
    `https://api.redtrack.io/campaigns/${campaignId}/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`);
  await get(`/campaigns/${campaignId}/stats`,
    `https://api.redtrack.io/campaigns/${campaignId}/stats?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`);

  // Try the campaign's tracking domain
  await get('tk.trkfy.us API', `https://tk.trkfy.us/api/report?api_key=${KEY}&${queries}`);

  // Check /report with workspace_id param
  const wsIds = [
    '67338e898d0c0496e191b163', // user_id from campaigns
  ];
  for (const wsId of wsIds) {
    await get(`/report?workspace_id=${wsId}`,
      `https://api.redtrack.io/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date&workspace_id=${wsId}`);
  }

  // Try /report with filter by title keyword (in case RT supports text search)
  await get('/report?search=QHF',
    `https://api.redtrack.io/report?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}&group_by[]=date&search=QHF`);

  // Try /stats/campaigns or /stats/landers
  await get('/stats/campaigns', `https://api.redtrack.io/stats/campaigns?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`);
  await get('/stats/landers', `https://api.redtrack.io/stats/landers?api_key=${KEY}&date_from=${date_from}&date_to=${date_to}`);
}

main().catch(e => console.error('Fatal:', e.message));
