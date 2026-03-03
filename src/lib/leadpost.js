export const LEADPOST_PARTNERS_URL =
  "https://hs.leadpost.net/clientList.jsp?c_level=default&aff=0";

export const HOME_PHONE_CONSENT_LANGUAGE =
  "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project. You understand some may use auto-dialers, SMS messages, artificial and prerecorded voice messages to contact you. There is no requirement to purchase services. Please see our Privacy Notice and Terms of Use.";

function extractTokenFromTrustedFormValue(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";

  // If TrustedForm provides a full cert URL, use the trailing token.
  if (trimmed.includes("cert.trustedform.com/")) {
    const token = trimmed.split("/").pop() || "";
    return token.trim();
  }

  return trimmed;
}

export function getTrustedFormToken() {
  if (typeof document === "undefined") return "";

  const candidates = [
    "#xxTrustedFormCertUrl",
    "input[name='xxTrustedFormCertUrl']",
    "input[name='trustedFormToken']",
  ];

  for (const selector of candidates) {
    const el = document.querySelector(selector);
    if (el && typeof el.value === "string") {
      const token = extractTokenFromTrustedFormValue(el.value);
      if (token) return token;
    }
  }

  return "";
}
