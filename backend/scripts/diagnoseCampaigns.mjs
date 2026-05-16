import axios from 'axios';

const BASE = 'https://api.redtrack.io';
const KEY  = 'hryEZN8985CISCtjMpn1';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // Scan first 10 pages to gather unique source_titles and sample campaign titles
  const sourceTitleSet = new Set();
  const interesting = [];
  const LIMIT = 200;

  for (let page = 1; page <= 10; page++) {
    await sleep(200);
    const res = await axios.get(`${BASE}/campaigns?api_key=${KEY}&limit=${LIMIT}&page=${page}`);
    const rows = Array.isArray(res.data) ? res.data : [];
    if (!rows.length) break;

    for (const r of rows) {
      sourceTitleSet.add(r.source_title || '(empty)');
      const t = (r.title || '').toLowerCase();
      const st = (r.source_title || '').toLowerCase();
      if (/bath|roof|window|windo|gutter|solar/i.test(t) || /bath|roof|window|windo/i.test(st)) {
        interesting.push({ id: r.id, title: r.title, source_title: r.source_title, source_id: r.source_id });
      }
    }
    console.log(`Page ${page}: ${rows.length} campaigns, running unique sources: ${sourceTitleSet.size}`);
  }

  console.log('\n=== Unique source_titles (first 10 pages) ===');
  [...sourceTitleSet].sort().forEach(s => console.log(' ', s));

  console.log('\n=== Campaigns with bath/roof/window in title or source_title ===');
  if (interesting.length === 0) {
    console.log('None found in first 10 pages');
  } else {
    interesting.forEach(r => console.log(`  ${r.id} | src="${r.source_title}" | title="${r.title}"`));
  }

  // Also fetch the /sources endpoint to see what source IDs look like there
  console.log('\n=== /sources endpoint ===');
  await sleep(300);
  const srcRes = await axios.get(`${BASE}/sources?api_key=${KEY}&limit=200`);
  const sources = Array.isArray(srcRes.data) ? srcRes.data : [];
  console.log(`Total sources: ${sources.length}`);
  const qhfSrc = sources.filter(s => /quickhomefix|qhf/i.test(s.title || s.name || ''));
  console.log(`QHF sources: ${qhfSrc.length}`);
  qhfSrc.forEach(s => console.log(`  id=${s.id} | title="${s.title || s.name}"`));

  if (sources.length > 0) {
    console.log('\nAll source IDs (sample 5):');
    sources.slice(0, 5).forEach(s => console.log(`  id=${s.id} | title="${s.title || s.name}"`));
  }
}

main().catch(console.error);
