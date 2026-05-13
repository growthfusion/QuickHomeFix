# Meta Pixel Standard Events — GTM-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fire all Meta Pixel standard events (ViewContent, Subscribe, Contact, Lead, Purchase) through GTM — zero direct `fbq()` calls added to code — so Meta Events Manager shows Standard events with no warning triangle.

**Architecture:** Code pushes named events to GTM's `dataLayer`. GTM has a Custom Event Trigger per event + a Meta Pixel Custom HTML Tag per trigger. Each tag calls `fbq('track', 'StandardEventName', {...})` using GTM Data Layer Variables for dynamic parameters. One small code change adds the `service` field to existing dataLayer pushes, and one new `qhf_purchase` push is added for the complete step.

**Tech Stack:** Google Tag Manager, Meta Pixel (`fbq`), Vanilla JS (`dataLayer`)

---

## How It All Works (Read This First)

```
User action
  → JS code pushes to dataLayer  (event: "zipcode", service: "bath", ...)
    → GTM Custom Event Trigger fires  (listens for event name "zipcode")
      → GTM Tag runs Custom HTML  (calls fbq('track', 'ViewContent', {...}))
        → Meta Pixel receives STANDARD event ✅
```

Currently GTM has tags that call `fbq('trackCustom', eventName)` — that's why you see Custom events. We replace those tags with ones that call `fbq('track', 'StandardName', {...})`.

---

## Full Event Map

| User action | dataLayer event | GTM Trigger name | GTM Tag name | Meta Standard Event | Parameters |
|---|---|---|---|---|---|
| Enter zip code | `zipcode` | `CE - zipcode` | `Meta - ViewContent` | `ViewContent` | `content_category: service` |
| Enter address | `AddressDetails` | `CE - AddressDetails` | `Meta - Subscribe` | `Subscribe` | `content_category: service` |
| Enter name | `name` | `CE - name` | `Meta - Contact` | `Contact` | _(none)_ |
| Enter phone → submit | `metaLead` | `CE - metaLead` | `Meta - Lead` | `Lead` | `content_category: service` |
| Thank-you page shown | `qhf_purchase` | `CE - qhf_purchase` | `Meta - Purchase` | `Purchase` | `content_type: service, value: 0, currency: USD` |
| Email entered | `email` | `CE - email` | `Meta - email` (optional) | _(create GTM tag only if you want to track email)_ | `content_category: service` |
| Radio steps (types/services) | `types` / `services` | **No change** | — | _(intentionally custom/ignored)_ | — |

---

## Files

**Modify (code — minimal):**
- `frontend/js/tracking.js` — **no changes needed**
- `frontend/get-quotes.html`:
  - Lines ~798 and ~953 — replace `trackMetaEvent("zipcode", ...)` with direct `window.dataLayer.push({event:"zipcode", service:..., ...})`
  - Lines ~998, ~1007 — replace `trackMetaEvent("email", ...)` with direct `window.dataLayer.push({event:"email", service:..., ...})`
  - Line ~1085 — replace `trackMetaEvent("AddressDetails", ...)` with direct `window.dataLayer.push({event:"AddressDetails", service:..., ...})`
  - Line ~1116 — replace `trackMetaEvent("name", ...)` with direct `window.dataLayer.push({event:"name", service:..., ...})`
  - Line ~1150 — **remove** `trackMetaEvent("PhoneNumber", ...)` (Lead fires via metaLead already)
  - Line ~890 (complete step) — **add** new `qhf_purchase` dataLayer push

**Configure (GTM — the main work):**
- 1 GTM Data Layer Variable: `DLV - service`
- 5 GTM Custom Event Triggers
- 5 GTM Tags (Meta Pixel Custom HTML)
- Fix 1 existing broken tag (`ViewContent_Bath`)

---

## Task 1: Code — Replace `trackMetaEvent` Calls with Direct `dataLayer.push` (Includes `service`)

**Why:** GTM needs `service` in each dataLayer push to use as `content_category`/`content_type` in Meta Pixel tags. The `trackMetaEvent()` helper doesn't include `service`. Replace each call with a direct `window.dataLayer.push({...})` that explicitly includes `service`. No changes to `tracking.js` needed.

**Files:**
- Modify: `frontend/get-quotes.html` lines ~798, ~953, ~998, ~1007, ~1085, ~1116

---

- [ ] **Step 1: Replace zipcode in `startWizardFromLanding` (~line 798)**

Find:
```js
trackMetaEvent("zipcode", "Enter Your Zip Code", zip, "zipcode");
```

Replace:
```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "zipcode",
  service: store.formData.service || currentLandingService || "",
  question_id: "zipcode",
  question_text: "Enter Your Zip Code",
  answer_text: zip
});
```

- [ ] **Step 2: Replace zipcode in `submitZipcode` (~line 953)**

Find:
```js
trackMetaEvent("zipcode", "Enter Your Zip Code", zip);
```

Replace:
```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "zipcode",
  service: store.formData.service || "",
  question_id: "zipcode",
  question_text: "Enter Your Zip Code",
  answer_text: zip
});
```

- [ ] **Step 3: Replace email in success path of `submitEmail` (~line 998)**

Find:
```js
store.updateFormData("email", email);
trackMetaEvent("email", "Please Enter Your Email", email);
```

Replace:
```js
store.updateFormData("email", email);
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "email",
  service: store.formData.service || "",
  question_text: "Please Enter Your Email",
  answer_text: email
});
```

- [ ] **Step 4: Replace email in catch/fallback of `submitEmail` (~line 1007)**

Find:
```js
store.updateFormData("email", email);
trackMetaEvent("email", "Please Enter Your Email", email);
```

Replace:
```js
store.updateFormData("email", email);
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "email",
  service: store.formData.service || "",
  question_text: "Please Enter Your Email",
  answer_text: email
});
```

- [ ] **Step 5: Replace address in `submitDetails` (~line 1085)**

Find:
```js
trackMetaEvent("AddressDetails", "Property Address", addr+", "+city+", "+state+" "+zip);
```

Replace:
```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "AddressDetails",
  service: store.formData.service || "",
  question_text: "Property Address",
  answer_text: addr+", "+city+", "+state+" "+zip
});
```

- [ ] **Step 6: Replace name in `submitName` (~line 1116)**

Find:
```js
trackMetaEvent("name", "Enter Your Name", fn+" "+ln);
```

Replace:
```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: "name",
  service: store.formData.service || "",
  question_text: "Enter Your Name",
  answer_text: fn+" "+ln
});
```

- [ ] **Step 7: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat(pixel): replace trackMetaEvent calls with direct dataLayer.push including service field"
```

---

## Task 2: Code — Remove `trackMetaEvent("PhoneNumber", ...)` Call

**Why:** `PhoneNumber` is redundant — `submitFullLead()` already pushes `metaLead` to the dataLayer, and GTM maps that to `fbq('track', 'Lead')`. The `PhoneNumber` custom event just duplicates the signal with a wrong name.

**Files:**
- Modify: `frontend/get-quotes.html` line ~1150

- [ ] **Step 1: Remove PhoneNumber call in `doLeadSubmit` (~line 1150)**

Find:
```js
function doLeadSubmit(phone, btn) {
  trackMetaEvent("PhoneNumber", "Enter Your Phone Number", phone);

  // Submit the lead to backend
  submitFullLead(store.formData)
```

Replace:
```js
function doLeadSubmit(phone, btn) {
  // Lead fires via submitFullLead → metaLead dataLayer push → GTM → fbq('track','Lead')
  submitFullLead(store.formData)
```

- [ ] **Step 2: Verify — grep `get-quotes.html` for any remaining `trackMetaEvent(` calls**

Expected remaining calls after Task 1 + Task 2:
- `trackMetaEvent(config.event, ...)` × 1 inside `submitRadioStep` — radio steps only, intentionally untouched

All other calls should now be direct `window.dataLayer.push({...})` blocks.

- [ ] **Step 3: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat(pixel): remove PhoneNumber trackMetaEvent — Lead fires via metaLead"
```

---

## Task 3: Code — Add `qhf_purchase` Push on Complete Step

**Why:** The complete/thank-you step currently fires no Meta event. We need to push `qhf_purchase` to the dataLayer when the user reaches it so GTM can fire a `Purchase` standard event. Uses a one-time flag to prevent double-firing if `renderCurrentStep` runs again.

**Files:**
- Modify: `frontend/get-quotes.html` lines ~884–891

- [ ] **Step 1: Find the complete-step block inside `renderCurrentStep`**

Find:
```js
  } else if (stepName === "complete") {
    document.getElementById("step-complete").classList.add("active");
    backBtn.style.display = "none";
    var svcMap = { windows:"window", solar:"solar energy", bath:"bath remodeling", gutter:"gutter service", shower:"walk-in shower", tub:"walk-in tub" };
    var label = svcMap[store.formData.service] || "roofing";
    document.getElementById("completeMessage").textContent = "A specialist will review your " + label + " project and contact you within 24 hours with a free, no-obligation quote.";
    buildThumbTackContractors();
  } else if (radioStepConfigs[stepName]) {
```

Replace:
```js
  } else if (stepName === "complete") {
    document.getElementById("step-complete").classList.add("active");
    backBtn.style.display = "none";
    var svcMap = { windows:"window", solar:"solar energy", bath:"bath remodeling", gutter:"gutter service", shower:"walk-in shower", tub:"walk-in tub" };
    var label = svcMap[store.formData.service] || "roofing";
    document.getElementById("completeMessage").textContent = "A specialist will review your " + label + " project and contact you within 24 hours with a free, no-obligation quote.";
    buildThumbTackContractors();
    if (!store.state.purchaseFired) {
      store.state.purchaseFired = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "qhf_purchase",
        service: store.formData.service || "",
        content_type: store.formData.service || "",
        value: 0,
        currency: "USD"
      });
    }
  } else if (radioStepConfigs[stepName]) {
```

- [ ] **Step 2: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat(pixel): push qhf_purchase to dataLayer on complete step for GTM Purchase tag"
```

---

## Task 4: GTM — Create Data Layer Variable `DLV - service`

**Why:** GTM Tags need to read `service` from the dataLayer to pass as `content_category` / `content_type` to Meta Pixel. This variable does that.

**Steps (do in GTM UI — gtm.google.com):**

- [ ] **Step 1: Go to your GTM Container → Variables → User-Defined Variables → New**

- [ ] **Step 2: Configure the variable**

```
Variable Type:  Data Layer Variable
Variable Name:  DLV - service
Data Layer Variable Name:  service
Data Layer Version:  Version 2
Default Value:  (leave blank)
```

Click **Save** — name it exactly: `DLV - service`

---

## Task 5: GTM — Create All 5 Custom Event Triggers

**Why:** GTM needs a trigger for each dataLayer event name. Each trigger listens for exactly one event and fires the corresponding Meta tag.

**Steps (do in GTM UI → Triggers → New for each):**

- [ ] **Trigger 1: CE - zipcode**
```
Trigger Type:   Custom Event
Event Name:     zipcode
Fires On:       All Custom Events
Name:           CE - zipcode
```

- [ ] **Trigger 2: CE - AddressDetails**
```
Trigger Type:   Custom Event
Event Name:     AddressDetails
Fires On:       All Custom Events
Name:           CE - AddressDetails
```

- [ ] **Trigger 3: CE - name**
```
Trigger Type:   Custom Event
Event Name:     name
Fires On:       All Custom Events
Name:           CE - name
```

- [ ] **Trigger 4: CE - metaLead**

> Check if this trigger already exists — search your existing triggers for `metaLead`. If it exists, just note its name. If not, create:
```
Trigger Type:   Custom Event
Event Name:     metaLead
Fires On:       All Custom Events
Name:           CE - metaLead
```

- [ ] **Trigger 5: CE - email** _(optional — only if you want to track email in Meta)_
```
Trigger Type:   Custom Event
Event Name:     email
Fires On:       All Custom Events
Name:           CE - email
```

- [ ] **Trigger 6: CE - qhf_purchase**
```
Trigger Type:   Custom Event
Event Name:     qhf_purchase
Fires On:       All Custom Events
Name:           CE - qhf_purchase
```

---

## Task 6: GTM — Create 5 Meta Pixel Tags (Custom HTML)

**Why:** Each tag calls the correct `fbq('track', 'StandardEventName', {...})`. We use Custom HTML tags because they give full control over the fbq call and its parameters.

**Steps (GTM UI → Tags → New for each):**

---

- [ ] **Tag 1: Meta - ViewContent** (fires on zipcode step)

```
Tag Type:       Custom HTML
Tag Name:       Meta - ViewContent
HTML:
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      content_category: '{{DLV - service}}',
      content_name: '{{DLV - service}}'
    });
  }
</script>
Firing Trigger: CE - zipcode
```

---

- [ ] **Tag 2: Meta - Subscribe** (fires on address step)

```
Tag Type:       Custom HTML
Tag Name:       Meta - Subscribe
HTML:
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'Subscribe', {
      content_category: '{{DLV - service}}'
    });
  }
</script>
Firing Trigger: CE - AddressDetails
```

---

- [ ] **Tag 3: Meta - Contact** (fires on name step)

```
Tag Type:       Custom HTML
Tag Name:       Meta - Contact
HTML:
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'Contact');
  }
</script>
Firing Trigger: CE - name
```

---

- [ ] **Tag 4: Meta - Lead** (fires on phone submit)

> Check if this tag already exists — search your tags for `metaLead` or `Lead`. If yes, check if it calls `fbq('track', 'Lead', ...)`. If it already works correctly (Lead shows as standard in Events Manager), leave it alone. If not, create or fix:

```
Tag Type:       Custom HTML
Tag Name:       Meta - Lead
HTML:
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', {
      content_category: '{{DLV - service}}',
      content_name: '{{DLV - service}} lead'
    });
  }
</script>
Firing Trigger: CE - metaLead
```

---

- [ ] **Tag 5: Meta - Purchase** (fires on complete/thank-you step)

```
Tag Type:       Custom HTML
Tag Name:       Meta - Purchase
HTML:
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'Purchase', {
      content_type: '{{DLV - service}}',
      value: 0,
      currency: 'USD'
    });
  }
</script>
Firing Trigger: CE - qhf_purchase
```

---

## Task 7: GTM — Fix Broken `ViewContent_Bath` Tag

**Why:** `ViewContent_Bath` shows as a Custom event because the tag calls `fbq('trackCustom', 'ViewContent_Bath', ...)` instead of `fbq('track', 'ViewContent', ...)`. The `_Bath` suffix makes it custom — Meta does not recognise it as standard. Fix it to call the proper standard event with `content_category: 'bath'`.

- [ ] **Step 1: Find the existing tag in GTM**

In GTM → Tags, search for `ViewContent_Bath` or `ViewContent`. Open the tag.

- [ ] **Step 2: Check what it currently calls**

It likely contains:
```js
fbq('trackCustom', 'ViewContent_Bath', { ... });
```

- [ ] **Step 3: Replace the HTML content with:**

```html
<script>
  if (typeof fbq === 'function') {
    fbq('track', 'ViewContent', {
      content_category: 'bath'
    });
  }
</script>
```

Note: Change `trackCustom` → `track` and `ViewContent_Bath` → `ViewContent`.

- [ ] **Step 4: Save the tag**

---

## Task 8: GTM — Delete or Disable Old Broken Tags

**Why:** If GTM has existing tags for `email`, `PhoneNumber`, `zipcode`, `AddressDetails`, `name` that call `fbq('trackCustom', ...)`, they will keep firing custom events even after code changes. Find and delete/pause them.

- [ ] **Step 1: In GTM → Tags, search for each name:**
  - `email` or `Email`
  - `PhoneNumber` or `Phone`
  - `zipcode` or `Zipcode`
  - `AddressDetails` or `Address`
  - `name` or `Name`

- [ ] **Step 2: For each found tag, check if it calls `fbq('trackCustom', ...)`**

If yes → either **Delete** the tag or **Pause** it (3-dot menu → Pause).

> Do NOT delete the `metaLead` / Lead tag — that one should already be working correctly.

---

## Task 9: GTM — Publish Container

- [ ] **Step 1: In GTM, click Submit (top right)**

- [ ] **Step 2: Add a version name**
```
Version Name:    Meta Pixel Standard Events — ViewContent, Subscribe, Contact, Lead, Purchase
```

- [ ] **Step 3: Click Publish**

---

## Task 10: Test in Meta Events Manager

- [ ] **Step 1: Open Meta Events Manager → Test Events tab → select Website → enter your URL**

- [ ] **Step 2: Walk through the full form funnel and verify each event**

| Step | Expected Event | Expected: Standard (no triangle) |
|---|---|---|
| Enter zip code | `ViewContent` | ✅ |
| Select service type | Custom (intentional, no tag) | — |
| Enter address | `Subscribe` | ✅ |
| Enter name | `Contact` | ✅ |
| Enter phone + submit | `Lead` | ✅ |
| Thank-you page | `Purchase` | ✅ |
| Bath service pages | `ViewContent` (not `ViewContent_Bath`) | ✅ |

- [ ] **Step 3: Confirm no warning triangles on any of the above 6 events**

- [ ] **Step 4: Final code commit if any last tweaks**

```bash
git add frontend/get-quotes.html frontend/js/tracking.js
git commit -m "feat(pixel): GTM-based standard Meta Pixel events fully wired — ViewContent, Subscribe, Contact, Lead, Purchase"
```

---

## Quick Reference — What GTM Object You're Creating

```
GTM Container
├── Variables
│   └── DLV - service          (Data Layer Variable → "service" key)
│
├── Triggers
│   ├── CE - zipcode            (Custom Event → "zipcode")
│   ├── CE - AddressDetails     (Custom Event → "AddressDetails")
│   ├── CE - name               (Custom Event → "name")
│   ├── CE - metaLead           (Custom Event → "metaLead")  ← may already exist
│   └── CE - qhf_purchase       (Custom Event → "qhf_purchase")
│
└── Tags
    ├── Meta - ViewContent      → fbq('track','ViewContent',{content_category:service})
    ├── Meta - Subscribe        → fbq('track','Subscribe',{content_category:service})
    ├── Meta - Contact          → fbq('track','Contact')
    ├── Meta - Lead             → fbq('track','Lead',{content_category:service})  ← may already exist
    ├── Meta - Purchase         → fbq('track','Purchase',{content_type:service,...})
    └── [Fix] ViewContent_Bath  → fbq('track','ViewContent',{content_category:'bath'})
```
