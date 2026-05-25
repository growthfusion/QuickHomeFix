# LeadProsper Buyer Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture LP buyer-level data (Modernize, Remodelwell, OpenHome, Leadvision, etc.) from the LeadProsper `/public/stats` API into a new `leadprosper_buyer_stats` ClickHouse table and expose it via a new API endpoint.

**Architecture:** The LP `/public/stats` response already returns a `buyers` array per campaign per day — the current sync job discards it. We extend `fetchLeadProsper.js` to extract buyer rows alongside the existing campaign rows and insert them into a new dedicated table. A new `GET /api/stats/leadprosper-buyers` endpoint serves the latest snapshot. No existing tables, endpoints, or dashboard code are touched.

**Tech Stack:** Node.js / ES modules, axios, @clickhouse/client, vitest

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/jobs/fetchLeadProsper.js` | Modify | Extract buyers array, build buyer rows, insert + clean up `leadprosper_buyer_stats` |
| `backend/jobs/fetchLeadProsper.test.js` | Modify | Add test cases for buyer row extraction |
| `backend/server.js` | Modify (2 places) | Add migration CREATE TABLE; add new GET endpoint |
| `docs/clickhouse.md` | Modify | Document new table as Table 6 |

---

## Task 1: Write failing tests for buyer row extraction

**Files:**
- Modify: `backend/jobs/fetchLeadProsper.test.js`

- [ ] **Step 1: Add buyer extraction test**

Open `backend/jobs/fetchLeadProsper.test.js`. Add these two test cases inside the existing `describe('fetchLeadProsper', ...)` block, after the last existing `it(...)`:

```javascript
it('inserts buyer rows into leadprosper_buyer_stats when buyers are present', async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/stats')) {
      return Promise.resolve({
        data: [{
          campaign: {
            id: 'c1', name: 'Bath Campaign',
            leads_total: 10, leads_accepted: 8,
            leads_failed: 1, leads_returned: 1,
          },
          suppliers: [],
          buyers: [
            {
              id: 'b1', name: 'Modernize', client_id: 100, client_company: 'Modernize',
              leads_total: 5, leads_accepted: 3, leads_duplicated: 0,
              leads_failed: 2, leads_returned: 0,
              pings_total: 10, pings_accepted: 8, pings_failed: 2,
              total_sell: 30.0, gross_revenue: 30.0, net_revenue: 30.0,
              returned_revenue: 0, net_leads_accepted: 3,
            },
            {
              id: 'b2', name: 'Remodelwell', client_id: 101, client_company: 'Remodelwell',
              leads_total: 5, leads_accepted: 5, leads_duplicated: 0,
              leads_failed: 0, leads_returned: 0,
              pings_total: 10, pings_accepted: 10, pings_failed: 0,
              total_sell: 50.0, gross_revenue: 50.0, net_revenue: 50.0,
              returned_revenue: 0, net_leads_accepted: 5,
            },
          ],
        }],
      });
    }
    return Promise.resolve({
      data: [{ campaign_id: 'c1', total_buy: 20.0, total_sell: 80.0, net_profit: 60.0 }],
    });
  });

  await fetchLeadProsper();

  // Two inserts: one for leadprosper_stats, one for leadprosper_buyer_stats
  expect(mockInsert).toHaveBeenCalledTimes(2);

  const buyerCall = mockInsert.mock.calls.find(c => c[0].table === 'leadprosper_buyer_stats');
  expect(buyerCall).toBeDefined();

  const buyerRows = buyerCall[0].values;
  expect(buyerRows).toHaveLength(2);

  expect(buyerRows[0]).toMatchObject({
    campaign_id: 'c1',
    campaign_name: 'Bath Campaign',
    buyer_id: 'b1',
    buyer_name: 'Modernize',
    leads_total: 5,
    leads_accepted: 3,
    leads_duplicated: 0,
    leads_failed: 2,
    leads_returned: 0,
    pings_total: 10,
    pings_accepted: 8,
    pings_failed: 2,
    total_sell: 30,
    gross_revenue: 30,
    net_revenue: 30,
    returned_revenue: 0,
    net_leads_accepted: 3,
  });

  expect(mockClose).toHaveBeenCalledTimes(1);
});

it('does not insert buyer rows when all campaigns have empty buyers arrays', async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/stats')) {
      return Promise.resolve({
        data: [{
          campaign: { id: 'c1', name: 'Bath', leads_total: 5, leads_accepted: 4, leads_failed: 0, leads_returned: 0 },
          suppliers: [],
          buyers: [],
        }],
      });
    }
    return Promise.resolve({ data: [] });
  });

  await fetchLeadProsper();

  // Only one insert: leadprosper_stats — no buyer insert
  expect(mockInsert).toHaveBeenCalledTimes(1);
  expect(mockInsert.mock.calls[0][0].table).toBe('leadprosper_stats');
  expect(mockClose).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the new tests to confirm they fail**

```bash
cd backend && npx vitest run jobs/fetchLeadProsper.test.js
```

Expected: the two new tests FAIL (buyer logic not implemented yet), all existing tests still PASS.

---

## Task 2: Add buyer row extraction to `fetchLeadProsper.js`

**Files:**
- Modify: `backend/jobs/fetchLeadProsper.js`

- [ ] **Step 1: Add buyer row building and insertion**

In `backend/jobs/fetchLeadProsper.js`, replace the block from line 77 to line 108 (the `allRows` loop + insert + cleanup) with this:

```javascript
    const allRows = [];
    const allBuyerRows = [];

    for (const { day, stats, accounting } of dayResults) {
      if (stats.length === 0) continue;
      const acctMap = {};
      accounting.forEach(a => { acctMap[a.campaign_id] = a; });
      for (const s of stats) {
        const c = s.campaign || s;
        const acct = acctMap[c.id] || {};
        allRows.push({
          fetched_at: fetchedAt,
          date: day,
          campaign_id: String(c.id || ''),
          campaign_name: c.name || '',
          leads_total: Number(c.leads_total || 0),
          leads_accepted: Number(c.leads_accepted || 0),
          leads_failed: Number(c.leads_failed || 0),
          leads_returned: Number(c.leads_returned || 0),
          total_buy: Number(acct.total_buy || 0),
          total_sell: Number(acct.total_sell || 0),
          net_profit: Number(acct.net_profit || 0),
        });

        const buyers = Array.isArray(s.buyers) ? s.buyers : [];
        for (const b of buyers) {
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
          });
        }
      }
    }

    if (allRows.length === 0) {
      console.log('[fetchLeadProsper] No stats returned for any day this month');
      return;
    }

    await ch.insert({ table: 'leadprosper_stats', values: allRows, format: 'JSONEachRow' });
    await ch.command({ query: `ALTER TABLE leadprosper_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
    console.log(`[fetchLeadProsper] Inserted ${allRows.length} rows across ${days.length} days`);

    if (allBuyerRows.length > 0) {
      await ch.insert({ table: 'leadprosper_buyer_stats', values: allBuyerRows, format: 'JSONEachRow' });
      await ch.command({ query: `ALTER TABLE leadprosper_buyer_stats DELETE WHERE fetched_at != '${fetchedAt}'` });
      console.log(`[fetchLeadProsper] Inserted ${allBuyerRows.length} buyer rows`);
    }
```

- [ ] **Step 2: Run all tests to confirm they pass**

```bash
cd backend && npx vitest run jobs/fetchLeadProsper.test.js
```

Expected: ALL tests PASS including the two new ones.

- [ ] **Step 3: Commit**

```bash
git add backend/jobs/fetchLeadProsper.js backend/jobs/fetchLeadProsper.test.js
git commit -m "feat: extract and store LP buyer rows into leadprosper_buyer_stats"
```

---

## Task 3: Add migration and API endpoint to `server.js`

**Files:**
- Modify: `backend/server.js` (two places)

- [ ] **Step 1: Add migration query**

In `backend/server.js`, find the `migrationQueries` array. After the thumbtack_stats `CREATE TABLE IF NOT EXISTS` block (ends around line 1538), add this new entry:

```javascript
      // 6. LP buyer stats — one row per (date, campaign_id, buyer_id)
      `
        CREATE TABLE IF NOT EXISTS leadprosper_buyer_stats (
          fetched_at          DateTime64(3, 'UTC') DEFAULT now64(3),
          date                Date,
          campaign_id         String,
          campaign_name       String,
          buyer_id            String,
          buyer_name          String,
          leads_total         UInt32,
          leads_accepted      UInt32,
          leads_duplicated    UInt32,
          leads_failed        UInt32,
          leads_returned      UInt32,
          pings_total         UInt32,
          pings_accepted      UInt32,
          pings_failed        UInt32,
          total_sell          Float64,
          gross_revenue       Float64,
          net_revenue         Float64,
          returned_revenue    Float64,
          net_leads_accepted  UInt32
        ) ENGINE = MergeTree()
        ORDER BY (date, campaign_id, buyer_id)
      `,
```

- [ ] **Step 2: Add the new API endpoint**

In `backend/server.js`, directly after the closing `});` of the `/api/stats/leadprosper` endpoint (around line 1895), add:

```javascript
app.get("/api/stats/leadprosper-buyers", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_buyer_stats WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_buyer_stats) ORDER BY date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/leadprosper-buyers]', e.message);
    res.status(500).json({ ok: false, rows: [] });
  }
});
```

- [ ] **Step 3: Run the full test suite to catch any regressions**

```bash
cd backend && npx vitest run
```

Expected: ALL tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/server.js
git commit -m "feat: add leadprosper_buyer_stats migration and /api/stats/leadprosper-buyers endpoint"
```

---

## Task 4: Document the new table in `docs/clickhouse.md`

**Files:**
- Modify: `docs/clickhouse.md`

- [ ] **Step 1: Add Table 6**

Open `docs/clickhouse.md`. At the end of the file, before the `## Migration` section, add:

```markdown
## Table 6: `leadprosper_buyer_stats`

**Purpose:** LeadProsper buyer-level performance — lead counts, ping stats, and revenue broken down per buyer per campaign per day. Populated by `fetchLeadProsper` alongside `leadprosper_stats`. Dashboard reads the latest `fetched_at` snapshot.

**Engine:** `MergeTree` — `ORDER BY (date, campaign_id, buyer_id)`

| Column | Type | Description |
|---|---|---|
| `fetched_at` | `DateTime64(3, 'UTC')` | Timestamp of the fetch run |
| `date` | `Date` | Date of the stats row |
| `campaign_id` | `String` | LP campaign ID |
| `campaign_name` | `String` | LP campaign name |
| `buyer_id` | `String` | LP buyer ID |
| `buyer_name` | `String` | LP buyer name (e.g. Modernize, Remodelwell) |
| `leads_total` | `UInt32` | Total leads submitted to this buyer |
| `leads_accepted` | `UInt32` | Leads accepted by this buyer |
| `leads_duplicated` | `UInt32` | Duplicate leads |
| `leads_failed` | `UInt32` | Leads rejected by this buyer |
| `leads_returned` | `UInt32` | Leads returned after acceptance |
| `pings_total` | `UInt32` | Total pings sent to this buyer |
| `pings_accepted` | `UInt32` | Pings accepted by this buyer |
| `pings_failed` | `UInt32` | Pings rejected by this buyer |
| `total_sell` | `Float64` | Total sell-side revenue from this buyer (USD) |
| `gross_revenue` | `Float64` | Gross revenue from this buyer (USD) |
| `net_revenue` | `Float64` | Net revenue from this buyer (USD) |
| `returned_revenue` | `Float64` | Revenue from returned leads (USD) |
| `net_leads_accepted` | `UInt32` | Net accepted leads (accepted minus returned) |

```

- [ ] **Step 2: Commit**

```bash
git add docs/clickhouse.md
git commit -m "docs: document leadprosper_buyer_stats table in clickhouse.md"
```

---

## Task 5: Create the table and verify live data

- [ ] **Step 1: Run the migration**

Hit the migration endpoint to create `leadprosper_buyer_stats` in ClickHouse Cloud:

```bash
curl -X POST http://localhost:5050/api/dev/migrate
```

Expected response: `{"ok":true,"migrated":true}`

- [ ] **Step 2: Trigger a force-fetch to populate the table**

```bash
curl -X POST http://localhost:5050/api/dev/force-fetch
```

Expected response: `{"meta":"ok","leadprosper":"ok","redtrack":"ok","thumbtack":"ok"}`

- [ ] **Step 3: Verify buyer rows were inserted**

```bash
curl http://localhost:5050/api/stats/leadprosper-buyers
```

Expected: `{"ok":true,"rows":[...]}` with rows containing `buyer_name` values like `"Modernize"`, `"Remodelwell"`, `"OpenHome"`, `"Leadvision"`.

- [ ] **Step 4: Final commit if any last adjustments were needed**

```bash
git add -p
git commit -m "fix: <describe any adjustments>"
```
