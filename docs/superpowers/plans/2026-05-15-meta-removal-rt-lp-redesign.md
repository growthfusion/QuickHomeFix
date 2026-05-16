# Meta Removal & RT+LP Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Meta Ads API integration completely and rewire the dashboard so RedTrack provides all traffic metrics (visits, lp_clicks, lp_ctr, cost, device, OS, region) and LeadProsper provides all lead/revenue metrics, joined by campaign name.

**Architecture:** Single atomic pass — delete Meta files, rewrite `fetchRedTrack.js` (TDD), update `server.js` endpoints, rewrite dashboard data wiring. Migration drops old tables and recreates `redtrack_stats` with the new schema. No fallbacks to Meta anywhere.

**Tech Stack:** Node.js ES modules, Express 5, ClickHouse Cloud (`@clickhouse/client`), Vitest, static HTML dashboard, axios.

---

## File Map

| File | Action | Responsibility after change |
|---|---|---|
| `backend/jobs/fetchMeta.js` | **DELETE** | Gone |
| `backend/jobs/fetchMeta.test.js` | **DELETE** | Gone |
| `backend/jobs/fetchRedTrack.js` | **REWRITE** | 7-call sequential RT fetch, new schema mapping |
| `backend/jobs/fetchRedTrack.test.js` | **REWRITE** | Full TDD suite for new fetchRedTrack |
| `backend/server.js` | **MODIFY** | Remove Meta import/calls/endpoints, update RT endpoint + migration |
| `frontend/dash/form_leads.html` | **MODIFY** | Remove Meta arrays/functions, rewire to RT+LP join |

**DO NOT TOUCH:** `frontend/get-quotes/**`, `frontend/js/tracking.js`, `frontend/js/store.js`, `backend/jobs/fetchLeadProsper.js`, `/api/leads` endpoint logic.

---

## Task 1: Delete Meta files

**Files:**
- Delete: `backend/jobs/fetchMeta.js`
- Delete: `backend/jobs/fetchMeta.test.js`

- [ ] **Step 1: Delete both files**

```bash
git rm backend/jobs/fetchMeta.js backend/jobs/fetchMeta.test.js
```

Expected: both files staged for deletion.

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: delete fetchMeta.js and fetchMeta.test.js - Meta API removed"
```

---

## Task 2: Remove Meta from server.js

**Files:**
- Modify: `backend/server.js`

Four independent removals in one edit pass. None of these changes touch `/api/leads`, rate limiting, helmet, or Zod.

- [ ] **Step 1: Remove fetchMeta import (line 13)**

Find and remove this line:
```js
import { fetchMeta } from "./jobs/fetchMeta.js";
```

- [ ] **Step 2: Update startup job runner (around line 1825)**

Change:
```js
Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()])
  .then(() => console.log('[startup] Initial API sync complete'));
```
To:
```js
Promise.allSettled([fetchLeadProsper(), fetchRedTrack()])
  .then(() => console.log('[startup] Initial API sync complete'));
```

- [ ] **Step 3: Update cron job (around line 1831)**

Change:
```js
  Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()])
    .then(() => console.log('[cron] Hourly sync complete'));
```
To:
```js
  Promise.allSettled([fetchLeadProsper(), fetchRedTrack()])
    .then(() => console.log('[cron] Hourly sync complete'));
```

- [ ] **Step 4: Remove GET /api/stats/meta endpoint (around line 1836–1846)**

Remove this entire block:
```js
app.get("/api/stats/meta", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM meta_ad_stats WHERE fetched_at = (SELECT max(fetched_at) FROM meta_ad_stats) ORDER BY date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/meta]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});
```

- [ ] **Step 5: Update /api/dev/force-fetch to remove fetchMeta (around line 1874–1889)**

Change:
```js
app.post("/api/dev/force-fetch", async (_req, res) => {
  try {
    const [metaResult, lpResult, rtResult] = await Promise.allSettled([
      fetchMeta(),
      fetchLeadProsper(),
      fetchRedTrack(),
    ]);
    res.json({
      meta:       metaResult.status === 'fulfilled' ? 'ok' : metaResult.reason?.message,
      leadprosper: lpResult.status === 'fulfilled'  ? 'ok' : lpResult.reason?.message,
      redtrack:   rtResult.status === 'fulfilled'   ? 'ok' : rtResult.reason?.message,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```
To:
```js
app.post("/api/dev/force-fetch", async (_req, res) => {
  try {
    const [lpResult, rtResult] = await Promise.allSettled([
      fetchLeadProsper(),
      fetchRedTrack(),
    ]);
    res.json({
      leadprosper: lpResult.status === 'fulfilled' ? 'ok' : lpResult.reason?.message,
      redtrack:    rtResult.status === 'fulfilled' ? 'ok' : rtResult.reason?.message,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

- [ ] **Step 6: Remove CampaignMappingSchema and all three campaign-mapping endpoints (around line 1915–1970)**

Remove this entire block (from `const CampaignMappingSchema` through the closing `});` of the DELETE endpoint):
```js
const CampaignMappingSchema = z.object({
  meta_campaign_id: z.string().min(1),
  lp_campaign_id:   z.string().min(1),
  rt_source_id:     z.string().default(''),
  form_type:        z.enum(['bath', 'roof', 'windo', 'other']),
  label:            z.string().optional(),
});

app.get('/api/campaign-mapping', async (_req, res) => { ... });
app.post('/api/campaign-mapping', async (req, res) => { ... });
app.delete('/api/campaign-mapping/:meta_campaign_id', async (req, res) => { ... });
```

- [ ] **Step 7: Update /api/dev/migrate to new sequence (around line 1381–1538)**

Replace the entire `migrationQueries` array with:
```js
    const migrationQueries = [
      // 1. Drop orphaned Meta tables
      `DROP TABLE IF EXISTS meta_ad_stats`,
      `DROP TABLE IF EXISTS campaign_mapping`,
      // 2. Drop and recreate redtrack_stats with new schema
      `DROP TABLE IF EXISTS redtrack_stats`,
      `
        CREATE TABLE redtrack_stats (
          fetched_at      DateTime64(3, 'UTC') DEFAULT now64(3),
          date            Date,
          breakdown_type  String,
          group_key       String,
          campaign_name   String,
          channel         String,
          lander_name     String,
          lp_views        UInt32,
          lp_clicks       UInt32,
          lp_ctr          Float64,
          conversions     UInt32,
          purchases       UInt32,
          revenue         Float64,
          cost            Float64,
          roi             Float64,
          device          String,
          os              String,
          region          String
        ) ENGINE = MergeTree()
        ORDER BY (date, breakdown_type, group_key, campaign_name)
      `,
      // 3. LeadProsper stats (unchanged)
      `
        CREATE TABLE IF NOT EXISTS leadprosper_stats (
          fetched_at      DateTime64(3, 'UTC') DEFAULT now64(3),
          date            Date,
          campaign_id     String,
          campaign_name   String,
          leads_total     UInt32,
          leads_accepted  UInt32,
          leads_failed    UInt32,
          leads_returned  UInt32,
          total_buy       Float64,
          total_sell      Float64,
          net_profit      Float64
        ) ENGINE = MergeTree()
        ORDER BY (date, campaign_id)
      `,
      // 4. Leads table (unchanged)
      `
        CREATE TABLE IF NOT EXISTS ${CLICKHOUSE_TABLE}
        (
          id UUID DEFAULT generateUUIDv4(),
          service Nullable(String),
          normalized_service Nullable(String),
          first_name Nullable(String),
          last_name Nullable(String),
          email Nullable(String),
          phone Nullable(String),
          address Nullable(String),
          city Nullable(String),
          state Nullable(String),
          postal_code Nullable(String),
          own_home Nullable(String),
          buy_timeframe Nullable(String),
          is_owner Nullable(UInt8),
          can_make_changes Nullable(UInt8),
          roofing_type Nullable(String),
          roofing_plan Nullable(String),
          roof_count Nullable(String),
          roof_size Nullable(String),
          material Nullable(String),
          number_of_windows Nullable(String),
          windows_project_scope Nullable(String),
          window_style Nullable(String),
          opt_in_1 Nullable(String),
          interest Nullable(String),
          bath_needs Nullable(String),
          tub_reason Nullable(String),
          bathshower_type Nullable(String),
          bathwall_type Nullable(String),
          walkin_type Nullable(String),
          gutter_material Nullable(String),
          gutter_type Nullable(String),
          solar_type Nullable(String),
          sun_exposure Nullable(String),
          electric_bill Nullable(String),
          tag_id Nullable(String),
          publisher_sub_id Nullable(String),
          partner_source_id Nullable(String),
          trusted_form_token Nullable(String),
          lead_id_token Nullable(String),
          ping_token Nullable(String),
          home_phone_consent_language Nullable(String),
          landing_page_url Nullable(String),
          lp_campaign_id Nullable(String),
          lp_supplier_id Nullable(String),
          lp_ping_id Nullable(String),
          partner_lead_id Nullable(String),
          partner_delivered Nullable(UInt8),
          partner_payout Nullable(Float64),
          partner_status Nullable(String),
          client_ip Nullable(String),
          user_agent Nullable(String),
          created_at DateTime64(3, 'UTC') DEFAULT now64(3)
        )
        ENGINE = MergeTree
        ORDER BY (created_at, id)
      `,
    ];
```

- [ ] **Step 8: Update GET /api/stats/redtrack to return structured JSON (around line 1860–1870)**

Change:
```js
app.get("/api/stats/redtrack", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM redtrack_stats WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats) ORDER BY date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/redtrack]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});
```
To:
```js
app.get("/api/stats/redtrack", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM redtrack_stats WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats) ORDER BY date DESC`
    );
    const result = { daily: [], campaign: [], os: [], device: [], region: [], lander: [] };
    for (const r of rows) {
      const key = r.breakdown_type;
      if (result[key]) result[key].push(r);
    }
    res.json(result);
  } catch (e) {
    console.error('[/api/stats/redtrack]', e.message);
    res.status(500).json({ daily: [], campaign: [], os: [], device: [], region: [], lander: [] });
  }
});
```

- [ ] **Step 9: Verify server.js still has no reference to fetchMeta or meta_ad_stats**

```bash
grep -n "fetchMeta\|meta_ad_stats\|campaign_mapping\|stats/meta" backend/server.js
```

Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add backend/server.js
git commit -m "feat: remove Meta API from server.js - update RT endpoint, migration, force-fetch"
```

---

## Task 3: Write new fetchRedTrack.test.js (TDD — write tests before rewriting the job)

**Files:**
- Rewrite: `backend/jobs/fetchRedTrack.test.js`

Write the complete new test file. Tests will FAIL until Task 4 rewrites the implementation.

- [ ] **Step 1: Replace entire test file content**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInsert = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClose  = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockClickhouseClient = vi.hoisted(() => ({ insert: mockInsert, close: mockClose }));

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => mockClickhouseClient),
}));

import axios from 'axios';
import { fetchRedTrack } from './fetchRedTrack.js';

function mockRtApi({
  sources  = [],
  daily    = [],
  os       = [],
  device   = [],
  country  = [],
  campaign = [],
  offer    = [],
} = {}) {
  axios.get.mockImplementation((url) => {
    const decoded = decodeURIComponent(url);
    if (decoded.includes('/traffic_sources')) return Promise.resolve({ data: sources });
    if (!decoded.includes('/report'))         return Promise.resolve({ data: [] });
    if (decoded.includes('group[]=campaign')) return Promise.resolve({ data: campaign });
    if (decoded.includes('group[]=os'))       return Promise.resolve({ data: os });
    if (decoded.includes('group[]=device'))   return Promise.resolve({ data: device });
    if (decoded.includes('group[]=country'))  return Promise.resolve({ data: country });
    if (decoded.includes('group[]=offer'))    return Promise.resolve({ data: offer });
    return Promise.resolve({ data: daily });
  });
}

describe('fetchRedTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue(undefined);
    process.env.REDTRACK_API_KEY    = 'rt_key';
    process.env.CLICKHOUSE_HOST     = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
    process.env.RT_CALL_DELAY_MS    = '0';
  });

  // ── Call count ────────────────────────────────────────────────────────────

  it('makes exactly 7 API calls: traffic_sources + 6 report breakdowns', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(axios.get).toHaveBeenCalledTimes(7);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('includes a group[]=campaign call in the 7 calls', async () => {
    mockRtApi();
    await fetchRedTrack();
    const urls = axios.get.mock.calls.map(c => decodeURIComponent(c[0]));
    expect(urls.some(u => u.includes('group[]=campaign'))).toBe(true);
  });

  it('report URLs contain date_from and date_to, not bare from= or to=', async () => {
    mockRtApi({ daily: [{ date: '2026-05-01', lp_views: 10, lp_clicks: 5, conversions: 1, revenue: 0, cost: 0, roi: 0 }] });
    await fetchRedTrack();
    const reportUrl = decodeURIComponent(
      axios.get.mock.calls.find(c => decodeURIComponent(c[0]).includes('/report') && !decodeURIComponent(c[0]).includes('group[]=os'))?.[0] || ''
    );
    expect(reportUrl).toContain('date_from=');
    expect(reportUrl).toContain('date_to=');
    expect(reportUrl).not.toMatch(/[?&]from=/);
    expect(reportUrl).not.toMatch(/[?&]to=/);
  });

  // ── Breakdown types ───────────────────────────────────────────────────────

  it('stores daily rows with breakdown_type=daily and group_key=""', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 500, lp_clicks: 200, conversions: 15, revenue: 300, cost: 100, roi: 200 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row).toBeDefined();
    expect(row.date).toBe('2026-05-01');
    expect(row.lp_views).toBe(500);
    expect(row.group_key).toBe('');
  });

  it('stores OS rows with breakdown_type=os, group_key from row.os', async () => {
    mockRtApi({
      os: [
        { date: '2026-05-01', os: 'iOS',     lp_views: 300, lp_clicks: 100, conversions: 10, revenue: 0, cost: 0, roi: 0 },
        { date: '2026-05-01', os: 'Android', lp_views: 150, lp_clicks:  80, conversions:  5, revenue: 0, cost: 0, roi: 0 },
      ],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const osRows = values.filter(r => r.breakdown_type === 'os');
    expect(osRows).toHaveLength(2);
    expect(osRows.map(r => r.group_key).sort()).toEqual(['Android', 'iOS']);
  });

  it('stores device rows with breakdown_type=device, group_key from row.device', async () => {
    mockRtApi({
      device: [
        { date: '2026-05-01', device: 'smartphone', lp_views: 400, lp_clicks: 150, conversions: 12, revenue: 0, cost: 0, roi: 0 },
        { date: '2026-05-01', device: 'desktop',    lp_views: 100, lp_clicks:  50, conversions:  4, revenue: 0, cost: 0, roi: 0 },
      ],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const devRows = values.filter(r => r.breakdown_type === 'device');
    expect(devRows).toHaveLength(2);
    expect(devRows.map(r => r.group_key).sort()).toEqual(['desktop', 'smartphone']);
  });

  it('stores region rows with breakdown_type=region (not country), group_key from row.country', async () => {
    mockRtApi({
      country: [{ date: '2026-05-01', country: 'United States', lp_views: 400, lp_clicks: 150, conversions: 12, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const regionRows = values.filter(r => r.breakdown_type === 'region');
    expect(regionRows).toHaveLength(1);
    expect(regionRows[0].group_key).toBe('United States');
    // must NOT produce breakdown_type='country'
    expect(values.some(r => r.breakdown_type === 'country')).toBe(false);
  });

  it('stores campaign rows with breakdown_type=campaign, group_key from row.campaign', async () => {
    mockRtApi({
      campaign: [
        { date: '2026-05-01', campaign: 'Bath-Remodel-May2026', lp_views: 300, lp_clicks: 120, conversions: 10, revenue: 500, cost: 200, roi: 150 },
      ],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const campRows = values.filter(r => r.breakdown_type === 'campaign');
    expect(campRows).toHaveLength(1);
    expect(campRows[0].group_key).toBe('Bath-Remodel-May2026');
    expect(campRows[0].campaign_name).toBe('Bath-Remodel-May2026');
  });

  it('stores campaign rows with group_key from campaign_name fallback when campaign field absent', async () => {
    mockRtApi({
      campaign: [{ date: '2026-05-01', campaign_name: 'Roof-May2026', lp_views: 100, lp_clicks: 40, conversions: 5, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const campRows = values.filter(r => r.breakdown_type === 'campaign');
    expect(campRows[0].group_key).toBe('Roof-May2026');
  });

  it('stores campaign rows with group_key from row.name fallback when campaign and campaign_name absent', async () => {
    mockRtApi({
      campaign: [{ date: '2026-05-01', name: 'Window-May2026', lp_views: 50, lp_clicks: 20, conversions: 2, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const campRows = values.filter(r => r.breakdown_type === 'campaign');
    expect(campRows[0].group_key).toBe('Window-May2026');
  });

  it('stores campaign rows with group_key from row.title fallback as last resort', async () => {
    mockRtApi({
      campaign: [{ date: '2026-05-01', title: 'Tub-May2026', lp_views: 50, lp_clicks: 20, conversions: 2, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const campRows = values.filter(r => r.breakdown_type === 'campaign');
    expect(campRows[0].group_key).toBe('Tub-May2026');
  });

  it('stores lander rows with breakdown_type=lander (not offer), group_key from row.offer', async () => {
    mockRtApi({
      offer: [
        { date: '2026-05-01', offer: 'Bath Remodel Landing',  lp_views: 200, lp_clicks:  80, conversions:  8, revenue: 0, cost: 0, roi: 0 },
        { date: '2026-05-01', offer: 'Roof Estimate Landing', lp_views: 150, lp_clicks:  60, conversions:  6, revenue: 0, cost: 0, roi: 0 },
      ],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const landerRows = values.filter(r => r.breakdown_type === 'lander');
    expect(landerRows).toHaveLength(2);
    expect(landerRows.map(r => r.group_key).sort()).toEqual(['Bath Remodel Landing', 'Roof Estimate Landing']);
    // must NOT produce breakdown_type='offer'
    expect(values.some(r => r.breakdown_type === 'offer')).toBe(false);
  });

  // ── lp_clicks, lp_ctr field mapping ──────────────────────────────────────

  it('computes lp_ctr correctly as lp_clicks/lp_views*100', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 200, lp_clicks: 50, conversions: 5, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.lp_ctr).toBeCloseTo(25.0); // 50/200*100
  });

  it('lp_ctr is 0 when lp_views is 0', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 0, lp_clicks: 0, conversions: 0, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.lp_ctr).toBe(0);
  });

  it('lp_clicks falls back to landing_clicks when lp_clicks is absent', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 100, landing_clicks: 40, conversions: 0, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.lp_clicks).toBe(40);
  });

  // ── Financial field mapping ───────────────────────────────────────────────

  it('purchases mapped correctly from RT row (row.purchases || 0)', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 100, lp_clicks: 40, conversions: 5, purchases: 3, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.purchases).toBe(3);
  });

  it('roi mapped correctly from RT row (row.roi || 0)', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 100, lp_clicks: 40, conversions: 5, revenue: 300, cost: 100, roi: 200 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.roi).toBe(200);
  });

  it('revenue mapped correctly from RT row (row.revenue || 0)', async () => {
    mockRtApi({
      daily: [{ date: '2026-05-01', lp_views: 100, lp_clicks: 40, conversions: 5, revenue: 1234.56, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.revenue).toBeCloseTo(1234.56);
  });

  // ── sourceMap: channel and lander_name ───────────────────────────────────

  it('fills channel and lander_name from sourceMap when source_id matches', async () => {
    mockRtApi({
      sources: [{ _id: 'src001', name: 'Facebook', lander: { name: 'Bath Landing' } }],
      daily:   [{ date: '2026-05-01', source_id: 'src001', lp_views: 100, lp_clicks: 40, conversions: 5, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.channel).toBe('Facebook');
    expect(row.lander_name).toBe('Bath Landing');
  });

  it('channel and lander_name are empty string when source ID not found in sourceMap', async () => {
    mockRtApi({
      sources: [{ _id: 'other_id', name: 'TikTok', lander: { name: 'Some Landing' } }],
      daily:   [{ date: '2026-05-01', source_id: 'missing_id', lp_views: 100, lp_clicks: 40, conversions: 5, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const row = values.find(r => r.breakdown_type === 'daily');
    expect(row.channel).toBe('');
    expect(row.lander_name).toBe('');
    // Row is still stored despite missing sourceMap entry
    expect(row).toBeDefined();
  });

  // ── device / os / region field population ────────────────────────────────

  it('device field is set for breakdown_type=device rows, empty for others', async () => {
    mockRtApi({
      device: [{ date: '2026-05-01', device: 'smartphone', lp_views: 200, lp_clicks: 80, conversions: 5, revenue: 0, cost: 0, roi: 0 }],
      daily:  [{ date: '2026-05-01', lp_views: 500, lp_clicks: 200, conversions: 15, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const devRow = values.find(r => r.breakdown_type === 'device');
    expect(devRow.device).toBe('smartphone');
    const dailyRow = values.find(r => r.breakdown_type === 'daily');
    expect(dailyRow.device).toBe('');
  });

  it('os field is set for breakdown_type=os rows, empty for others', async () => {
    mockRtApi({
      os:    [{ date: '2026-05-01', os: 'iOS', lp_views: 300, lp_clicks: 120, conversions: 10, revenue: 0, cost: 0, roi: 0 }],
      daily: [{ date: '2026-05-01', lp_views: 500, lp_clicks: 200, conversions: 15, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const osRow = values.find(r => r.breakdown_type === 'os');
    expect(osRow.os).toBe('iOS');
    const dailyRow = values.find(r => r.breakdown_type === 'daily');
    expect(dailyRow.os).toBe('');
  });

  it('region field is set for breakdown_type=region rows, empty for others', async () => {
    mockRtApi({
      country: [{ date: '2026-05-01', country: 'US', lp_views: 400, lp_clicks: 150, conversions: 12, revenue: 0, cost: 0, roi: 0 }],
      daily:   [{ date: '2026-05-01', lp_views: 500, lp_clicks: 200, conversions: 15, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const regionRow = values.find(r => r.breakdown_type === 'region');
    expect(regionRow.region).toBe('US');
    const dailyRow = values.find(r => r.breakdown_type === 'daily');
    expect(dailyRow.region).toBe('');
  });

  // ── Insert behavior ───────────────────────────────────────────────────────

  it('combines all 6 breakdown types into a single ch.insert() call', async () => {
    mockRtApi({
      daily:    [{ date: '2026-05-01', lp_views: 500, lp_clicks: 200, conversions: 10, revenue: 0, cost: 0, roi: 0 }],
      os:       [{ date: '2026-05-01', os: 'iOS', lp_views: 300, lp_clicks: 120, conversions: 6, revenue: 0, cost: 0, roi: 0 }],
      device:   [{ date: '2026-05-01', device: 'smartphone', lp_views: 400, lp_clicks: 150, conversions: 8, revenue: 0, cost: 0, roi: 0 }],
      country:  [{ date: '2026-05-01', country: 'US', lp_views: 450, lp_clicks: 180, conversions: 9, revenue: 0, cost: 0, roi: 0 }],
      campaign: [{ date: '2026-05-01', campaign: 'Bath-May2026', lp_views: 300, lp_clicks: 120, conversions: 6, revenue: 0, cost: 0, roi: 0 }],
      offer:    [{ date: '2026-05-01', offer: 'Bath Landing', lp_views: 200, lp_clicks: 80, conversions: 4, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const values = mockInsert.mock.calls[0][0].values;
    expect(values).toHaveLength(6);
    const types = values.map(r => r.breakdown_type).sort();
    expect(types).toEqual(['campaign', 'daily', 'device', 'lander', 'os', 'region']);
  });

  it('skips insert when all calls return empty', async () => {
    mockRtApi();
    await fetchRedTrack();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  // ── Empty group_key handling ───────────────────────────────────────────────

  it('stores rows with empty group_key as unknown instead of filtering them out', async () => {
    mockRtApi({
      os: [
        { date: '2026-05-01', os: '',    lp_views: 10, lp_clicks: 5, conversions: 1, revenue: 0, cost: 0, roi: 0 },
        { date: '2026-05-01', os: 'iOS', lp_views: 50, lp_clicks: 20, conversions: 3, revenue: 0, cost: 0, roi: 0 },
      ],
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    const osRows = values.filter(r => r.breakdown_type === 'os');
    expect(osRows).toHaveLength(2);
    const emptyKeyRow = osRows.find(r => r.group_key === 'unknown');
    expect(emptyKeyRow).toBeDefined();
  });

  it('rows without a date field are filtered out', async () => {
    mockRtApi({
      os: [{ os: 'iOS', lp_views: 100, lp_clicks: 40, conversions: 4, revenue: 0, cost: 0, roi: 0 }],
    });
    await fetchRedTrack();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // ── Error resilience ──────────────────────────────────────────────────────

  it('still inserts from successful calls when one breakdown call fails', async () => {
    axios.get.mockImplementation((url) => {
      const decoded = decodeURIComponent(url);
      if (decoded.includes('/traffic_sources')) return Promise.resolve({ data: [] });
      if (decoded.includes('group[]=os')) return Promise.reject(new Error('os failed'));
      if (decoded.includes('/report')) {
        return Promise.resolve({
          data: [{ date: '2026-05-01', lp_views: 100, lp_clicks: 40, conversions: 4, revenue: 0, cost: 0, roi: 0 }],
        });
      }
      return Promise.resolve({ data: [] });
    });
    await fetchRedTrack();
    const values = mockInsert.mock.calls[0][0].values;
    expect(values.some(r => r.breakdown_type === 'daily')).toBe(true);
    expect(values.every(r => r.breakdown_type !== 'os')).toBe(true);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('closes ClickHouse client exactly once even when all API calls fail', async () => {
    axios.get.mockRejectedValue(new Error('network failure'));
    await fetchRedTrack();
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd backend && npx vitest run jobs/fetchRedTrack.test.js
```

Expected: multiple FAIL. Failures should be about wrong call counts, wrong breakdown_type names (`'country'` vs `'region'`, `'offer'` vs `'lander'`), missing `campaign` breakdown, missing `lp_clicks`/`lp_ctr`/`purchases` fields.

- [ ] **Step 3: Commit failing tests**

```bash
git add backend/jobs/fetchRedTrack.test.js
git commit -m "test: rewrite fetchRedTrack tests for new 7-call schema (failing)"
```

---

## Task 4: Rewrite fetchRedTrack.js to make tests pass

**Files:**
- Rewrite: `backend/jobs/fetchRedTrack.js`

- [ ] **Step 1: Replace entire file content**

```js
import axios from 'axios';
import { createClient } from '@clickhouse/client';

const RT_BASE = 'https://api.redtrack.io';

function buildClient() {
  const host = process.env.CLICKHOUSE_HOST || '';
  const url = /^https?:\/\//i.test(host)
    ? host
    : `https://${host}:${process.env.CLICKHOUSE_PORT || 8443}`;
  return createClient({
    url,
    database: process.env.CLICKHOUSE_DATABASE || 'default',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    request_timeout: 45000,
  });
}

function last30Days() {
  const now = new Date();
  const date_to   = now.toISOString().slice(0, 10);
  const date_from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { date_from, date_to };
}

function buildReportUrl(apiKey, date_from, date_to, groups) {
  const p = new URLSearchParams();
  p.append('api_key', apiKey);
  p.append('date_from', date_from);
  p.append('date_to', date_to);
  for (const g of groups) p.append('group[]', g);
  return `${RT_BASE}/report?${p.toString()}`;
}

async function fetchTrafficSources(apiKey) {
  try {
    const res = await axios.get(
      `${RT_BASE}/traffic_sources?api_key=${encodeURIComponent(apiKey)}&limit=200`
    );
    const items = Array.isArray(res.data)
      ? res.data
      : (res.data?.data || res.data?.items || res.data?.sources || []);
    const map = {};
    for (const s of items) {
      const id = String(s._id || s.id || '');
      if (!id) continue;
      map[id] = {
        channel_name: s.name || s.title || '',
        lander_name:  s.lander?.name || s.offer?.name || s.landing?.name || '',
      };
    }
    return map;
  } catch (err) {
    console.warn('[fetchRedTrack] traffic_sources call failed:', err.message);
    return {};
  }
}

function deriveGroupKey(type, row) {
  switch (type) {
    case 'os':       return row.os       || row.os_family    || '';
    case 'device':   return row.device   || row.device_type  || '';
    case 'region':   return row.country  || row.country_name || row.region || '';
    case 'campaign': return row.campaign || row.campaign_name || row.name  || row.title || '';
    case 'lander':   return row.offer    || row.offer_name   || row.lander || '';
    default:         return '';
  }
}

function makeRow(fetchedAt, type, sourceMap, row) {
  const rawKey   = deriveGroupKey(type, row);
  const groupKey = (type === 'daily') ? '' : (rawKey || 'unknown');
  const src      = sourceMap[String(row.source_id || row.source || '')] || {};
  const lp_views  = Number(row.lp_views)  || 0;
  const lp_clicks = Number(row.lp_clicks) || Number(row.landing_clicks) || 0;
  const lp_ctr    = lp_views > 0 ? (lp_clicks / lp_views) * 100 : 0;

  return {
    fetched_at:     fetchedAt,
    date:           row.date,
    breakdown_type: type,
    group_key:      groupKey,
    campaign_name:  row.campaign || row.campaign_name || row.name || row.title || '',
    channel:        src.channel_name || '',
    lander_name:    src.lander_name  || '',
    lp_views,
    lp_clicks,
    lp_ctr,
    conversions:    Number(row.conversions) || 0,
    purchases:      Number(row.purchases)   || 0,
    revenue:        Number(row.revenue)     || 0,
    cost:           Number(row.cost)        || 0,
    roi:            Number(row.roi)         || 0,
    device:         type === 'device' ? groupKey : '',
    os:             type === 'os'     ? groupKey : '',
    region:         type === 'region' ? groupKey : '',
  };
}

const BREAKDOWNS = [
  { type: 'daily',    groups: ['date'] },
  { type: 'os',       groups: ['date', 'os'] },
  { type: 'device',   groups: ['date', 'device'] },
  { type: 'region',   groups: ['date', 'country'] },
  { type: 'campaign', groups: ['date', 'campaign'] },
  { type: 'lander',   groups: ['date', 'offer'] },
];

const sleep  = ms => new Promise(resolve => setTimeout(resolve, ms));
const rtDelay = () => sleep(Number(process.env.RT_CALL_DELAY_MS ?? 800));

export async function fetchRedTrack() {
  const apiKey = process.env.REDTRACK_API_KEY;
  if (!apiKey) {
    console.warn('[fetchRedTrack] REDTRACK_API_KEY not set — skipping');
    return;
  }

  const ch = buildClient();
  try {
    const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const { date_from, date_to } = last30Days();

    const sourceMap = await fetchTrafficSources(apiKey);
    await rtDelay();

    const allRows = [];

    for (let i = 0; i < BREAKDOWNS.length; i++) {
      const { type, groups } = BREAKDOWNS[i];
      try {
        const url = buildReportUrl(apiKey, date_from, date_to, groups);
        const res = await axios.get(url);
        const data = Array.isArray(res.data) ? res.data : [];

        if (data.length > 0) {
          console.log(`[fetchRedTrack] ${type} sample keys:`,
            Object.keys(data[0]).filter(k => k.length < 20).join(','));
        }

        let hasEmptyKey = false;
        for (const r of data) {
          if (!r.date) continue;
          if (type !== 'daily' && !deriveGroupKey(type, r)) hasEmptyKey = true;
          allRows.push(makeRow(fetchedAt, type, sourceMap, r));
        }

        if (hasEmptyKey) {
          console.warn(
            `[fetchRedTrack] ${type} grouping returned empty keys - RT may not support this breakdown`
          );
        }
      } catch (err) {
        console.warn(`[fetchRedTrack] ${type} call failed:`, err.message);
      }

      if (i < BREAKDOWNS.length - 1) await rtDelay();
    }

    if (allRows.length === 0) {
      console.log('[fetchRedTrack] No data returned');
      return;
    }

    await ch.insert({ table: 'redtrack_stats', values: allRows, format: 'JSONEachRow' });
    const byType = allRows.reduce(
      (acc, r) => { acc[r.breakdown_type] = (acc[r.breakdown_type] || 0) + 1; return acc; },
      {}
    );
    console.log(`[fetchRedTrack] Inserted ${allRows.length} rows:`, byType);
  } finally {
    await ch.close();
  }
}
```

- [ ] **Step 2: Run tests — expect all green**

```bash
cd backend && npx vitest run jobs/fetchRedTrack.test.js
```

Expected: all PASS. If any test fails, fix the implementation before proceeding.

- [ ] **Step 3: Commit**

```bash
git add backend/jobs/fetchRedTrack.js
git commit -m "feat: rewrite fetchRedTrack with 7 calls, new schema (lp_clicks/lp_ctr/purchases/campaign)"
```

---

## Task 5: Run full test suite to confirm nothing broken

**Files:** none (validation only)

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npx vitest run
```

Expected: all tests pass. No tests should reference `fetchMeta`, `meta_ad_stats`, `campaign_mapping`, or `epc`.

- [ ] **Step 2: Spot-check: confirm no remaining Meta references in backend**

```bash
grep -rn "fetchMeta\|meta_ad_stats\|campaign_mapping\|epc\b" backend/jobs/ backend/server.js
```

Expected: no output (or only unrelated matches like `epc` in comments — confirm they are not wiring code).

- [ ] **Step 3: Commit if clean, or fix and commit**

```bash
git add -p  # stage any fixes
git commit -m "chore: confirm all backend Meta references removed"
```

---

## Task 6: Rewrite form_leads.html dashboard

**Files:**
- Modify: `frontend/dash/form_leads.html`

This is the largest change. Six independent sub-steps, each with a commit.

### 6a — Remove Meta variables and inferForm()

- [ ] **Step 1: Remove these variable declarations (around lines 420–445)**

Remove:
```js
    // Meta placement rows: [date, form, publisher_platform, clicks, ctr, spend]
    let AD_SPEND = [];
    // Meta ad-level rows: [campaign_name, adset_name, ad_name, placement, campaign_id, form, clicks, 0]
    let META_ADS = [];
    // Meta device breakdown: [date, form, device, os, clicks, spend]
    let META_DEVICE = [];
    // Meta region breakdown: [date, form, region, clicks, spend]
    let META_REGION = [];
```

And:
```js
    let CAMPAIGN_MAP = {}; // keyed by meta_campaign_id → campaign_mapping row (Fix B)
```

- [ ] **Step 2: Remove inferForm() function (around lines 451–457)**

Remove:
```js
    function inferForm(name) {
      const n = (name || '').toLowerCase();
      if (n.includes('bath') || n.includes('shower') || n.includes('tub')) return 'bath';
      if (n.includes('roof')) return 'roof';
      if (n.includes('windo')) return 'windo';
      return 'other';
    }
```

- [ ] **Step 3: Replace the existing RT variable declarations with new ones (around lines 428–449)**

Change from:
```js
    // RedTrack daily: [[date, lp_views], ...]
    let RT_DAILY = [];
    // RedTrack OS daily: [[date, os_name, lp_views], ...]
    let RT_BY_OS = [];
    // RedTrack device daily: [[date, device, lp_views], ...]
    let RT_BY_DEVICE = [];
    // RedTrack country daily: [[date, country, lp_views], ...]
    let RT_BY_COUNTRY = [];
    let RT_OFFERS = [];
```

To:
```js
    let RT_DAILY    = [];   // redtrack_stats rows, breakdown_type='daily'
    let RT_CAMPAIGN = [];   // redtrack_stats rows, breakdown_type='campaign'
    let RT_OS       = [];   // redtrack_stats rows, breakdown_type='os'
    let RT_DEVICE   = [];   // redtrack_stats rows, breakdown_type='device'
    let RT_REGION   = [];   // redtrack_stats rows, breakdown_type='region'
    let RT_LANDER   = [];   // redtrack_stats rows, breakdown_type='lander'
```

Also add after `let LD_OS = [];`:
```js
    let LD_CAMPAIGN = [];   // from /api/stats/leads-breakdown, by lp_campaign_id
```

- [ ] **Step 4: Remove dead LD_DAILY declaration**

Find and remove this line (it maps to a field that no longer exists in the API response):
```js
    let LD_DAILY  = [];
```

- [ ] **Step 5: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "refactor(dash): remove Meta variable declarations, inferForm, and LD_DAILY"
```

### 6b — Rewrite loadStats()

- [ ] **Step 1: Replace the entire loadStats() function (around lines 464–629)**

```js
    async function loadStats() {
      try {
        const [rtRes, lpRes, ldRes, lpFormMapRes] = await Promise.all([
          fetch('/api/stats/redtrack').then(r => r.json()).catch(() => ({ daily:[], campaign:[], os:[], device:[], region:[], lander:[] })),
          fetch('/api/stats/leadprosper').then(r => r.json()).catch(() => ({ ok: false, rows: [] })),
          fetch('/api/stats/leads-breakdown').then(r => r.json()).catch(() => ({ state:[], device:[], os:[], campaign:[] })),
          fetch('/api/stats/lp-form-map').then(r => r.json()).catch(() => []),
        ]);

        console.log('[loadStats] rt daily:', rtRes.daily?.length, 'campaign:', rtRes.campaign?.length,
          'os:', rtRes.os?.length, 'device:', rtRes.device?.length,
          'region:', rtRes.region?.length, 'lander:', rtRes.lander?.length);
        console.log('[loadStats] lp rows:', lpRes.ok, lpRes.rows?.length, 'error:', lpRes.message);

        RT_DAILY    = rtRes.daily    || [];
        RT_CAMPAIGN = rtRes.campaign || [];
        RT_OS       = rtRes.os       || [];
        RT_DEVICE   = rtRes.device   || [];
        RT_REGION   = rtRes.region   || [];
        RT_LANDER   = rtRes.lander   || [];

        if (Array.isArray(lpFormMapRes)) {
          LP_FORM_MAP = {};
          for (const entry of lpFormMapRes) {
            if (entry.lp_campaign_id) LP_FORM_MAP[entry.lp_campaign_id] = entry.form_type;
          }
        }

        if (ldRes) {
          LD_STATE    = ldRes.state    || [];
          LD_DEVICE   = ldRes.device   || [];
          LD_OS       = ldRes.os       || [];
          LD_CAMPAIGN = ldRes.campaign || [];
        }

        if (lpRes.ok && lpRes.rows) {
          LP_CAMPAIGNS_RAW = lpRes.rows;
          LP_ROWS = lpRes.rows.map(r => {
            const lt   = Number(r.leads_total    || 0);
            const sold = Number(r.leads_accepted || 0);
            const failed = Number(r.leads_failed || 0);
            const rev  = Number(r.total_sell     || 0);
            const form = LP_FORM_MAP[r.campaign_id] || 'other';
            return [
              r.date,
              form,
              lt,
              sold,
              lt > 0 ? (sold / lt) * 100 : 0,
              failed,
              lt > 0 ? (failed / lt) * 100 : 0,
              Number(r.leads_returned || 0),
              rev,
              0,
              r.campaign_id   || '',
              r.campaign_name || '',   // index 11: for RT join
            ];
          });
        }

      } catch (err) {
        console.warn('[loadStats] fetch failed, rendering with empty API data:', err.message);
      }

      const statusEl = document.getElementById('data-status');
      if (statusEl) {
        statusEl.textContent =
          `RT: ${RT_DAILY.length} daily | ${RT_CAMPAIGN.length} campaign | ${RT_LANDER.length} lander  ·  ` +
          `LP: ${LP_ROWS.length} rows  ·  ` +
          `Date range: ${FILTERS.from} → ${FILTERS.to}`;
        statusEl.classList.remove('hidden');
      }

      rerender();
    }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "refactor(dash): rewrite loadStats to use RT+LP only, remove Meta fetches"
```

### 6c — Add RT helper functions and rewrite lpRow()

- [ ] **Step 1: Replace the sumAd() function and add new RT helpers (around lines 759–768)**

Remove `sumAd()` entirely and replace with:
```js
    // Normalize RT device names to mobile/tablet/desktop
    function normalizeDevice(v) {
      const s = (v || '').toLowerCase();
      if (s.includes('mobile') || s.includes('android') || s.includes('smartphone')) return 'mobile';
      if (s.includes('tablet')) return 'tablet';
      return 'desktop';
    }

    // Normalize RT OS names to ios/android/windows/macos/other
    function normalizeOs(v) {
      const s = (v || '').toLowerCase();
      if (s.includes('ios') || s.includes('iphone') || s.includes('ipad')) return 'ios';
      if (s.includes('android')) return 'android';
      if (s.includes('windows')) return 'windows';
      if (s.includes('mac')) return 'macos';
      return 'other';
    }

    // Sum RT rows matching a predicate. Returns { lp_views, lp_clicks, lp_ctr, cost }
    function sumRt(rows, predicate) {
      let views = 0, clicks = 0, cost = 0;
      for (const r of rows) {
        if (!predicate(r)) continue;
        views  += Number(r.lp_views  || 0);
        clicks += Number(r.lp_clicks || 0);
        cost   += Number(r.cost      || 0);
      }
      const ctr = views > 0 ? (clicks / views) * 100 : 0;
      return { lp_views: views, lp_clicks: clicks, lp_ctr: ctr, cost };
    }
```

- [ ] **Step 2: Rewrite lpRow() to use RT data instead of Meta ad object (around line 721)**

Replace the existing `lpRow()` function with:
```js
    // Build a row with all metric columns.
    // rtData: { lp_views, lp_clicks, lp_ctr, cost } — all from RedTrack
    function lpRow(label, leads, succ, accPct, rev, rtData, _unused) {
      const { lp_views: visits, lp_clicks, lp_ctr, cost } = Object.assign(
        { lp_views: 0, lp_clicks: 0, lp_ctr: 0, cost: 0 }, rtData
      );
      const profit = rev - cost;
      const cr     = visits ? (leads / visits) * 100 : 0;
      const epv    = visits ? rev / visits            : 0;
      const avgL   = leads  ? rev / leads             : 0;
      const avgS   = succ   ? rev / succ              : 0;
      return [
        label,
        visits,                                         // VISITS
        lp_clicks,                                      // LP CLICKS
        lp_ctr.toFixed(2) + "%",                        // LP CTR, %
        cr.toFixed(2) + "%",                            // CR, %
        "-",                                            // EMAILS
        leads, succ, accPct.toFixed(2) + "%",           // LEADS, SOLD, %
        0, "0%", 0, 0, "0%", "0%",                      // APPTS, UPSELLS group
        0, 0, "0%", "0%",                               // PPC group
        0, 0, "0%",                                     // THUMBTACK group
        rev,                                            // TOTAL REVENUE, $
        avgL.toFixed(2),                                // LEADS, $
        cost.toFixed(2),                                // COST, $
        0, 0, 0, 0,                                     // UPSELLS, THUMBTACK, PPC, REPOSTS $
        0,                                              // ADJUSTMENT, $
        avgL.toFixed(2),                                // AVG PER LEAD, $
        avgS.toFixed(2),                                // AVG PER SOLD, $
        epv.toFixed(2),                                 // EPV, $
        profit.toFixed(2),                              // PROFIT, $
      ];
    }
```

Also update `METRIC_COLS` to match the new columns (around line 410):
```js
    const METRIC_COLS = [
      "VISITS","LP CLICKS","LP CTR, %","CR, %","EMAILS","LEADS","SOLD","%",
      "APPTS","%","UPSELLS","SOLD","%","UPSELL_RATE, %",
      "PPC","SOLD","%","PPC_RATE, %",
      "THUMBTACK","SOLD","%",
      "TOTAL REVENUE, $","LEADS, $","COST, $","UPSELLS, $","THUMBTACK, $","PPC, $","REPOSTS, $",
      "ADJUSTMENT, $","AVG PER LEAD, $","AVG PER SOLD, $","EPV, $","PROFIT, $"
    ];
```

- [ ] **Step 3: Update rtVisitsForDate() to use new RT_DAILY row objects (around line 754)**

Change:
```js
    function rtVisitsForDate(date) {
      const row = RT_DAILY.find(r => r[0] === date);
      return row ? row[1] : 0;
    }
```
To:
```js
    function rtVisitsForDate(date) {
      const row = RT_DAILY.find(r => r.date === date);
      return row ? Number(row.lp_views || 0) : 0;
    }

    function totalRtInRange(field) {
      return RT_DAILY
        .filter(r => (!FILTERS.from || r.date >= FILTERS.from) && (!FILTERS.to || r.date <= FILTERS.to))
        .reduce((s, r) => s + Number(r[field] || 0), 0);
    }
```

- [ ] **Step 4: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "refactor(dash): replace lpRow/sumAd with RT-native helpers (lp_clicks, lp_ctr)"
```

### 6d — Rewrite build functions

- [ ] **Step 1: Replace buildDateRows() (around line 771)**

```js
    function buildDateRows() {
      const byDate = new Map();
      for (const r of LP_ROWS) {
        const [d, form] = r;
        if (FILTERS.form && form !== FILTERS.form) continue;
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        if (!byDate.has(d)) byDate.set(d, { l:0, s:0, rv:0 });
        const a = byDate.get(d);
        a.l += r[2]; a.s += r[3]; a.rv += r[8];
      }
      const dates = [...byDate.keys()].sort().reverse();
      return dates.map(d => {
        const a = byDate.get(d);
        const acc = a.l ? (a.s / a.l) * 100 : 0;
        const rt  = sumRt(RT_DAILY, r => r.date === d);
        return lpRow(d, a.l, a.s, acc, a.rv, rt);
      });
    }
```

- [ ] **Step 2: Replace buildFormRows() (around line 793)**

```js
    function buildFormRows() {
      const byForm = new Map();
      for (const r of LP_ROWS) {
        const [d, form] = r;
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        if (!byForm.has(form)) byForm.set(form, { l:0, s:0, rv:0 });
        const a = byForm.get(form);
        a.l += r[2]; a.s += r[3]; a.rv += r[8];
      }

      const totalLeads   = [...byForm.values()].reduce((s, a) => s + a.l, 0);
      const totalViews   = totalRtInRange('lp_views');
      const totalClicks  = totalRtInRange('lp_clicks');

      const out = [];
      for (const [form, a] of byForm.entries()) {
        const acc   = a.l ? (a.s / a.l) * 100 : 0;
        const ratio = totalLeads > 0 ? a.l / totalLeads : 0;
        const formViews  = Math.round(totalViews  * ratio);
        const formClicks = Math.round(totalClicks * ratio);
        const formCtr    = formViews > 0 ? (formClicks / formViews) * 100 : 0;
        const rt = { lp_views: formViews, lp_clicks: formClicks, lp_ctr: formCtr, cost: 0 };
        out.push(lpRow(form, a.l, a.s, acc, a.rv, rt));
      }
      out.sort((a, b) => b[6] - a[6]);
      return out;
    }
```

- [ ] **Step 3: Remove buildSourceRows() entirely and all aggMeta() / aggMetaCampaign() functions**

These functions reference `AD_SPEND` and `META_ADS` which no longer exist. Remove them completely.

- [ ] **Step 4: Add buildCampaignRows() after buildFormRows()**

```js
    function buildCampaignRows() {
      // Build LP totals keyed by campaign_name
      const lpByCamp = new Map();
      for (const r of LP_ROWS) {
        const [d, form,,,,,,, rev,, , campName] = r;
        if (!campName) continue;
        if (FILTERS.form && form !== FILTERS.form) continue;
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        if (!lpByCamp.has(campName)) lpByCamp.set(campName, { l:0, s:0, rv:0 });
        const v = lpByCamp.get(campName);
        v.l += r[2]; v.s += r[3]; v.rv += rev;
      }

      // Build RT totals keyed by campaign_name
      const rtByCamp = new Map();
      for (const r of RT_CAMPAIGN) {
        const d = r.date || '';
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        const key = r.campaign_name || r.group_key || '';
        if (!key) continue;
        if (!rtByCamp.has(key)) rtByCamp.set(key, { lp_views:0, lp_clicks:0, cost:0 });
        const v = rtByCamp.get(key);
        v.lp_views  += Number(r.lp_views  || 0);
        v.lp_clicks += Number(r.lp_clicks || 0);
        v.cost      += Number(r.cost      || 0);
      }

      const seen = new Set();
      const out  = [];

      // RT+LP matched rows
      for (const [campName, rt] of rtByCamp.entries()) {
        seen.add(campName);
        const lp  = lpByCamp.get(campName);
        if (!lp && FILTERS.form) continue; // RT-only with form filter active: skip
        if (!lp) console.warn('[dashboard] RT campaign not found in LP:', campName);
        const l   = lp?.l  || 0;
        const s   = lp?.s  || 0;
        const rv  = lp?.rv || 0;
        const acc = l ? (s / l) * 100 : 0;
        const ctr = rt.lp_views > 0 ? (rt.lp_clicks / rt.lp_views) * 100 : 0;
        out.push(lpRow(campName, l, s, acc, rv,
          { lp_views: rt.lp_views, lp_clicks: rt.lp_clicks, lp_ctr: ctr, cost: rt.cost }));
      }

      // LP-only rows (no RT match)
      for (const [campName, lp] of lpByCamp.entries()) {
        if (seen.has(campName)) continue;
        console.warn('[dashboard] LP campaign not found in RT:', campName);
        const acc = lp.l ? (lp.s / lp.l) * 100 : 0;
        out.push(lpRow(campName, lp.l, lp.s, acc, lp.rv,
          { lp_views: 0, lp_clicks: 0, lp_ctr: 0, cost: 0 }));
      }

      out.sort((a, b) => b[6] - a[6]);
      return out;
    }
```

- [ ] **Step 5: Add buildRegionRows() after buildOsRows()**

```js
    function buildRegionRows() {
      const m = new Map();
      for (const r of RT_REGION) {
        const d = r.date || '';
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        const key = r.group_key || r.region || '';
        if (!key) continue;
        if (!m.has(key)) m.set(key, { lp_views:0, lp_clicks:0, cost:0 });
        const v = m.get(key);
        v.lp_views  += Number(r.lp_views  || 0);
        v.lp_clicks += Number(r.lp_clicks || 0);
        v.cost      += Number(r.cost      || 0);
      }
      const out = [];
      for (const [k, v] of m.entries()) {
        const ctr = v.lp_views > 0 ? (v.lp_clicks / v.lp_views) * 100 : 0;
        out.push(lpRow(k, 0, 0, 0, 0,
          { lp_views: v.lp_views, lp_clicks: v.lp_clicks, lp_ctr: ctr, cost: v.cost }));
      }
      out.sort((a, b) => b[1] - a[1]);
      return out;
    }
```

- [ ] **Step 6: Rewrite buildDeviceRows() to join RT_DEVICE + LD_DEVICE (around line 879)**

```js
    function buildDeviceRows() {
      // LD side — already normalized to mobile/tablet/desktop
      const ldByDev = new Map();
      for (const r of LD_DEVICE) {
        const { device, form_type, date, leads, sold, revenue } = r;
        if (!device) continue;
        if (FILTERS.form && form_type !== FILTERS.form) continue;
        if (FILTERS.from && date < FILTERS.from) continue;
        if (FILTERS.to   && date > FILTERS.to)   continue;
        if (!ldByDev.has(device)) ldByDev.set(device, { l:0, s:0, rv:0 });
        const v = ldByDev.get(device);
        v.l  += Number(leads   || 0);
        v.s  += Number(sold    || 0);
        v.rv += Number(revenue || 0);
      }

      // RT side — normalize to same strings before joining
      const rtByDev = new Map();
      for (const r of RT_DEVICE) {
        const d = r.date || '';
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        const key = normalizeDevice(r.group_key || r.device || '');
        if (!rtByDev.has(key)) rtByDev.set(key, { lp_views:0, lp_clicks:0, cost:0 });
        const v = rtByDev.get(key);
        v.lp_views  += Number(r.lp_views  || 0);
        v.lp_clicks += Number(r.lp_clicks || 0);
        v.cost      += Number(r.cost      || 0);
      }

      const allKeys = new Set([...ldByDev.keys(), ...rtByDev.keys()]);
      const out = [];
      for (const key of allKeys) {
        const ld  = ldByDev.get(key) || { l:0, s:0, rv:0 };
        const rt  = rtByDev.get(key) || { lp_views:0, lp_clicks:0, cost:0 };
        const acc = ld.l ? (ld.s / ld.l) * 100 : 0;
        const ctr = rt.lp_views > 0 ? (rt.lp_clicks / rt.lp_views) * 100 : 0;
        out.push(lpRow(key, ld.l, ld.s, acc, ld.rv,
          { lp_views: rt.lp_views, lp_clicks: rt.lp_clicks, lp_ctr: ctr, cost: rt.cost }));
      }
      out.sort((a, b) => b[6] - a[6]);
      return out;
    }
```

- [ ] **Step 7: Rewrite buildOsRows() to join RT_OS + LD_OS (around line 905)**

```js
    function buildOsRows() {
      // LD side — already normalized to ios/android/windows/macos/other
      const ldByOs = new Map();
      for (const r of LD_OS) {
        const { os, form_type, date, leads, sold, revenue } = r;
        const key = os || 'other';
        if (FILTERS.form && form_type !== FILTERS.form) continue;
        if (FILTERS.from && date < FILTERS.from) continue;
        if (FILTERS.to   && date > FILTERS.to)   continue;
        if (!ldByOs.has(key)) ldByOs.set(key, { l:0, s:0, rv:0 });
        const v = ldByOs.get(key);
        v.l  += Number(leads   || 0);
        v.s  += Number(sold    || 0);
        v.rv += Number(revenue || 0);
      }

      // RT side — normalize before joining
      const rtByOs = new Map();
      for (const r of RT_OS) {
        const d = r.date || '';
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        const key = normalizeOs(r.group_key || r.os || '');
        if (!rtByOs.has(key)) rtByOs.set(key, { lp_views:0, lp_clicks:0, cost:0 });
        const v = rtByOs.get(key);
        v.lp_views  += Number(r.lp_views  || 0);
        v.lp_clicks += Number(r.lp_clicks || 0);
        v.cost      += Number(r.cost      || 0);
      }

      const allKeys = new Set([...ldByOs.keys(), ...rtByOs.keys()]);
      const out = [];
      for (const key of allKeys) {
        const ld  = ldByOs.get(key) || { l:0, s:0, rv:0 };
        const rt  = rtByOs.get(key) || { lp_views:0, lp_clicks:0, cost:0 };
        const acc = ld.l ? (ld.s / ld.l) * 100 : 0;
        const ctr = rt.lp_views > 0 ? (rt.lp_clicks / rt.lp_views) * 100 : 0;
        out.push(lpRow(key, ld.l, ld.s, acc, ld.rv,
          { lp_views: rt.lp_views, lp_clicks: rt.lp_clicks, lp_ctr: ctr, cost: rt.cost }));
      }
      out.sort((a, b) => b[6] - a[6]);
      return out;
    }
```

- [ ] **Step 8: Rewrite aggLandings() to use RT_LANDER and LP campaign name matching (around line 646)**

```js
    function aggLandings() {
      // Aggregate RT lander visits/clicks
      const rtByLander = new Map();
      for (const r of RT_LANDER) {
        const d = r.date || '';
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        const key = r.group_key || r.lander_name || '';
        if (!key) continue;
        if (!rtByLander.has(key)) rtByLander.set(key, { lp_views:0, lp_clicks:0, cost:0 });
        const v = rtByLander.get(key);
        v.lp_views  += Number(r.lp_views  || 0);
        v.lp_clicks += Number(r.lp_clicks || 0);
        v.cost      += Number(r.cost      || 0);
      }

      // Aggregate LP by form type for cross-reference
      const lpByForm = new Map();
      for (const r of LP_CAMPAIGNS_RAW) {
        const d    = r.date || '';
        const form = LP_FORM_MAP[r.campaign_id] || 'other';
        if (FILTERS.form && form !== FILTERS.form) continue;
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        if (!lpByForm.has(form)) lpByForm.set(form, { l:0, s:0, rv:0 });
        const v = lpByForm.get(form);
        v.l  += Number(r.leads_total    || 0);
        v.s  += Number(r.leads_accepted || 0);
        v.rv += Number(r.total_sell     || 0);
      }

      const out = [];
      for (const [lander, rt] of rtByLander.entries()) {
        // Derive form type from lander name using normalized_service logic
        const nl = lander.toLowerCase();
        const form = nl.includes('bath') || nl.includes('shower') || nl.includes('tub')
          ? 'bath' : nl.includes('roof') ? 'roof' : nl.includes('windo') ? 'windo' : 'other';
        if (FILTERS.form && form !== FILTERS.form) continue;
        const lp  = lpByForm.get(form) || { l:0, s:0, rv:0 };
        const acc = lp.l ? (lp.s / lp.l) * 100 : 0;
        const ctr = rt.lp_views > 0 ? (rt.lp_clicks / rt.lp_views) * 100 : 0;
        out.push(lpRow(lander, lp.l, lp.s, acc, lp.rv,
          { lp_views: rt.lp_views, lp_clicks: rt.lp_clicks, lp_ctr: ctr, cost: rt.cost }));
      }
      out.sort((a, b) => b[1] - a[1]);
      return out;
    }
```

- [ ] **Step 9: Rewrite buildStateRows() to use RT_DAILY proportional visits (around line 853)**

```js
    function buildStateRows() {
      const m = new Map();
      for (const r of LD_STATE) {
        const { state, form_type, date, leads, sold, revenue } = r;
        if (!state) continue;
        if (FILTERS.form && form_type !== FILTERS.form) continue;
        if (FILTERS.from && date < FILTERS.from) continue;
        if (FILTERS.to   && date > FILTERS.to)   continue;
        if (!m.has(state)) m.set(state, { l:0, s:0, rv:0 });
        const v = m.get(state);
        v.l  += Number(leads   || 0);
        v.s  += Number(sold    || 0);
        v.rv += Number(revenue || 0);
      }
      const totalLeads  = [...m.values()].reduce((s, v) => s + v.l, 0);
      const totalViews  = totalRtInRange('lp_views');
      const totalClicks = totalRtInRange('lp_clicks');
      const out = [];
      for (const [k, v] of m.entries()) {
        const acc    = v.l ? (v.s / v.l) * 100 : 0;
        const ratio  = totalLeads > 0 ? v.l / totalLeads : 0;
        const views  = Math.round(totalViews  * ratio);
        const clicks = Math.round(totalClicks * ratio);
        const ctr    = views > 0 ? (clicks / views) * 100 : 0;
        out.push(lpRow(k, v.l, v.s, acc, v.rv,
          { lp_views: views, lp_clicks: clicks, lp_ctr: ctr, cost: 0 }));
      }
      out.sort((a, b) => b[6] - a[6]);
      return out;
    }
```

- [ ] **Step 10: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "feat(dash): rewrite all build functions with RT+LP sources, add campaign/region tables"
```

### 6e — Update getTables() and remove Meta-only tables

- [ ] **Step 1: Replace getTables() (around line 1066)**

```js
    function getTables() {
      return [
        { title: "Date",     label: "DATE",     rows: buildDateRows() },
        { title: "Form",     label: "FORM",     rows: buildFormRows() },
        { title: "Campaign", label: "CAMPAIGN", rows: buildCampaignRows() },
        { title: "Landing",  label: "LANDING",  rows: aggLandings() },
        { title: "State",    label: "STATE",     rows: buildStateRows() },
        { title: "Device",   label: "DEVICE",   rows: buildDeviceRows() },
        { title: "OS",       label: "OS",        rows: buildOsRows() },
        { title: "Region",   label: "REGION",   rows: buildRegionRows() },
      ];
    }
```

- [ ] **Step 2: Update totalRtVisitsInRange() to use object rows (around line 847) if still present**

If `totalRtVisitsInRange()` still exists as a standalone function, remove it since `totalRtInRange('lp_views')` replaces it. Check for any remaining references to `totalRtVisitsInRange` and replace with `totalRtInRange('lp_views')`.

```bash
grep -n "totalRtVisitsInRange" frontend/dash/form_leads.html
```

Replace any remaining calls with `totalRtInRange('lp_views')`.

- [ ] **Step 3: Confirm no remaining Meta references in form_leads.html**

```bash
grep -n "AD_SPEND\|META_ADS\|META_DEVICE\|META_REGION\|CAMPAIGN_MAP\|inferForm\|aggMeta\|aggMetaCampaign\|buildSourceRows\|stats/meta\|campaign-mapping" frontend/dash/form_leads.html
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "feat(dash): update getTables to RT+LP tables, remove Meta-only tables (Source/Widget/Teaser/Title/Placement)"
```

---

## Task 7: Final verification

- [ ] **Step 1: Run full backend test suite**

```bash
cd backend && npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Confirm no fetchMeta or Meta references in entire repo (excluding docs and node_modules)**

```bash
grep -rn "fetchMeta\|meta_ad_stats\|campaign_mapping\|META_ACCESS_TOKEN\|META_AD_ACCOUNT" \
  --include="*.js" --include="*.html" \
  --exclude-dir=node_modules --exclude-dir=docs \
  .
```

Expected: no output.

- [ ] **Step 3: Confirm no ad-click EPC in dashboard**

```bash
grep -n "epc\|EPC\|ad\.c\b\|ad\.ctr\b" frontend/dash/form_leads.html
```

Expected: no output (or only in HTML comments that are clearly inactive).

- [ ] **Step 4: Confirm 7-call structure in fetchRedTrack.js**

```bash
grep -n "BREAKDOWNS\|campaign\|lander\|region" backend/jobs/fetchRedTrack.js | head -20
```

Expected: BREAKDOWNS array with 6 entries, types: daily, os, device, region, campaign, lander.

- [ ] **Step 5: Final commit if any cleanup needed, else tag as ready**

```bash
git log --oneline -10
```

Review the commit list. All changes should be present across Tasks 1–6.

---

## Deployment Sequence (run after merging)

1. **Verify RT API is alive** before touching production:
   ```
   GET https://api.redtrack.io/report?api_key={REDTRACK_API_KEY}&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&group[]=date
   ```
   Must return data. If 401 or empty — stop. Fix `REDTRACK_API_KEY` first.

2. **Deploy code** (this branch).

3. **Run** `POST /api/dev/migrate` — drops meta_ad_stats, campaign_mapping, old redtrack_stats; creates new schema.

4. **Run** `POST /api/dev/force-fetch` — populates redtrack_stats and leadprosper_stats.

5. **Verify** `GET /api/stats/redtrack` — `daily` array must not be empty (hard stop if empty). Other arrays empty = warning only.

6. **Verify** `GET /api/stats/leadprosper` — must have at least one row.

7. **Only after both checks pass**: remove `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` from `.env`, restart server.
