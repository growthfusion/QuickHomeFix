# Thumbtack API Integration Design

**Date:** 2026-04-24  
**Status:** Approved  
**Scope:** Integrate Thumbtack keyword search + business search into the QuickHomeFix multi-step wizard and thank-you page

---

## Overview

Add Thumbtack contractor matching to the existing QuickHomeFix lead-gen wizard. After a user selects a service and enters their ZIP code, they pick a Thumbtack-sourced keyword describing their specific need. After the lead is submitted, the thank-you page displays matched Thumbtack businesses instead of the current upsell cards.

---

## Full User Flow

```
Landing page: user clicks service button (e.g. "Roofing")
        ↓
Wizard Step 1: ZIP code entry (existing)
        ↓
Wizard Step 2 (NEW): Thumbtack keyword chips
  - Backend fetches GET /api/v4/keywords/search?searchQuery={serviceName}
  - Shows 2–6 keyword chips (e.g. "Roof Replacement", "Roof Repair")
  - User clicks one → stored as thumbtackKeyword, auto-advances
  - On API failure → silently skips, stores service name as fallback
        ↓
Wizard Steps 3–N: existing steps (service questions, email, address, name, phone)
        ↓
Lead submitted to LeadProsper (existing, unchanged)
        ↓
Thank You page:
  - Existing: success message, "What Happens Next?", trust badges (unchanged)
  - REPLACED: upsell cards → "Matched Contractors Near You" section
  - Backend fetches POST /api/v4/businesses/search with {thumbtackKeyword, zipCode}
  - Shows skeleton loader while fetching
  - Renders business cards (photo, name, rating, price, profile link)
  - On failure → section hidden, rest of page unaffected
```

---

## Architecture

### Backend Changes — server.js

**Token Manager (module-level)**
- In-memory cache: `{ token, expiresAt }`
- Before every Thumbtack call: check if `Date.now() < expiresAt - 60000`
- If expired/missing: POST to Thumbtack auth URL with Basic auth (client_id:client_secret), `grant_type=client_credentials`, `audience=urn:partner-api`
- Cache new token with its `expires_in` value

**New Routes**

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/thumbtack/keywords` | Proxy to `GET /api/v4/keywords/search?searchQuery={query}` |
| POST | `/api/thumbtack/businesses` | Proxy to `POST /api/v4/businesses/search` with `utmData` appended |

Both routes:
- Call `getThumbTackToken()` before each request
- Return Thumbtack's response as-is
- Return `500` with `{ error: "..." }` on failure (frontend handles gracefully)
- Subject to existing `/api/` rate limiting (60 req/min/IP)

**New Environment Variables (backend/.env)**
```
THUMBTACK_CLIENT_ID=bb119518-d6ea-479b-90c5-327a719aa0ee
THUMBTACK_CLIENT_SECRET=YmcIf_wO~etbN0J0sHNwlzpOMz
THUMBTACK_API_BASE=https://staging-api.thumbtack.com
THUMBTACK_AUTH_URL=https://staging-auth.thumbtack.com/oauth2/token
```

---

### Frontend Changes

#### store.js
- Add `thumbtackKeyword: ""` to form data defaults
- Setter called when user picks a chip or when step is auto-skipped

#### tracking.js (new API functions)
- `fetchThumbTackKeywords(searchQuery)` — GET `/api/thumbtack/keywords?searchQuery={query}`
- `fetchThumbTackBusinesses(searchQuery, zipCode)` — POST `/api/thumbtack/businesses` with `{ searchQuery, zipCode }`. The backend appends `utmData: { utm_source: "cma-housecrew" }` before forwarding to Thumbtack — the frontend does not send utmData.

#### get-quotes.html — Step sequence changes
Insert `"thumbtack-keywords"` after `"zipcode"` in all 7 service flows:

```js
// Before:
["zipcode", "roofing-type", "material", "email", ...]
// After:
["zipcode", "thumbtack-keywords", "roofing-type", "material", "email", ...]
```

Applied to: roofing, windows, solar, bath, gutter, tub, shower flows.

#### get-quotes.html — New step HTML: `step-thumbtack-keywords`
- Header: "What type of [service] do you need?"
- **On step render:** immediately fires `fetchThumbTackKeywords(serviceSearchQuery)` using the service→searchQuery mapping
- Loading state: spinner shown while fetch is in flight
- Keyword chips: rendered from API response, same visual style as existing radio buttons
- Clicking a chip: calls `store.updateFormData('thumbtackKeyword', keyword)` then `store.nextStep()`
- API failure or empty result: calls `store.updateFormData('thumbtackKeyword', serviceNameFallback)` then `store.nextStep()` silently with no visible error

#### get-quotes.html — Thank You page (`step-complete`)
- **Remove:** current upsell cards grid (5 service promotion cards)
- **Add:** "Matched Contractors Near You" section
  - On step render: call `fetchThumbTackBusinesses(thumbtackKeyword, zipCode)`
  - While loading: 3 skeleton placeholder cards (pulsing animation)
  - On success: render business cards
  - On failure/empty: hide section entirely, no error message shown to user

**Business Card Layout:**
```
[ photo ] | Business Name (bold)
          | ★★★★☆ 4.2  (128 reviews)
          | Starting at $X  OR  price range
          | [View Profile →]
```

---

## Service → searchQuery Mapping

| Service slug | Thumbtack searchQuery |
|---|---|
| roofing | `roofing` |
| windows | `window installation` |
| solar | `solar panels` |
| bath | `bathroom remodeling` |
| gutter | `gutters` |
| tub | `walk-in tub` |
| shower | `walk-in shower` |

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Keyword API fails during wizard | Auto-skip step, store service name as keyword, continue |
| Keyword API returns empty list | Auto-skip step, store service name as keyword, continue |
| Business API fails on thank-you page | Hide contractor section, rest of page unaffected |
| Business API returns 0 results | Hide contractor section silently |
| Token fetch fails | Both proxy routes return 500; frontend handles per above rules |

---

## What Is NOT Changing

- Lead submission to LeadProsper — unchanged
- Email/phone verification — unchanged
- ClickHouse analytics logging — unchanged
- Google Places address autocomplete — unchanged
- All existing service-specific wizard questions — unchanged
- Thank-you page: success message, "What Happens Next?", trust badges — unchanged
- All tracking (GTM, Snap Pixel, TrustedForm, Redtrack) — unchanged

---

## Files to Modify

| File | Change |
|---|---|
| `backend/server.js` | Add token manager + 2 new proxy routes |
| `backend/.env` | Add 4 Thumbtack env vars |
| `frontend/js/store.js` | Add `thumbtackKeyword` to form state defaults |
| `frontend/js/tracking.js` | Add `fetchThumbTackKeywords()` and `fetchThumbTackBusinesses()` |
| `frontend/get-quotes.html` | Add keyword step HTML, update step flows, update thank-you section |
