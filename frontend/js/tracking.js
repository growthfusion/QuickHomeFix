/* ─── QuickHomeFix – Analytics, Tracking & API ─── */

/* ═══════════════════════════════════════════
   1. CONFIGURATION
   ═══════════════════════════════════════════ */
var API_BASE = (typeof QHF_CONFIG !== "undefined" && QHF_CONFIG.API_BASE_URL) || "";
var API_TIMEOUT_MS = (typeof QHF_CONFIG !== "undefined" && QHF_CONFIG.API_TIMEOUT_MS) || 90000;

/* ═══════════════════════════════════════════
   2. TRACKING – DataLayer / GTM
   ═══════════════════════════════════════════ */
var stepLabels = {
  zipcode: "Zip Code", "roofing-type": "Roofing Type", material: "Roof Material",
  "window-type": "Window Type", "window-count": "Window Count",
  "solar-type": "Solar Type", "roof-size": "Roof Size / Sun Exposure",
  "bathroom-wall": "Bathroom Wall", "gutter-type": "Gutter Type",
  "gutter-material": "Gutter Material", "tub-reason": "Tub Reason",
  walk: "Walk-In Shower", email: "Email", details: "Address Details",
  name: "Name", phone: "Phone", final: "Final / Phone", complete: "Thank You",
};

function trackVirtualPageview(service, stepName, stepNumber, totalSteps) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "virtualPageview",
    virtualPageURL: "/get-quotes/" + service + "/" + stepName,
    virtualPageTitle: (stepLabels[stepName] || stepName) + " | " + service + " | QuickHomeFix",
    stepName: stepName, stepNumber: stepNumber, totalSteps: totalSteps,
    service: service, stepLabel: stepLabels[stepName] || stepName,
  });
}

function trackStepEvent(eventName, data) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: eventName }, data || {}));
}

function trackMetaEvent(eventName, question, value, questionId) {
  // Push to dataLayer — GTM Custom HTML tags fire fbq using
  // {{question_id}} / {{question_text}} / {{answer_text}}
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    question_id: questionId || eventName,
    question_text: question,
    answer_text: value,
  });
}

function trackSnapEvent(eventName, params) {
  // Snap Pixel handled by GTM triggers on dataLayer pushes
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
}

/* ═══════════════════════════════════════════
   3. URL PARAM CAPTURE – Redtrack / Affiliate
   ═══════════════════════════════════════════ */
function getClickId() {
  try {
    var params = new URLSearchParams(window.location.search);
    var val = params.get("sub1") || params.get("clickid") || "";
    if (val) sessionStorage.setItem("qhf_clickid", val);
    return sessionStorage.getItem("qhf_clickid") || "";
  } catch (e) { return ""; }
}

function getRtAd() {
  try {
    var params = new URLSearchParams(window.location.search);
    var val = params.get("rt_ad") || params.get("sub2") || "";
    if (val) sessionStorage.setItem("qhf_rt_ad", val);
    return val || sessionStorage.getItem("qhf_rt_ad") || "";
  } catch (e) { return ""; }
}

function getFbclid() {
  try {
    var params = new URLSearchParams(window.location.search);
    var val = params.get("fbclid") || params.get("sub3") || "";
    if (val) sessionStorage.setItem("qhf_fbclid", val);
    return val || sessionStorage.getItem("qhf_fbclid") || "";
  } catch (e) { return ""; }
}

function getSourceId() {
  try {
    var params = new URLSearchParams(window.location.search);
    var val = params.get("source_id") || params.get("sourceId") || params.get("sub4") || "";
    if (val) sessionStorage.setItem("qhf_source_id", val);
    return val || sessionStorage.getItem("qhf_source_id") || "";
  } catch (e) { return ""; }
}

/* ═══════════════════════════════════════════
   4. REDTRACK – Postback & Click Beacons
   ═══════════════════════════════════════════ */
var REDTRACK_POSTBACK_URL = "https://uo8b2.ttrk.io/postback";
var REDTRACK_CLICK_URL = "https://tk.trkfy.us/click";
var REDTRACK_PAYOUT_AMOUNT = "";

function fireRedtrackPostback(formData) {
  formData = formData || {};
  var clickid = getClickId();
  if (!clickid) return;
  var params = new URLSearchParams({
    clickid: clickid,
    sub2: getRtAd(),
    sub3: getFbclid(),
    sub4: formData.service || "",
    sum: REDTRACK_PAYOUT_AMOUNT,
  });
  var img = new Image();
  img.src = REDTRACK_POSTBACK_URL + "?" + params.toString();
  console.log("[Redtrack postback]", img.src);
}

function fireRedtrackClick(formData) {
  formData = formData || {};
  var params = new URLSearchParams({
    sub1: getClickId(),
    sub2: getRtAd(),
    sub3: formData.service || "",
    sub4: formData.firstName || "",
    sub5: formData.lastName || "",
    sub6: formData.city || "",
    sub7: (formData.state || "").toUpperCase(),
    sub8: formData.address || "",
    sub9: formData.zipcode || formData.zip || "",
    sub10: formData.phone || "",
    sub11: getFbclid(),
    sub12: formData.email || "",
  });
  var img = new Image();
  img.src = REDTRACK_CLICK_URL + "?" + params.toString();
  console.log("[Redtrack click]", img.src);
}

/* ═══════════════════════════════════════════
   5. TRUSTEDFORM – Token Capture
   ═══════════════════════════════════════════ */
function getTrustedFormToken() {
  var selectors = [
    "#xxTrustedFormCertUrl", "#xxTrustedFormCertUrl_0",
    "input[name='xxTrustedFormCertUrl']", "input[name='xxTrustedFormCertUrl_0']",
    "[id^='xxTrustedFormCertUrl']", "[name^='xxTrustedFormCertUrl']",
  ];
  for (var i = 0; i < selectors.length; i++) {
    try {
      var el = document.querySelector(selectors[i]);
      var val = (el && el.value || "").trim();
      if (val) return val;
    } catch (e) { /* skip */ }
  }
  // Fallback: scan all hidden inputs
  var allHidden = document.querySelectorAll("input[type='hidden']");
  for (var j = 0; j < allHidden.length; j++) {
    var v = (allHidden[j].value || "").trim();
    if (v.indexOf("trustedform.com/") !== -1) return v;
  }
  return "";
}

/* ═══════════════════════════════════════════
   6. LEADPOST – Attribution
   ═══════════════════════════════════════════ */
var LEADPOST_PARTNERS_URL = "/marketing-partners";
var LEADPOST_PARTNER_SOURCE_ID = (typeof QHF_CONFIG !== "undefined" && QHF_CONFIG.LEADPOST_PARTNER_SOURCE_ID) || "CampaignA";
var LEADPOST_PUBLISHER_SUB_ID = (typeof QHF_CONFIG !== "undefined" && QHF_CONFIG.LEADPOST_PUBLISHER_SUB_ID) || "123456";
var HOME_PHONE_CONSENT_LANGUAGE = "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project. You understand some may use auto-dialers, SMS messages, artificial and prerecorded voice messages to contact you. There is no requirement to purchase services. Please see our Privacy Notice and Terms of Use.";

function getLeadpostAttribution(formData) {
  formData = formData || {};
  return {
    partnerSourceId: (formData.partnerSourceId || "").trim() || LEADPOST_PARTNER_SOURCE_ID,
    publisherSubId: (formData.publisherSubId || "").trim() || LEADPOST_PUBLISHER_SUB_ID,
  };
}

/* ═══════════════════════════════════════════
   7. API CALLS – Lead Submit, Email/Phone Verify, Places
   ═══════════════════════════════════════════ */
function apiRequest(path, options) {
  options = options || {};
  var ctrl = new AbortController();
  var didTimeout = false;
  var timer = setTimeout(function () { didTimeout = true; ctrl.abort(); }, API_TIMEOUT_MS);

  return fetch(API_BASE + path, Object.assign({
    headers: Object.assign({ "Content-Type": "application/json" }, options.headers || {}),
    signal: ctrl.signal,
  }, options))
    .then(function (res) {
      return res.text().then(function (text) {
        clearTimeout(timer);
        var data = null;
        try { data = JSON.parse(text); } catch (e) { data = { _raw: text }; }
        if (!res.ok) throw new Error((data && (data.message || data.error)) || "HTTP " + res.status);
        return data;
      });
    })
    .catch(function (err) {
      clearTimeout(timer);
      if (err && err.name === "AbortError") {
        throw new Error(didTimeout
          ? "Request timed out after " + Math.round(API_TIMEOUT_MS / 1000) + "s. Please try again."
          : "Request was cancelled.");
      }
      throw err;
    });
}

/** POST /api/leads — submit a lead */
function submitLead(payload) {
  return apiRequest("/api/leads", { method: "POST", body: JSON.stringify(payload) });
}

/** GET /api/verify-email?email=... */
function verifyEmail(email) {
  return apiRequest("/api/verify-email?email=" + encodeURIComponent(email));
}

/** GET /api/verify-phone?phone=... */
function verifyPhone(phone) {
  return apiRequest("/api/verify-phone?phone=" + encodeURIComponent(phone));
}

/** GET /api/places/autocomplete?input=...&zip=... */
function placesAutocomplete(input) {
  var url = "/api/places/autocomplete?input=" + encodeURIComponent(input);
  var zip = (typeof store !== "undefined" && store.formData && store.formData.zipcode) || "";
  if (/^\d{5}$/.test(zip)) url += "&zip=" + zip;
  return apiRequest(url);
}

/** GET /api/places/details?place_id=... */
function placeDetails(placeId) {
  return apiRequest("/api/places/details?place_id=" + encodeURIComponent(placeId));
}

/** GET /api/places/geocode?latlng=... */
function placesGeocode(latlng) {
  return apiRequest("/api/places/geocode?latlng=" + encodeURIComponent(latlng));
}

/** Zipcode lookup — Google first, then Zippopotam fallback */
function lookupZipcode(zipcode) {
  return placesAutocomplete(zipcode)
    .then(function (autoData) {
      var first = autoData && autoData.predictions && autoData.predictions[0];
      if (!first || !first.place_id) throw new Error("No results");
      return placeDetails(first.place_id);
    })
    .then(function (detail) {
      if (detail.city && detail.state) return { city: detail.city, state: detail.state.toUpperCase() };
      throw new Error("No city/state");
    })
    .catch(function () {
      // Fallback: Zippopotam API
      return fetch("https://api.zippopotam.us/us/" + zipcode)
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (data && data.places && data.places[0]) {
            return { city: data.places[0]["place name"], state: data.places[0]["state abbreviation"] };
          }
          return null;
        })
        .catch(function () { return null; });
    });
}

/* ═══════════════════════════════════════════
   8. FULL LEAD SUBMISSION FLOW
   (called from final-step / phone-step)
   ═══════════════════════════════════════════ */
function submitFullLead(formData) {
  var attribution = getLeadpostAttribution(formData);
  var payload = Object.assign({}, formData, attribution, {
    state: (formData.state || "").toUpperCase(),
    trustedFormToken: getTrustedFormToken(),
    homePhoneConsentLanguage: HOME_PHONE_CONSENT_LANGUAGE,
    clickid: getClickId(),
    rt_ad: getRtAd(),
    fbclid: getFbclid(),
    source_id: getSourceId(),
  });

  function pushLeadEvent() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "redtrackLead",
      rt_ad: getRtAd(),
      service: formData.service || "",
      fname: formData.firstName || "",
      lname: formData.lastName || "",
      city: formData.city || "",
      email: formData.email || "",
      zipcode: formData.zipcode || "",
      fbclid: getFbclid(),
      clickid: getClickId(),
      payout_amount: REDTRACK_PAYOUT_AMOUNT,
    });
  }

  return submitLead(payload)
    .then(function (result) {
      console.log("Lead submitted:", result);
      trackStepEvent("leadSubmit", { service: formData.service });
      pushLeadEvent();
      fireRedtrackPostback(formData);
      fireRedtrackClick(payload);
      return result;
    })
    .catch(function (err) {
      console.error("Lead submission error:", err);
      trackStepEvent("leadSubmit", { service: formData.service });
      pushLeadEvent();
      fireRedtrackPostback(formData);
      fireRedtrackClick(formData);
      return null;
    });
}

/* ═══════════════════════════════════════════
   9. INIT – Capture URL params on page load
   ═══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  getClickId();
  getSourceId();
  getRtAd();
  getFbclid();
});
