# Thumbtack Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Thumbtack keyword search + business matching into the QuickHomeFix wizard and thank-you page, using a secure backend proxy.

**Architecture:** All Thumbtack API calls are proxied through the existing Express backend (`server.js`). The backend manages OAuth token caching. The wizard gains a new `thumbtack-keywords` step after ZIP entry. The thank-you page replaces upsell cards with Thumbtack business cards fetched after lead submission.

**Tech Stack:** Node.js/Express (ES6 modules), Vanilla JS, Tailwind CSS CDN, axios (already installed)

---

## File Map

| File | Change |
|---|---|
| `backend/.env` | Add 4 Thumbtack env vars |
| `backend/server.js` | Add token manager + GET /api/thumbtack/keywords + POST /api/thumbtack/businesses (before `const PORT`) |
| `frontend/js/store.js` | Add `thumbtackKeyword: ""` to `initialFormData`; insert `"thumbtack-keywords"` after `"zipcode"` in all 7 service flows |
| `frontend/js/tracking.js` | Add `"thumbtack-keywords"` to `stepLabels`; add `fetchThumbTackKeywords()` and `fetchThumbTackBusinesses()` after `submitFullLead`; add `esc()` XSS helper |
| `frontend/get-quotes.html` | Add `step-thumbtack-keywords` HTML div; add `THUMBTACK_SERVICE_QUERIES` map + `renderThumbTackKeywordsStep()` function; add `thumbtack-keywords` branch in `renderCurrentStep()`; replace upsell cards HTML with contractor HTML; replace `buildUpsellCards()` call with `buildThumbTackContractors()`; add `buildThumbTackContractors()` function |

---

## Task 1: Add Thumbtack env vars to backend/.env

**Files:**
- Create/modify: `backend/.env`

> Note: `backend/.env` is git-ignored. If the file doesn't exist yet, create it. If it exists, append these lines.

- [ ] **Step 1: Check if backend/.env exists**

```bash
ls backend/.env 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
```

- [ ] **Step 2: Append the Thumbtack vars**

If the file exists, append to it. If not, create it with these 4 lines (keep any existing content intact):

```
THUMBTACK_CLIENT_ID=bb119518-d6ea-479b-90c5-327a719aa0ee
THUMBTACK_CLIENT_SECRET=YmcIf_wO~etbN0J0sHNwlzpOMz
THUMBTACK_API_BASE=https://staging-api.thumbtack.com
THUMBTACK_AUTH_URL=https://staging-auth.thumbtack.com/oauth2/token
```

- [ ] **Step 3: Verify the vars are present**

```bash
grep "THUMBTACK" backend/.env
```

Expected output:
```
THUMBTACK_CLIENT_ID=bb119518-d6ea-479b-90c5-327a719aa0ee
THUMBTACK_CLIENT_SECRET=YmcIf_wO~etbN0J0sHNwlzpOMz
THUMBTACK_API_BASE=https://staging-api.thumbtack.com
THUMBTACK_AUTH_URL=https://staging-auth.thumbtack.com/oauth2/token
```

- [ ] **Step 4: Commit**

```bash
git add backend/.env 2>/dev/null || true
git commit --allow-empty -m "chore: add Thumbtack env vars to backend config"
```

> Note: If `.env` is git-ignored this commit may have nothing to stage — that's fine. The vars need to be present in the file on the server.

---

## Task 2: Add Thumbtack token manager and proxy routes to server.js

**Files:**
- Modify: `backend/server.js` (insert before the last 5 lines — `const PORT = ...` and `app.listen(...)`)

- [ ] **Step 1: Locate the insertion point**

Open `backend/server.js`. Find line:
```js
const PORT = process.env.PORT || 5000;
```
This is near the end of the file (~line 1518). All new code goes **immediately before** this line.

- [ ] **Step 2: Insert the Thumbtack token manager and routes**

Insert the following block immediately before `const PORT = process.env.PORT || 5000;`:

```js
// ─── Thumbtack OAuth token cache ───────────────────────────────────────────
let _thumbtackToken = null;
let _thumbtackTokenExpiresAt = 0;

async function getThumbTackToken() {
  if (_thumbtackToken && Date.now() < _thumbtackTokenExpiresAt - 60000) {
    return _thumbtackToken;
  }
  const clientId = process.env.THUMBTACK_CLIENT_ID;
  const clientSecret = process.env.THUMBTACK_CLIENT_SECRET;
  const authUrl = process.env.THUMBTACK_AUTH_URL;
  if (!clientId || !clientSecret || !authUrl) {
    throw new Error("Thumbtack credentials not configured");
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await axios.post(
    authUrl,
    new URLSearchParams({ grant_type: "client_credentials", audience: "urn:partner-api" }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    }
  );
  _thumbtackToken = response.data.access_token;
  _thumbtackTokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;
  return _thumbtackToken;
}

// GET /api/thumbtack/keywords?searchQuery=roofing
app.get("/api/thumbtack/keywords", async (req, res) => {
  const { searchQuery } = req.query;
  if (!searchQuery) return res.status(400).json({ error: "searchQuery is required" });
  try {
    const token = await getThumbTackToken();
    const apiBase = process.env.THUMBTACK_API_BASE;
    const response = await axios.get(
      `${apiBase}/api/v4/keywords/search?searchQuery=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      }
    );
    return res.json(response.data);
  } catch (err) {
    console.error("Thumbtack keywords error:", err.message);
    return res.status(500).json({ error: "Failed to fetch Thumbtack keywords" });
  }
});

// POST /api/thumbtack/businesses
app.post("/api/thumbtack/businesses", async (req, res) => {
  const { searchQuery, zipCode } = req.body || {};
  if (!searchQuery || !zipCode) {
    return res.status(400).json({ error: "searchQuery and zipCode are required" });
  }
  try {
    const token = await getThumbTackToken();
    const apiBase = process.env.THUMBTACK_API_BASE;
    const response = await axios.post(
      `${apiBase}/api/v4/businesses/search`,
      { searchQuery, zipCode, utmData: { utm_source: "cma-housecrew" } },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    return res.json(response.data);
  } catch (err) {
    console.error("Thumbtack businesses error:", err.message);
    return res.status(500).json({ error: "Failed to fetch Thumbtack businesses" });
  }
});
// ───────────────────────────────────────────────────────────────────────────
```

- [ ] **Step 3: Restart the backend server**

```bash
cd backend && node server.js &
```

Wait 2 seconds for startup.

- [ ] **Step 4: Test the keywords endpoint**

```bash
curl -s "http://localhost:5000/api/thumbtack/keywords?searchQuery=roofing"
```

Expected: a JSON response from Thumbtack. It should NOT return `"Failed to fetch Thumbtack keywords"`. If you get `"Thumbtack credentials not configured"`, verify Task 1 env vars are saved correctly.

- [ ] **Step 5: Test the businesses endpoint**

```bash
curl -s -X POST "http://localhost:5000/api/thumbtack/businesses" \
  -H "Content-Type: application/json" \
  -d '{"searchQuery":"roofing","zipCode":"90210"}'
```

Expected: a JSON response with business data (or empty results) — not a 500 error.

- [ ] **Step 6: Log the actual response shape and note the field names**

Print the full responses and record:

**Keywords response:**
- Top-level array field: (e.g. `keywords`, `results`, or the response itself is an array)
- Per-item label field: (e.g. `name`, `keyword`, `displayName`, or items are plain strings)

**Businesses response:**
- Top-level array field: (e.g. `businesses`, `results`)
- `name` field name
- Photo URL field: (e.g. `thumbnailUrl`, `photos[0].url`, `imageUrl`)
- Rating field: (e.g. `averageRating`, `rating`)
- Review count field: (e.g. `numberOfReviews`, `reviewCount`)
- Price field: (e.g. `cost`, `priceRange`, `startingCost`)
- Profile URL field: (e.g. `profileUrl`, `url`)

You will use these in Task 5 and Task 6.

- [ ] **Step 7: Kill the test server**

```bash
kill %1 2>/dev/null || pkill -f "node server.js"
```

- [ ] **Step 8: Commit**

```bash
git add backend/server.js
git commit -m "feat: add Thumbtack token manager and proxy routes to backend"
```

---

## Task 3: Update store.js — add thumbtackKeyword + step flows

**Files:**
- Modify: `frontend/js/store.js`

- [ ] **Step 1: Add `thumbtackKeyword` to `initialFormData`**

In `frontend/js/store.js`, find (line 10–11):
```js
  trustedFormToken: "", homePhoneConsentLanguage: "",
};
```

Replace with:
```js
  trustedFormToken: "", homePhoneConsentLanguage: "",
  thumbtackKeyword: "",
};
```

- [ ] **Step 2: Insert `"thumbtack-keywords"` into all 7 service flow step arrays**

Find the `serviceFlows` object (lines 16–24). Replace the entire object with:

```js
const serviceFlows = {
  roof:    { id: "roof",    name: "Roofing Service", initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","roofing-type","material","email","details","name","final","complete"] },
  windows: { id: "windows", name: "Windows Service",  initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","window-type","window-count","email","details","name","final","complete"] },
  solar:   { id: "solar",   name: "Solar Energy",     initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","solar-type","roof-size","email","details","name","final","complete"] },
  bath:    { id: "bath",    name: "Bath Remodeling",   initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","bathroom-wall","email","details","name","final","complete"] },
  gutter:  { id: "gutter",  name: "Gutter Services",   initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","gutter-type","gutter-material","email","details","name","final","complete"] },
  tub:     { id: "tub",     name: "Walk-In Tub",       initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","tub-reason","email","details","name","final","complete"] },
  shower:  { id: "shower",  name: "Walk-In Shower",    initialStep: "zipcode", steps: ["zipcode","thumbtack-keywords","walk","email","details","name","final","complete"] },
};
```

- [ ] **Step 3: Verify the change**

```bash
grep "thumbtack-keywords" frontend/js/store.js | wc -l
```

Expected output: `7`

- [ ] **Step 4: Commit**

```bash
git add frontend/js/store.js
git commit -m "feat: add thumbtackKeyword state and step to all service flows"
```

---

## Task 4: Add Thumbtack API functions to tracking.js

**Files:**
- Modify: `frontend/js/tracking.js`

- [ ] **Step 1: Add `"thumbtack-keywords"` to `stepLabels`**

In `frontend/js/tracking.js`, find (line 18):
```js
  walk: "Walk-In Shower", email: "Email", details: "Address Details",
```

Replace with:
```js
  walk: "Walk-In Shower", "thumbtack-keywords": "Service Type", email: "Email", details: "Address Details",
```

- [ ] **Step 2: Add the `esc()` XSS helper and the two Thumbtack API functions**

Find the end of `submitFullLead` (after its closing `}` around line 303). Add the following block immediately after it:

```js
function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** GET /api/thumbtack/keywords?searchQuery=... */
function fetchThumbTackKeywords(searchQuery) {
  return apiRequest("/api/thumbtack/keywords?searchQuery=" + encodeURIComponent(searchQuery));
}

/** POST /api/thumbtack/businesses — body: { searchQuery, zipCode } */
function fetchThumbTackBusinesses(searchQuery, zipCode) {
  return apiRequest("/api/thumbtack/businesses", {
    method: "POST",
    body: JSON.stringify({ searchQuery: searchQuery, zipCode: zipCode }),
  });
}
```

- [ ] **Step 3: Verify**

```bash
grep -n "fetchThumbTack\|function esc" frontend/js/tracking.js
```

Expected: 3 matches (esc, fetchThumbTackKeywords, fetchThumbTackBusinesses).

- [ ] **Step 4: Commit**

```bash
git add frontend/js/tracking.js
git commit -m "feat: add Thumbtack API functions and XSS escape helper to tracking.js"
```

---

## Task 5: Add thumbtack-keywords wizard step to get-quotes.html

**Files:**
- Modify: `frontend/get-quotes.html`

This task has 3 parts: (A) add the HTML div, (B) add the JS map + render function, (C) wire into `renderCurrentStep`.

### Part A — HTML div

- [ ] **Step 1: Insert the new step HTML**

In `frontend/get-quotes.html`, find the comment:
```html
    <!-- ═══ GENERIC RADIO STEP (reused for all service-specific questions) ═══ -->
```

Insert the following **immediately before** that comment:

```html
    <!-- ═══ THUMBTACK KEYWORDS STEP ═══ -->
    <div id="step-thumbtack-keywords" class="wizard-step">
      <div class="flex justify-center px-4 py-4 sm:py-12">
        <div class="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="progress-bar"><div id="progressThumbTackKeywords" class="progress-bar-fill" style="width:0%"></div></div>
          <div class="p-6 sm:p-8">
            <div class="text-center mb-6">
              <h2 id="thumbTackKeywordsTitle" class="text-lg sm:text-xl font-bold text-gray-900">What type of service do you need?</h2>
              <p class="text-sm text-gray-500 mt-1">Select the option that best matches your project</p>
            </div>
            <div id="thumbTackKeywordsLoading" class="flex justify-center py-8">
              <div class="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div id="thumbTackKeywordsOptions" class="space-y-3" style="display:none;"></div>
          </div>
        </div>
      </div>
    </div>

```

### Part B — JS service map and render function

- [ ] **Step 2: Add the service query map after `radioStepConfigs`**

In `frontend/get-quotes.html`, find the end of the `radioStepConfigs` object:
```js
  "walk": { title: "What type of Walk-In tub", field: "walkinType", event: "types", options: [
    { id: "replace", name: "Replace Walk-In Tub" }, { id: "install", name: "Install Walk-In Tub" }, { id: "repair", name: "Repair Walk-In Tub" }
  ]},
};
```

Add immediately after the closing `};`:

```js
const THUMBTACK_SERVICE_QUERIES = {
  roof:    "roofing",
  windows: "window installation",
  solar:   "solar panels",
  bath:    "bathroom remodeling",
  gutter:  "gutters",
  tub:     "walk-in tub",
  shower:  "walk-in shower",
};

const THUMBTACK_SERVICE_NAMES = {
  roof: "roofing", windows: "windows", solar: "solar",
  bath: "bathroom", gutter: "gutter", tub: "walk-in tub", shower: "walk-in shower",
};

function renderThumbTackKeywordsStep(progress) {
  document.getElementById("step-thumbtack-keywords").classList.add("active");
  document.getElementById("progressThumbTackKeywords").style.width = progress + "%";

  var service = store.formData.service;
  var searchQuery = THUMBTACK_SERVICE_QUERIES[service] || service;
  document.getElementById("thumbTackKeywordsTitle").textContent =
    "What type of " + (THUMBTACK_SERVICE_NAMES[service] || "home") + " service do you need?";

  var loadingEl = document.getElementById("thumbTackKeywordsLoading");
  var optionsEl = document.getElementById("thumbTackKeywordsOptions");
  loadingEl.style.display = "flex";
  optionsEl.style.display = "none";
  optionsEl.innerHTML = "";

  fetchThumbTackKeywords(searchQuery)
    .then(function(data) {
      // Adjust the field names here based on the actual Thumbtack response
      // logged in Task 2 Step 6.
      var rawList = (data && data.keywords) || (data && data.results) || (Array.isArray(data) ? data : []);
      if (!rawList.length) throw new Error("empty");
      loadingEl.style.display = "none";
      optionsEl.style.display = "block";
      rawList.forEach(function(kw) {
        var label = (typeof kw === "string") ? kw : (kw.name || kw.keyword || kw.displayName || "");
        if (!label) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "w-full flex items-center gap-3 px-5 py-4 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors";
        var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("class", "w-5 h-5 text-blue-400 flex-shrink-0");
        icon.setAttribute("fill", "none");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("stroke", "currentColor");
        icon.setAttribute("stroke-width", "2");
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>';
        var span = document.createElement("span");
        span.className = "font-medium text-base text-gray-800";
        span.textContent = label;
        btn.appendChild(icon);
        btn.appendChild(span);
        btn.onclick = function() {
          store.updateFormData("thumbtackKeyword", label);
          store.nextStep();
          renderCurrentStep();
        };
        optionsEl.appendChild(btn);
      });
    })
    .catch(function() {
      store.updateFormData("thumbtackKeyword", searchQuery);
      store.nextStep();
      renderCurrentStep();
    });
}
```

### Part C — Wire into renderCurrentStep

- [ ] **Step 3: Add `thumbtack-keywords` branch to `renderCurrentStep`**

In `frontend/get-quotes.html`, inside `renderCurrentStep()`, find:
```js
  } else if (radioStepConfigs[stepName]) {
    renderRadioStep(stepName, progress);
  }
```

Replace with:
```js
  } else if (stepName === "thumbtack-keywords") {
    renderThumbTackKeywordsStep(progress);
  } else if (radioStepConfigs[stepName]) {
    renderRadioStep(stepName, progress);
  }
```

- [ ] **Step 4: Verify**

```bash
grep -n "thumbtack-keywords\|THUMBTACK_SERVICE_QUERIES\|renderThumbTackKeywordsStep" frontend/get-quotes.html | head -20
```

Expected: at least 4 matches.

- [ ] **Step 5: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat: add thumbtack-keywords wizard step with keyword chip selection"
```

---

## Task 6: Update thank-you page — replace upsell cards with Thumbtack business cards

**Files:**
- Modify: `frontend/get-quotes.html`

### Part A — Replace upsell section HTML

- [ ] **Step 1: Find and replace the upsell cards HTML block**

In `frontend/get-quotes.html`, find:
```html
        <!-- Upsell Services -->
        <div class="w-full max-w-3xl mb-12">
          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-gray-900">Explore Other Services</h3>
            <p class="text-sm text-gray-400 mt-1">Save more by bundling home improvement projects</p>
          </div>
          <div id="upsellCards" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"></div>
        </div>
```

Replace with:
```html
        <!-- Thumbtack Matched Contractors -->
        <div id="thumbtackContractorsSection" class="w-full max-w-3xl mb-12" style="display:none;">
          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-gray-900">Matched Contractors Near You</h3>
            <p class="text-sm text-gray-400 mt-1">Top-rated professionals ready to help with your project</p>
          </div>
          <div id="thumbtackContractors"></div>
        </div>
```

### Part B — Update renderCurrentStep complete branch

- [ ] **Step 2: Replace `buildUpsellCards()` call with `buildThumbTackContractors()`**

In `frontend/get-quotes.html`, find in the `complete` branch of `renderCurrentStep`:
```js
    document.getElementById("completeMessage").textContent = "A specialist will review your " + label + " project and contact you within 24 hours with a free, no-obligation quote.";
    buildUpsellCards();
```

Replace with:
```js
    document.getElementById("completeMessage").textContent = "A specialist will review your " + label + " project and contact you within 24 hours with a free, no-obligation quote.";
    buildThumbTackContractors();
```

### Part C — Add buildThumbTackContractors function

- [ ] **Step 3: Add the function before `switchToService`**

In `frontend/get-quotes.html`, find:
```js
function switchToService(serviceKey, path) {
```

Insert the following **immediately before** it:

```js
function buildThumbTackContractors() {
  var section = document.getElementById("thumbtackContractorsSection");
  var container = document.getElementById("thumbtackContractors");
  if (!section || !container) return;

  var keyword = store.formData.thumbtackKeyword || THUMBTACK_SERVICE_QUERIES[store.formData.service] || store.formData.service || "";
  var zipCode = store.formData.zipcode || "";
  if (!keyword || !zipCode) return;

  section.style.display = "block";

  // Skeleton loaders
  var skeletons = "";
  for (var i = 0; i < 3; i++) {
    skeletons += '<div class="bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex gap-4 animate-pulse">' +
      '<div class="w-20 h-20 rounded-xl bg-gray-200 flex-shrink-0"></div>' +
      '<div class="flex-1 space-y-2 py-1">' +
        '<div class="h-4 bg-gray-200 rounded w-3/4"></div>' +
        '<div class="h-3 bg-gray-200 rounded w-1/2"></div>' +
        '<div class="h-3 bg-gray-200 rounded w-1/3"></div>' +
      '</div>' +
    '</div>';
  }
  container.innerHTML = skeletons;

  fetchThumbTackBusinesses(keyword, zipCode)
    .then(function(data) {
      // Adjust the field names below based on actual Thumbtack response
      // recorded in Task 2 Step 6.
      var businesses = (data && data.businesses) || (data && data.results) || (Array.isArray(data) ? data : []);
      if (!businesses.length) { section.style.display = "none"; return; }

      container.innerHTML = "";
      businesses.forEach(function(biz) {
        var name       = String(biz.name || "");
        var rating     = parseFloat(biz.averageRating || biz.rating || 0);
        var reviews    = parseInt(biz.numberOfReviews || biz.reviewCount || 0, 10);
        var rawPhoto   = String((biz.photos && biz.photos[0] && biz.photos[0].url) || biz.thumbnailUrl || biz.imageUrl || "");
        var rawProfile = String(biz.profileUrl || biz.url || "");
        var price      = String(biz.cost ? ("Starting at $" + biz.cost) : (biz.priceRange || biz.startingCost || ""));

        // Only allow safe http/https URLs to prevent javascript: injection
        var safePhoto   = /^https?:\/\//.test(rawPhoto)   ? rawPhoto   : "";
        var safeProfile = /^https?:\/\//.test(rawProfile) ? rawProfile : "";

        var card = document.createElement("div");
        card.className = "bg-white border border-gray-200 rounded-2xl p-4 mb-4 flex gap-4 hover:shadow-md transition-shadow";

        // Photo
        var photoEl;
        if (safePhoto) {
          photoEl = document.createElement("img");
          photoEl.src = safePhoto;
          photoEl.alt = name;
          photoEl.className = "w-20 h-20 rounded-xl object-cover flex-shrink-0";
        } else {
          photoEl = document.createElement("div");
          photoEl.className = "w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0";
          photoEl.innerHTML = '<svg class="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>';
        }

        // Info column
        var infoEl = document.createElement("div");
        infoEl.className = "flex-1 min-w-0";

        var nameEl = document.createElement("h4");
        nameEl.className = "font-bold text-gray-900 text-base truncate";
        nameEl.textContent = name;

        // Stars
        var starsEl = document.createElement("div");
        starsEl.className = "flex items-center gap-0.5 mt-1";
        for (var s = 0; s < 5; s++) {
          var starSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          starSvg.setAttribute("class", "w-4 h-4 " + (s < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"));
          starSvg.setAttribute("viewBox", "0 0 24 24");
          starSvg.innerHTML = '<path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>';
          starsEl.appendChild(starSvg);
        }
        if (reviews) {
          var reviewSpan = document.createElement("span");
          reviewSpan.className = "text-xs text-gray-400 ml-1";
          reviewSpan.textContent = "(" + reviews + ")";
          starsEl.appendChild(reviewSpan);
        }

        infoEl.appendChild(nameEl);
        infoEl.appendChild(starsEl);

        if (price) {
          var priceEl = document.createElement("p");
          priceEl.className = "text-sm text-gray-500 mt-1";
          priceEl.textContent = price;
          infoEl.appendChild(priceEl);
        }

        if (safeProfile) {
          var linkEl = document.createElement("a");
          linkEl.href = safeProfile;
          linkEl.target = "_blank";
          linkEl.rel = "noopener noreferrer";
          linkEl.className = "inline-flex items-center gap-1 text-blue-600 text-sm font-medium mt-2 hover:underline";
          linkEl.textContent = "View Profile";
          var arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          arrowSvg.setAttribute("class", "w-3 h-3");
          arrowSvg.setAttribute("fill", "none");
          arrowSvg.setAttribute("viewBox", "0 0 24 24");
          arrowSvg.setAttribute("stroke", "currentColor");
          arrowSvg.setAttribute("stroke-width", "2");
          arrowSvg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>';
          linkEl.appendChild(arrowSvg);
          infoEl.appendChild(linkEl);
        }

        card.appendChild(photoEl);
        card.appendChild(infoEl);
        container.appendChild(card);
      });
    })
    .catch(function() {
      section.style.display = "none";
    });
}

```

- [ ] **Step 4: Verify all changes are present**

```bash
grep -n "thumbtackContractors\|buildThumbTackContractors\|buildUpsellCards" frontend/get-quotes.html
```

Confirm:
- `buildThumbTackContractors()` is called in the `complete` branch (not `buildUpsellCards`)
- `thumbtackContractorsSection` and `thumbtackContractors` exist in HTML
- `function buildThumbTackContractors` is defined
- `buildUpsellCards` still exists as a function definition (it's fine to keep — it's just not called)

- [ ] **Step 5: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat: replace upsell cards with Thumbtack matched contractors on thank-you page"
```

---

## Task 7: End-to-end browser test

**Files:** No code changes — verification only.

- [ ] **Step 1: Start the backend**

```bash
cd backend && node server.js
```

- [ ] **Step 2: Open the roofing page in a browser and test the keyword step**

Navigate to the roofing landing page. Enter any valid ZIP (e.g. `90210`) and click through. After the ZIP step, you should see a loading spinner, then 2–6 keyword chips appear.

Expected: chips like "Roof Replacement", "Roof Repair", "Roof Installation"

If you see the spinner briefly and then the next step (roofing-type) loads automatically without chips, the API returned empty — check the backend console for errors.

- [ ] **Step 3: Click a keyword chip and verify state**

Click one chip. Check browser DevTools → Application → Session Storage → `roofing-form-storage` → `formData.thumbtackKeyword`. It should equal the chip label you clicked.

- [ ] **Step 4: Complete the full form and verify the thank-you page**

Fill in roofing-type, material, email, address, name, and phone. Submit.

On the thank-you page:
- The "Thank You!" header, "What Happens Next?" section, and trust badges should all appear as before
- Below them: "Matched Contractors Near You" with a 3-card skeleton loader
- Skeleton resolves to real business cards with name, stars, and (if available) photo + price + profile link

- [ ] **Step 5: Verify graceful failure**

1. Temporarily change `THUMBTACK_CLIENT_ID` in `backend/.env` to an invalid value, restart backend
2. Go through the wizard again with any ZIP
3. On the keyword step: spinner appears, then the wizard silently skips to the next step — no error shown
4. On the thank-you page: the contractors section is hidden — no broken UI
5. Restore the correct `THUMBTACK_CLIENT_ID` and restart backend

- [ ] **Step 6: Test 2 more services**

Quickly run through `solar` and `bath` to confirm the keyword step fires with the correct search query for each service.

---

## Appendix: Adjusting for actual Thumbtack response shape

After running Task 2 Step 6, if the actual response fields differ, update these two locations:

**In `renderThumbTackKeywordsStep` (get-quotes.html, Task 5 Part B):**
```js
var rawList = (data && data.keywords) || (data && data.results) || (Array.isArray(data) ? data : []);
```
Change `data.keywords` / `data.results` to the actual top-level array field.

```js
var label = (typeof kw === "string") ? kw : (kw.name || kw.keyword || kw.displayName || "");
```
Change to the actual per-item label field.

**In `buildThumbTackContractors` (get-quotes.html, Task 6 Part C):**
```js
var businesses = (data && data.businesses) || (data && data.results) || (Array.isArray(data) ? data : []);
```
Change to the actual array field.

Then update the individual field reads (`biz.name`, `biz.averageRating`, etc.) to match the actual property names from the Thumbtack response.
