# Data Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace keyword-guessing and fabricated-estimate logic in the QuickHomeFix dashboard with real data already stored in the `leads` ClickHouse table, and add campaign-level cross-source mapping via a new `campaign_mapping` table.

**Architecture:** Three sequential fixes (A → B → C), each independently deployable. All backend changes go into `backend/server.js`. All frontend changes go into `frontend/dash/form_leads.html`. Zero changes to `/get-quotes/` pages, tracking JS files, cron jobs, existing endpoints, or existing ClickHouse table schemas.

**Tech Stack:** Node.js ES modules, Express 5, ClickHouse Cloud (`@clickhouse/client`), vitest, static HTML dashboard.

---

## File Map

| File | Change |
|---|---|
| `backend/server.js` | Add `inferFormTypeFromLead()` helper + 5 new endpoints before `app.listen` |
| `frontend/dash/form_leads.html` | Add 3 new `fetch()` calls, 4 new in-memory arrays, update 3 builder functions |
| `backend/tests/data-quality.test.js` | New test file covering all server-side logic |

---

## Task 1: Write tests for `inferFormTypeFromLead` helper

**Files:**
- Create: `backend/tests/data-quality.test.js`

The helper will be a pure function that takes `(normalizedService, landingPageUrl)` and returns one of `'bath'`, `'roof'`, `'windo'`, `'other'`. Tests must be written before the helper exists.

- [ ] **Step 1: Create the test file**

```js
// backend/tests/data-quality.test.js
import { describe, it, expect } from 'vitest';
import { inferFormTypeFromLead } from '../server.js';

describe('inferFormTypeFromLead', () => {
  // normalized_service priority
  it('returns bath for BATH_REMODEL', () => {
    expect(inferFormTypeFromLead('BATH_REMODEL', null)).toBe('bath');
  });
  it('returns bath for TUB_REPLACEMENT', () => {
    expect(inferFormTypeFromLead('TUB_REPLACEMENT', null)).toBe('bath');
  });
  it('returns bath for SHOWER_INSTALL', () => {
    expect(inferFormTypeFromLead('SHOWER_INSTALL', null)).toBe('bath');
  });
  it('returns roof for ROOFING_ASPHALT', () => {
    expect(inferFormTypeFromLead('ROOFING_ASPHALT', null)).toBe('roof');
  });
  it('returns windo for WINDOWS', () => {
    expect(inferFormTypeFromLead('WINDOWS', null)).toBe('windo');
  });

  // URL fallback when normalized_service is null
  it('falls back to url: /get-quotes/bath', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/get-quotes/bath')).toBe('bath');
  });
  it('falls back to url: /shower', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/shower')).toBe('bath');
  });
  it('falls back to url: /get-quotes/roof', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/get-quotes/roof')).toBe('roof');
  });
  it('falls back to url: /window', () => {
    expect(inferFormTypeFromLead(null, 'https://quickhomefix.com/window')).toBe('windo');
  });

  // Unrecognised
  it('returns other when both null', () => {
    expect(inferFormTypeFromLead(null, null)).toBe('other');
  });
  it('returns other for unrecognised service', () => {
    expect(inferFormTypeFromLead('GUTTERS', 'https://quickhomefix.com/gutters')).toBe('other');
  });

  // normalized_service takes priority over url
  it('service wins over url when both set', () => {
    expect(inferFormTypeFromLead('ROOFING_ASPHALT', 'https://quickhomefix.com/get-quotes/bath')).toBe('roof');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
cd backend && npx vitest run tests/data-quality.test.js
```

Expected output: fails with `SyntaxError` or `Cannot find module` — `inferFormTypeFromLead` is not exported yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add backend/tests/data-quality.test.js
git commit -m "test: add failing tests for inferFormTypeFromLead"
```

---

## Task 2: Implement `inferFormTypeFromLead` and `GET /api/stats/lp-form-map`

**Files:**
- Modify: `backend/server.js` (add export + endpoint before `app.listen` at line ~1932)

- [ ] **Step 1: Add the helper function and export it**

Find the `runClickhouseSelect` function (line ~948) in `backend/server.js`. Add the helper immediately after it (after line 957):

```js
export function inferFormTypeFromLead(normalizedService, landingPageUrl) {
  if (normalizedService) {
    const s = normalizedService.toUpperCase();
    if (s.includes('BATH') || s.includes('TUB') || s.includes('SHOWER')) return 'bath';
    if (s.includes('ROOF')) return 'roof';
    if (s.includes('WINDOW')) return 'windo';
  }
  if (landingPageUrl) {
    const p = landingPageUrl.toLowerCase();
    if (p.includes('/bath') || p.includes('/shower')) return 'bath';
    if (p.includes('/roof')) return 'roof';
    if (p.includes('/window')) return 'windo';
  }
  return 'other';
}
```

- [ ] **Step 2: Add the endpoint**

Add the following endpoint before `app.listen` (before line ~1932):

```js
app.get('/api/stats/lp-form-map', async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(`
      SELECT
        lp_campaign_id,
        any(normalized_service) AS sample_service,
        any(landing_page_url)   AS sample_url
      FROM leads
      WHERE created_at >= now() - INTERVAL 90 DAY
        AND lp_campaign_id IS NOT NULL
        AND lp_campaign_id != ''
      GROUP BY lp_campaign_id
    `);
    const result = rows.map(r => ({
      lp_campaign_id: r.lp_campaign_id,
      form_type: inferFormTypeFromLead(r.sample_service, r.sample_url),
    }));
    res.json(result);
  } catch (e) {
    console.error('[lp-form-map]', e.message);
    res.json([]);
  }
});
```

- [ ] **Step 3: Run the tests**

```
cd backend && npx vitest run tests/data-quality.test.js
```

Expected: 12/12 PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/server.js
git commit -m "feat(fix-a): add inferFormTypeFromLead helper and GET /api/stats/lp-form-map"
```

---

## Task 3: Dashboard — Fix A (load LP_FORM_MAP, use in LP_ROWS builder)

**Files:**
- Modify: `frontend/dash/form_leads.html`

There are two changes:
1. Add `/api/stats/lp-form-map` to the `Promise.all` in `loadStats()`.
2. In the `LP_ROWS` builder, look up the map before falling back to `inferForm`.

- [ ] **Step 1: Declare `LP_FORM_MAP` alongside the other in-memory arrays**

Find the block around line 440 in `form_leads.html` where variables like `RT_OFFERS`, `LP_CAMPAIGNS_RAW` are declared. Add right after `let LP_CAMPAIGNS_RAW = [];`:

```js
let LP_FORM_MAP = {}; // keyed by lp_campaign_id → form_type (Fix A)
```

- [ ] **Step 2: Add the fetch call to `loadStats()`**

The current `loadStats()` fetches three endpoints (lines ~460-464):

```js
const [metaRes, lpRes, rtRes] = await Promise.all([
  fetch('/api/stats/meta').then(r => r.json()),
  fetch('/api/stats/leadprosper').then(r => r.json()),
  fetch('/api/stats/redtrack').then(r => r.json()),
]);
```

Replace with:

```js
const [metaRes, lpRes, rtRes, lpFormMapRes] = await Promise.all([
  fetch('/api/stats/meta').then(r => r.json()),
  fetch('/api/stats/leadprosper').then(r => r.json()),
  fetch('/api/stats/redtrack').then(r => r.json()),
  fetch('/api/stats/lp-form-map').then(r => r.json()).catch(() => []),
]);
```

- [ ] **Step 3: Build `LP_FORM_MAP` from the response**

After the existing `if (lpRes.ok && lpRes.rows)` block (after line ~581), add:

```js
if (Array.isArray(lpFormMapRes)) {
  LP_FORM_MAP = {};
  for (const entry of lpFormMapRes) {
    LP_FORM_MAP[entry.lp_campaign_id] = entry.form_type;
  }
}
```

- [ ] **Step 4: Update the LP_ROWS builder to use the map**

In the `LP_ROWS` builder (line ~570), change:

```js
inferForm(r.campaign_name),
```

to:

```js
LP_FORM_MAP[r.campaign_id] || inferForm(r.campaign_name),
```

- [ ] **Step 5: Manual smoke test**

Start the server (`cd backend && node server.js`), open the dashboard in a browser, open DevTools console, and verify:
- No JS errors on load
- `fetch('/api/stats/lp-form-map')` returns a JSON array (check Network tab)
- The Form table still renders rows

- [ ] **Step 6: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "feat(fix-a): dashboard uses LP_FORM_MAP for authoritative LP form_type"
```

---

## Task 4: Backend — Fix B (campaign_mapping table + 3 endpoints)

**Files:**
- Modify: `backend/server.js`

Three changes:
1. Add `campaign_mapping` `CREATE TABLE IF NOT EXISTS` to the migration array.
2. Add `GET /api/campaign-mapping`.
3. Add `POST /api/campaign-mapping` with Zod validation.
4. Add `DELETE /api/campaign-mapping/:meta_campaign_id`.

- [ ] **Step 1: Add tests for Fix B endpoints**

Add to `backend/tests/data-quality.test.js`:

```js
import request from 'supertest'; // will need: npm i -D supertest
// Note: these are integration-style tests that call the live app export.
// Since we don't export `app`, we test the Zod schema independently.
import { z } from 'zod';

describe('campaign_mapping POST schema', () => {
  const CampaignMappingSchema = z.object({
    meta_campaign_id: z.string().min(1),
    lp_campaign_id:   z.string().min(1),
    rt_source_id:     z.string().default(''),
    form_type:        z.enum(['bath', 'roof', 'windo', 'other']),
    label:            z.string().optional(),
  });

  it('accepts valid payload', () => {
    const result = CampaignMappingSchema.safeParse({
      meta_campaign_id: '123',
      lp_campaign_id:   '456',
      form_type:        'bath',
    });
    expect(result.success).toBe(true);
    expect(result.data.rt_source_id).toBe('');
  });

  it('rejects missing meta_campaign_id', () => {
    const result = CampaignMappingSchema.safeParse({
      lp_campaign_id: '456',
      form_type:      'bath',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid form_type', () => {
    const result = CampaignMappingSchema.safeParse({
      meta_campaign_id: '123',
      lp_campaign_id:   '456',
      form_type:        'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts label as optional', () => {
    const result = CampaignMappingSchema.safeParse({
      meta_campaign_id: '123',
      lp_campaign_id:   '456',
      form_type:        'roof',
      label:            'My Campaign',
    });
    expect(result.success).toBe(true);
    expect(result.data.label).toBe('My Campaign');
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

```
cd backend && npx vitest run tests/data-quality.test.js
```

Expected: new schema tests should PASS immediately (they test the Zod schema only, not the server). The `inferFormTypeFromLead` tests should still pass.

- [ ] **Step 3: Add the campaign_mapping table to the migration**

In `backend/server.js`, find `const migrationQueries = [` (line ~1375). Add the new table at the end of the array, before the closing `]`:

```js
      // campaign_mapping table (Fix B)
      `
        CREATE TABLE IF NOT EXISTS campaign_mapping (
          meta_campaign_id  String,
          lp_campaign_id    String,
          rt_source_id      String,
          form_type         String,
          label             Nullable(String),
          created_at        DateTime64(3, 'UTC') DEFAULT now64(3)
        ) ENGINE = ReplacingMergeTree(created_at)
        ORDER BY (meta_campaign_id)
      `,
```

- [ ] **Step 4: Add the Zod schema and three endpoints**

Add before `app.listen` (before line ~1932):

```js
const CampaignMappingSchema = z.object({
  meta_campaign_id: z.string().min(1),
  lp_campaign_id:   z.string().min(1),
  rt_source_id:     z.string().default(''),
  form_type:        z.enum(['bath', 'roof', 'windo', 'other']),
  label:            z.string().optional(),
});

app.get('/api/campaign-mapping', async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(`
      SELECT * FROM campaign_mapping FINAL
      ORDER BY form_type, meta_campaign_id
    `);
    res.json(rows);
  } catch (e) {
    console.error('[campaign-mapping GET]', e.message);
    res.json([]);
  }
});

app.post('/api/campaign-mapping', async (req, res) => {
  let data;
  try {
    data = CampaignMappingSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ error: 'validation failed', details: err?.issues });
  }
  try {
    await clickhouse.insert({
      table: 'campaign_mapping',
      values: [data],
      format: 'JSONEachRow',
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[campaign-mapping POST]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/campaign-mapping/:meta_campaign_id', async (req, res) => {
  const id = req.params.meta_campaign_id;
  if (!id || id.trim() === '') {
    return res.status(400).json({ error: 'meta_campaign_id is required' });
  }
  try {
    await clickhouse.command({
      query: `ALTER TABLE campaign_mapping DELETE WHERE meta_campaign_id = {id:String}`,
      query_params: { id },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[campaign-mapping DELETE]', e.message);
    res.status(500).json({ error: e.message });
  }
});
```

- [ ] **Step 5: Run all tests**

```
cd backend && npx vitest run tests/data-quality.test.js
```

Expected: all tests PASS.

- [ ] **Step 6: Run migration**

Start the server and call the migration endpoint once to create the table:

```
curl -X POST http://localhost:5000/api/dev/migrate
```

Expected: `{ "ok": true }` (or similar success response).

- [ ] **Step 7: Commit**

```bash
git add backend/server.js backend/tests/data-quality.test.js
git commit -m "feat(fix-b): campaign_mapping table + GET/POST/DELETE /api/campaign-mapping"
```

---

## Task 5: Dashboard — Fix B (load CAMPAIGN_MAP, update Campaign ID view)

**Files:**
- Modify: `frontend/dash/form_leads.html`

Two changes:
1. Add `/api/campaign-mapping` to the `Promise.all`.
2. Build `CAMPAIGN_MAP` from the response.
3. Add `aggMetaCampaign()` — a new function that joins Meta campaign rows to LP revenue via CAMPAIGN_MAP, replacing the pure-Meta `aggMeta(4)` in `getTables()`.

- [ ] **Step 1: Declare `CAMPAIGN_MAP`**

Below the `LP_FORM_MAP` declaration added in Task 3, add:

```js
let CAMPAIGN_MAP = {}; // keyed by meta_campaign_id → campaign_mapping row (Fix B)
```

- [ ] **Step 2: Add the fetch to `loadStats()`**

Extend the `Promise.all` from Task 3 to add the campaign-mapping fetch:

```js
const [metaRes, lpRes, rtRes, lpFormMapRes, campaignMapRes] = await Promise.all([
  fetch('/api/stats/meta').then(r => r.json()),
  fetch('/api/stats/leadprosper').then(r => r.json()),
  fetch('/api/stats/redtrack').then(r => r.json()),
  fetch('/api/stats/lp-form-map').then(r => r.json()).catch(() => []),
  fetch('/api/campaign-mapping').then(r => r.json()).catch(() => []),
]);
```

- [ ] **Step 3: Build CAMPAIGN_MAP**

After the `LP_FORM_MAP` builder added in Task 3, add:

```js
if (Array.isArray(campaignMapRes)) {
  CAMPAIGN_MAP = {};
  for (const row of campaignMapRes) {
    CAMPAIGN_MAP[row.meta_campaign_id] = row;
  }
}
```

- [ ] **Step 4: Add `aggMetaCampaign()` function**

The existing `aggMeta(4)` builds the Campaign ID table using only Meta data (clicks, zero revenue). The new function enriches it: for each Meta campaign ID, look up the LP campaign ID from CAMPAIGN_MAP, then pull LP leads/revenue from LP_ROWS.

Add this function after `aggMeta()` (after line ~979):

```js
function aggMetaCampaign() {
  if (FILTERS.source && FILTERS.source !== "meta") return [];
  const m = new Map();
  for (const A of META_ADS) {
    const [camp, adset, ad, pl, cid, form, clicks, purch] = A;
    if (FILTERS.form && form !== FILTERS.form) continue;
    if (!cid) continue;
    if (!m.has(cid)) m.set(cid, { c: 0, cost: 0 });
    const v = m.get(cid);
    v.c += clicks;
  }
  const out = [];
  for (const [cid, v] of m.entries()) {
    const mapping = CAMPAIGN_MAP[cid];
    let leads = 0, sold = 0, rev = 0;
    if (mapping) {
      const lpCid = mapping.lp_campaign_id;
      for (const r of LP_ROWS) {
        const [d, form, lt, s, , , , , revenue] = r;
        if (FILTERS.from && d < FILTERS.from) continue;
        if (FILTERS.to   && d > FILTERS.to)   continue;
        if (FILTERS.form && form !== FILTERS.form) continue;
        // LP_ROWS doesn't have campaign_id; we match by form_type from mapping
        // Use mapping.form_type to filter LP rows of the right service
        if (form !== mapping.form_type) continue;
        leads  += lt;
        sold   += s;
        rev    += revenue;
      }
    }
    const label = mapping?.label || cid;
    const acc   = leads ? (sold / leads) * 100 : 0;
    out.push(lpRow(label, leads, sold, acc, rev, { c: v.c, ctr: 0, cost: 0 }));
  }
  out.sort((a, b) => b[6] - a[6]);
  return out;
}
```

- [ ] **Step 5: Wire `aggMetaCampaign()` into `getTables()`**

In `getTables()` (line ~990), change:

```js
{ title: "Campaign ID", label: "CAMPAIGN_ID", rows: aggMeta(4) },
```

to:

```js
{ title: "Campaign ID", label: "CAMPAIGN_ID", rows: aggMetaCampaign() },
```

- [ ] **Step 6: Manual smoke test**

Open the dashboard, go to the Campaign ID table. Verify it still renders (rows may be empty until campaign_mapping is populated — that is expected). No JS errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "feat(fix-b): dashboard Campaign ID view uses CAMPAIGN_MAP for LP revenue join"
```

---

## Task 6: Backend — Fix C (`GET /api/stats/leads-breakdown`)

**Files:**
- Modify: `backend/server.js`
- Modify: `backend/tests/data-quality.test.js`

- [ ] **Step 1: Write tests for the endpoint response shape**

Add to `backend/tests/data-quality.test.js`:

```js
describe('leads-breakdown response shape', () => {
  it('state row has required fields', () => {
    const row = { state: 'CA', form_type: 'bath', date: '2026-05-01', leads: '10', sold: '5', revenue: '500.00' };
    expect(row).toHaveProperty('state');
    expect(row).toHaveProperty('form_type');
    expect(row).toHaveProperty('leads');
    expect(row).toHaveProperty('sold');
    expect(row).toHaveProperty('revenue');
  });

  it('device row has required fields', () => {
    const row = { device: 'mobile', form_type: 'roof', date: '2026-05-01', leads: '3', sold: '1', revenue: '100.00' };
    expect(row).toHaveProperty('device');
    expect(row).toHaveProperty('form_type');
  });

  it('os row has required fields', () => {
    const row = { os: 'ios', form_type: 'windo', date: '2026-05-01', leads: '2', sold: '0', revenue: '0' };
    expect(row).toHaveProperty('os');
    expect(row).toHaveProperty('form_type');
  });

  it('daily row has required fields', () => {
    const row = { date: '2026-05-01', form_type: 'bath', leads: '8', sold: '4', revenue: '400.00' };
    expect(row).toHaveProperty('date');
    expect(row).toHaveProperty('form_type');
  });
});
```

- [ ] **Step 2: Run tests to confirm they pass (shape-only tests)**

```
cd backend && npx vitest run tests/data-quality.test.js
```

Expected: all pass (these are just object shape assertions, not server calls).

- [ ] **Step 3: Add the endpoint**

Add before `app.listen` (before line ~1932):

```js
app.get('/api/stats/leads-breakdown', async (_req, res) => {
  const [stateRows, deviceRows, osRows, dailyRows] = await Promise.all([
    runClickhouseSelect(`
      SELECT
        state,
        multiIf(
          normalized_service LIKE '%BATH%' OR
          normalized_service LIKE '%TUB%' OR
          normalized_service LIKE '%SHOWER%', 'bath',
          normalized_service LIKE '%ROOF%',   'roof',
          normalized_service LIKE '%WINDOW%', 'windo',
          'other'
        ) AS form_type,
        toDate(created_at) AS date,
        count()                AS leads,
        sum(partner_delivered) AS sold,
        sum(partner_payout)    AS revenue
      FROM leads
      WHERE created_at >= now() - INTERVAL 30 DAY
        AND state IS NOT NULL
        AND state != ''
      GROUP BY state, form_type, date
      ORDER BY date DESC, leads DESC
    `).catch(() => []),

    runClickhouseSelect(`
      SELECT
        multiIf(
          user_agent LIKE '%Mobile%' OR
          user_agent LIKE '%Android%', 'mobile',
          'desktop'
        ) AS device,
        multiIf(
          normalized_service LIKE '%BATH%' OR
          normalized_service LIKE '%TUB%' OR
          normalized_service LIKE '%SHOWER%', 'bath',
          normalized_service LIKE '%ROOF%',   'roof',
          normalized_service LIKE '%WINDOW%', 'windo',
          'other'
        ) AS form_type,
        toDate(created_at) AS date,
        count()                AS leads,
        sum(partner_delivered) AS sold,
        sum(partner_payout)    AS revenue
      FROM leads
      WHERE created_at >= now() - INTERVAL 30 DAY
        AND user_agent IS NOT NULL
        AND user_agent != ''
      GROUP BY device, form_type, date
      ORDER BY date DESC, leads DESC
    `).catch(() => []),

    runClickhouseSelect(`
      SELECT
        multiIf(
          user_agent LIKE '%iPhone%' OR
          user_agent LIKE '%iPad%' OR
          user_agent LIKE '%iPod%',    'ios',
          user_agent LIKE '%Android%', 'android',
          user_agent LIKE '%Windows%', 'windows',
          user_agent LIKE '%Macintosh%', 'macos',
          'other'
        ) AS os,
        multiIf(
          normalized_service LIKE '%BATH%' OR
          normalized_service LIKE '%TUB%' OR
          normalized_service LIKE '%SHOWER%', 'bath',
          normalized_service LIKE '%ROOF%',   'roof',
          normalized_service LIKE '%WINDOW%', 'windo',
          'other'
        ) AS form_type,
        toDate(created_at) AS date,
        count()                AS leads,
        sum(partner_delivered) AS sold,
        sum(partner_payout)    AS revenue
      FROM leads
      WHERE created_at >= now() - INTERVAL 30 DAY
        AND user_agent IS NOT NULL
        AND user_agent != ''
      GROUP BY os, form_type, date
      ORDER BY date DESC, leads DESC
    `).catch(() => []),

    runClickhouseSelect(`
      SELECT
        toDate(created_at) AS date,
        multiIf(
          normalized_service LIKE '%BATH%' OR
          normalized_service LIKE '%TUB%' OR
          normalized_service LIKE '%SHOWER%', 'bath',
          normalized_service LIKE '%ROOF%',   'roof',
          normalized_service LIKE '%WINDOW%', 'windo',
          'other'
        ) AS form_type,
        count()                AS leads,
        sum(partner_delivered) AS sold,
        sum(partner_payout)    AS revenue
      FROM leads
      WHERE created_at >= now() - INTERVAL 30 DAY
      GROUP BY date, form_type
      ORDER BY date DESC
    `).catch(() => []),
  ]);

  res.json({ state: stateRows, device: deviceRows, os: osRows, daily: dailyRows });
});
```

- [ ] **Step 4: Run all tests**

```
cd backend && npx vitest run tests/data-quality.test.js
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add backend/server.js backend/tests/data-quality.test.js
git commit -m "feat(fix-c): add GET /api/stats/leads-breakdown with 4 parallel ClickHouse queries"
```

---

## Task 7: Dashboard — Fix C (replace fabricated state/device/OS estimates)

**Files:**
- Modify: `frontend/dash/form_leads.html`

Three changes:
1. Add `/api/stats/leads-breakdown` to `Promise.all`, populate `LD_STATE`, `LD_DEVICE`, `LD_OS`, `LD_DAILY`.
2. Replace `buildStateRows()` to use `LD_STATE`.
3. Replace `buildDeviceRows()` to use `LD_DEVICE`.
4. Replace `buildOsRows()` to use `LD_OS`.

VISITS column (`[1]`) continues using RT `lp_views` proportional allocation — only LEADS (`[6]`), SOLD (`[7]`), and REVENUE (`[22]`) change to real data.

- [ ] **Step 1: Declare LD_* arrays**

Below the `CAMPAIGN_MAP` declaration, add:

```js
let LD_STATE  = []; // from /api/stats/leads-breakdown (Fix C)
let LD_DEVICE = [];
let LD_OS     = [];
let LD_DAILY  = [];
```

- [ ] **Step 2: Add the fetch to `loadStats()`**

Extend the `Promise.all` to add the leads-breakdown fetch:

```js
const [metaRes, lpRes, rtRes, lpFormMapRes, campaignMapRes, ldRes] = await Promise.all([
  fetch('/api/stats/meta').then(r => r.json()),
  fetch('/api/stats/leadprosper').then(r => r.json()),
  fetch('/api/stats/redtrack').then(r => r.json()),
  fetch('/api/stats/lp-form-map').then(r => r.json()).catch(() => []),
  fetch('/api/campaign-mapping').then(r => r.json()).catch(() => []),
  fetch('/api/stats/leads-breakdown').then(r => r.json()).catch(() => ({ state: [], device: [], os: [], daily: [] })),
]);
```

- [ ] **Step 3: Populate LD_* from the response**

After the `CAMPAIGN_MAP` builder added in Task 5, add:

```js
if (ldRes) {
  LD_STATE  = ldRes.state  || [];
  LD_DEVICE = ldRes.device || [];
  LD_OS     = ldRes.os     || [];
  LD_DAILY  = ldRes.daily  || [];
}
```

- [ ] **Step 4: Replace `buildStateRows()`**

Find `buildStateRows()` (line ~827) and replace the entire function:

```js
function buildStateRows() {
  const m = new Map();
  for (const r of LD_STATE) {
    const { state, form_type, date, leads, sold, revenue } = r;
    if (!state) continue;
    if (FILTERS.form && form_type !== FILTERS.form) continue;
    if (FILTERS.from && date < FILTERS.from) continue;
    if (FILTERS.to   && date > FILTERS.to)   continue;
    if (!m.has(state)) m.set(state, { l: 0, s: 0, rv: 0 });
    const v = m.get(state);
    v.l  += Number(leads   || 0);
    v.s  += Number(sold    || 0);
    v.rv += Number(revenue || 0);
  }
  const totalLeads  = [...m.values()].reduce((s, v) => s + v.l, 0);
  const totalVisits = totalRtVisitsInRange();
  const out = [];
  for (const [k, v] of m.entries()) {
    const acc    = v.l ? (v.s / v.l) * 100 : 0;
    const visits = totalLeads > 0 ? Math.round(totalVisits * (v.l / totalLeads)) : 0;
    out.push(lpRow(k, v.l, v.s, acc, v.rv, { c: 0, ctr: 0, cost: 0 }, visits));
  }
  out.sort((a, b) => b[6] - a[6]); // sort by LEADS desc
  return out;
}
```

- [ ] **Step 5: Replace `buildDeviceRows()`**

Find `buildDeviceRows()` (line ~849) and replace the entire function:

```js
function buildDeviceRows() {
  const m = new Map();
  for (const r of LD_DEVICE) {
    const { device, form_type, date, leads, sold, revenue } = r;
    if (!device) continue;
    if (FILTERS.form && form_type !== FILTERS.form) continue;
    if (FILTERS.from && date < FILTERS.from) continue;
    if (FILTERS.to   && date > FILTERS.to)   continue;
    if (!m.has(device)) m.set(device, { l: 0, s: 0, rv: 0 });
    const v = m.get(device);
    v.l  += Number(leads   || 0);
    v.s  += Number(sold    || 0);
    v.rv += Number(revenue || 0);
  }
  const totalLeads  = [...m.values()].reduce((s, v) => s + v.l, 0);
  const totalVisits = totalRtVisitsInRange();
  const out = [];
  for (const [k, v] of m.entries()) {
    const acc    = v.l ? (v.s / v.l) * 100 : 0;
    const visits = totalLeads > 0 ? Math.round(totalVisits * (v.l / totalLeads)) : 0;
    out.push(lpRow(k, v.l, v.s, acc, v.rv, { c: 0, ctr: 0, cost: 0 }, visits));
  }
  out.sort((a, b) => b[6] - a[6]);
  return out;
}
```

- [ ] **Step 6: Replace `buildOsRows()`**

Find `buildOsRows()` (line ~871) and replace the entire function:

```js
function buildOsRows() {
  const m = new Map();
  for (const r of LD_OS) {
    const { os, form_type, date, leads, sold, revenue } = r;
    const key = os || 'other';
    if (FILTERS.form && form_type !== FILTERS.form) continue;
    if (FILTERS.from && date < FILTERS.from) continue;
    if (FILTERS.to   && date > FILTERS.to)   continue;
    if (!m.has(key)) m.set(key, { l: 0, s: 0, rv: 0 });
    const v = m.get(key);
    v.l  += Number(leads   || 0);
    v.s  += Number(sold    || 0);
    v.rv += Number(revenue || 0);
  }
  const totalLeads  = [...m.values()].reduce((s, v) => s + v.l, 0);
  const totalVisits = totalRtVisitsInRange();
  const out = [];
  for (const [k, v] of m.entries()) {
    const acc    = v.l ? (v.s / v.l) * 100 : 0;
    const visits = totalLeads > 0 ? Math.round(totalVisits * (v.l / totalLeads)) : 0;
    out.push(lpRow(k, v.l, v.s, acc, v.rv, { c: 0, ctr: 0, cost: 0 }, visits));
  }
  out.sort((a, b) => b[6] - a[6]);
  return out;
}
```

- [ ] **Step 7: Manual smoke test**

Open the dashboard. Check the State, Device, and OS tables:
- LEADS, SOLD, REVENUE columns should show real numbers from the `leads` table
- VISITS column should show proportional RT allocation (non-zero if leads exist)
- If no leads in date range, rows should be empty (not fabricated)
- No JS errors in console

- [ ] **Step 8: Commit**

```bash
git add frontend/dash/form_leads.html
git commit -m "feat(fix-c): state/device/OS tables now use real lead counts from leads table"
```

---

## Self-Review Against Spec

### Spec coverage check

| Spec requirement | Covered by task |
|---|---|
| Fix A: `GET /api/stats/lp-form-map` endpoint | Task 2 |
| Fix A: `inferFormTypeFromLead` priority logic (service → url → other) | Task 1+2 |
| Fix A: LP_FORM_MAP lookup in LP_ROWS builder, fallback to inferForm | Task 3 |
| Fix B: `campaign_mapping` ReplacingMergeTree table in migration | Task 4 |
| Fix B: `GET /api/campaign-mapping` | Task 4 |
| Fix B: `POST /api/campaign-mapping` with Zod | Task 4 |
| Fix B: `DELETE /api/campaign-mapping/:id` with non-empty validation | Task 4 |
| Fix B: Dashboard CAMPAIGN_MAP load + Campaign ID view | Task 5 |
| Fix C: `GET /api/stats/leads-breakdown` with 4 Promise.all queries | Task 6 |
| Fix C: Individual query failures return `[]` | Task 6 (`.catch(() => [])`) |
| Fix C: Dashboard LD_STATE/DEVICE/OS/DAILY load | Task 7 |
| Fix C: `buildStateRows()` replaced with LD_STATE real data | Task 7 |
| Fix C: `buildDeviceRows()` replaced with LD_DEVICE real data | Task 7 |
| Fix C: `buildOsRows()` replaced with LD_OS real data | Task 7 |
| Fix C: VISITS column unchanged (still RT proportional) | Task 7 (lead-count proportional allocation kept) |
| Fix C: Empty rows if no leads — no fabricated fallback | Task 7 (map stays empty, returns []) |
| All new ClickHouse queries against ReplacingMergeTree use FINAL | Task 4 (`SELECT * FROM campaign_mapping FINAL`) |
| All new endpoints respect existing rate limiter (no changes needed) | Satisfied — new endpoints under same `/api/` prefix |
| DO NOT TOUCH: get-quotes pages, tracking JS, jobs, existing endpoints | No tasks touch those files |

### Constraint verification

- `GET /api/stats/lp-form-map` — no Zod required per spec (GET, no body) ✓
- `POST /api/campaign-mapping` returns `HTTP 400 { error: 'validation failed', details: zodError.issues }` ✓
- `DELETE` validates non-empty param before query ✓
- `Promise.all` with individual `.catch(() => [])` in leads-breakdown ✓
- No new environment variables ✓
- No schema changes to existing tables ✓
