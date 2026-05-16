# Rate Limits Reference

---

## 1. Meta Graph API

**Official limits:** Meta uses a dynamic rate limit system based on Business Use Case (BUC) quotas, not fixed numbers. The limits depend on account tier, app type, and recent usage patterns.

### Request limits

| Limit type | Value |
|---|---|
| Page size per call | 500 rows (set via `limit=500` param) |
| Calls per fetch run | 3 (placement, device, region — in parallel via `Promise.allSettled`) |
| Pagination | Automatic — client follows `paging.next` until exhausted |
| Token type | Long-lived user token or system user token (60-day expiry for user tokens) |

### Error handling

| Scenario | Behaviour |
|---|---|
| Any of the 3 calls fails | `Promise.allSettled` captures the rejection; that breakdown returns `[]` |
| All 3 calls fail | No rows inserted for this run; previous snapshot remains in `meta_ad_stats` |
| Partial failure | Successful breakdowns are still inserted; failing ones are logged as `console.warn` |

**Error codes to watch:**
- `#4` — Application request limit reached (reduce call frequency)
- `#17` — User request limit reached (token-level throttle)
- `#80000` — Campaign-level throttle
- `#80001` — Ad account-level throttle
- `#80002` — Ad account or business rate limit reached

### Additional restrictions

- **Token expiry:** User tokens expire in 60 days. System user tokens are permanent but require Business Manager setup. Expired tokens cause all 3 calls to fail silently — monitor logs for `[fetchMeta] placement call failed`.
- **Date range:** Always fetches `last_30d`. Avoid reducing to shorter windows as Meta may return zero rows for very recent dates.
- **Ad account ID:** Must be provided without the `act_` prefix in the `META_AD_ACCOUNT_ID` env var; the code prepends it.

### Retry logic

None implemented. If a call fails, the previous snapshot in `meta_ad_stats` remains active until the next successful hourly run. There is no per-call retry or backoff.

---

## 2. LeadProsper API

### Stats sync limits

| Limit type | Value |
|---|---|
| Calls per fetch run | `2 × N` where N = days elapsed in current month (stats + accounting per day) |
| Parallelism | All days fetched in parallel via `Promise.allSettled` |
| Max calls per run | ~62 (2 calls × 31 days maximum) |
| Frequency | Hourly (plus one call at server startup) |

**Practical maximum monthly call volume from stats sync:**
- At 24 runs/day × ~62 calls = ~1,488 calls/day during a 31-day month.
- Early in the month the count is lower (e.g. day 5 = 10 calls per run).

### Lead delivery limits

LP does not publish explicit rate limits for the ping/post/direct_post endpoints. Limits are enforced per campaign and per supplier account.

| Limit type | Behaviour |
|---|---|
| Duplicate leads | Duplicate suppression is **disabled** — every submission is forwarded to LP so all leads appear in the LP dashboard. LP itself deduplicates on their end. |
| Test mode | Set `LP_TEST_MODE=true` to send leads in test mode (no billing, rejected by buyers) |
| Request timeout | 10 000 ms (configurable via code; AbortController used) |

### Error handling

| Scenario | Behaviour |
|---|---|
| A day's fetch fails | `Promise.allSettled` captures rejection; that day is skipped; others are inserted |
| All days fail | `console.error` logged; no insert; previous snapshot remains |
| LP HTTP 4xx/5xx | Throws with `LeadProsper HTTP {status}`; logged |
| Lead delivery failure | Stored in `QuickHomeFix_leads` with `partner_delivered=0`, `partner_status` = rejection reason |

### Retry logic

None implemented for stats sync. Failed days in the current month will be missing from the snapshot until the next hourly run fetches them again. The current month is always re-fetched in full, so a previously failed day will be included in the next successful run.

For lead delivery: no retry. The ping/post result is final — rejected leads are stored as-is. Resubmission must be done manually.

---

## 3. RedTrack API

### Request limits

RedTrack enforces rate limits that trigger `HTTP 429` when API calls are made concurrently. The implementation uses sequential calls with a configurable delay.

| Limit type | Value |
|---|---|
| Calls per fetch run | 6 (traffic_sources + 5 report calls) |
| Parallelism | **None** — all calls are sequential |
| Delay between calls | 800 ms (default) — configurable via `RT_CALL_DELAY_MS` env var |
| Total time per run | ~5 seconds minimum (6 calls × 800 ms) |
| Date range | Always last 30 days |

**Why sequential:** Parallel RT API calls reliably produce `HTTP 429` errors. Earlier implementation used parallel calls and failed. The current sequential approach with 800 ms delay is stable.

### Error handling

| Scenario | Behaviour |
|---|---|
| Any individual call fails | `console.warn` logged; that call returns `[]`; other calls continue |
| `traffic_sources` fails | `sourcesMap` is empty; lander name resolution falls back to empty string |
| All calls return empty | No insert performed; `console.log('[fetchRedTrack] No data returned')` |
| `HTTP 429` | Caught by the per-call try/catch; that call returns `[]`; increase `RT_CALL_DELAY_MS` if this happens regularly |
| `HTTP 401` | API key invalid or expired — check `REDTRACK_API_KEY` |

### Row deduplication

`redtrack_stats` uses `MergeTree` (not `ReplacingMergeTree`). Each hourly run inserts a new set of rows with a new `fetched_at` timestamp. The `/api/stats/redtrack` endpoint always queries only the latest `fetched_at`:

```sql
SELECT * FROM redtrack_stats
WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats)
```

Old `fetched_at` rows accumulate over time. There is no automatic cleanup — run a manual `DELETE` or `DROP PARTITION` if the table grows too large.

### Additional restrictions

- **Source ID filter:** Only the 7 hardcoded QHF source IDs are relevant. These are embedded in the code (`QHF_SOURCE_IDS` set in `fetchRedTrack.js`). If new RedTrack traffic channels are added they must be added to this set.
- **Offer breakdown:** The `offer` grouping relies on RT's lander/offer configuration. If a lander is not associated with an offer in RT, it will not appear in the offer breakdown and the Landing table will fall back to LP campaign names.
- **RT_CALL_DELAY_MS tuning:** If 429 errors occur, increase `RT_CALL_DELAY_MS` (e.g. to `1500`). If the fetch runs too slowly and starts overlapping with the next hourly cron, consider reducing the number of breakdown calls.

---

## 4. Internal API Rate Limit (Express)

All `/api/` routes on the backend are protected by an Express rate limiter:

| Setting | Value |
|---|---|
| Window | 60 seconds |
| Max requests | 60 per IP per window |
| Headers | Standard rate-limit headers returned (`RateLimit-*`) |
| Scope | Per IP address |

This applies to all internal callers too (the dashboard page). With 6 parallel fetches on page load, a single user is well within the 60 req/min limit.

---

## Summary Table

| API | Calls per hourly run | Parallelism | Retry | Rate limit response |
|---|---|---|---|---|
| Meta Graph | 3 (+ pagination) | Parallel (`Promise.allSettled`) | None | Previous snapshot used until next run |
| LeadProsper stats | 2 × days in month | Parallel per day (`Promise.allSettled`) | None | Failed days re-fetched next run |
| LeadProsper lead | 1 ping + 1 post per submission | Synchronous | None | Lead stored as rejected |
| RedTrack | 6 | Sequential, 800 ms delay | None | Empty breakdown returned |
| Internal (`/api/`) | N/A | N/A | N/A | HTTP 429 after 60 req/min |
