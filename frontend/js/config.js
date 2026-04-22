/* ═══════════════════════════════════════════════════════════════
   QuickHomeFix – Frontend Configuration
   Only PUBLIC values here. Secrets stay in .env (backend only).
   ═══════════════════════════════════════════════════════════════ */

var QHF_CONFIG = {
  // Backend API URL — chosen by hostname so prod hits prod, everything else hits test
  API_BASE_URL: (function () {
    var host = (typeof location !== "undefined" && location.hostname) || "";
    if (host === "quickhomefix.pro" || host === "www.quickhomefix.pro") {
      return "https://api.quickhomefix.pro";
    }
    return "https://api-test.quickhomefix.pro";
  })(),

  // Request timeout (ms)
  API_TIMEOUT_MS: 90000,

  // Google reCAPTCHA v2 site key (public — safe for frontend)
  RECAPTCHA_SITE_KEY: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",

  // LeadPost attribution (public identifiers)
  LEADPOST_PARTNER_SOURCE_ID: "CampaignA",
  LEADPOST_PUBLISHER_SUB_ID: "123456",
};
