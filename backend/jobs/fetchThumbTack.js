import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { getClickhouse } from '../clickhouseClient.js';

// Sheet 2 — detailed stats with contacts_created, pros_contacted, net_revenue
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mu5MHTa0WeYcLonQ49Xw5rqamqB7qbCfikR1bDCvmeA/export?format=csv&gid=804697822';

// Map Thumbtack category names → dashboard form_type keys
// Category names must match exactly what appears in the Google Sheet
const CATEGORY_MAP = {
  'Bathroom Remodel':    'bath',
  'Window Installation': 'windo',
  // 'Roofing' not present in sheet — add here when Thumbtack tracks it
};

function parseDate(str) {
  // M/D/YYYY → YYYY-MM-DD
  const parts = (str || '').trim().split('/');
  if (parts.length !== 3) return '';
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseMoney(str) {
  return parseFloat((str || '').replace(/[$,]/g, '')) || 0;
}

export async function fetchThumbTack() {
  try {
    const res = await axios.get(SHEET_URL, {
      maxRedirects: 10,
      responseType: 'text',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const records = parse(res.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const rows = [];

    for (const r of records) {
      const form_type = CATEGORY_MAP[r.category];
      if (!form_type) continue; // skip non-QHF categories
      const date = parseDate(r.day);
      if (!date) continue;

      rows.push({
        fetched_at:       fetchedAt,
        date,
        campaign_id:      r.utm_campaign  || '',
        category:         r.category      || '',
        form_type,
        sessions:         Number(r.sessions          || 0),
        visitors:         Number(r.visitors           || 0),
        contacts_created: Number(r.contacts_created   || 0),
        pros_contacted:   Number(r.pros_contacted     || 0),
        revenue:          parseMoney(r.revenue),
        net_revenue:      parseMoney(r.net_revenue),
        owed_revenue:     parseMoney(r.owed_revenue),
      });
    }

    if (rows.length === 0) {
      console.warn('[fetchThumbTack] No QHF rows found in sheet');
      return;
    }

    const ch = getClickhouse();
    if (!ch) { console.warn('[fetchThumbTack] ClickHouse not configured — skipping'); return; }
    // Insert first, then delete old batches — avoids the empty-table window that
    // TRUNCATE caused: if the insert failed after a TRUNCATE, the dashboard's
    // THUMBTACK column went to 0. /api/stats/thumbtack reads max(fetched_at), so
    // the new batch is live the instant it lands and the old batch is only purged
    // after a successful insert. (Same pattern as fetchRedTrack/Meta/LeadProsper.)
    await ch.insert({ table: 'thumbtack_stats', values: rows, format: 'JSONEachRow' });
    await ch.command({ query: `ALTER TABLE thumbtack_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
    console.log(`[fetchThumbTack] Inserted ${rows.length} rows`);
  } catch (err) {
    console.warn('[fetchThumbTack] Failed:', err.message);
  }
}
