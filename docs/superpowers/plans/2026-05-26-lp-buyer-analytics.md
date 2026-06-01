# LP Buyer Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scalable buyer-wise analytics system that fetches individual lead records from the LeadProsper `/public/leads` API and stores them in a raw leads table plus four pre-aggregated summary tables (buyer / buyer+state / buyer+state+city / buyer+postal-code), replacing the existing `leadprosper_buyer_stats` table.

**Architecture:** A new `fetchAllLeadsForCampaign` helper paginates `/public/leads` (100 leads/page via `search_after` cursor) for every campaign discovered in the existing `/public/stats` response. Five pure JS functions transform raw lead records into aggregated rows. All six new tables use the same delete-on-refetch pattern as the rest of the codebase (`ALTER TABLE … DELETE WHERE fetched_at != 'current'`). The existing `leadprosper_buyer_stats` table is kept for backward compat but gets two new computed rate columns.

**Tech Stack:** Node.js / ES modules, axios, @clickhouse/client, vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/jobs/fetchLeadProsper.js` | Modify | Add `fetchAllLeadsForCampaign`, export 5 pure aggregate functions, wire leads fetch + agg inserts into main `fetchLeadProsper()` |
| `backend/jobs/fetchLeadProsper.test.js` | Modify | Unit tests for 5 pure functions; integration tests for leads pagination and full-table inserts |
| `backend/server.js` | Modify (2 places) | Add 6 CREATE TABLE migrations (tables 7–12); add 2 ALTER COLUMN migrations; add 5 new GET endpoints |
| `docs/clickhouse.md` | Modify | Document 6 new tables (Tables 7–12); note new columns on `leadprosper_buyer_stats` |

---

## Task 1: Write failing unit tests for the five pure aggregate functions

**Files:**
- Modify: `backend/jobs/fetchLeadProsper.test.js`

These tests import functions that don't exist yet — they must fail until Task 2 is done.

- [ ] **Step 1: Add import line at top of test file**

After the existing `import { fetchLeadProsper } from './fetchLeadProsper.js';` line, add:

```javascript
import {
  buildLeadRecordRows,
  computeAggBuyer,
  computeAggBuyerState,
  computeAggBuyerStateCity,
  computeAggBuyerPostal,
} from './fetchLeadProsper.js';
```

- [ ] **Step 2: Add a second describe block at the end of the file (after the closing `});` of the existing describe)**

```javascript
// ── Pure function unit tests ─────────────────────────────────────────────────
describe('buildLeadRecordRows', () => {
  const TS = '2026-05-26 12:00:00';

  it('returns one row per buyer per lead', () => {
    const leads = [{
      id: 'lead1', lead_date_ms: '1748260800000', status: 'ACCEPTED',
      revenue: 30, cost: 0, campaign_id: 33966, campaign_name: 'Bath',
      returned: false, return_reason: '', test: false, error_code: 0, error_message: '',
      lead_data: { state: 'CA', city: 'Los Angeles', postalCode: '90001', service: 'BATH_REMODEL', rt_ad: 'ad1', source_id: 'gf2' },
      supplier: { id: '110222', name: 'Karigouda' },
      buyers: [
        { id: 'b1', name: 'Modernize',  status: 'ACCEPTED', sell_price: 30, error_code: 0, error_message: '' },
        { id: 'b2', name: 'Remodelwell', status: 'OUTBID',  sell_price: 0,  error_code: 0, error_message: '' },
      ],
    }];

    const rows = buildLeadRecordRows(TS, leads);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      fetched_at: TS, lead_id: 'lead1', lead_date: '2026-05-26',
      campaign_id: '33966', campaign_name: 'Bath', lead_status: 'ACCEPTED',
      revenue: 30, state: 'CA', city: 'Los Angeles', postal_code: '90001',
      service: 'BATH_REMODEL', supplier_name: 'Karigouda',
      buyer_id: 'b1', buyer_name: 'Modernize', buyer_status: 'ACCEPTED', sell_price: 30,
    });
    expect(rows[1]).toMatchObject({ buyer_id: 'b2', buyer_status: 'OUTBID', sell_price: 0 });
  });

  it('returns empty array for empty input', () => {
    expect(buildLeadRecordRows(TS, [])).toEqual([]);
  });

  it('skips buyers array gracefully when absent', () => {
    const leads = [{
      id: 'lead2', lead_date_ms: '1748260800000', status: 'ERROR',
      revenue: 0, cost: 0, campaign_id: 33966, campaign_name: 'Bath',
      returned: false, return_reason: '', test: false, error_code: 1, error_message: 'err',
      lead_data: { state: 'TX', city: 'Austin', postalCode: '78701', service: 'BATH_REMODEL', rt_ad: '', source_id: '' },
      supplier: { id: '110222', name: 'Karigouda' },
      buyers: [],
    }];
    expect(buildLeadRecordRows(TS, leads)).toEqual([]);
  });
});

describe('computeAggBuyer', () => {
  const TS = '2026-05-26 12:00:00';

  const sampleLeadRows = [
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'ACCEPTED', sell_price: 30 },
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'ACCEPTED', sell_price: 20 },
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'ERROR',    sell_price: 0  },
    { buyer_id: 'b1', buyer_name: 'Modernize',  buyer_status: 'OUTBID',   sell_price: 0  },
    { buyer_id: 'b2', buyer_name: 'Remodelwell', buyer_status: 'ACCEPTED', sell_price: 15 },
  ];

  const samplePingRows = [
    { buyer_id: 'b1', pings_total: 10, pings_accepted: 8, pings_failed: 2 },
    { buyer_id: 'b1', pings_total: 5,  pings_accepted: 4, pings_failed: 1 },
  ];

  it('aggregates buyer totals correctly', () => {
    const rows = computeAggBuyer(TS, sampleLeadRows, []);
    const b1 = rows.find(r => r.buyer_id === 'b1');
    expect(b1).toMatchObject({
      fetched_at: TS,
      total_leads: 4, accepted_leads: 2, rejected_leads: 1, outbid_leads: 1,
      sold_leads: 2, total_revenue: 50,
      avg_sell_price: 25,
      acceptance_rate: 50,
      rejection_rate: 25,
      conversion_rate: 50,
    });
  });

  it('merges ping metrics from allBuyerRows', () => {
    const rows = computeAggBuyer(TS, sampleLeadRows, samplePingRows);
    const b1 = rows.find(r => r.buyer_id === 'b1');
    expect(b1).toMatchObject({
      pings_total: 15, pings_accepted: 12, pings_failed: 3,
      ping_accept_rate: 80,
      ping_reject_rate: 20,
    });
  });

  it('sets ping rates to 0 when pings_total is 0', () => {
    const rows = computeAggBuyer(TS, sampleLeadRows, []);
    const b1 = rows.find(r => r.buyer_id === 'b1');
    expect(b1.ping_accept_rate).toBe(0);
    expect(b1.ping_reject_rate).toBe(0);
  });
});

describe('computeAggBuyerState', () => {
  const TS = '2026-05-26 12:00:00';

  it('groups by buyer + state', () => {
    const leadRows = [
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', buyer_status: 'ACCEPTED', sell_price: 30 },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', buyer_status: 'ERROR',    sell_price: 0  },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'TX', buyer_status: 'ACCEPTED', sell_price: 20 },
    ];
    const rows = computeAggBuyerState(TS, leadRows);
    expect(rows).toHaveLength(2);
    const ca = rows.find(r => r.state === 'CA');
    expect(ca).toMatchObject({
      buyer_id: 'b1', state: 'CA',
      total_leads: 2, accepted_leads: 1, rejected_leads: 1, sold_leads: 1,
      total_revenue: 30, avg_sell_price: 30, acceptance_rate: 50,
    });
  });
});

describe('computeAggBuyerStateCity', () => {
  const TS = '2026-05-26 12:00:00';

  it('groups by buyer + state + city', () => {
    const leadRows = [
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', city: 'LA',   buyer_status: 'ACCEPTED', sell_price: 30 },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', city: 'LA',   buyer_status: 'OUTBID',   sell_price: 0  },
      { buyer_id: 'b1', buyer_name: 'Modernize', state: 'CA', city: 'SF',   buyer_status: 'ACCEPTED', sell_price: 25 },
    ];
    const rows = computeAggBuyerStateCity(TS, leadRows);
    expect(rows).toHaveLength(2);
    const la = rows.find(r => r.city === 'LA');
    expect(la).toMatchObject({ state: 'CA', city: 'LA', total_leads: 2, sold_leads: 1, total_revenue: 30 });
  });
});

describe('computeAggBuyerPostal', () => {
  const TS = '2026-05-26 12:00:00';

  it('groups by buyer + postal code', () => {
    const leadRows = [
      { buyer_id: 'b1', buyer_name: 'Modernize', postal_code: '90001', state: 'CA', buyer_status: 'ACCEPTED', sell_price: 30 },
      { buyer_id: 'b1', buyer_name: 'Modernize', postal_code: '90001', state: 'CA', buyer_status: 'ERROR',    sell_price: 0  },
      { buyer_id: 'b1', buyer_name: 'Modernize', postal_code: '78701', state: 'TX', buyer_status: 'ACCEPTED', sell_price: 20 },
    ];
    const rows = computeAggBuyerPostal(TS, leadRows);
    expect(rows).toHaveLength(2);
    const zip = rows.find(r => r.postal_code === '90001');
    expect(zip).toMatchObject({ postal_code: '90001', state: 'CA', total_leads: 2, sold_leads: 1, total_revenue: 30 });
  });
});
```

- [ ] **Step 3: Run new tests to confirm they fail**

```bash
cd backend && npx vitest run jobs/fetchLeadProsper.test.js
```

Expected: all new `describe` blocks FAIL with "not a function" or import error. Existing 7 tests still PASS.

---

## Task 2: Implement the five pure functions in `fetchLeadProsper.js`

**Files:**
- Modify: `backend/jobs/fetchLeadProsper.js`

- [ ] **Step 1: Add the five exported pure functions**

Add the following block at the end of `backend/jobs/fetchLeadProsper.js` (before the final blank line, after the `fetchLeadProsper` export):

```javascript
// ── Pure data-transformation functions (exported for unit testing) ────────────

export function buildLeadRecordRows(fetchedAt, leads) {
  const rows = [];
  for (const lead of leads) {
    const ld = lead.lead_data || {};
    const base = {
      fetched_at:    fetchedAt,
      lead_id:       String(lead.id || ''),
      lead_date:     new Date(Number(lead.lead_date_ms)).toISOString().slice(0, 10),
      campaign_id:   String(lead.campaign_id || ''),
      campaign_name: String(lead.campaign_name || ''),
      lead_status:   String(lead.status || ''),
      revenue:       Number(lead.revenue || 0),
      state:         String(ld.state || ''),
      city:          String(ld.city || ''),
      postal_code:   String(ld.postalCode || ''),
      service:       String(ld.service || ''),
      rt_ad:         String(ld.rt_ad || ''),
      source_id:     String(ld.source_id || ''),
      supplier_id:   String(lead.supplier?.id || ''),
      supplier_name: String(lead.supplier?.name || ''),
    };
    for (const b of (Array.isArray(lead.buyers) ? lead.buyers : [])) {
      rows.push({
        ...base,
        buyer_id:      String(b.id || ''),
        buyer_name:    String(b.name || ''),
        buyer_status:  String(b.status || ''),
        sell_price:    Number(b.sell_price || 0),
        error_code:    Number(b.error_code || 0),
        error_message: String(b.error_message || ''),
      });
    }
  }
  return rows;
}

export function computeAggBuyer(fetchedAt, leadRecordRows, allBuyerRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    if (!map.has(r.buyer_id)) map.set(r.buyer_id, {
      buyer_id: r.buyer_id, buyer_name: r.buyer_name,
      total_leads: 0, accepted_leads: 0, rejected_leads: 0,
      outbid_leads: 0, sold_leads: 0, total_revenue: 0,
    });
    const v = map.get(r.buyer_id);
    v.total_leads++;
    if (r.buyer_status === 'ACCEPTED') { v.accepted_leads++; v.sold_leads++; v.total_revenue += r.sell_price; }
    else if (r.buyer_status === 'ERROR')  { v.rejected_leads++; }
    else if (r.buyer_status === 'OUTBID') { v.outbid_leads++; }
  }
  const pingMap = new Map();
  for (const r of allBuyerRows) {
    if (!pingMap.has(r.buyer_id)) pingMap.set(r.buyer_id, { pings_total: 0, pings_accepted: 0, pings_failed: 0 });
    const p = pingMap.get(r.buyer_id);
    p.pings_total    += Number(r.pings_total    || 0);
    p.pings_accepted += Number(r.pings_accepted || 0);
    p.pings_failed   += Number(r.pings_failed   || 0);
  }
  return [...map.values()].map(v => {
    const p = pingMap.get(v.buyer_id) || { pings_total: 0, pings_accepted: 0, pings_failed: 0 };
    return {
      fetched_at:       fetchedAt,
      buyer_id:         v.buyer_id,
      buyer_name:       v.buyer_name,
      total_leads:      v.total_leads,
      accepted_leads:   v.accepted_leads,
      rejected_leads:   v.rejected_leads,
      outbid_leads:     v.outbid_leads,
      sold_leads:       v.sold_leads,
      total_revenue:    +v.total_revenue.toFixed(2),
      avg_sell_price:   v.sold_leads   > 0 ? +(v.total_revenue / v.sold_leads   * 1).toFixed(2) : 0,
      acceptance_rate:  v.total_leads  > 0 ? +(v.accepted_leads / v.total_leads  * 100).toFixed(2) : 0,
      rejection_rate:   v.total_leads  > 0 ? +(v.rejected_leads / v.total_leads  * 100).toFixed(2) : 0,
      conversion_rate:  v.total_leads  > 0 ? +(v.sold_leads     / v.total_leads  * 100).toFixed(2) : 0,
      pings_total:      p.pings_total,
      pings_accepted:   p.pings_accepted,
      pings_failed:     p.pings_failed,
      ping_accept_rate: p.pings_total > 0 ? +(p.pings_accepted / p.pings_total * 100).toFixed(2) : 0,
      ping_reject_rate: p.pings_total > 0 ? +(p.pings_failed   / p.pings_total * 100).toFixed(2) : 0,
    };
  });
}

function _aggMetrics(v) {
  return {
    total_leads:     v.total_leads,
    accepted_leads:  v.accepted_leads,
    rejected_leads:  v.rejected_leads,
    outbid_leads:    v.outbid_leads,
    sold_leads:      v.sold_leads,
    total_revenue:   +v.total_revenue.toFixed(2),
    avg_sell_price:  v.sold_leads  > 0 ? +(v.total_revenue / v.sold_leads  * 1).toFixed(2) : 0,
    acceptance_rate: v.total_leads > 0 ? +(v.accepted_leads / v.total_leads * 100).toFixed(2) : 0,
    rejection_rate:  v.total_leads > 0 ? +(v.rejected_leads / v.total_leads * 100).toFixed(2) : 0,
    conversion_rate: v.total_leads > 0 ? +(v.sold_leads     / v.total_leads * 100).toFixed(2) : 0,
  };
}

function _accumulateLead(map, key, dims, r) {
  if (!map.has(key)) map.set(key, { ...dims, total_leads: 0, accepted_leads: 0, rejected_leads: 0, outbid_leads: 0, sold_leads: 0, total_revenue: 0 });
  const v = map.get(key);
  v.total_leads++;
  if (r.buyer_status === 'ACCEPTED') { v.accepted_leads++; v.sold_leads++; v.total_revenue += r.sell_price; }
  else if (r.buyer_status === 'ERROR')  { v.rejected_leads++; }
  else if (r.buyer_status === 'OUTBID') { v.outbid_leads++; }
}

export function computeAggBuyerState(fetchedAt, leadRecordRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    const key = `${r.buyer_id}|${r.state}`;
    _accumulateLead(map, key, { buyer_id: r.buyer_id, buyer_name: r.buyer_name, state: r.state }, r);
  }
  return [...map.values()].map(v => ({ fetched_at: fetchedAt, buyer_id: v.buyer_id, buyer_name: v.buyer_name, state: v.state, ..._aggMetrics(v) }));
}

export function computeAggBuyerStateCity(fetchedAt, leadRecordRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    const key = `${r.buyer_id}|${r.state}|${r.city}`;
    _accumulateLead(map, key, { buyer_id: r.buyer_id, buyer_name: r.buyer_name, state: r.state, city: r.city }, r);
  }
  return [...map.values()].map(v => ({ fetched_at: fetchedAt, buyer_id: v.buyer_id, buyer_name: v.buyer_name, state: v.state, city: v.city, ..._aggMetrics(v) }));
}

export function computeAggBuyerPostal(fetchedAt, leadRecordRows) {
  const map = new Map();
  for (const r of leadRecordRows) {
    const key = `${r.buyer_id}|${r.postal_code}`;
    _accumulateLead(map, key, { buyer_id: r.buyer_id, buyer_name: r.buyer_name, postal_code: r.postal_code, state: r.state }, r);
  }
  return [...map.values()].map(v => ({ fetched_at: fetchedAt, buyer_id: v.buyer_id, buyer_name: v.buyer_name, postal_code: v.postal_code, state: v.state, ..._aggMetrics(v) }));
}
```

- [ ] **Step 2: Run tests to confirm unit tests now pass**

```bash
cd backend && npx vitest run jobs/fetchLeadProsper.test.js
```

Expected: ALL tests PASS. Verify the new `describe` blocks pass individually.

- [ ] **Step 3: Commit**

```bash
git add backend/jobs/fetchLeadProsper.js backend/jobs/fetchLeadProsper.test.js
git commit -m "feat: add pure aggregate functions for LP buyer analytics"
```

---

## Task 3: Write failing integration tests for leads pagination + full-table inserts

**Files:**
- Modify: `backend/jobs/fetchLeadProsper.test.js`

- [ ] **Step 1: Add helper `makeLead` at the top of the second describe block (before existing unit tests)**

Add this helper function just before the `describe('buildLeadRecordRows', ...)` block:

```javascript
function makeLead(id, state, buyerStatus, sellPrice, campaignId = 33966) {
  return {
    id, lead_date_ms: '1748260800000', status: buyerStatus === 'ACCEPTED' ? 'ACCEPTED' : 'ERROR',
    revenue: sellPrice, cost: 0, campaign_id: campaignId, campaign_name: 'Bath',
    returned: false, return_reason: '', test: false, error_code: 0, error_message: '',
    lead_data: { state, city: 'TestCity', postalCode: '12345', service: 'BATH_REMODEL', rt_ad: 'ad', source_id: 'gf2' },
    supplier: { id: '110222', name: 'Karigouda' },
    buyers: [{ id: 'b1', name: 'Modernize', status: buyerStatus, sell_price: sellPrice, error_code: 0, error_message: '' }],
  };
}
```

- [ ] **Step 2: Add integration tests inside the existing `describe('fetchLeadProsper', ...)` block, after the last `it(...)` test**

```javascript
it('fetches leads with pagination and inserts lead_records + 4 agg tables', async () => {
  axios.get.mockImplementation((url, opts) => {
    if (url.includes('/public/stats')) {
      return Promise.resolve({
        data: [{
          campaign: { id: 33966, name: 'Bath', leads_total: 2, leads_accepted: 1, leads_failed: 1, leads_returned: 0 },
          suppliers: [],
          buyers: [{ id: 'b1', name: 'Modernize', client_id: 1, client_company: 'Modernize',
            leads_total: 2, leads_accepted: 1, leads_duplicated: 0, leads_failed: 1, leads_returned: 0,
            pings_total: 5, pings_accepted: 4, pings_failed: 1,
            total_sell: 30, gross_revenue: 30, net_revenue: 30, returned_revenue: 0, net_leads_accepted: 1 }],
        }],
      });
    }
    if (url.includes('/public/accounting')) return Promise.resolve({ data: [] });
    if (url.includes('/public/leads')) {
      const sa = opts?.params?.search_after;
      if (!sa) {
        // First page: 1 lead + search_after cursor
        return Promise.resolve({ data: { leads: [makeLead('L1', 'CA', 'ACCEPTED', 30)], search_after: 'cursor1' } });
      }
      // Second page: 1 lead + no cursor (last page)
      return Promise.resolve({ data: { leads: [makeLead('L2', 'TX', 'ERROR', 0)], search_after: null } });
    }
    return Promise.resolve({ data: [] });
  });

  await fetchLeadProsper();

  // inserts: leadprosper_stats(1) + leadprosper_buyer_stats(1) + lead_records(1) + agg_buyer(1) + agg_state(1) + agg_city(1) + agg_postal(1) = 7
  expect(mockInsert).toHaveBeenCalledTimes(7);

  const tableNames = mockInsert.mock.calls.map(c => c[0].table);
  expect(tableNames).toContain('leadprosper_lead_records');
  expect(tableNames).toContain('leadprosper_agg_buyer');
  expect(tableNames).toContain('leadprosper_agg_buyer_state');
  expect(tableNames).toContain('leadprosper_agg_buyer_city');
  expect(tableNames).toContain('leadprosper_agg_buyer_postal');

  const recordsCall = mockInsert.mock.calls.find(c => c[0].table === 'leadprosper_lead_records');
  expect(recordsCall[0].values).toHaveLength(2); // 2 leads × 1 buyer each

  const aggBuyerCall = mockInsert.mock.calls.find(c => c[0].table === 'leadprosper_agg_buyer');
  const buyerRow = aggBuyerCall[0].values[0];
  expect(buyerRow).toMatchObject({
    buyer_name: 'Modernize',
    total_leads: 2, sold_leads: 1, total_revenue: 30,
    pings_total: 5, pings_accepted: 4, ping_accept_rate: 80,
  });

  expect(mockClose).toHaveBeenCalledTimes(1);
});

it('skips lead_records inserts when leads fetch returns empty', async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/public/stats')) {
      return Promise.resolve({
        data: [{ campaign: { id: 33966, name: 'Bath', leads_total: 0, leads_accepted: 0, leads_failed: 0, leads_returned: 0 }, suppliers: [], buyers: [] }],
      });
    }
    if (url.includes('/public/accounting')) return Promise.resolve({ data: [] });
    if (url.includes('/public/leads')) return Promise.resolve({ data: { leads: [], search_after: null } });
    return Promise.resolve({ data: [] });
  });

  await fetchLeadProsper();

  const tableNames = mockInsert.mock.calls.map(c => c[0].table);
  expect(tableNames).not.toContain('leadprosper_lead_records');
  expect(tableNames).not.toContain('leadprosper_agg_buyer');
  expect(mockClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 3: Run tests to confirm the two new integration tests fail**

```bash
cd backend && npx vitest run jobs/fetchLeadProsper.test.js
```

Expected: the two new `it(...)` tests inside `describe('fetchLeadProsper')` FAIL. All previous tests still PASS.

---

## Task 4: Implement `fetchAllLeadsForCampaign` and wire everything into `fetchLeadProsper()`

**Files:**
- Modify: `backend/jobs/fetchLeadProsper.js`

- [ ] **Step 1: Add `fetchAllLeadsForCampaign` helper after the existing `fetchDay` function (around line 46)**

```javascript
async function fetchAllLeadsForCampaign(headers, campaignId, startDate, endDate) {
  const allLeads = [];
  let searchAfter = null;
  do {
    const params = { start_date: startDate, end_date: endDate, campaign: campaignId };
    if (searchAfter) params.search_after = searchAfter;
    const res = await axios.get(`${LP_BASE}/public/leads`, { headers, params });
    const batch = Array.isArray(res.data?.leads) ? res.data.leads : [];
    allLeads.push(...batch);
    searchAfter = res.data?.search_after || null;
  } while (searchAfter);
  return allLeads;
}
```

- [ ] **Step 2: Update the `allBuyerRows.push(...)` block in `fetchLeadProsper()` to include the two new rate columns**

Find the existing `allBuyerRows.push({` block (around line 103) and replace the closing part after `net_leads_accepted` so the object includes two new fields:

```javascript
        allBuyerRows.push({
          fetched_at: fetchedAt,
          date: day,
          campaign_id: String(c.id || ''),
          campaign_name: c.name || '',
          buyer_id: String(b.id || ''),
          buyer_name: b.name || '',
          leads_total: Number(b.leads_total || 0),
          leads_accepted: Number(b.leads_accepted || 0),
          leads_duplicated: Number(b.leads_duplicated || 0),
          leads_failed: Number(b.leads_failed || 0),
          leads_returned: Number(b.leads_returned || 0),
          pings_total: Number(b.pings_total || 0),
          pings_accepted: Number(b.pings_accepted || 0),
          pings_failed: Number(b.pings_failed || 0),
          total_sell: Number(b.total_sell || 0),
          gross_revenue: Number(b.gross_revenue || 0),
          net_revenue: Number(b.net_revenue || 0),
          returned_revenue: Number(b.returned_revenue || 0),
          net_leads_accepted: Number(b.net_leads_accepted || 0),
          ping_accept_rate: Number(b.pings_total || 0) > 0
            ? +((Number(b.pings_accepted || 0) / Number(b.pings_total)) * 100).toFixed(2) : 0,
          ping_reject_rate: Number(b.pings_total || 0) > 0
            ? +((Number(b.pings_failed || 0) / Number(b.pings_total)) * 100).toFixed(2) : 0,
        });
```

- [ ] **Step 3: Add leads fetch + aggregate inserts inside `fetchLeadProsper()`**

Find the block that starts at line 128 (`if (allRows.length === 0) {`). Replace the entire section from `if (allRows.length === 0)` to the end of the `try` block (before `finally`) with:

```javascript
    if (allRows.length === 0) {
      console.log('[fetchLeadProsper] No stats returned for any day this month');
      return;
    }

    await ch.insert({ table: 'leadprosper_stats', values: allRows, format: 'JSONEachRow' });
    await ch.command({ query: `ALTER TABLE leadprosper_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
    console.log(`[fetchLeadProsper] Inserted ${allRows.length} stats rows`);

    if (allBuyerRows.length > 0) {
      await ch.insert({ table: 'leadprosper_buyer_stats', values: allBuyerRows, format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_buyer_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
    }

    // Leads fetch — one paginated call per campaign found in stats
    const campaignIds = [...new Set(
      dayResults.flatMap(({ stats }) => stats.map(s => String((s.campaign || s).id || '')))
    )].filter(Boolean);

    const allLeads = [];
    for (const cid of campaignIds) {
      try {
        const leads = await fetchAllLeadsForCampaign(headers, cid, days[0], days[days.length - 1]);
        allLeads.push(...leads);
      } catch (e) {
        console.warn(`[fetchLeadProsper] leads fetch failed for campaign ${cid}:`, e.message);
      }
    }

    if (allLeads.length > 0) {
      const allLeadRecordRows  = buildLeadRecordRows(fetchedAt, allLeads);
      const aggBuyerRows       = computeAggBuyer(fetchedAt, allLeadRecordRows, allBuyerRows);
      const aggStateRows       = computeAggBuyerState(fetchedAt, allLeadRecordRows);
      const aggCityRows        = computeAggBuyerStateCity(fetchedAt, allLeadRecordRows);
      const aggPostalRows      = computeAggBuyerPostal(fetchedAt, allLeadRecordRows);

      await ch.insert({ table: 'leadprosper_lead_records',    values: allLeadRecordRows, format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_lead_records    DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer',        values: aggBuyerRows,      format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer        DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer_state',  values: aggStateRows,      format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer_state  DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer_city',   values: aggCityRows,       format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer_city   DELETE WHERE fetched_at != '${fetchedAt}'` });

      await ch.insert({ table: 'leadprosper_agg_buyer_postal', values: aggPostalRows,     format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_agg_buyer_postal DELETE WHERE fetched_at != '${fetchedAt}'` });

      console.log(`[fetchLeadProsper] Inserted ${allLeadRecordRows.length} lead records across ${campaignIds.length} campaigns`);
    }
```

- [ ] **Step 4: Run all tests to confirm they pass**

```bash
cd backend && npx vitest run jobs/fetchLeadProsper.test.js
```

Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/jobs/fetchLeadProsper.js backend/jobs/fetchLeadProsper.test.js
git commit -m "feat: fetch LP leads with pagination and populate 5 analytics tables"
```

---

## Task 5: Add ClickHouse migrations in `server.js`

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Add 6 new CREATE TABLE migrations**

In `backend/server.js`, find the `migrationQueries` array. After the closing backtick of the `leadprosper_buyer_stats` block (around line 1563), add:

```javascript
      // 7. LP raw lead records — one row per (lead_id, buyer_id)
      `
        CREATE TABLE IF NOT EXISTS leadprosper_lead_records (
          fetched_at     DateTime64(3, 'UTC') DEFAULT now64(3),
          lead_id        String,
          lead_date      Date,
          campaign_id    String,
          campaign_name  String,
          lead_status    LowCardinality(String),
          revenue        Float64,
          state          LowCardinality(String),
          city           LowCardinality(String),
          postal_code    String,
          service        LowCardinality(String),
          rt_ad          String,
          source_id      String,
          supplier_id    String,
          supplier_name  LowCardinality(String),
          buyer_id       String,
          buyer_name     LowCardinality(String),
          buyer_status   LowCardinality(String),
          sell_price     Float64,
          error_code     Int32,
          error_message  String
        ) ENGINE = MergeTree()
        ORDER BY (lead_date, campaign_id, lead_id, buyer_id)
      `,
      // 8. LP buyer-level summary (current month, latest snapshot)
      `
        CREATE TABLE IF NOT EXISTS leadprosper_agg_buyer (
          fetched_at       DateTime64(3, 'UTC') DEFAULT now64(3),
          buyer_id         String,
          buyer_name       LowCardinality(String),
          total_leads      UInt32,
          accepted_leads   UInt32,
          rejected_leads   UInt32,
          outbid_leads     UInt32,
          sold_leads       UInt32,
          total_revenue    Float64,
          avg_sell_price   Float64,
          acceptance_rate  Float64,
          rejection_rate   Float64,
          conversion_rate  Float64,
          pings_total      UInt32,
          pings_accepted   UInt32,
          pings_failed     UInt32,
          ping_accept_rate Float64,
          ping_reject_rate Float64
        ) ENGINE = MergeTree()
        ORDER BY (buyer_id)
      `,
      // 9. LP buyer + state summary
      `
        CREATE TABLE IF NOT EXISTS leadprosper_agg_buyer_state (
          fetched_at       DateTime64(3, 'UTC') DEFAULT now64(3),
          buyer_id         String,
          buyer_name       LowCardinality(String),
          state            LowCardinality(String),
          total_leads      UInt32,
          accepted_leads   UInt32,
          rejected_leads   UInt32,
          outbid_leads     UInt32,
          sold_leads       UInt32,
          total_revenue    Float64,
          avg_sell_price   Float64,
          acceptance_rate  Float64,
          rejection_rate   Float64,
          conversion_rate  Float64
        ) ENGINE = MergeTree()
        ORDER BY (buyer_id, state)
      `,
      // 10. LP buyer + state + city summary
      `
        CREATE TABLE IF NOT EXISTS leadprosper_agg_buyer_city (
          fetched_at       DateTime64(3, 'UTC') DEFAULT now64(3),
          buyer_id         String,
          buyer_name       LowCardinality(String),
          state            LowCardinality(String),
          city             LowCardinality(String),
          total_leads      UInt32,
          accepted_leads   UInt32,
          rejected_leads   UInt32,
          outbid_leads     UInt32,
          sold_leads       UInt32,
          total_revenue    Float64,
          avg_sell_price   Float64,
          acceptance_rate  Float64,
          rejection_rate   Float64,
          conversion_rate  Float64
        ) ENGINE = MergeTree()
        ORDER BY (buyer_id, state, city)
      `,
      // 11. LP buyer + postal code summary
      `
        CREATE TABLE IF NOT EXISTS leadprosper_agg_buyer_postal (
          fetched_at       DateTime64(3, 'UTC') DEFAULT now64(3),
          buyer_id         String,
          buyer_name       LowCardinality(String),
          postal_code      String,
          state            LowCardinality(String),
          total_leads      UInt32,
          accepted_leads   UInt32,
          rejected_leads   UInt32,
          outbid_leads     UInt32,
          sold_leads       UInt32,
          total_revenue    Float64,
          avg_sell_price   Float64,
          acceptance_rate  Float64,
          rejection_rate   Float64,
          conversion_rate  Float64
        ) ENGINE = MergeTree()
        ORDER BY (buyer_id, postal_code)
      `,
      // 12. Add rate columns to existing leadprosper_buyer_stats
      `ALTER TABLE leadprosper_buyer_stats ADD COLUMN IF NOT EXISTS ping_accept_rate Float64 DEFAULT 0`,
      `ALTER TABLE leadprosper_buyer_stats ADD COLUMN IF NOT EXISTS ping_reject_rate Float64 DEFAULT 0`,
```

- [ ] **Step 2: Run the full test suite to ensure no regressions**

```bash
cd backend && npx vitest run
```

Expected: ALL tests PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat: add ClickHouse migrations for LP buyer analytics tables"
```

---

## Task 6: Add five new API endpoints in `server.js`

**Files:**
- Modify: `backend/server.js`

- [ ] **Step 1: Add endpoints after the existing `/api/stats/leadprosper-buyers` endpoint (around line 1932)**

```javascript
app.get("/api/stats/lp-leads", async (req, res) => {
  try {
    const { buyer, state, city, postal_code, from, to } = req.query;
    const conditions = [`fetched_at = (SELECT max(fetched_at) FROM leadprosper_lead_records)`];
    if (buyer)       conditions.push(`buyer_name = '${buyer.replace(/'/g, "''")}'`);
    if (state)       conditions.push(`state = '${state.replace(/'/g, "''")}'`);
    if (city)        conditions.push(`city = '${city.replace(/'/g, "''")}'`);
    if (postal_code) conditions.push(`postal_code = '${postal_code.replace(/'/g, "''")}'`);
    if (from)        conditions.push(`lead_date >= '${from}'`);
    if (to)          conditions.push(`lead_date <= '${to}'`);
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_lead_records WHERE ${conditions.join(' AND ')} ORDER BY lead_date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/lp-leads]', e.message);
    res.status(500).json({ ok: false, rows: [] });
  }
});

app.get("/api/stats/lp-agg-buyer", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_agg_buyer WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_agg_buyer) ORDER BY total_revenue DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/lp-agg-buyer]', e.message);
    res.status(500).json({ ok: false, rows: [] });
  }
});

app.get("/api/stats/lp-agg-buyer-state", async (req, res) => {
  try {
    const { buyer } = req.query;
    const extra = buyer ? ` AND buyer_name = '${buyer.replace(/'/g, "''")}'` : '';
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_agg_buyer_state WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_agg_buyer_state)${extra} ORDER BY buyer_name, total_revenue DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/lp-agg-buyer-state]', e.message);
    res.status(500).json({ ok: false, rows: [] });
  }
});

app.get("/api/stats/lp-agg-buyer-city", async (req, res) => {
  try {
    const { buyer, state } = req.query;
    const conds = [`fetched_at = (SELECT max(fetched_at) FROM leadprosper_agg_buyer_city)`];
    if (buyer) conds.push(`buyer_name = '${buyer.replace(/'/g, "''")}'`);
    if (state) conds.push(`state = '${state.replace(/'/g, "''")}'`);
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_agg_buyer_city WHERE ${conds.join(' AND ')} ORDER BY buyer_name, state, total_revenue DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/lp-agg-buyer-city]', e.message);
    res.status(500).json({ ok: false, rows: [] });
  }
});

app.get("/api/stats/lp-agg-buyer-postal", async (req, res) => {
  try {
    const { buyer, state } = req.query;
    const conds = [`fetched_at = (SELECT max(fetched_at) FROM leadprosper_agg_buyer_postal)`];
    if (buyer) conds.push(`buyer_name = '${buyer.replace(/'/g, "''")}'`);
    if (state) conds.push(`state = '${state.replace(/'/g, "''")}'`);
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_agg_buyer_postal WHERE ${conds.join(' AND ')} ORDER BY buyer_name, total_revenue DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/lp-agg-buyer-postal]', e.message);
    res.status(500).json({ ok: false, rows: [] });
  }
});
```

- [ ] **Step 2: Run the full test suite**

```bash
cd backend && npx vitest run
```

Expected: ALL tests PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat: add LP buyer analytics API endpoints"
```

---

## Task 7: Update `docs/clickhouse.md`

**Files:**
- Modify: `docs/clickhouse.md`

- [ ] **Step 1: Add Tables 7–12 before the `## Migration` section**

Open `docs/clickhouse.md`. Find the `## Migration` heading at the end and insert the following before it:

```markdown
---

## Table 7: `leadprosper_lead_records`

**Purpose:** Individual LP lead × buyer decision rows for the current calendar month. One row per (lead_id, buyer_id). Populated by `fetchLeadProsper` via `/public/leads` with pagination. Enables geo-level filtering (state/city/postal) and per-buyer decision tracking.

**Engine:** `MergeTree` — `ORDER BY (lead_date, campaign_id, lead_id, buyer_id)`

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3,'UTC')` | Fetch timestamp |
| `lead_id` | `String` | LP lead ID |
| `lead_date` | `Date` | Lead submission date |
| `campaign_id` | `String` | LP campaign ID |
| `campaign_name` | `String` | LP campaign name |
| `lead_status` | `LowCardinality(String)` | Overall lead status: `ACCEPTED` / `ERROR` |
| `revenue` | `Float64` | Total payout for this lead |
| `state` | `LowCardinality(String)` | 2-letter US state code |
| `city` | `LowCardinality(String)` | City name |
| `postal_code` | `String` | 5-digit ZIP |
| `service` | `LowCardinality(String)` | e.g. `BATH_REMODEL` |
| `rt_ad` | `String` | RedTrack ad label |
| `source_id` | `String` | Traffic source ID |
| `supplier_id` | `String` | LP supplier ID |
| `supplier_name` | `LowCardinality(String)` | Supplier name |
| `buyer_id` | `String` | LP buyer ID |
| `buyer_name` | `LowCardinality(String)` | Buyer name (Modernize, Remodelwell…) |
| `buyer_status` | `LowCardinality(String)` | `ACCEPTED` / `OUTBID` / `ERROR` |
| `sell_price` | `Float64` | Buyer-level payout (USD) |
| `error_code` | `Int32` | LP error code (0 = none) |
| `error_message` | `String` | Rejection reason |

---

## Table 8: `leadprosper_agg_buyer`

**Purpose:** Current-month buyer-level performance summary with ping metrics. Aggregated from `leadprosper_lead_records` (lead metrics) + `leadprosper_buyer_stats` (ping metrics). One row per buyer.

**Engine:** `MergeTree` — `ORDER BY (buyer_id)`

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3,'UTC')` | Fetch timestamp |
| `buyer_id` | `String` | |
| `buyer_name` | `LowCardinality(String)` | |
| `total_leads` | `UInt32` | All lead attempts |
| `accepted_leads` | `UInt32` | Buyer accepted |
| `rejected_leads` | `UInt32` | Buyer rejected (ERROR) |
| `outbid_leads` | `UInt32` | Lost auction (OUTBID) |
| `sold_leads` | `UInt32` | Leads with sell_price > 0 |
| `total_revenue` | `Float64` | Sum of sell_price |
| `avg_sell_price` | `Float64` | Revenue ÷ sold_leads |
| `acceptance_rate` | `Float64` | accepted ÷ total × 100 |
| `rejection_rate` | `Float64` | rejected ÷ total × 100 |
| `conversion_rate` | `Float64` | sold ÷ total × 100 |
| `pings_total` | `UInt32` | From ping stats |
| `pings_accepted` | `UInt32` | From ping stats |
| `pings_failed` | `UInt32` | From ping stats |
| `ping_accept_rate` | `Float64` | accepted ÷ total × 100 |
| `ping_reject_rate` | `Float64` | failed ÷ total × 100 |

---

## Table 9: `leadprosper_agg_buyer_state`

**Purpose:** Buyer × state performance. Same metrics as Table 8 minus ping columns (pings have no state breakdown).

**Engine:** `MergeTree` — `ORDER BY (buyer_id, state)`

Columns: `fetched_at`, `buyer_id`, `buyer_name`, `state` + all 10 lead metrics from Table 8 (total through conversion_rate).

---

## Table 10: `leadprosper_agg_buyer_city`

**Purpose:** Buyer × state × city performance.

**Engine:** `MergeTree` — `ORDER BY (buyer_id, state, city)`

Columns: `fetched_at`, `buyer_id`, `buyer_name`, `state`, `city` + same 10 lead metrics.

---

## Table 11: `leadprosper_agg_buyer_postal`

**Purpose:** Buyer × postal code performance. Includes `state` for context.

**Engine:** `MergeTree` — `ORDER BY (buyer_id, postal_code)`

Columns: `fetched_at`, `buyer_id`, `buyer_name`, `postal_code`, `state` + same 10 lead metrics.

---

## Table 6 update: `leadprosper_buyer_stats` (ping stats — updated)

Two columns added via `ALTER TABLE … ADD COLUMN IF NOT EXISTS`:

| New Column | Type | Description |
|---|---|---|
| `ping_accept_rate` | `Float64` | `pings_accepted / pings_total × 100`, 0 when total is 0 |
| `ping_reject_rate` | `Float64` | `pings_failed / pings_total × 100`, 0 when total is 0 |

```

- [ ] **Step 2: Commit**

```bash
git add docs/clickhouse.md
git commit -m "docs: document LP buyer analytics tables 7-12 and buyer_stats rate columns"
```

---

## Task 8: Live verification

- [ ] **Step 1: Run the migration**

```bash
curl -X POST http://localhost:5050/api/dev/migrate
```

Expected: `{"ok":true,"migrated":true}`

- [ ] **Step 2: Trigger a force-fetch**

```bash
curl -X POST http://localhost:5050/api/dev/force-fetch
```

Expected: `{"meta":"ok","leadprosper":"ok","redtrack":"ok","thumbtack":"ok"}`

- [ ] **Step 3: Verify raw lead records**

```bash
curl http://localhost:5050/api/stats/lp-leads
```

Expected: `{"ok":true,"rows":[...]}` with rows containing `state`, `city`, `postal_code`, `buyer_name`, `buyer_status`.

- [ ] **Step 4: Verify buyer aggregate**

```bash
curl http://localhost:5050/api/stats/lp-agg-buyer
```

Expected: rows with `buyer_name` (Modernize, Remodelwell…), `total_leads`, `sold_leads`, `total_revenue`, `ping_accept_rate`.

- [ ] **Step 5: Verify geo aggregates**

```bash
curl "http://localhost:5050/api/stats/lp-agg-buyer-state?buyer=Modernize"
curl "http://localhost:5050/api/stats/lp-agg-buyer-city?buyer=Modernize&state=CA"
curl "http://localhost:5050/api/stats/lp-agg-buyer-postal?buyer=Modernize"
```

Expected: each returns `{"ok":true,"rows":[...]}` with correct groupings showing state/city/postal breakdowns.

- [ ] **Step 6: Spot-check totals match**

The sum of `total_revenue` across all rows in `/api/stats/lp-agg-buyer` must equal the sum of `total_sell` across all buyers in `/api/stats/leadprosper-buyers` for the current month. If they differ by more than a few cents (float rounding), investigate the `buildLeadRecordRows` date conversion — ensure `lead_date_ms` milliseconds are being converted correctly.

- [ ] **Step 7: Final commit if any adjustments were needed**

```bash
git add -p
git commit -m "fix: <describe any live adjustments>"
```
