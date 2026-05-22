# Bathroom Hub Flow Design
**Date:** 2026-05-22

## Overview

Add a new entry URL `/get-quotes/bathroom` that collects the user's ZIP code first, then presents a service-selection screen with 3 options. Clicking a service uses the existing `switchService()` mechanism to route into the correct flow. No existing flows are modified.

---

## Flow

```
/get-quotes/bathroom
  → step: zipcode          (existing step-zipcode block)
  → step: service-selection (new DOM block)
      [Bathroom Remodeling] → switchService("bath")   → bathroom-wall → email → details → name → final → complete
      [Walk-in Tub]         → switchService("tub")    → tub-reason   → email → details → name → final → complete
      [Walk-in Shower]      → switchService("shower") → walk          → email → details → name → final → complete
```

`switchService()` skips the zipcode step automatically since the ZIP is already filled, so clicking a button lands the user directly at the first service-specific question.

The lead submitted to LeadProsper has `service: "bath"` / `"tub"` / `"shower"` (not `"bathroom"`) — delivery pipeline unchanged.

---

## Changes

### 1. `frontend/js/store.js`

Add `bathroom` to `serviceFlows`:

```js
bathroom: {
  id: "bathroom",
  name: "Bathroom Services",
  initialStep: "zipcode",
  steps: ["zipcode", "service-selection"]
}
```

No other changes to `store.js`. `isValidService()`, `nextStep()`, `getProgress()`, and `switchService()` all work as-is.

### 2. `frontend/get-quotes.html` — new HTML step

Add a new `div#step-service-selection` block inside `#wizardMain`, after the existing `step-zipcode` block:

```
┌─────────────────────────────────────┐
│  Let's get started!                 │
│                                     │
│  What type of service do you need?  │
│                                     │
│  [  Bathroom Remodeling          ]  │
│  [  Walk-in Tub                  ]  │
│  [  Walk-in Shower               ]  │
└─────────────────────────────────────┘
```

- No progress bar on this step (consistent with the `complete` step).
- Trust badge hidden on this step (add `"service-selection"` to the existing trust badge hide condition).
- Clicking a button calls `store.switchService(serviceId)` then `renderCurrentStep()` — no "Next" button needed.
- Button style: full-width blue buttons matching the screenshot aesthetic.

### 3. `frontend/get-quotes.html` — `renderCurrentStep()`

Add one new `else if` branch:

```js
} else if (stepName === "service-selection") {
  document.getElementById("step-service-selection").classList.add("active");
  // no progress bar update needed
}
```

Update the trust badge hide condition (currently `stepName === "complete" || stepName === "service-selection"`).

### 4. Backend (`backend/server.js`)

No changes needed. The `/get-quotes/*` wildcard route already serves `get-quotes.html` for any service path including `/get-quotes/bathroom`.

---

## What is NOT changed

- Existing `/get-quotes/bath`, `/get-quotes/tub`, `/get-quotes/shower` flows — untouched.
- `radioStepConfigs` — untouched.
- LeadProsper delivery logic — untouched.
- Analytics / tracking — untouched (events fire normally once inside the actual service flow).
- `serviceLandingData` — no landing page for `bathroom` hub (goes straight to wizard).

---

## Acceptance Criteria

1. Navigating to `/get-quotes/bathroom` shows the ZIP code step.
2. Entering a valid ZIP and clicking Next shows the 3-button service selection screen.
3. Clicking "Bathroom Remodeling" routes to the `bathroom-wall` question.
4. Clicking "Walk-in Tub" routes to the `tub-reason` question.
5. Clicking "Walk-in Shower" routes to the `walk` question.
6. Completing any flow submits a lead with the correct `service` value (`bath`, `tub`, or `shower`).
7. Back button from service-selection returns to the ZIP step.
8. Navigating directly to `/get-quotes/bath`, `/get-quotes/tub`, `/get-quotes/shower` still works as before.
