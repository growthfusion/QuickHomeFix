# Dashboard API Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded `AD_SPEND`, `META_ADS`, and `LANDINGS` JavaScript arrays in `frontend/dash/form_leads.html` with live data fetched hourly from Meta Ads API, Lead Prosper API, and RedTrack API, storing all results in ClickHouse and serving them through three new Express endpoints.

**Architecture:** A `node-cron` scheduler runs inside the existing Express process every hour, triggering three isolated fetcher modules. Each fetcher writes its latest snapshot to a dedicated ClickHouse table. Three new GET endpoints always return the latest snapshot (`WHERE fetched_at = max(fetched_at)`). The frontend replaces hardcoded arrays with `fetch()` calls on page load and wires the new data sources into the existing rendering logic.

**Tech Stack:** Node.js ES modules, Express 5, `@clickhouse/client` (already installed), `axios` (already installed), `node-cron` (new), `vitest` (new for tests), Meta Graph API v21.0, Lead Prosper API, RedTrack API.

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `backend/package.json` | Add `node-cron` dependency and `vitest` dev dependency + test script |
| Modify | `backend/.env` | Add 4 new API credential env vars |
| Modify | `backend/server.js` | Add migration DDL, cron scheduler, 3 new GET endpoints |
| Create | `backend/jobs/fetchMeta.js` | Meta Ads API fetcher |
| Create | `backend/jobs/fetchLeadProsper.js` | Lead Prosper API fetcher |
| Create | `backend/jobs/fetchRedTrack.js` | RedTrack API fetcher |
| Create | `backend/jobs/fetchMeta.test.js` | Vitest unit tests for fetchMeta |
| Create | `backend/jobs/fetchLeadProsper.test.js` | Vitest unit tests for fetchLeadProsper |
| Create | `backend/jobs/fetchRedTrack.test.js` | Vitest unit tests for fetchRedTrack |
| Modify | `frontend/dash/form_leads.html` | Replace AD_SPEND, META_ADS, and LANDINGS arrays with fetch() calls |

---

## Task 1: Install Dependencies and Add Env Vars

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/.env`

- [ ] **Step 1: Add node-cron and vitest to package.json**

Open `backend/package.json` and replace it with:

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "vitest run"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@clickhouse/client": "^1.12.1",
    "axios": "^1.12.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.1.0",
    "helmet": "^8.1.0",
    "node-cron": "^3.0.3",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Install the new packages**

Run from `backend/`:
```
npm install
```

Expected: `node-cron` and `vitest` appear in `node_modules/`. No errors.

- [ ] **Step 3: Add env vars to backend/.env**

Append these four lines to `backend/.env` (do not remove existing lines):

```
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
LEADPROSPER_API_KEY=
REDTRACK_API_KEY=
```

Fill in the values from your Meta App Dashboard, Lead Prosper account settings, and RedTrack profile page.

- [ ] **Step 4: Commit**

```
git add backend/package.json backend/package-lock.json backend/.env
git commit -m "chore: add node-cron and vitest, add API credential env vars"
```

---

## Task 2: Create ClickHouse Tables

**Files:**
- Modify: `backend/server.js` (the existing `/api/dev/migrate` endpoint)

The existing server.js already has a `/api/dev/migrate` endpoint. Find it (search for `api/dev/migrate`) and add the three new CREATE TABLE statements to the array of migration queries it runs.

- [ ] **Step 1: Find the existing migrate endpoint in server.js**

Search for `api/dev/migrate` in `backend/server.js`. You will find an array of SQL strings. Add the three new tables to that array.

The new SQL to add (append after the existing `QuickHomeFix_leads` table DDL):

```sql
CREATE TABLE IF NOT EXISTS meta_ad_stats (
  fetched_at         DateTime,
  date               Date,
  campaign_id        String,
  campaign_name      String,
  adset_id           String,
  adset_name         String,
  ad_id              String,
  ad_name            String,
  publisher_platform String,
  placement          String,
  device             String,
  os                 String,
  state              String,
  region             String,
  clicks             UInt32,
  impressions        UInt32,
  ctr                Float32,
  spend              Float32
) ENGINE = MergeTree()
ORDER BY (date, campaign_id, adset_id, ad_id, placement, device, os, state)
```

```sql
CREATE TABLE IF NOT EXISTS leadprosper_stats (
  fetched_at      DateTime,
  date            Date,
  campaign_id     String,
  campaign_name   String,
  leads_total     UInt32,
  leads_accepted  UInt32,
  leads_failed    UInt32,
  leads_returned  UInt32,
  total_buy       Float32,
  total_sell      Float32,
  net_profit      Float32
) ENGINE = MergeTree()
ORDER BY (date, campaign_id)
```

```sql
CREATE TABLE IF NOT EXISTS redtrack_stats (
  fetched_at    DateTime,
  date          Date,
  campaign_id   String,
  campaign_name String,
  landing       String,
  clicks        UInt32,
  conversions   UInt32,
  revenue       Float32,
  cost          Float32,
  epc           Float32,
  roi           Float32
) ENGINE = MergeTree()
ORDER BY (date, campaign_id, landing)
```

- [ ] **Step 2: Start the server and trigger migration**

```
node server.js
```

In a second terminal, run:
```
curl -X POST http://localhost:5000/api/dev/migrate
```

Expected response contains `ok: true` and no errors.

- [ ] **Step 3: Verify tables exist in ClickHouse**

In your ClickHouse Cloud console (or via curl), run:
```sql
SHOW TABLES
```

Expected: `meta_ad_stats`, `leadprosper_stats`, and `redtrack_stats` appear in the output alongside `QuickHomeFix_leads`.

- [ ] **Step 4: Commit**

```
git add backend/server.js
git commit -m "feat: add ClickHouse migration DDL for meta_ad_stats, leadprosper_stats, redtrack_stats"
```

---

## Task 3: Build fetchMeta.js

**Files:**
- Create: `backend/jobs/fetchMeta.js`
- Create: `backend/jobs/fetchMeta.test.js`

The Meta Insights API has breakdown combination restrictions — delivery breakdowns (`region`) cannot be combined with `publisher_platform`+`placement` in a single call. `fetchMeta` therefore makes **3 separate API calls** per run, all writing to `meta_ad_stats`:
1. Ad-level: `publisher_platform` + `platform_position` (placement)
2. Campaign-level: `device_platform` + `impression_device`
3. Campaign-level: `region`

Rows from all 3 calls have empty strings for the dimensions that call doesn't provide.

- [ ] **Step 1: Write the failing test**

Create `backend/jobs/fetchMeta.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue(undefined),
  })),
}));

import axios from 'axios';
import { createClient } from '@clickhouse/client';
import { fetchMeta } from './fetchMeta.js';

describe('fetchMeta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_ACCESS_TOKEN = 'tok';
    process.env.META_AD_ACCOUNT_ID = '111';
    process.env.CLICKHOUSE_HOST = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
  });

  it('inserts placement rows with correct shape', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: {
          data: [{
            campaign_id: 'cmp1', campaign_name: 'QHF | Bath | test',
            adset_id: 'ads1', adset_name: 'AdSet1',
            ad_id: 'ad1', ad_name: 'Ad1',
            date_start: '2026-05-13',
            publisher_platform: 'facebook', platform_position: 'feed',
            clicks: '50', impressions: '1000', ctr: '5.0', spend: '25.00',
          }],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    await fetchMeta();

    const mockClient = createClient();
    expect(mockClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'meta_ad_stats',
        format: 'JSONEachRow',
        values: expect.arrayContaining([
          expect.objectContaining({
            campaign_id: 'cmp1',
            publisher_platform: 'facebook',
            placement: 'feed',
            clicks: 50,
            spend: 25,
            device: '',
            os: '',
            state: '',
            region: '',
          }),
        ]),
      })
    );
  });

  it('inserts device rows with correct shape', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({
        data: {
          data: [{
            campaign_id: 'cmp1', campaign_name: 'QHF | Roof | test',
            date_start: '2026-05-13',
            device_platform: 'mobile', impression_device: 'iphone',
            clicks: '30', impressions: '500', spend: '15.00',
          }],
        },
      })
      .mockResolvedValueOnce({ data: { data: [] } });

    await fetchMeta();

    const mockClient = createClient();
    expect(mockClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        values: expect.arrayContaining([
          expect.objectContaining({
            device: 'mobile',
            os: 'iphone',
            publisher_platform: '',
            placement: '',
          }),
        ]),
      })
    );
  });

  it('skips insert when all 3 calls return empty data', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } });

    await fetchMeta();

    const mockClient = createClient();
    expect(mockClient.insert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `backend/`:
```
npm test -- fetchMeta
```

Expected: FAIL — `Cannot find module './fetchMeta.js'`

- [ ] **Step 3: Create backend/jobs/fetchMeta.js**

```js
import axios from 'axios';
import { createClient } from '@clickhouse/client';

const META_BASE = 'https://graph.facebook.com/v21.0';

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

async function fetchInsights(accountId, token, params) {
  const all = [];
  let url = `${META_BASE}/act_${accountId}/insights`;
  let queryParams = { access_token: token, limit: 500, ...params };
  while (url) {
    const res = await axios.get(url, { params: queryParams });
    (res.data.data || []).forEach(r => all.push(r));
    url = res.data.paging?.next || null;
    queryParams = {};
  }
  return all;
}

export async function fetchMeta() {
  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  const ch = buildClient();
  const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const [placementData, deviceData, regionData] = await Promise.all([
    fetchInsights(accountId, token, {
      level: 'ad',
      fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,date_start,clicks,impressions,ctr,spend',
      breakdowns: 'publisher_platform,platform_position',
      date_preset: 'last_30d',
      time_increment: 1,
    }),
    fetchInsights(accountId, token, {
      level: 'campaign',
      fields: 'campaign_id,campaign_name,date_start,clicks,impressions,spend',
      breakdowns: 'device_platform,impression_device',
      date_preset: 'last_30d',
      time_increment: 1,
    }),
    fetchInsights(accountId, token, {
      level: 'campaign',
      fields: 'campaign_id,campaign_name,date_start,clicks,impressions,spend',
      breakdowns: 'region',
      date_preset: 'last_30d',
      time_increment: 1,
    }),
  ]);

  const placementRows = placementData.map(r => ({
    fetched_at: fetchedAt,
    date: r.date_start || '',
    campaign_id: r.campaign_id || '',
    campaign_name: r.campaign_name || '',
    adset_id: r.adset_id || '',
    adset_name: r.adset_name || '',
    ad_id: r.ad_id || '',
    ad_name: r.ad_name || '',
    publisher_platform: r.publisher_platform || '',
    placement: r.platform_position || '',
    device: '',
    os: '',
    state: '',
    region: '',
    clicks: Number(r.clicks || 0),
    impressions: Number(r.impressions || 0),
    ctr: Number(r.ctr || 0),
    spend: Number(r.spend || 0),
  }));

  const deviceRows = deviceData.map(r => ({
    fetched_at: fetchedAt,
    date: r.date_start || '',
    campaign_id: r.campaign_id || '',
    campaign_name: r.campaign_name || '',
    adset_id: '',
    adset_name: '',
    ad_id: '',
    ad_name: '',
    publisher_platform: '',
    placement: '',
    device: r.device_platform || '',
    os: r.impression_device || '',
    state: '',
    region: '',
    clicks: Number(r.clicks || 0),
    impressions: Number(r.impressions || 0),
    ctr: 0,
    spend: Number(r.spend || 0),
  }));

  const regionRows = regionData.map(r => ({
    fetched_at: fetchedAt,
    date: r.date_start || '',
    campaign_id: r.campaign_id || '',
    campaign_name: r.campaign_name || '',
    adset_id: '',
    adset_name: '',
    ad_id: '',
    ad_name: '',
    publisher_platform: '',
    placement: '',
    device: '',
    os: '',
    state: r.region || '',
    region: r.region || '',
    clicks: Number(r.clicks || 0),
    impressions: Number(r.impressions || 0),
    ctr: 0,
    spend: Number(r.spend || 0),
  }));

  const allRows = [...placementRows, ...deviceRows, ...regionRows];
  if (allRows.length === 0) {
    console.log('[fetchMeta] No data returned from Meta API');
    return;
  }

  await ch.insert({ table: 'meta_ad_stats', values: allRows, format: 'JSONEachRow' });
  console.log(`[fetchMeta] Inserted ${allRows.length} rows`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- fetchMeta
```

Expected: 3 tests PASS, 0 failures.

- [ ] **Step 5: Commit**

```
git add backend/jobs/fetchMeta.js backend/jobs/fetchMeta.test.js
git commit -m "feat: add Meta Ads API fetcher with tests"
```

---

## Task 4: Build fetchLeadProsper.js

**Files:**
- Create: `backend/jobs/fetchLeadProsper.js`
- Create: `backend/jobs/fetchLeadProsper.test.js`

`fetchLeadProsper` calls two Lead Prosper endpoints (`/public/stats` and `/public/accounting`) for the current calendar month, then merges the results by `campaign_id` before inserting into `leadprosper_stats`.

- [ ] **Step 1: Write the failing test**

Create `backend/jobs/fetchLeadProsper.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue(undefined),
  })),
}));

import axios from 'axios';
import { createClient } from '@clickhouse/client';
import { fetchLeadProsper } from './fetchLeadProsper.js';

describe('fetchLeadProsper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LEADPROSPER_API_KEY = 'lp_key';
    process.env.CLICKHOUSE_HOST = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
  });

  it('inserts merged stats and accounting rows', async () => {
    axios.get
      .mockResolvedValueOnce({
        data: [{
          id: 'c1', name: 'Bath Campaign',
          leads_total: 100, leads_accepted: 80,
          leads_failed: 10, leads_returned: 10,
        }],
      })
      .mockResolvedValueOnce({
        data: [{
          campaign_id: 'c1',
          total_buy: 200.0, total_sell: 400.0, net_profit: 200.0,
        }],
      });

    await fetchLeadProsper();

    const mockClient = createClient();
    expect(mockClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'leadprosper_stats',
        format: 'JSONEachRow',
        values: expect.arrayContaining([
          expect.objectContaining({
            campaign_id: 'c1',
            campaign_name: 'Bath Campaign',
            leads_total: 100,
            leads_accepted: 80,
            total_buy: 200,
            total_sell: 400,
          }),
        ]),
      })
    );
  });

  it('skips insert when stats returns empty array', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    await fetchLeadProsper();

    const mockClient = createClient();
    expect(mockClient.insert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```
npm test -- fetchLeadProsper
```

Expected: FAIL — `Cannot find module './fetchLeadProsper.js'`

- [ ] **Step 3: Create backend/jobs/fetchLeadProsper.js**

```js
import axios from 'axios';
import { createClient } from '@clickhouse/client';

const LP_BASE = 'https://api.leadprosper.io';

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

function todayDateRange() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const start = `${yyyy}-${mm}-01`;
  const end = now.toISOString().slice(0, 10);
  return { start_date: start, end_date: end };
}

export async function fetchLeadProsper() {
  const key = process.env.LEADPROSPER_API_KEY;
  const headers = { Authorization: `Bearer ${key}` };
  const ch = buildClient();
  const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const date = new Date().toISOString().slice(0, 10);
  const dateRange = todayDateRange();

  const [statsRes, accountingRes] = await Promise.all([
    axios.get(`${LP_BASE}/public/stats`, { headers, params: dateRange }),
    axios.get(`${LP_BASE}/public/accounting`, {
      headers,
      params: { ...dateRange, client_type: 'buyers', mode: 'granular' },
    }),
  ]);

  const stats = Array.isArray(statsRes.data) ? statsRes.data : [];
  const accounting = Array.isArray(accountingRes.data) ? accountingRes.data : [];

  if (stats.length === 0) {
    console.log('[fetchLeadProsper] No stats returned');
    return;
  }

  const acctMap = {};
  accounting.forEach(a => {
    acctMap[a.campaign_id] = a;
  });

  const rows = stats.map(s => {
    const acct = acctMap[s.id] || {};
    return {
      fetched_at: fetchedAt,
      date,
      campaign_id: String(s.id || ''),
      campaign_name: s.name || '',
      leads_total: Number(s.leads_total || 0),
      leads_accepted: Number(s.leads_accepted || 0),
      leads_failed: Number(s.leads_failed || 0),
      leads_returned: Number(s.leads_returned || 0),
      total_buy: Number(acct.total_buy || 0),
      total_sell: Number(acct.total_sell || 0),
      net_profit: Number(acct.net_profit || 0),
    };
  });

  await ch.insert({ table: 'leadprosper_stats', values: rows, format: 'JSONEachRow' });
  console.log(`[fetchLeadProsper] Inserted ${rows.length} rows`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- fetchLeadProsper
```

Expected: 2 tests PASS, 0 failures.

- [ ] **Step 5: Commit**

```
git add backend/jobs/fetchLeadProsper.js backend/jobs/fetchLeadProsper.test.js
git commit -m "feat: add Lead Prosper API fetcher with tests"
```

---

## Task 5: Build fetchRedTrack.js

**Files:**
- Create: `backend/jobs/fetchRedTrack.js`
- Create: `backend/jobs/fetchRedTrack.test.js`

RedTrack's report endpoint is `GET https://api.redtrack.io/report`. The API key is passed in the `api_key` query parameter. Breakdowns are specified as `group[]` query params. This fetcher requests `group[]=landing` and `group[]=campaign` to get EPC and landing data grouped by campaign and landing page. Date range uses `from` and `to` params in `YYYY-MM-DD` format.

**Before coding:** Verify the exact endpoint and parameter names by checking the Swagger docs at `https://api.redtrack.io/docs/index.html` (open in browser). The implementation below uses the most common RedTrack API pattern — adjust field names if the Swagger shows different ones.

- [ ] **Step 1: Write the failing test**

Create `backend/jobs/fetchRedTrack.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('@clickhouse/client', () => ({
  createClient: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue(undefined),
  })),
}));

import axios from 'axios';
import { createClient } from '@clickhouse/client';
import { fetchRedTrack } from './fetchRedTrack.js';

describe('fetchRedTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REDTRACK_API_KEY = 'rt_key';
    process.env.CLICKHOUSE_HOST = 'https://localhost';
    process.env.CLICKHOUSE_DATABASE = 'default';
    process.env.CLICKHOUSE_USERNAME = 'default';
    process.env.CLICKHOUSE_PASSWORD = 'pass';
  });

  it('inserts report rows with correct shape', async () => {
    axios.get.mockResolvedValueOnce({
      data: [{
        campaign_id: 'rt_cmp1',
        campaign_name: 'Bath Campaign',
        landing: 'https://example.com/bath',
        clicks: 200,
        conversions: 15,
        revenue: 300.0,
        cost: 100.0,
        epc: 1.5,
        roi: 200.0,
      }],
    });

    await fetchRedTrack();

    const mockClient = createClient();
    expect(mockClient.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'redtrack_stats',
        format: 'JSONEachRow',
        values: expect.arrayContaining([
          expect.objectContaining({
            campaign_id: 'rt_cmp1',
            landing: 'https://example.com/bath',
            clicks: 200,
            epc: 1.5,
          }),
        ]),
      })
    );
  });

  it('skips insert when report returns empty array', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    await fetchRedTrack();

    const mockClient = createClient();
    expect(mockClient.insert).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- fetchRedTrack
```

Expected: FAIL — `Cannot find module './fetchRedTrack.js'`

- [ ] **Step 3: Create backend/jobs/fetchRedTrack.js**

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
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
}

export async function fetchRedTrack() {
  const apiKey = process.env.REDTRACK_API_KEY;
  const ch = buildClient();
  const fetchedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const { from, to } = last30Days();

  // Request daily breakdown by adding date to the group dimensions.
  // Verify exact parameter names against https://api.redtrack.io/docs/index.html
  // if the field names in the response differ, adjust the row mapping below.
  const res = await axios.get(`${RT_BASE}/report`, {
    params: {
      api_key: apiKey,
      from,
      to,
      'group[]': ['date', 'campaign', 'landing'],
    },
  });

  const data = Array.isArray(res.data) ? res.data : [];
  if (data.length === 0) {
    console.log('[fetchRedTrack] No data returned');
    return;
  }

  const rows = data.map(r => ({
    fetched_at: fetchedAt,
    // RedTrack returns date in YYYY-MM-DD format when group[]=date is used
    date: r.date || from,
    campaign_id: String(r.campaign_id || ''),
    campaign_name: r.campaign_name || '',
    landing: r.landing || '',
    clicks: Number(r.clicks || 0),
    conversions: Number(r.conversions || 0),
    revenue: Number(r.revenue || 0),
    cost: Number(r.cost || 0),
    epc: Number(r.epc || 0),
    roi: Number(r.roi || 0),
  }));

  await ch.insert({ table: 'redtrack_stats', values: rows, format: 'JSONEachRow' });
  console.log(`[fetchRedTrack] Inserted ${rows.length} rows`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- fetchRedTrack
```

Expected: 2 tests PASS, 0 failures.

- [ ] **Step 5: Commit**

```
git add backend/jobs/fetchRedTrack.js backend/jobs/fetchRedTrack.test.js
git commit -m "feat: add RedTrack API fetcher with tests"
```

---

## Task 6: Add Cron Scheduler and GET Endpoints to server.js

**Files:**
- Modify: `backend/server.js`

Two additions to `server.js`:
1. Import the 3 fetchers and `node-cron`, then schedule an hourly run.
2. Add 3 GET endpoints that return the latest snapshot from each ClickHouse table.

Both additions go near the bottom of `server.js`, just before the `app.listen(PORT, ...)` line (which is the last line of the file).

- [ ] **Step 1: Add imports at the top of server.js**

At the top of `backend/server.js`, after the existing imports (after `import { createClient } from "@clickhouse/client";`), add:

```js
import cron from 'node-cron';
import { fetchMeta } from './jobs/fetchMeta.js';
import { fetchLeadProsper } from './jobs/fetchLeadProsper.js';
import { fetchRedTrack } from './jobs/fetchRedTrack.js';
```

- [ ] **Step 2: Add the cron scheduler**

In `backend/server.js`, find the line:
```js
const PORT = process.env.PORT || 5000;
```

Insert the cron scheduler and a one-time startup fetch BEFORE that line:

```js
// Run all fetchers once on startup so the dashboard has data immediately
Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()])
  .then(() => console.log('[startup] Initial API sync complete'));

// Re-run every hour at :00
cron.schedule('0 * * * *', () => {
  console.log('[cron] Starting hourly API sync...');
  Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()])
    .then(() => console.log('[cron] Hourly sync complete'));
});
```

- [ ] **Step 3: Add the 3 GET endpoints**

In `backend/server.js`, after the existing `app.get("/api/leads/latest", ...)` block, add the three new endpoints:

```js
app.get("/api/stats/meta", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM meta_ad_stats WHERE fetched_at = (SELECT max(fetched_at) FROM meta_ad_stats)`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/meta]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/stats/leadprosper", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_stats WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_stats)`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/leadprosper]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/stats/redtrack", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM redtrack_stats WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats)`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/redtrack]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});
```

- [ ] **Step 4: Verify the server starts and endpoints respond**

Start the server:
```
node server.js
```

Expected in console:
```
[startup] Initial API sync complete
Server running on port 5000
```

Test each endpoint:
```
curl http://localhost:5000/api/stats/meta
curl http://localhost:5000/api/stats/leadprosper
curl http://localhost:5000/api/stats/redtrack
```

Expected for each: `{"ok":true,"rows":[...]}` — rows will be populated if the API credentials in `.env` are valid and the fetchers ran successfully. An empty `rows: []` is acceptable if this is a first run with no data yet.

- [ ] **Step 5: Commit**

```
git add backend/server.js
git commit -m "feat: add hourly cron scheduler and /api/stats/* endpoints"
```

---

## Task 7: Update frontend/dash/form_leads.html

**Files:**
- Modify: `frontend/dash/form_leads.html`

**Context before starting:** The dashboard's main render function is `rerender()`. SOLD and TOTAL REVENUE are already computed live from the `LEADS` array (which comes from ClickHouse) — no changes needed for those columns. EPC is auto-calculated as `rev / ad.c` — it will update correctly once AD_SPEND contains live Meta click data. The three hardcoded arrays to replace are:
- `AD_SPEND` (~line 642) — shape: `[date, form, source, clicks, ctr, cost]`
- `META_ADS` (~line 678) — shape: `[campaign_name, adset_name, ad_name, placement, campaign_id, form, clicks, purchases]`
- `LANDINGS` (~line 794) — shape: `[date, landing, form, clicks, lp_clicks, leads, purchases]`

- [ ] **Step 1: Remove the three hardcoded arrays**

In `frontend/dash/form_leads.html`, delete the following blocks entirely (find by the `const` keyword + array name):
1. `const AD_SPEND = [` ... closing `];`
2. `const META_ADS = [` ... closing `];`
3. `const LANDINGS = [` ... closing `];`

After deletion, the three variable names must still exist — they will be populated by `loadStats()` in the next step.

- [ ] **Step 2: Add the loadStats function**

In the `<script>` block, immediately after the `const METRIC_COLS = [...]` definition (around line 407), add:

```js
// These will be populated by loadStats() before rerender() is called
let AD_SPEND = [];
let META_ADS = [];
let LANDINGS = [];

function inferForm(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('bath') || n.includes('shower') || n.includes('tub')) return 'bath';
  if (n.includes('roof')) return 'roof';
  if (n.includes('windo')) return 'windo';
  return 'other';
}

async function loadStats() {
  try {
    const [metaRes, lpRes, rtRes] = await Promise.all([
      fetch('/api/stats/meta').then(r => r.json()),
      fetch('/api/stats/leadprosper').then(r => r.json()),
      fetch('/api/stats/redtrack').then(r => r.json()),
    ]);

    if (metaRes.ok && metaRes.rows) {
      // Rows with publisher_platform set → AD_SPEND (date-level spend/clicks/ctr by form+source)
      AD_SPEND = metaRes.rows
        .filter(r => r.publisher_platform)
        .map(r => [
          r.date,
          inferForm(r.campaign_name),
          r.publisher_platform,
          Number(r.clicks),
          Number(r.ctr),
          Number(r.spend),
        ]);

      // Rows with placement set → META_ADS (campaign structure by ad+placement)
      META_ADS = metaRes.rows
        .filter(r => r.placement && r.ad_id)
        .map(r => [
          r.campaign_name,
          r.adset_name,
          r.ad_name,
          r.placement,
          r.campaign_id,
          inferForm(r.campaign_name),
          Number(r.clicks),
          0,
        ]);
    }

    if (rtRes.ok && rtRes.rows) {
      // RedTrack rows → LANDINGS (date × landing, with clicks and conversions)
      LANDINGS = rtRes.rows.map(r => [
        r.date,
        r.landing,
        inferForm(r.campaign_name),
        Number(r.clicks),
        Number(r.clicks),   // lp_clicks: RedTrack doesn't separate LP clicks; use total clicks
        Number(r.conversions),
        0,                   // purchases: not tracked separately in RedTrack
      ]);
    }

    // LP_STATS available but SOLD/REVENUE are already computed live from the LEADS
    // array (ClickHouse partner_payout data) — no wiring needed here.

  } catch (err) {
    console.warn('[loadStats] fetch failed, rendering with empty API data:', err.message);
  }
  rerender();
}
```

- [ ] **Step 3: Replace the initial rerender() call with loadStats()**

Near the bottom of the `<script>` block, find the bare call to `rerender()` that runs when the page first loads (it is outside any function definition). Replace that call with:

```js
loadStats();
```

- [ ] **Step 4: Verify the dashboard renders in the browser**

Start the server (`node backend/server.js`) and open the dashboard URL in a browser.

Open DevTools → Network tab. Confirm:
- 3 requests to `/api/stats/meta`, `/api/stats/leadprosper`, `/api/stats/redtrack` all return HTTP 200
- No JavaScript errors in the Console tab
- CLICKS, CTR, COST columns show non-zero values
- EPC auto-updates (it is calculated as `rev / clicks` — non-zero once both revenue and clicks are populated)
- LANDING dimension table rows show RedTrack landing page URLs

- [ ] **Step 5: Commit**

```
git add frontend/dash/form_leads.html
git commit -m "feat: replace hardcoded AD_SPEND, META_ADS, LANDINGS arrays with live API fetch"
```

---

## Self-Review Notes

- **Meta breakdown restriction:** The 3-call approach for Meta (placement / device / region) is intentional. Meta's API does not allow combining delivery breakdowns (`region`) with `publisher_platform`+`platform_position` in a single call.
- **form field derivation:** The `form` field (bath/roof/windo) does not exist in the Meta API — it is derived by checking campaign names for keywords. This matches how the hardcoded arrays were populated manually.
- **SOLD and REVENUE not changed:** These columns are already computed live from the `LEADS` array in the dashboard, which is populated from ClickHouse (partner_payout field). LP_STATS is fetched and stored in ClickHouse but is not wired into the frontend rendering — it's available for future use.
- **EPC auto-calculated:** EPC is computed by the existing dashboard code as `rev / ad.c`. Once AD_SPEND is populated with live Meta click data, EPC automatically reflects live data. No rendering code changes needed.
- **LANDINGS replaced by RT_STATS:** The dashboard's `aggLandings()` function reads from the `LANDINGS` array (shape: `[date, landing, form, clicks, lp_clicks, leads, purchases]`). RedTrack does not provide `lp_clicks` separately — the implementation uses `clicks` for both fields, which is an approximation.
- **RedTrack endpoint:** The endpoint `GET /report` with `group[]=date&group[]=campaign&group[]=landing` is the most common RedTrack pattern. Verify against `https://api.redtrack.io/docs/index.html` before running Task 5.
- **LP accounting merge:** Lead Prosper's `/public/stats` and `/public/accounting` use different ID fields (`id` vs `campaign_id`). The fetcher maps accounting entries by `campaign_id` to match stats entries by `id`.
- **ClickHouse append-only:** Each hourly run appends new rows (not upserts). The endpoint query `WHERE fetched_at = max(fetched_at)` ensures only the latest snapshot is returned. The table will grow over time — add a TTL or periodic cleanup when data volume becomes a concern.
