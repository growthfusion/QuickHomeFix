# Bathroom Hub Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/get-quotes/bathroom` as a new entry URL that shows ZIP code first, then a 3-button service-selection screen (Bathroom Remodeling / Walk-in Tub / Walk-in Shower) that routes into the correct existing flow via `store.switchService()`.

**Architecture:** Add `bathroom` to `serviceFlows` in store.js with steps `["zipcode", "service-selection"]`. Add a new `#step-service-selection` DOM block in get-quotes.html. Add one `else if` branch in `renderCurrentStep()` and one `selectBathroomService()` helper function. Clicking a service button calls `store.switchService(id)` which rewrites `service`, skips already-filled steps (zipcode), and lands the user at the first service-specific question. Trust badge already hides for `service-selection` (line 831 of get-quotes.html already handles this).

**Tech Stack:** Vanilla JavaScript, HTML, Tailwind CSS (CDN)

---

## File Map

| File | Change |
|------|--------|
| `frontend/js/store.js` | Add `bathroom` entry to `serviceFlows` (line 28, after `shower`) |
| `frontend/get-quotes.html` | Add `#step-service-selection` HTML block after `#step-zipcode` (after line 251) |
| `frontend/get-quotes.html` | Add `else if (stepName === "service-selection")` branch in `renderCurrentStep()` (before line 885) |
| `frontend/get-quotes.html` | Add `selectBathroomService()` function in the `<script>` block |

---

## Task 1: Add `bathroom` to serviceFlows in store.js

**Files:**
- Modify: `frontend/js/store.js:28`

- [ ] **Step 1: Open store.js and find the serviceFlows object**

The relevant section is at lines 21–29:
```js
const serviceFlows = {
  roof:    { id: "roof",    name: "Roofing Service", initialStep: "zipcode", steps: ["zipcode","roofing-type","material","email","details","name","final","complete"] },
  windows: { id: "windows", name: "Windows Service",  initialStep: "zipcode", steps: ["zipcode","window-type","window-count","email","details","name","final","complete"] },
  solar:   { id: "solar",   name: "Solar Energy",     initialStep: "zipcode", steps: ["zipcode","solar-type","roof-size","email","details","name","final","complete"] },
  bath:    { id: "bath",    name: "Bath Remodeling",   initialStep: "zipcode", steps: ["zipcode","bathroom-wall","email","details","name","final","complete"] },
  gutter:  { id: "gutter",  name: "Gutter Services",   initialStep: "zipcode", steps: ["zipcode","gutter-type","gutter-material","email","details","name","final","complete"] },
  tub:     { id: "tub",     name: "Walk-In Tub",       initialStep: "zipcode", steps: ["zipcode","tub-reason","email","details","name","final","complete"] },
  shower:  { id: "shower",  name: "Walk-In Shower",    initialStep: "zipcode", steps: ["zipcode","walk","email","details","name","final","complete"] },
};
```

- [ ] **Step 2: Add the `bathroom` entry after the `shower` line**

Replace:
```js
  shower:  { id: "shower",  name: "Walk-In Shower",    initialStep: "zipcode", steps: ["zipcode","walk","email","details","name","final","complete"] },
};
```

With:
```js
  shower:   { id: "shower",   name: "Walk-In Shower",    initialStep: "zipcode", steps: ["zipcode","walk","email","details","name","final","complete"] },
  bathroom: { id: "bathroom", name: "Bathroom Services", initialStep: "zipcode", steps: ["zipcode","service-selection"] },
};
```

- [ ] **Step 3: Verify `isValidService("bathroom")` returns true**

Open browser console on any page that loads `store.js` and run:
```js
isValidService("bathroom")  // expected: true
isValidService("bath")      // expected: true (existing still works)
```

- [ ] **Step 4: Commit**

```bash
git add frontend/js/store.js
git commit -m "feat: add bathroom hub service flow to store"
```

---

## Task 2: Add service-selection HTML step to get-quotes.html

**Files:**
- Modify: `frontend/get-quotes.html` (after line 251, inside `#wizardMain`)

- [ ] **Step 1: Find the insertion point**

Locate the closing `</div>` of `#step-zipcode` at line 251:
```html
    </div>
    </div>

    <!-- ═══ GENERIC RADIO STEP (reused for all service-specific questions) ═══ -->
```

- [ ] **Step 2: Insert the `#step-service-selection` block immediately after `#step-zipcode`**

Add this block between the end of `#step-zipcode` and the start of `#step-radio`:

```html
    <!-- ═══ SERVICE SELECTION (bathroom hub) ═══ -->
    <div id="step-service-selection" class="wizard-step">
      <div class="flex justify-center px-4 py-4 sm:py-12">
        <div class="w-full max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div class="p-6 sm:p-8">
            <div class="text-center mb-6">
              <p class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Let's get started!</p>
              <h2 class="text-lg sm:text-xl lg:text-2xl font-extrabold text-gray-900">What type of service do you need?</h2>
            </div>
            <div class="flex flex-col gap-3">
              <button type="button" onclick="selectBathroomService('bath')"
                class="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-xl transition-colors">
                Bathroom Remodeling
              </button>
              <button type="button" onclick="selectBathroomService('tub')"
                class="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-xl transition-colors">
                Walk-in Tub
              </button>
              <button type="button" onclick="selectBathroomService('shower')"
                class="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-xl transition-colors">
                Walk-in Shower
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

```

- [ ] **Step 3: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat: add service-selection HTML step for bathroom hub"
```

---

## Task 3: Wire up renderCurrentStep and add selectBathroomService

**Files:**
- Modify: `frontend/get-quotes.html` (lines 884–885 in `renderCurrentStep`, and in the `<script>` block)

- [ ] **Step 1: Add the `else if` branch for `service-selection` in `renderCurrentStep()`**

Find this line (around line 885 after adding the HTML block):
```js
  } else if (radioStepConfigs[stepName]) {
    renderRadioStep(stepName, progress);
  }
```

Replace it with:
```js
  } else if (stepName === "service-selection") {
    document.getElementById("step-service-selection").classList.add("active");
  } else if (radioStepConfigs[stepName]) {
    renderRadioStep(stepName, progress);
  }
```

- [ ] **Step 2: Add the `selectBathroomService` function**

Find the `submitRadioStep` function (around line 959 in the original file, slightly after the new HTML block shifts things). Add the new function immediately before `submitRadioStep`:

```js
function selectBathroomService(serviceId) {
  store.switchService(serviceId);
  renderCurrentStep();
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/get-quotes.html
git commit -m "feat: wire service-selection step into renderCurrentStep"
```

---

## Task 4: Manual verification

- [ ] **Step 1: Start the backend server**

```bash
cd backend
node server.js
```

Expected output: server starts on configured port (check `.env` for PORT, default 3000).

- [ ] **Step 2: Verify `/get-quotes/bathroom` loads the ZIP step**

Open `http://localhost:3000/get-quotes/bathroom` in a browser.
Expected: wizard shows "What is your zip code?" — same as other services.

- [ ] **Step 3: Enter a ZIP and proceed to service-selection**

Enter `90210`, click Next.
Expected: screen shows "Let's get started!" heading, 3 blue buttons: Bathroom Remodeling, Walk-in Tub, Walk-in Shower. No progress bar, no trust badge.

- [ ] **Step 4: Click "Bathroom Remodeling"**

Expected: routes to "Need to remove or add walls for bath remodel?" (the `bathroom-wall` radio step). ZIP step is skipped. Progress bar appears.

- [ ] **Step 5: Navigate back to service-selection, click "Walk-in Tub"**

Press back button from the bathroom-wall question.
Expected: returns to service-selection screen.
Click "Walk-in Tub".
Expected: routes to "What is the biggest reason you are considering a walk-in tub?" (the `tub-reason` step).

- [ ] **Step 6: Navigate back, click "Walk-in Shower"**

Press back. Click "Walk-in Shower".
Expected: routes to "What type of Walk-In tub" (the `walk` step, which handles walk-in shower).

- [ ] **Step 7: Complete a full flow and verify lead submission**

Complete the walk-in shower flow through to the phone step, submit.
In browser DevTools → Network tab, confirm `POST /api/leads` was sent with `service: "shower"` (not `"bathroom"`).
Expected: 201 response with `ok: true`.

- [ ] **Step 8: Verify existing routes are unaffected**

Open `http://localhost:3000/get-quotes/bath` — should still show bath landing page, no service-selection step.
Open `http://localhost:3000/get-quotes/tub` — should still go straight to ZIP → tub-reason.
Open `http://localhost:3000/get-quotes/shower` — should still go straight to ZIP → walk.

- [ ] **Step 9: Final commit**

```bash
git add .
git commit -m "feat: bathroom hub flow complete — /get-quotes/bathroom with service selection"
```
