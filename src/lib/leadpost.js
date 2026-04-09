export const LEADPOST_PARTNERS_URL =
  "https://hs.leadpost.net/clientList.jsp?c_level=default&aff=0";

export const HOME_PHONE_CONSENT_LANGUAGE =
  "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project. You understand some may use auto-dialers, SMS messages, artificial and prerecorded voice messages to contact you. There is no requirement to purchase services. Please see our Privacy Notice and Terms of Use.";

export const LEADPOST_PARTNER_SOURCE_ID =
  import.meta.env.VITE_LEADPOST_PARTNER_SOURCE_ID || "CampaignA";
export const LEADPOST_PUBLISHER_SUB_ID =
  import.meta.env.VITE_LEADPOST_PUBLISHER_SUB_ID || "123456";

export function getLeadpostAttribution(formData = {}) {
  const partnerSourceId =
    String(formData.partnerSourceId || "").trim() || LEADPOST_PARTNER_SOURCE_ID;
  const publisherSubId =
    String(formData.publisherSubId || "").trim() || LEADPOST_PUBLISHER_SUB_ID;

  return { partnerSourceId, publisherSubId };
}

export function getTrustedFormToken() {
  if (typeof document === "undefined") return "";

  const selectors = [
    "#xxTrustedFormCertUrl",
    "#xxTrustedFormCertUrl_0",
    "input[name='xxTrustedFormCertUrl']",
    "input[name='xxTrustedFormCertUrl_0']",
    "[id^='xxTrustedFormCertUrl']",
    "[name^='xxTrustedFormCertUrl']",
  ];

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      const val = (el?.value || "").trim();
      if (val) return val;
    } catch { /* skip invalid selector */ }
  }

  // Fallback: scan all hidden inputs for a TrustedForm cert URL
  const allHidden = document.querySelectorAll("input[type='hidden']");
  for (const el of allHidden) {
    const val = (el.value || "").trim();
    if (val.includes("trustedform.com/")) return val;
  }

  return "";
}
