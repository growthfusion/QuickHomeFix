// One-off: build a multi-sheet Excel report for the buyer "Modernize" from the
// LeadProsper aggregate tables in ClickHouse. Sheets: Summary, By Date, By State,
// By City, By Postcode. Run: `node scripts/modernizeReport.mjs` from backend/.
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import { getClickhouse, closeClickhouse } from "../clickhouseClient.js";

const BUYER = process.argv[2] || "Modernize";
const ch = getClickhouse();
if (!ch) {
  console.error("ClickHouse not configured (check backend/.env CLICKHOUSE_*).");
  process.exit(1);
}

async function q(sql) {
  const rs = await ch.query({ query: sql, format: "JSONEachRow" });
  return rs.json();
}

// Aggregate across the 4 buyer_ids that share the name "Modernize", recomputing
// rates from summed counts so they stay correct after rollup. `extra` adds grain-
// specific columns (pings only exist at the buyer/date grain, not by location).
const base = (table, dims, extra = "") => `
  SELECT ${dims.join(", ")},
         sum(total_leads)    AS total_leads,
         sum(accepted_leads) AS accepted_leads,
         sum(rejected_leads) AS rejected_leads,
         sum(outbid_leads)   AS outbid_leads,
         sum(sold_leads)     AS sold_leads,
         round(sum(total_revenue), 2) AS total_revenue${extra}
  FROM default.${table}
  WHERE buyer_name = '${BUYER}'
  GROUP BY ${dims.join(", ")}`;

// Pings are reported by LeadProsper per buyer per day, so they're available only
// on the date grain (pings_accepted = bids made, pings_failed = pings rejected).
const PING_COLS = `,
         sum(pings_total)    AS pings_total,
         sum(pings_accepted) AS ping_accepted,
         sum(pings_failed)   AS ping_rejected`;

const [byDate, byState, byCity, byPostal] = await Promise.all([
  q(base("leadprosper_agg_buyer", ["lead_date"], PING_COLS) + " ORDER BY lead_date"),
  q(base("leadprosper_agg_buyer_state", ["state"]) + " ORDER BY total_leads DESC"),
  q(base("leadprosper_agg_buyer_city", ["state", "city"]) + " ORDER BY total_leads DESC"),
  q(base("leadprosper_agg_buyer_postal", ["postal_code", "state"]) + " ORDER BY total_leads DESC"),
]);

const pct = (n, d) => (d > 0 ? +( (n / d) * 100 ).toFixed(2) : 0);
const money = (n) => +(+n).toFixed(2);
const rpl = (rev, leads) => (leads > 0 ? +(rev / leads).toFixed(2) : 0);

const wb = new ExcelJS.Workbook();
wb.creator = "QuickHomeFix";
wb.created = new Date();

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC000" } };
const TITLE_FONT = { bold: true, size: 14 };

function styleHeader(ws, row) {
  row.eachCell((c) => {
    c.font = { bold: true };
    c.fill = HEADER_FILL;
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = { bottom: { style: "thin", color: { argb: "FFBFBFBF" } } };
  });
  ws.views = [{ state: "frozen", ySplit: row.number }];
}

function autoWidth(ws) {
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell({ includeEmpty: true }, (c) => {
      const len = c.value == null ? 0 : String(c.value).length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 40);
  });
}

// Build a data sheet given dimension column defs + rows. When `withPings` is set,
// two ping columns are appended (only valid on the date grain).
function dataSheet(name, dimCols, rows, withPings = false) {
  const ws = wb.addWorksheet(name, { views: [{ showGridLines: true }] });
  const headers = [
    ...dimCols.map((d) => d.label),
    "Total Leads", "Accepted", "Acceptance %", "Rejected", "Outbid",
    "Sold", "Total Revenue ($)", "Avg Sell Price ($)", "Avg RPL ($)",
    ...(withPings ? ["Ping Accepted", "Ping Rejected"] : []),
  ];
  const hr = ws.addRow(headers);
  styleHeader(ws, hr);

  for (const r of rows) {
    const accPct = pct(+r.accepted_leads, +r.total_leads);
    const avgSell = r.sold_leads > 0 ? money(+r.total_revenue / +r.sold_leads) : 0;
    ws.addRow([
      ...dimCols.map((d) => r[d.key]),
      +r.total_leads, +r.accepted_leads, accPct, +r.rejected_leads, +r.outbid_leads,
      +r.sold_leads, money(+r.total_revenue), avgSell, rpl(+r.total_revenue, +r.accepted_leads),
      ...(withPings ? [+r.ping_accepted, +r.ping_rejected] : []),
    ]);
  }

  // Totals row (recompute rates on the rollup, not an average of rates).
  const t = rows.reduce((a, r) => {
    a.tl += +r.total_leads; a.al += +r.accepted_leads; a.rl += +r.rejected_leads;
    a.ol += +r.outbid_leads; a.sl += +r.sold_leads; a.rev += +r.total_revenue;
    a.pa += +(r.ping_accepted || 0); a.pr += +(r.ping_rejected || 0);
    return a;
  }, { tl: 0, al: 0, rl: 0, ol: 0, sl: 0, rev: 0, pa: 0, pr: 0 });
  const totalRow = ws.addRow([
    "TOTAL", ...dimCols.slice(1).map(() => ""),
    t.tl, t.al, pct(t.al, t.tl), t.rl, t.ol, t.sl,
    money(t.rev), t.sl > 0 ? money(t.rev / t.sl) : 0, rpl(t.rev, t.al),
    ...(withPings ? [t.pa, t.pr] : []),
  ]);
  totalRow.eachCell((c) => {
    c.font = { bold: true };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } };
  });

  // Number formats: money cols and percent col.
  const moneyCols = headers.map((h, i) => (/\$/.test(h) ? i + 1 : 0)).filter(Boolean);
  const pctCol = headers.indexOf("Acceptance %") + 1;
  ws.eachRow((row, n) => {
    if (n === 1) return;
    moneyCols.forEach((ci) => (row.getCell(ci).numFmt = "$#,##0.00"));
    row.getCell(pctCol).numFmt = '0.00"%"';
  });
  autoWidth(ws);
  return { ws, totals: t };
}

// Overall totals (sum of the date grain = the buyer's totals for the period).
const T = byDate.reduce((a, r) => {
  a.tl += +r.total_leads; a.al += +r.accepted_leads; a.rl += +r.rejected_leads;
  a.ol += +r.outbid_leads; a.sl += +r.sold_leads; a.rev += +r.total_revenue;
  a.pt += +r.pings_total; a.pa += +r.ping_accepted; a.pr += +r.ping_rejected;
  return a;
}, { tl: 0, al: 0, rl: 0, ol: 0, sl: 0, rev: 0, pt: 0, pa: 0, pr: 0 });
const acceptance = pct(T.al, T.tl);
const conv = pct(T.sl, T.tl);
const avgRpl = rpl(T.rev, T.al); // revenue per ACCEPTED lead
const avgSellPrice = T.sl > 0 ? money(T.rev / T.sl) : 0;
const outbidShare = pct(T.ol, T.tl);
const rejectShare = pct(T.rl, T.tl);
const pingAcceptRate = pct(T.pa, T.pt);
const pingRejectRate = pct(T.pr, T.pt);

const sum = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "FFFFC000" } } });
sum.getColumn(1).width = 34;
sum.getColumn(2).width = 22;

let row = sum.addRow([`${BUYER} — Lead Buying Performance`]);
row.font = TITLE_FONT;
sum.addRow([`Period: ${byDate[0]?.lead_date ?? ""} to ${byDate[byDate.length - 1]?.lead_date ?? ""}`]);
sum.addRow([]);

const kpis = [
  ["Total leads received", T.tl],
  ["Accepted leads", T.al],
  ["Acceptance rate", `${acceptance}%`],
  ["Rejected leads", `${T.rl} (${rejectShare}%)`],
  ["Outbid leads", `${T.ol} (${outbidShare}%)`],
  ["Sold (converted) leads", `${T.sl} (${conv}%)`],
  ["Total pings", T.pt],
  ["Ping accepted", `${T.pa} (${pingAcceptRate}%)`],
  ["Ping rejected", `${T.pr} (${pingRejectRate}%)`],
  ["Total revenue", `$${money(T.rev).toLocaleString()}`],
  ["Avg sell price (per sold lead)", `$${avgSellPrice}`],
  ["Avg revenue per accepted lead (RPL)", `$${avgRpl}`],
];
const kHead = sum.addRow(["Metric", "Value"]);
styleHeader(sum, kHead);
for (const [k, v] of kpis) sum.addRow([k, v]);

sum.addRow([]);
const fHead = sum.addRow(["Why bids & revenue are low"]);
fHead.font = { bold: true, size: 12 };
const findings = [
  `Only ${conv}% of leads convert to a sale (${T.sl} of ${T.tl}) — the vast majority never turn into revenue.`,
  `${outbidShare}% of leads were OUTBID (${T.ol}) — competitors bid higher, so we lost those leads on price.`,
  `${rejectShare}% of leads were REJECTED (${T.rl}) — these failed buyer filters/quality criteria.`,
  `Of ${T.pt} pings sent, ${pingRejectRate}% were rejected (${T.pr}) and only ${pingAcceptRate}% accepted (${T.pa}).`,
  `Average sell price is just $${avgSellPrice} per sold lead, so revenue per accepted lead (RPL) is $${avgRpl}.`,
  `Net: low conversion + high outbid/reject share + low sell price together explain the low total revenue of $${money(T.rev)}.`,
];
for (const f of findings) {
  const r = sum.addRow([f]);
  sum.mergeCells(`A${r.number}:B${r.number}`);
  r.getCell(1).alignment = { wrapText: true };
  r.height = 30;
}

// --- Data sheets (added after Summary so Summary is the first tab) ---
dataSheet("By Date",     [{ key: "lead_date", label: "Lead Date" }], byDate, true);
const stateRes  = dataSheet("By State",    [{ key: "state", label: "State" }], byState);
const cityRes   = dataSheet("By City",     [{ key: "state", label: "State" }, { key: "city", label: "City" }], byCity);
const postalRes = dataSheet("By Postcode", [{ key: "postal_code", label: "Postal Code" }, { key: "state", label: "State" }], byPostal);

// Pings aren't available per location — add an explanatory note below each geo sheet.
const PING_NOTE = "Note: Ping accepted/rejected is reported by LeadProsper only per buyer per day (not by location), so it appears on the Summary and By Date sheets — not here.";
for (const { ws } of [stateRes, cityRes, postalRes]) {
  ws.addRow([]);
  const n = ws.addRow([PING_NOTE]);
  n.getCell(1).font = { italic: true, color: { argb: "FF808080" } };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../reports");
const fs = await import("node:fs");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const safeBuyer = BUYER.replace(/[^A-Za-z0-9]+/g, "_");
let outPath = path.join(outDir, `${safeBuyer}_LeadProsper_Report_${stamp}.xlsx`);
try {
  await wb.xlsx.writeFile(outPath);
} catch (e) {
  if (e?.code !== "EBUSY") throw e;
  // Target is open in Excel — write a fresh timestamped copy instead.
  const t = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
  outPath = path.join(outDir, `${safeBuyer}_LeadProsper_Report_${stamp}_${t}.xlsx`);
  console.warn("Original file is open in Excel; writing new copy.");
  await wb.xlsx.writeFile(outPath);
}

console.log("Rows -> date:%d state:%d city:%d postal:%d", byDate.length, byState.length, byCity.length, byPostal.length);
console.log("Totals -> leads:%d sold:%d revenue:$%s acceptance:%s%% conv:%s%%", T.tl, T.sl, money(T.rev), acceptance, conv);
console.log("Saved:", outPath);
await closeClickhouse();
