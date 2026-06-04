# Offer-Page View/Click Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record offer-page **views** and **clicks** into ClickHouse so we recover the LP-view / LP-click metrics that RedTrack stopped providing once we switched from a lander to a **direct offer**.

**Architecture:** The offer page (which we own) carries the real RedTrack click id in its URL via the `{clickid}` token configured on the RedTrack offer URL. A small first-party script on the offer page beacons two event types — `offer_view` on load and `offer_click` on CTA clicks — to a new `POST /api/track` endpoint. The endpoint derives IP + user-agent server-side and inserts one row per event into a new `offer_events` ClickHouse table using the existing shared client. CTR is derived at query time (`clicks ÷ views`), bucketed by US-Eastern day to match how lead revenue is already bucketed.

**Tech Stack:** Node.js + Express 5 (ESM), `@clickhouse/client`, Vitest. No GTM dependency (raw `navigator.sendBeacon` snippet). No new npm packages.

**Key decisions (locked):**
- **Click id = RedTrack `{clickid}` only.** No generated fallback. Rows with an empty `click_id` are still stored (they count toward view/click totals) but cannot be joined to a specific lead/conversion.
- **Timestamp** is stamped server-side by ClickHouse (`DEFAULT now64(3)`), not sent by the browser — avoids client clock skew and spoofing.
- **IP + user-agent** are read server-side from the request, never trusted from the body.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `backend/offerEvents.js` | Pure helpers: validate `event_type`, build a sanitized `offer_events` row from `(body, ctx)`. No I/O, no Express — unit-testable in isolation. | **Create** |
| `backend/offerEvents.test.js` | Vitest unit tests for the helpers. | **Create** |
| `backend/server.js` | (a) add `offer_events` table to the `/api/dev/migrate` query list; (b) add `POST /api/track` route that wires the helper to `clickhouse.insert`. | **Modify** |
| `docs/clickhouse.md` | Document the new `offer_events` table (Table 12). | **Modify** |
| `frontend/offer-tracking-snippet.html` | The copy-paste `<script>` for the offer page. Reference artifact; the actual deploy is pasting it into the offer page HTML. | **Create** |

Why a separate `backend/offerEvents.js`: `server.js` has no HTTP test harness (only the cron `jobs/*.test.js` files exist). Extracting the validation + row-shaping into a pure module lets us TDD the logic with Vitest, and keeps the route thin.

---

## Task 1: Pure helper module (`offerEvents.js`) — TDD

**Files:**
- Create: `backend/offerEvents.js`
- Test: `backend/offerEvents.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/offerEvents.test.js`:

```js
import { describe, it, expect } from "vitest";
import { isValidEventType, buildOfferEventRow } from "./offerEvents.js";

describe("isValidEventType", () => {
  it("accepts the two known event types", () => {
    expect(isValidEventType("offer_view")).toBe(true);
    expect(isValidEventType("offer_click")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isValidEventType("lead")).toBe(false);
    expect(isValidEventType("")).toBe(false);
    expect(isValidEventType(undefined)).toBe(false);
  });
});

describe("buildOfferEventRow", () => {
  const ctx = { clientIp: "1.2.3.4", userAgent: "Mozilla/5.0" };

  it("returns null for an invalid event_type", () => {
    expect(buildOfferEventRow({ event_type: "nope" }, ctx)).toBeNull();
    expect(buildOfferEventRow(null, ctx)).toBeNull();
  });

  it("builds a complete row from body + server context", () => {
    const row = buildOfferEventRow(
      {
        event_type: "offer_click",
        click_id: "rt_abc",
        rt_ad: "ad_7",
        source_id: "src_9",
        page_url: "https://offer.example/?clickid=rt_abc",
        click_text: "Get My Quote",
        click_url: "https://offer.example/next",
        referrer: "https://fb.com",
      },
      ctx,
    );
    expect(row).toEqual({
      event_type: "offer_click",
      click_id: "rt_abc",
      rt_ad: "ad_7",
      source_id: "src_9",
      page_url: "https://offer.example/?clickid=rt_abc",
      click_text: "Get My Quote",
      click_url: "https://offer.example/next",
      referrer: "https://fb.com",
      user_agent: "Mozilla/5.0",
      client_ip: "1.2.3.4",
    });
  });

  it("defaults missing string fields to empty strings", () => {
    const row = buildOfferEventRow({ event_type: "offer_view" }, {});
    expect(row.click_id).toBe("");
    expect(row.rt_ad).toBe("");
    expect(row.page_url).toBe("");
    expect(row.user_agent).toBe("");
    expect(row.client_ip).toBe("");
  });

  it("coerces non-strings and caps field length", () => {
    const row = buildOfferEventRow(
      { event_type: "offer_view", click_id: 12345, click_text: "x".repeat(500) },
      {},
    );
    expect(row.click_id).toBe("12345");
    expect(row.click_text.length).toBe(256);
  });

  it("does not include a ts field (ClickHouse stamps it via DEFAULT now64)", () => {
    const row = buildOfferEventRow({ event_type: "offer_view" }, {});
    expect(row).not.toHaveProperty("ts");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run offerEvents.test.js`
Expected: FAIL — `Failed to resolve import "./offerEvents.js"` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `backend/offerEvents.js`:

```js
// Pure helpers for the offer-page view/click tracking endpoint (POST /api/track).
// Kept out of server.js so the validation + row-shaping can be unit-tested
// without an HTTP harness. No I/O here — the route owns the ClickHouse insert.

const VALID_EVENT_TYPES = new Set(["offer_view", "offer_click"]);

export function isValidEventType(t) {
  return VALID_EVENT_TYPES.has(t);
}

// Coerce any incoming value to a trimmed, length-capped string.
function str(v, max = 2048) {
  if (v == null) return "";
  return String(v).slice(0, max);
}

// Build a single offer_events row from the request body plus server-derived
// context { clientIp, userAgent }. Returns null when event_type is not one of
// the known types. The `ts` column is intentionally omitted — ClickHouse fills
// it via `DEFAULT now64(3)` so the timestamp is server-authoritative.
export function buildOfferEventRow(body, ctx = {}) {
  body = body || {};
  if (!isValidEventType(body.event_type)) return null;
  return {
    event_type: body.event_type,
    click_id:   str(body.click_id, 256),
    rt_ad:      str(body.rt_ad, 256),
    source_id:  str(body.source_id, 256),
    page_url:   str(body.page_url),
    click_text: str(body.click_text, 256),
    click_url:  str(body.click_url),
    referrer:   str(body.referrer),
    user_agent: str(ctx.userAgent, 512),
    client_ip:  str(ctx.clientIp, 64),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run offerEvents.test.js`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add backend/offerEvents.js backend/offerEvents.test.js
git commit -m "feat(offer-tracking): add pure helpers for offer_events rows"
```

---

## Task 2: Add `offer_events` table to the migration endpoint

**Files:**
- Modify: `backend/server.js` (inside the `migrationQueries` array in `app.post("/api/dev/migrate", ...)`, which begins at `backend/server.js:1401`)

- [ ] **Step 1: Add the CREATE TABLE statement**

In `backend/server.js`, locate the `migrationQueries` array (starts at line 1407). Append this entry to the array (before the closing `]`). Match the surrounding indentation/style of the other `CREATE TABLE IF NOT EXISTS` entries:

```js
      // Offer-page view/click events (direct-offer replacement for RT lp_views/lp_clicks)
      `
        CREATE TABLE IF NOT EXISTS offer_events (
          event_type  LowCardinality(String),
          click_id    String,
          rt_ad       String,
          source_id   String,
          page_url    String,
          click_text  String,
          click_url   String,
          referrer    String,
          user_agent  String,
          client_ip   String,
          ts          DateTime64(3, 'UTC') DEFAULT now64(3)
        ) ENGINE = MergeTree()
        ORDER BY (ts, event_type, click_id)
      `,
```

- [ ] **Step 2: Verify the file still parses**

Run: `cd backend && node --check server.js`
Expected: no output, exit code 0 (syntax OK).

- [ ] **Step 3: Commit**

```bash
git add backend/server.js
git commit -m "feat(offer-tracking): add offer_events table to /api/dev/migrate"
```

> The table is actually created later, in Task 5, by calling `POST /api/dev/migrate` against a running server. This task only registers the DDL.

---

## Task 3: Add `POST /api/track` endpoint

**Files:**
- Modify: `backend/server.js` — add the route near the other `app.post(...)` routes (e.g. directly after the `/api/leads` handler that ends at `backend/server.js:1397`, before the `/api/dev/migrate` route).
- Verify import: `buildOfferEventRow` from `./offerEvents.js`.

- [ ] **Step 1: Add the import**

At the top of `backend/server.js`, alongside the other local imports (e.g. near `import { getClickhouse } from "./clickhouseClient.js";`), add:

```js
import { buildOfferEventRow } from "./offerEvents.js";
```

- [ ] **Step 2: Add the route**

Insert this handler after the `/api/leads` route (after line 1397) and before `app.post("/api/dev/migrate", ...)`:

```js
// Offer-page view/click beacon. Called via navigator.sendBeacon from the offer
// page. One row per event into offer_events. Always returns 204 so the beacon
// never surfaces an error to the page; failures are logged server-side.
app.post("/api/track", async (req, res) => {
  try {
    const clientIp =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    const row = buildOfferEventRow(req.body, { clientIp, userAgent });
    if (!row) return res.status(204).end(); // unknown event_type → drop silently

    const clickhouse = getClickhouse();
    if (clickhouse) {
      await clickhouse.insert({
        table: "offer_events",
        values: [row],
        format: "JSONEachRow",
      });
    }
  } catch (err) {
    console.error("[/api/track] insert failed:", err.message);
  }
  return res.status(204).end();
});
```

> Notes for the implementer:
> - `navigator.sendBeacon` sends `Content-Type: text/plain` by default, NOT JSON. Confirm the JSON body parser accepts it (Step 3). The snippet in Task 4 sends a `Blob` with `type: "application/json"` precisely so the existing `express.json()` middleware parses it.
> - `getClickhouse()` is the existing memoized accessor from `clickhouseClient.js`; check whether `server.js` already holds a module-level `clickhouse` constant and reuse that instead of re-calling, to match the file's existing style.

- [ ] **Step 3: Confirm the JSON body parser covers the beacon content type**

Search `backend/server.js` for the `express.json(` middleware registration.
- If it is `app.use(express.json())` with no `type` option, it only parses `application/json`. The Task 4 snippet sends `application/json` via a typed `Blob`, so this is fine — no change needed.
- Do NOT broaden the parser to `text/*`; the snippet is responsible for sending the correct content type.

Run: `cd backend && node --check server.js`
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add backend/server.js
git commit -m "feat(offer-tracking): add POST /api/track endpoint"
```

---

## Task 4: Offer-page snippet + RedTrack offer URL config

**Files:**
- Create: `frontend/offer-tracking-snippet.html` (reference artifact to paste into the offer page)

- [ ] **Step 1: Create the snippet**

Create `frontend/offer-tracking-snippet.html`:

```html
<!--
  Offer-page view/click tracking.
  Paste this just before </body> on the OFFER page.
  Prerequisite: the RedTrack offer URL must carry the click id, e.g.
    https://YOUR-OFFER-PAGE/?clickid={clickid}&rt_ad={sub2}&source_id={sub4}
  Replace API_BASE with your backend origin.
-->
<script>
(function () {
  var API_BASE = "https://your-api.com"; // <-- set to your backend origin
  var p = new URLSearchParams(location.search);

  function send(type, extra) {
    var payload = Object.assign({
      event_type: type,
      click_id:   p.get("clickid")   || "",
      rt_ad:      p.get("rt_ad")     || "",
      source_id:  p.get("source_id") || "",
      page_url:   location.href,
      referrer:   document.referrer || ""
    }, extra || {});
    // Typed Blob so express.json() parses it (sendBeacon defaults to text/plain).
    var blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(API_BASE + "/api/track", blob);
  }

  // View — once on load.
  send("offer_view");

  // Click — only real CTAs (links / buttons), not every pixel on the page.
  document.addEventListener("click", function (e) {
    var b = e.target.closest("a, button, [role=button]");
    if (!b) return;
    send("offer_click", {
      click_text: (b.innerText || b.textContent || "").trim().slice(0, 80),
      click_url:  b.href || ""
    });
  });
})();
</script>
```

- [ ] **Step 2: Document the RedTrack configuration step**

This is a manual RedTrack dashboard change (no code). Record it in the snippet file header (done above) and verify during Step-5 testing:

> In RedTrack, open the **Offer** used by the direct-offer campaign → set its **URL** to append the tokens:
> `?clickid={clickid}&rt_ad={sub2}&source_id={sub4}`
> (append with `&` if the offer URL already has query params). This is what puts the real RedTrack click id onto the offer page URL where the snippet reads it.

- [ ] **Step 3: Commit**

```bash
git add frontend/offer-tracking-snippet.html
git commit -m "feat(offer-tracking): add offer-page beacon snippet + RT URL notes"
```

---

## Task 5: Migrate, end-to-end verification, and docs

**Files:**
- Modify: `docs/clickhouse.md` (add Table 12)

- [ ] **Step 1: Create the table on the live database**

With the backend running (or against the deployed instance), call the migration endpoint:

```bash
curl -X POST https://your-api.com/api/dev/migrate
```

Expected: JSON response indicating success (same shape the endpoint already returns for existing migrations). `CREATE TABLE IF NOT EXISTS offer_events` runs without error.

- [ ] **Step 2: Verify the table exists**

Run a ClickHouse query (via your ClickHouse client/console):

```sql
SHOW CREATE TABLE offer_events
```

Expected: the DDL from Task 2, with `ts DateTime64(3, 'UTC') DEFAULT now64(3)` and `ORDER BY (ts, event_type, click_id)`.

- [ ] **Step 3: Send a synthetic event and confirm the row lands**

```bash
curl -i -X POST https://your-api.com/api/track \
  -H "Content-Type: application/json" \
  -d '{"event_type":"offer_view","click_id":"test_rt_1","rt_ad":"ad_x","source_id":"src_y","page_url":"https://offer.example/?clickid=test_rt_1","referrer":"https://fb.com"}'
```

Expected: `HTTP/1.1 204 No Content`.

Then:

```sql
SELECT event_type, click_id, rt_ad, source_id, client_ip, user_agent, ts
FROM offer_events
WHERE click_id = 'test_rt_1'
ORDER BY ts DESC
LIMIT 5
```

Expected: one `offer_view` row with `click_id = 'test_rt_1'`, `client_ip` populated from the request, and a `ts` ~now (UTC).

- [ ] **Step 4: Verify the CTR query works (Eastern-day buckets)**

```sql
SELECT
  toDate(ts, 'America/New_York')      AS day,
  countIf(event_type = 'offer_view')  AS views,
  countIf(event_type = 'offer_click') AS clicks,
  round(if(views = 0, 0, clicks / views * 100), 2) AS ctr
FROM offer_events
GROUP BY day
ORDER BY day DESC
```

Expected: at least one row for today with `views >= 1`. (The `if(views = 0, ...)` guard avoids divide-by-zero.)

- [ ] **Step 5: Live smoke test from the offer page**

After pasting the snippet (Task 4) on the offer page and setting the RedTrack offer URL tokens (Task 4 Step 2): load the offer page through a real RedTrack click, then click a CTA. Re-run the Step-3 `SELECT` (without the `WHERE`) and confirm both an `offer_view` and an `offer_click` row appear, **carrying the real RedTrack `click_id`** (not empty).

- [ ] **Step 6: Document the table**

In `docs/clickhouse.md`, add a new section after Table 11:

```markdown
---

## Table 12: `offer_events`

**Purpose:** Raw offer-page view and click events for direct-offer campaigns (no lander). Replaces the RedTrack `lp_views` / `lp_clicks` metrics lost when traffic goes straight to the offer page. One row per event, written by `POST /api/track` from a first-party beacon on the offer page.

**Engine:** `MergeTree` — `ORDER BY (ts, event_type, click_id)`

| Column | Type | Description |
|---|---|---|
| `event_type` | `LowCardinality(String)` | `offer_view` or `offer_click` |
| `click_id` | `String` | RedTrack `{clickid}` from the offer URL; empty if RedTrack passed none |
| `rt_ad` | `String` | RedTrack `{sub2}` ad label |
| `source_id` | `String` | Traffic source id (`{sub4}`) |
| `page_url` | `String` | Full offer page URL |
| `click_text` | `String` | Text of the clicked element (offer_click only) |
| `click_url` | `String` | Destination of the clicked element (offer_click only) |
| `referrer` | `String` | `document.referrer` |
| `user_agent` | `String` | Browser UA (server-derived) |
| `client_ip` | `String` | Client IP (server-derived from `x-forwarded-for`) |
| `ts` | `DateTime64(3, 'UTC')` | Event time, stamped server-side via `DEFAULT now64(3)` |

**CTR:** aggregate `countIf(offer_click) / countIf(offer_view)`, bucketed by `toDate(ts, 'America/New_York')` to match lead-revenue day bucketing.
```

- [ ] **Step 7: Commit**

```bash
git add docs/clickhouse.md
git commit -m "docs(clickhouse): document offer_events table"
```

---

## Self-Review notes

- **Spec coverage:** view tracking (Task 4 `offer_view` + Task 3 route + Task 2 table), click tracking (`offer_click`), ClickHouse storage (Tasks 2/3/5), RedTrack-clickid-only / no fallback (snippet reads `clickid` only; empty allowed), CTR query (Task 5 Step 4 + docs). All covered.
- **No fallback id:** confirmed — `offerEvents.js` never generates an id; an absent `clickid` yields `click_id = ""`. Rows are still stored and counted.
- **Type consistency:** `buildOfferEventRow` keys ↔ `offer_events` columns ↔ snippet payload keys all match (`event_type`, `click_id`, `rt_ad`, `source_id`, `page_url`, `click_text`, `click_url`, `referrer`); `user_agent`/`client_ip` added server-side; `ts` added by ClickHouse default.
- **Open risk to watch (not blocking):** open `/api/track` endpoint can receive bot traffic and inflate view counts. Not handled in this plan. If counts look inflated post-launch, add lightweight filtering (UA/known-bot list, or per-click_id dedup) as a follow-up — `log()` any cap so truncation isn't silent.
```
