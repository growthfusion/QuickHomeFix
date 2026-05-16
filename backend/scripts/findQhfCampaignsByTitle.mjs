import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Scan ALL pages, filter by title containing QHF
  const LIMIT = 100;
  const TOTAL = 13341;
  const TOTAL_PAGES = Math.ceil(TOTAL / LIMIT);

  console.log(`Scanning ${TOTAL_PAGES} pages...`);

  const qhfCampaigns = [];
  let page = 1;

  while (page <= TOTAL_PAGES) {
    await sleep(150);
    try {
      const res = await axios.get(`${BASE}/campaigns?api_key=${KEY}&limit=${LIMIT}&page=${page}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) break;

      for (const r of rows) {
        const t = (r.title || '').toLowerCase();
        const st = (r.source_title || '').toLowerCase();
        // QHF campaigns: title starts with "QHF |" or source is QuickHomeFix
        if (/^qhf\s*\|/i.test(r.title || '') || /quickhomefix/i.test(st)) {
          qhfCampaigns.push(r);
        }
      }

      if (page % 20 === 0) {
        console.log(`Page ${page}/${TOTAL_PAGES}: QHF found so far: ${qhfCampaigns.length}`);
      }

      if (rows.length < LIMIT) break;
      page++;

      if (page > 200) { console.log('Hit 200 page limit'); break; }
    } catch (e) {
      console.error(`Page ${page}: ${e.message}`);
      if (e.response?.status === 429) { await sleep(5000); } else { page++; }
    }
  }

  console.log(`\n=== Found ${qhfCampaigns.length} QHF campaigns ===`);

  if (qhfCampaigns.length > 0) {
    qhfCampaigns.forEach(c => {
      const stat = c.stat || {};
      console.log(`id=${c.id} | src="${c.source_title}" | title="${c.title}" | lp_views=${stat.lp_views || 0} | cost=${stat.cost || 0}`);
    });

    // Check stat fields in first campaign
    const first = qhfCampaigns[0];
    if (first.stat) {
      console.log('\nStat fields available:', Object.keys(first.stat).filter(k => ['lp_views','lp_clicks','lp_ctr','cost','revenue','conversions'].includes(k)));
      console.log('Stat sample:', JSON.stringify(first.stat));
    }

    // Check streams (landers) in first campaign
    if (first.streams) {
      console.log('\nStreams count:', first.streams.length);
      if (first.streams[0]) console.log('First stream:', JSON.stringify(first.streams[0]).slice(0, 500));
    }
  }

  // Also check: what sources do QHF-looking campaigns use?
  const sourceTitles = [...new Set(qhfCampaigns.map(c => c.source_title))];
  console.log('\nSources used by QHF campaigns:', sourceTitles);
}

main().catch(console.error);
