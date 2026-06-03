// Generates the Thumbtack A/B test report (Before May 1-18 vs After May 19-Jun 3)
// Data source: ClickHouse thumbtack_stats (pulled 2026-06-03), embedded below.
import * as XLSX from 'xlsx';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../reports/Thumbtack_AB_Test_Report_2026-06-03.xlsx');

const HEAD = ['Date', 'Category', 'Campaign ID', 'Sessions', 'Visitors',
  'Contacts Created', 'Pros Contacted', 'Gross Revenue', 'Net Revenue', 'Owed Revenue'];

// A: Before A/B test (May 1-18) — old revenue baseline
const before = [
  ['2026-05-05', 'Window Installation', '',                   9, 9, 0, 0, 0, 0, 0],
  ['2026-05-06', 'Bathroom Remodel',    '',                   2, 2, 0, 0, 0, 0, 0],
  ['2026-05-12', 'Bathroom Remodel',    '120241919584330278', 1, 1, 0, 0, 0, 0, 0],
  ['2026-05-14', 'Bathroom Remodel',    '120241919584330278', 1, 1, 0, 0, 0, 0, 0],
];

// B: After A/B test (May 19 - Jun 3)
const after = [
  ['2026-05-19', 'Bathroom Remodel', '120247451043710279',  1,  1, 0, 0,    0,       0,      0],
  ['2026-05-19', 'Bathroom Remodel', '120247895169170279',  2,  2, 0, 0,    0,       0,      0],
  ['2026-05-20', 'Bathroom Remodel', '120247895169170279',  6,  6, 1, 1,   85.02,   85.02,  32.99],
  ['2026-05-21', 'Bathroom Remodel', '120243083556030278',  1,  1, 0, 0,    0,       0,      0],
  ['2026-05-21', 'Bathroom Remodel', 'gf2',                 1,  1, 0, 0,    0,       0,      0],
  ['2026-05-22', 'Bathroom Remodel', '120243083556030278',  1,  1, 0, 0,    0,       0,      0],
  ['2026-05-22', 'Bathroom Remodel', '120247895169170279',  2,  2, 0, 0,    0,       0,      0],
  ['2026-05-22', 'Bathroom Remodel', 'gf2',                 2,  2, 2, 2,  341.27,  341.27, 132.41],
  ['2026-05-25', 'Bathroom Remodel', '120243083556030278',  1,  1, 0, 0,    0,       0,      0],
  ['2026-05-25', 'Bathroom Remodel', '120247895169170279', 11, 11, 3, 3,  354.31,  354.31, 137.48],
  ['2026-05-25', 'Bathroom Remodel', 'gf2',                17, 17, 4, 4,  722.77,  722.77, 280.43],
  ['2026-05-26', 'Bathroom Remodel', '120243022550240278',  2,  2, 1, 1,   65.84,   65.84,  25.55],
  ['2026-05-26', 'Bathroom Remodel', '120243083556030278',  2,  2, 0, 0,    0,       0,      0],
  ['2026-05-26', 'Bathroom Remodel', '120247363355030163',  2,  2, 0, 0,    0,       0,      0],
  ['2026-05-26', 'Bathroom Remodel', '120247895169170279', 28, 25, 2, 2,   68.97,   68.97,  26.76],
  ['2026-05-26', 'Bathroom Remodel', 'gf2',                 3,  3, 3, 3,   90.09,    0,      0],
  ['2026-05-27', 'Bathroom Remodel', '120243083556030278',  3,  3, 1, 1,   74.13,   74.13,  28.76],
  ['2026-05-27', 'Bathroom Remodel', '120247363355030163',  6,  6, 0, 0,    0,       0,      0],
  ['2026-05-27', 'Bathroom Remodel', 'gf2',                 1,  1, 0, 0,    0,       0,      0],
  ['2026-05-28', 'Bathroom Remodel', '120247363355030163',  9,  9, 0, 0,    0,       0,      0],
  ['2026-05-29', 'Bathroom Remodel', '',                    1,  1, 0, 0,    0,       0,      0],
  ['2026-05-29', 'Bathroom Remodel', '120247363355030163',  2,  2, 0, 0,    0,       0,      0],
  ['2026-06-01', 'Bathroom Remodel', '120247363355030163',  1,  1, 0, 0,    0,       0,      0],
  ['2026-06-02', 'Bathroom Remodel', '120247363355030163',  2,  2, 0, 0,    0,       0,      0],
  ['2026-06-02', 'Bathroom Remodel', '120247363355030163',  3,  3, 0, 0,    0,       0,      0],
  ['2026-06-02', 'Bathroom Remodel', '120247895169170279',  1,  1, 1, 1,    0,       0,      0],
];

const sum = (rows, i) => rows.reduce((a, r) => a + r[i], 0);
const r2 = (n) => Math.round(n * 100) / 100;

function totals(rows) {
  return {
    sessions: sum(rows, 3), visitors: sum(rows, 4),
    contacts: sum(rows, 5), pros: sum(rows, 6),
    revenue: r2(sum(rows, 7)), net: r2(sum(rows, 8)), owed: r2(sum(rows, 9)),
  };
}

const A = totals(before);   // 18 calendar days
const B = totals(after);    // 16 calendar days
const A_DAYS = 18, B_DAYS = 16;

const cr = (t) => t.sessions ? t.contacts / t.sessions : 0;
const pct = (a, b) => (a === 0 ? (b === 0 ? '0%' : 'N/A (baseline $0)') : `${r2(((b - a) / a) * 100)}%`);
const revPerContact = (t) => (t.contacts ? r2(t.revenue / t.contacts) : 0);

// ── Tab 1: Summary (A vs B) ──────────────────────────────────────────────
const summary = [
  ['Thumbtack A/B Test — Revenue Comparison'],
  ['Source: ClickHouse thumbtack_stats · Generated 2026-06-03'],
  [],
  ['Metric', 'A: Before (May 1–18)', 'B: After (May 19–Jun 3)', 'Change'],
  ['Calendar days', A_DAYS, B_DAYS, ''],
  ['Sessions', A.sessions, B.sessions, pct(A.sessions, B.sessions)],
  ['Visitors', A.visitors, B.visitors, pct(A.visitors, B.visitors)],
  ['Contacts created', A.contacts, B.contacts, pct(A.contacts, B.contacts)],
  ['Pros contacted', A.pros, B.pros, pct(A.pros, B.pros)],
  ['Conversion rate (contacts ÷ sessions)', cr(A), cr(B), pct(cr(A), cr(B))],
  ['Gross revenue', A.revenue, B.revenue, pct(A.revenue, B.revenue)],
  ['Net revenue', A.net, B.net, pct(A.net, B.net)],
  ['Owed revenue', A.owed, B.owed, pct(A.owed, B.owed)],
  ['Revenue per day', r2(A.revenue / A_DAYS), r2(B.revenue / B_DAYS), pct(A.revenue / A_DAYS, B.revenue / B_DAYS)],
  ['Revenue per contact', revPerContact(A), revPerContact(B), ''],
];

const wb = XLSX.utils.book_new();

const wsSummary = XLSX.utils.aoa_to_sheet(summary);
wsSummary['!cols'] = [{ wch: 38 }, { wch: 22 }, { wch: 24 }, { wch: 20 }];
// Percent format for the two CR cells (row 10, 0-indexed col B/C)
['B10', 'C10'].forEach((c) => { if (wsSummary[c]) { wsSummary[c].z = '0.0%'; } });
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

// ── Tab 2: Before detail ─────────────────────────────────────────────────
const beforeSheet = [HEAD, ...before,
  ['TOTAL', '', '', A.sessions, A.visitors, A.contacts, A.pros, A.revenue, A.net, A.owed]];
const wsB = XLSX.utils.aoa_to_sheet(beforeSheet);
wsB['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 9 }, { wch: 9 }, { wch: 15 }, { wch: 14 }, { wch: 13 }, { wch: 12 }, { wch: 13 }];
XLSX.utils.book_append_sheet(wb, wsB, 'Before (May 1-18)');

// ── Tab 3: After detail (daily + campaign) ───────────────────────────────
const afterSheet = [HEAD, ...after,
  ['TOTAL', '', '', B.sessions, B.visitors, B.contacts, B.pros, B.revenue, B.net, B.owed]];
const wsA = XLSX.utils.aoa_to_sheet(afterSheet);
wsA['!cols'] = wsB['!cols'];
XLSX.utils.book_append_sheet(wb, wsA, 'After (May 19-Jun 3)');

// ── Tab 4: Landing-page A/B/C test (last 3 days) ─────────────────────────
// Source: RedTrack dashboard screenshot (last 3 days). LP Views read 0 — known
// upstream RedTrack lp_views tracking issue, not a real zero.
const lpHead = ['#', 'Title', 'Variant', 'LP Clicks', 'Clicks', 'Lead', 'Purchase',
  'Total CPA', 'EPC', 'Total Revenue', 'Cost', 'Profit', 'Total ROI', 'LP Views'];
const lp = [
  [1337, 'Quickhomefix | Bath | Meta | KG',                       'Control (Original)', 8, 247, 8, 1, 43.47, 0.05, 12.66, 391.25, -378.59, -0.9676, 0],
  [1557, 'Quickhomefix | Bath | Meta | Hero_Page A Variant | KG', 'A (Hero Page A)',    2, 211, 6, 3, 37.26, 0.37, 78.12, 335.32, -257.20, -0.7670, 0],
  [1556, 'Quickhomefix | Bath | Meta | Hero_Page B Variant | KG', 'B (Hero Page B)',    2, 210, 4, 2, 56.22, 0.15, 32.18, 337.34, -305.16, -0.9046, 0],
];
const lpTotal = ['', 'Total', '', 12, 668, 18, 6, 44.33, 0.18, 122.96, 1063.91, -940.95, -0.8844, 0];

const lpSheet = [
  ['Landing Page A/B/C Test — Last 3 Days'],
  ['Source: RedTrack dashboard · Generated 2026-06-03'],
  [],
  lpHead,
  ...lp,
  lpTotal,
  [],
  ['Winner: Variant A (Hero_Page A Variant, #1557)'],
  ['Why: best EPC ($0.37 vs $0.15 / $0.05), highest revenue ($78.12), most purchases (3),'],
  ['     lowest CPA ($37.26), and least-negative ROI (-76.7%) / profit (-$257.20).'],
  ['Caveat: small sample (LP clicks 8 / 2 / 2). All variants still ROI-negative — A is the'],
  ['        best of three, not yet profitable. LP Views show 0 due to a known RedTrack tracking issue.'],
];
const wsLp = XLSX.utils.aoa_to_sheet(lpSheet);
wsLp['!cols'] = [{ wch: 6 }, { wch: 42 }, { wch: 18 }, { wch: 9 }, { wch: 8 }, { wch: 7 }, { wch: 9 },
  { wch: 10 }, { wch: 7 }, { wch: 13 }, { wch: 11 }, { wch: 11 }, { wch: 10 }, { wch: 9 }];
// Currency + percent formatting on the data + total rows (rows 5-8 in 1-indexed → r5..r8)
for (let r = 5; r <= 8; r++) {
  ['H', 'I', 'J', 'K', 'L'].forEach((c) => { const cell = wsLp[`${c}${r}`]; if (cell && cell.t === 'n') cell.z = '$#,##0.00'; });
  const roi = wsLp[`M${r}`]; if (roi && roi.t === 'n') roi.z = '0.00%';
}
XLSX.utils.book_append_sheet(wb, wsLp, 'LP A-B-C Test (3 Days)');

XLSX.writeFile(wb, OUT);
console.log('Wrote', OUT);
console.log('Before:', JSON.stringify(A));
console.log('After: ', JSON.stringify(B));
