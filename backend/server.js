import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { createClient } from "@clickhouse/client";

// Force local .env values to override any stale system env vars.
dotenv.config({ override: true });

const app = express();

// --- LeadProsper configuration ---
const LP_PING_URL = "https://api.leadprosper.io/ping";
const LP_POST_URL = "https://api.leadprosper.io/post";
const LP_DIRECT_POST_URL = "https://api.leadprosper.io/direct_post";
const LP_TEST_MODE = String(process.env.LP_TEST_MODE || "").toLowerCase() === "true";

// Per-campaign credentials: { campaign_id, supplier_id, key }
const LP_CAMPAIGNS = {
  WINDOWS:         { id: process.env.LP_CAMPAIGN_WINDOWS, supplier: process.env.LP_SUPPLIER_WINDOWS, key: process.env.LP_KEY_WINDOWS },
  BATH_REMODEL:    { id: process.env.LP_CAMPAIGN_BATH, supplier: process.env.LP_SUPPLIER_BATH, key: process.env.LP_KEY_BATH },
  WALK_IN_SHOWERS: { id: process.env.LP_CAMPAIGN_SHOWER, supplier: process.env.LP_SUPPLIER_SHOWER, key: process.env.LP_KEY_SHOWER },
  ROOFING_ASPHALT:       { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  ROOFING_METAL:         { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  ROOFING_TILE:          { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  ROOFING_NATURAL_SLATE: { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  ROOFING_CEDAR_SHAKE:   { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  ROOFING_COMPOSITE:     { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  ROOFING_TAR_TORCHDOWN: { id: process.env.LP_CAMPAIGN_ROOF, supplier: process.env.LP_SUPPLIER_ROOF, key: process.env.LP_KEY_ROOF },
  WALK_IN_TUBS:  { id: process.env.LP_CAMPAIGN_TUB, supplier: process.env.LP_SUPPLIER_TUB, key: process.env.LP_KEY_TUB },
  GUTTERS:       { id: process.env.LP_CAMPAIGN_GUTTERS || "", supplier: "", key: "" },
  GUTTER_COVERS: { id: process.env.LP_CAMPAIGN_GUTTERS || "", supplier: "", key: "" },
  SOLAR:         { id: process.env.LP_CAMPAIGN_SOLAR || "", supplier: "", key: "" },
};
const LP_ENABLED = true;
const LP_TCPA_TEXT = process.env.LP_TCPA_TEXT ||
  "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project.";
const LP_DEBUG = String(process.env.LP_DEBUG || "").toLowerCase() === "true";

const ALLOW_LEAD_WITHOUT_DB = String(process.env.ALLOW_LEAD_WITHOUT_DB || "").toLowerCase() === "true";
const lpTimeoutFromEnv = Number(process.env.LP_REQUEST_TIMEOUT_MS || 15000);
const LP_REQUEST_TIMEOUT_MS =
  Number.isFinite(lpTimeoutFromEnv) && lpTimeoutFromEnv > 0
    ? lpTimeoutFromEnv
    : 15000;

function normalizeTrustedFormToken(value) {
  const raw = String(value || "").trim();
  return raw;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatPhoneUS(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return digits;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

function normalizeZip(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}


function normalizeServiceForPartner(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const serviceMap = {
    windows: "WINDOWS",
    window: "WINDOWS",
    solar: "SOLAR",
    bath: "BATH_REMODEL",
    shower: "WALK_IN_SHOWERS",
    tub: "WALK_IN_TUBS",
    gutter: "GUTTERS",
  };
  return serviceMap[normalized] || String(value || "").trim().toUpperCase();
}

function normalizeOwnHome(data) {
  const own = String(data.ownHome || "").trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(own)) return "Yes";
  if (["no", "n", "false", "0"].includes(own)) return "No";
  if (data.canMakeChanges === true || data.isOwner === true) return "Yes";
  if (data.isOwner === false) return "No";
  return "Yes";
}

function normalizeBuyTimeframe(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const map = {
    immediately: "Immediately",
    "1-6 months": "1-6 months",
    "1 to 6 months": "1-6 months",
    "dont know": "Don't know",
    "don't know": "Don't know",
    "not sure": "Don't know",
  };
  return map[normalized] || "Immediately";
}

// LeadProsper's roof `service` field accepts only these material names.
// LeadProsper's internal modernize_service mapping converts them to
// ROOFING_ASPHALT etc before forwarding to Modernize buyer.
function normalizeRoofingMaterial(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const map = {
    asphalt: "Asphalt",
    composite: "Composite",
    tile: "Tile",
    slate: "Natural Slate",
    "natural slate": "Natural Slate",
    wood: "Cedar Shake",
    cedar: "Cedar Shake",
    "cedar shake": "Cedar Shake",
    metal: "Metal",
    tar: "Tar/Torchdown",
    torchdown: "Tar/Torchdown",
    "tar/torchdown": "Tar/Torchdown",
  };
  return map[normalized] || "";
}

function roofingMaterialFromService(normalizedService) {
  const map = {
    ROOFING_ASPHALT: "Asphalt",
    ROOFING_COMPOSITE: "Composite",
    ROOFING_TILE: "Tile",
    ROOFING_NATURAL_SLATE: "Natural Slate",
    ROOFING_CEDAR_SHAKE: "Cedar Shake",
    ROOFING_METAL: "Metal",
    ROOFING_TAR_TORCHDOWN: "Tar/Torchdown",
  };
  return map[normalizedService] || "Asphalt";
}

function normalizeRoofingPlan(roofingType) {
  const normalized = String(roofingType || "").trim().toLowerCase();
  const map = {
    "roof replace": "Completely replace roof",
    replace: "Completely replace roof",
    "roof repair": "Repair existing roof",
    repair: "Repair existing roof",
    "new construction": "Install roof on new construction",
    install: "Install roof on new construction",
  };
  return map[normalized] || "Install roof on new construction";
}

function normalizeWalkInTubInterest(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "safety" || normalized.includes("safe")) return "Safety";
  if (normalized === "therapeutic" || normalized.includes("therapy")) return "Therapeutic";
  if (normalized) return "Other";
  return "";
}

function normalizeBathOptIn(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "full-remodel") return "Yes";
  if (normalized === "tub-shower") return "No";
  return "";
}

function normalizeWindowsCount(value) {
  const raw = String(value || "").trim().toLowerCase();
  const map = { "1": "1", "2": "2", "3-5": "3-5", "3 to 5": "3-5", "6+": "6-9", "6-9": "6-9", "9+": "6-9" };
  if (map[raw]) return map[raw];
  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed)) {
    if (parsed <= 1) return "1";
    if (parsed === 2) return "2";
    if (parsed <= 5) return "3-5";
    return "6-9";
  }
  return "";
}

function normalizeWindowsProjectScope(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["repair", "fix"].includes(normalized)) return "Repair";
  if (["replace", "install", "installation", "not sure"].includes(normalized)) return "Install";
  return "";
}

// Build service-specific fields for LeadProsper → LeadPost
function buildServiceFields(data, normalizedService) {
  if (normalizedService === "WINDOWS") {
    return {
      NumberOfWindows: normalizeWindowsCount(data.windowCount),
      WindowsProjectScope: normalizeWindowsProjectScope(data.windowType),
    };
  }
  if (normalizedService === "WALK_IN_TUBS") {
    return { Interest: normalizeWalkInTubInterest(data.tubReason || data.bathNeeds) };
  }
  if (normalizedService === "BATH_REMODEL" || normalizedService === "WALK_IN_SHOWERS") {
    return { OptIn1: normalizeBathOptIn(data.bathNeeds) };
  }
  if (normalizedService.startsWith("ROOFING_")) {
    return { RoofingPlan: normalizeRoofingPlan(data.roofingType) };
  }
  if (normalizedService === "GUTTERS") {
    return {
      GutterType: data.gutterMaterial || "",
      GuttersProjectScope: data.gutterType || "",
      CommercialLocation: "Home",
    };
  }
  if (normalizedService === "GUTTER_COVERS") {
    return {
      GuttersProjectScope: data.gutterType || "",
      CommercialLocation: "Home",
    };
  }
  if (normalizedService === "SOLAR") {
    return {
      ElectricBill: data.electricBill || "",
    };
  }
  return {};
}

function resolvePartnerServiceCode(data = {}) {
  const service = String(data.service || "").trim().toLowerCase();

  if (["roof", "roofing"].includes(service)) {
    const material = String(data.material || "").trim().toLowerCase();
    const roofingMap = {
      asphalt: "ROOFING_ASPHALT",
      metal: "ROOFING_METAL",
      tile: "ROOFING_TILE",
      slate: "ROOFING_NATURAL_SLATE",
      wood: "ROOFING_CEDAR_SHAKE",
      composite: "ROOFING_COMPOSITE",
      tar: "ROOFING_TAR_TORCHDOWN",
      torchdown: "ROOFING_TAR_TORCHDOWN",
    };
    return roofingMap[material] || "ROOFING_ASPHALT";
  }

  if (service === "gutter") {
    const gutterType = String(data.gutterType || "").trim().toLowerCase();
    if (gutterType.includes("guard")) return "GUTTER_COVERS";
    return "GUTTERS";
  }

  return normalizeServiceForPartner(service);
}

function normalizeYesNo(value) {
  if (value === null || value === undefined || value === "") return "";
  const normalized = String(value).trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(normalized)) return "Yes";
  if (["no", "n", "false", "0"].includes(normalized)) return "No";
  return "";
}

function normalizeBooleanChoice(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "authorized"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;

  return null;
}

function normalizeLeadInput(input = {}) {
  return {
    ...input,
    zipcode: String(input.zipcode || input.postalCode || "").trim(),
    buyTimeFrame: String(input.buyTimeFrame || input.buyTimeframe || "").trim(),
    isOwner: normalizeBooleanChoice(input.isOwner),
    canMakeChanges: normalizeBooleanChoice(input.canMakeChanges),
    ownHome: normalizeYesNo(input.ownHome),
  };
}

async function postJson(url, payload) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), LP_REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutErr = new Error(
        `LeadProsper request timed out after ${LP_REQUEST_TIMEOUT_MS}ms`
      );
      timeoutErr.status = 504;
      timeoutErr.url = url;
      timeoutErr.partnerResponse = { message: timeoutErr.message };
      timeoutErr.partnerRequest = payload;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`LeadProsper HTTP ${res.status}`);
    err.status = res.status;
    err.url = url;
    err.partnerResponse = data;
    err.partnerRequest = payload;
    throw err;
  }
  return data;
}

function resolveCampaignCredentials(normalizedService) {
  const campaign = LP_CAMPAIGNS[normalizedService];
  if (!campaign || !campaign.id) {
    console.warn(`No LeadProsper campaign mapped for service: ${normalizedService}`);
    return null;
  }
  return campaign;
}

async function sendLeadProsperPingThenPost(data, { clientIp, userAgent }) {
  if (!LP_ENABLED) {
    return { enabled: false, skipped: true };
  }

  const trustedFormToken = normalizeTrustedFormToken(data.trustedFormToken);
  const cleanedPhone = normalizePhone(data.phone);
  const cleanedZip = normalizeZip(data.zipcode);
  const upperState = (data.state || "").toUpperCase();
  const normalizedService = resolvePartnerServiceCode(data);

  const campaign = resolveCampaignCredentials(normalizedService);
  if (!campaign) {
    return {
      enabled: true,
      delivered: false,
      skipped: true,
      reason: "NO_CAMPAIGN",
      message: `No LeadProsper campaign configured for service: ${normalizedService}`,
    };
  }

  // Local duplicate suppression disabled — every form submission is forwarded
  // to LeadProsper so all leads (including duplicates) appear in the LP dashboard.

  const tcpaText =
    String(data.homePhoneConsentLanguage || "").trim() || LP_TCPA_TEXT;
  const ownHome = normalizeOwnHome(data);
  const buyTimeframe = normalizeBuyTimeframe(data.buyTimeFrame || data.buyTimeframe);
  const serviceFields = buildServiceFields(data, normalizedService);

  // --- TEST MODE: direct_post (single step) ---
  if (LP_TEST_MODE) {
    const testCampaignId = process.env.LP_TEST_CAMPAIGN_ID || "";
    const testSupplierId = process.env.LP_TEST_SUPPLIER_ID || "";
    const testKey = process.env.LP_TEST_KEY || "";

    const directPayload = {
      lp_campaign_id: testCampaignId,
      lp_supplier_id: testSupplierId,
      lp_key: testKey,
      lp_action: "test",
      // Standard fields
      first_name: data.firstName || "",
      last_name: data.lastName || "",
      email: data.email || "",
      phone: cleanedPhone,
      address: data.address || "",
      city: data.city || "",
      state: upperState,
      zip_code: cleanedZip,
      ip_address: clientIp || "",
      user_agent: userAgent || "",
      trustedform_cert_url: trustedFormToken,
      tcpa_text: tcpaText,
      // Custom fields
      service: normalizedService,
      ownHome,
      buyTimeframe,
      ...serviceFields,
    };

    const directResponse = await postJson(LP_DIRECT_POST_URL, directPayload);

    const delivery = {
      enabled: true,
      delivered: String(directResponse.status || "").toUpperCase() === "ACCEPTED",
      testMode: true,
      postResponse: directResponse,
      leadId: directResponse.lead_id || "",
    };
    if (LP_DEBUG) {
      delivery.debug = {
        url: LP_DIRECT_POST_URL,
        payload: directPayload,
      };
    }
    return delivery;
  }

  // --- PRODUCTION: PING/POST two-step flow ---
  const isRoofing = normalizedService.startsWith("ROOFING_");
  const isWindows = normalizedService === "WINDOWS";
  const isBath = normalizedService === "BATH_REMODEL" || normalizedService === "WALK_IN_SHOWERS";
  const bathOptIn = isBath ? (normalizeBathOptIn(data.bathNeeds) || "Yes") : "";
  const isTub = normalizedService === "WALK_IN_TUBS";

  // --- DIRECT POST: Windows, Bath, Tub, Roofing use direct_post (no ping/post) ---
  if (isWindows || isBath || isTub || isRoofing) {
    const tubInterestDirect = isTub ? (normalizeWalkInTubInterest(data.tubReason || data.bathNeeds) || "Safety") : "";
    const roofMaterialDirect = isRoofing
      ? (normalizeRoofingMaterial(data.material || data.roofingType) || roofingMaterialFromService(normalizedService))
      : "";
    const landingPageUrlDirect = isWindows
      ? "https://quickhomefix.pro/get-quotes/windows"
      : isBath
      ? "https://quickhomefix.pro/get-quotes/bath"
      : isTub
      ? "https://quickhomefix.pro/get-quotes/tub"
      : "https://quickhomefix.pro/get-quotes/roof";

    const directPayload = {
      lp_campaign_id: campaign.id,
      lp_supplier_id: campaign.supplier,
      lp_key: campaign.key,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: formatPhoneUS(cleanedPhone),
      email: data.email || "",
      address: data.address || "",
      city: data.city || "",
      state: upperState,
      postalCode: cleanedZip,
      ip_address: clientIp || "",
      user_agent: userAgent || "",
      landing_page_url: landingPageUrlDirect,
      trustedFormToken: normalizeTrustedFormToken(data.trustedFormToken),
      leadIDToken: String(data.leadIDToken || "").trim() || randomUUID().toUpperCase(),
      tcpa_text: tcpaText,
      ...(isRoofing ? { homePhoneConsentLanguage: tcpaText } : {}),
      ownHome,
      buyTimeframe,
      service: isRoofing ? roofMaterialDirect : normalizedService,
      ...(isWindows ? {
        NumberOfWindows: normalizeWindowsCount(data.windowCount),
        WindowsProjectScope: normalizeWindowsProjectScope(data.windowType),
      } : {}),
      ...(isBath ? { OptIn1: bathOptIn } : {}),
      ...(isTub ? {
        Interest: tubInterestDirect,
        source_id: String(data.source_id || ""),
      } : {}),
      ...(isRoofing ? { RoofingPlan: normalizeRoofingPlan(data.roofingType) } : {}),
      rt_ad:   String(data.rt_ad   || ""),
      fbclid:  String(data.fbclid  || ""),
      clickid: String(data.clickid || ""),
    };

    if (LP_DEBUG) console.log("[LP DIRECT POST OUT]", JSON.stringify(directPayload));

    const directResponse = await postJson(LP_DIRECT_POST_URL, directPayload);

    const delivery = {
      enabled: true,
      delivered: String(directResponse.status || "").toUpperCase() === "ACCEPTED",
      directPost: true,
      postResponse: directResponse,
      leadId: directResponse.lead_id || "",
    };
    if (LP_DEBUG) delivery.debug = { url: LP_DIRECT_POST_URL, payload: directPayload };
    return delivery;
  }
  const tubInterest = isTub ? (normalizeWalkInTubInterest(data.tubReason || data.bathNeeds) || "Safety") : "";
  const roofMaterial = isRoofing
    ? (normalizeRoofingMaterial(data.material || data.roofingType) || roofingMaterialFromService(normalizedService))
    : "";
  const landingPageUrl = (() => {
    if (isRoofing) return "https://quickhomefix.pro/get-quotes/roof";
    if (isWindows) return "https://quickhomefix.pro/get-quotes/windows";
    if (isBath)    return "https://quickhomefix.pro/get-quotes/bath";
    if (isTub)     return "https://quickhomefix.pro/get-quotes/tub";
    return String(data.landing_page_url || data.landingPageUrl || "").trim();
  })();
  const tagId = String(data.tagId || process.env.LP_TAG_ID || "204670250").trim();
  const publisherSubId = String(data.publisherSubId || randomUUID()).trim();
  const partnerSourceId = String(data.partnerSourceId || "quickhomefix").trim();

  const pingPayload = isRoofing
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        landing_page_url: landingPageUrl,
        RoofingPlan: normalizeRoofingPlan(data.roofingType),
        service: roofMaterial,
      }
    : isWindows
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        landing_page_url: landingPageUrl,
        service: normalizedService,
      }
    : isBath
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        landing_page_url: landingPageUrl,
        service: normalizedService,
        OptIn1: bathOptIn,
      }
    : isTub
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        landing_page_url: landingPageUrl,
        service: normalizedService,
        Interest: tubInterest,
      }
    : {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        zip_code: cleanedZip,
        // Custom fields forwarded to Modernize via LeadProsper buyer delivery
        service: normalizedService,
        ownHome,
        buyTimeframe,
        ...serviceFields,
      };

  console.log("[LP PING OUT]", JSON.stringify(pingPayload));
  let pingResponse;
  try {
    pingResponse = await postJson(LP_PING_URL, pingPayload);
  } catch (pingErr) {
    const partnerMsg = String(pingErr?.partnerResponse?.message || "");
    if (/duplicate/i.test(partnerMsg)) {
      return {
        enabled: true,
        delivered: false,
        skipped: true,
        reason: "PARTNER_DUPLICATE",
        message: partnerMsg,
        partnerResponse: pingErr.partnerResponse || null,
      };
    }
    throw pingErr;
  }

  // LeadProsper returns status: "ACCEPTED" (uppercase)
  if (String(pingResponse.status || "").toUpperCase() !== "ACCEPTED") {
    return {
      enabled: true,
      delivered: false,
      skipped: true,
      reason: "PING_REJECTED",
      message: pingResponse.message || "Ping was not accepted",
      pingResponse,
    };
  }

  const pingId = pingResponse.ping_id || "";
  if (!pingId) {
    const err = new Error("PING accepted but ping_id is missing");
    err.status = 400;
    err.url = LP_PING_URL;
    err.partnerResponse = pingResponse;
    err.partnerRequest = pingPayload;
    throw err;
  }
  // pingToken is required on POST. LeadProsper returns it on the ping response
  // (sometimes as `pingToken`, sometimes inside the first bid as `bid_id`).
  const responsePingToken =
    pingResponse.pingToken ||
    pingResponse.ping_token ||
    pingResponse.bids?.[0]?.bid_id ||
    pingResponse.bids?.[0]?.bidId ||
    pingId;

  // --- POST to LeadProsper ---
  const postPayload = isWindows
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        lp_ping_id: pingId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: formatPhoneUS(cleanedPhone),
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: upperState,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        trustedFormToken: trustedFormToken,
        tcpa_text: tcpaText,
        landing_page_url: landingPageUrl,
        ip_address: clientIp || "",
        user_agent: userAgent || "",
        pingToken: responsePingToken,
        service: normalizedService,
        leadIDToken: String(data.leadIDToken || "").trim() || randomUUID().toUpperCase(),
        NumberOfWindows: normalizeWindowsCount(data.windowCount),
        WindowsProjectScope: normalizeWindowsProjectScope(data.windowType),
      }
    : isBath
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        lp_ping_id: pingId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: formatPhoneUS(cleanedPhone),
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: upperState,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        trustedFormToken: trustedFormToken,
        tcpa_text: tcpaText,
        landing_page_url: landingPageUrl,
        ip_address: clientIp || "",
        user_agent: userAgent || "",
        pingToken: responsePingToken,
        service: normalizedService,
        leadIDToken: String(data.leadIDToken || "").trim() || randomUUID().toUpperCase(),
        OptIn1: bathOptIn,
      }
    : isTub
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        lp_ping_id: pingId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: formatPhoneUS(cleanedPhone),
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: upperState,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        trustedFormToken: trustedFormToken,
        tcpa_text: tcpaText,
        landing_page_url: landingPageUrl,
        ip_address: clientIp || "",
        user_agent: userAgent || "",
        pingToken: responsePingToken,
        service: normalizedService,
        leadIDToken: String(data.leadIDToken || "").trim() || randomUUID().toUpperCase(),
        Interest: tubInterest,
      }
    : isRoofing
    ? {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        lp_ping_id: pingId,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: formatPhoneUS(cleanedPhone),
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        state: upperState,
        postalCode: cleanedZip,
        ownHome,
        buyTimeframe,
        tagId,
        publisherSubId,
        partnerSourceId,
        trustedFormToken: trustedFormToken,
        homePhoneConsentLanguage: tcpaText,
        landing_page_url: landingPageUrl,
        RoofingPlan: normalizeRoofingPlan(data.roofingType),
        pingToken: responsePingToken,
        leadIDToken: String(data.leadIDToken || "").trim() || randomUUID().toUpperCase(),
        service: roofMaterial,
      }
    : {
        lp_campaign_id: campaign.id,
        lp_supplier_id: campaign.supplier,
        lp_key: campaign.key,
        lp_ping_id: pingId,
        // Custom fields forwarded to Modernize via LeadProsper buyer delivery
        service: normalizedService,
        ownHome,
        buyTimeframe,
        ...serviceFields,
        // Standard LeadProsper fields
        first_name: data.firstName || "",
        last_name: data.lastName || "",
        email: data.email || "",
        phone: cleanedPhone,
        address: data.address || "",
        city: data.city || "",
        state: upperState,
        zip_code: cleanedZip,
        ip_address: clientIp || "",
        user_agent: userAgent || "",
        trustedform_cert_url: trustedFormToken,
        tcpa_text: tcpaText,
      };

  const postResponse = await postJson(LP_POST_URL, postPayload);

  const delivery = {
    enabled: true,
    delivered: String(postResponse.status || "").toUpperCase() === "ACCEPTED",
    pingId,
    pingResponse,
    postResponse,
    payout: postResponse.payout || 0,
    leadId: postResponse.lead_id || "",
  };
  if (LP_DEBUG) {
    delivery.debug = {
      pingUrl: LP_PING_URL,
      postUrl: LP_POST_URL,
      pingPayload,
      postPayload,
    };
  }
  return delivery;
}

// --- Security & basics ---
app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "200kb" }));
app.use(
    cors({
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
        : true,
    })
);


// --- Rate limit API routes ---
app.use(
    "/api/",
    rateLimit({
      windowMs: 60 * 1000,
      max: 60, // 60 req/min/IP
      standardHeaders: true,
      legacyHeaders: false,
    })
);

// --- ClickHouse client ---
const CLICKHOUSE_HOST = String(process.env.CLICKHOUSE_HOST || process.env.CLICKHOUSE_URL || "").trim();
const CLICKHOUSE_PORT = Number(process.env.CLICKHOUSE_PORT || 8443);
const CLICKHOUSE_PROTOCOL = String(process.env.CLICKHOUSE_PROTOCOL || "https").trim();
const CLICKHOUSE_DATABASE = String(process.env.CLICKHOUSE_DATABASE || "default").trim();
const CLICKHOUSE_USERNAME = String(process.env.CLICKHOUSE_USERNAME || "default").trim();
const CLICKHOUSE_PASSWORD = String(process.env.CLICKHOUSE_PASSWORD || "").trim();
const CLICKHOUSE_TABLE = String(process.env.CLICKHOUSE_TABLE || "leads").trim();

if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(CLICKHOUSE_TABLE)) {
  throw new Error("Invalid CLICKHOUSE_TABLE name. Use only letters, numbers, and underscore.");
}

function buildClickhouseUrl() {
  if (!CLICKHOUSE_HOST) return "";

  if (/^https?:\/\//i.test(CLICKHOUSE_HOST)) {
    const parsed = new URL(CLICKHOUSE_HOST);
    if (!parsed.port) parsed.port = String(CLICKHOUSE_PORT);
    return parsed.toString().replace(/\/$/, "");
  }

  return `${CLICKHOUSE_PROTOCOL}://${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}`;
}

const CLICKHOUSE_URL = buildClickhouseUrl();
const CLICKHOUSE_ENABLED = Boolean(CLICKHOUSE_URL && CLICKHOUSE_USERNAME && CLICKHOUSE_PASSWORD);

const clickhouse = CLICKHOUSE_ENABLED
  ? createClient({
      url: CLICKHOUSE_URL,
      database: CLICKHOUSE_DATABASE,
      username: CLICKHOUSE_USERNAME,
      password: CLICKHOUSE_PASSWORD,
      request_timeout: 45000,
    })
  : null;

function boolToUInt8(value) {
  if (value === true) return 1;
  if (value === false) return 0;
  return null;
}

async function runClickhouseSelect(query) {
  if (!clickhouse) {
    throw new Error("ClickHouse is not configured. Set CLICKHOUSE_* values in backend/.env");
  }
  const resultSet = await clickhouse.query({
    query,
    format: "JSONEachRow",
  });
  return resultSet.json();
}

// --- Google Places proxy (your existing code) ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("Warning: GOOGLE_API_KEY is not set in environment variables");
}

app.get("/api/leads/count", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(`SELECT count() AS n FROM ${CLICKHOUSE_TABLE}`);
    res.json({ ok: true, count: Number(rows?.[0]?.n || 0) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: e.message, code: e.code || null });
  }
});

app.get("/api/leads/latest", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM ${CLICKHOUSE_TABLE} ORDER BY created_at DESC LIMIT 5`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: e.message, code: e.code || null });
  }
});

// In-memory cache: US ZIP → "lat,lng". Keeps Google results biased near the
// user's area even though the request originates from our Cloud Run server.
const ZIP_LATLNG_CACHE = new Map();
async function zipToLatLng(zip) {
  if (!/^\d{5}$/.test(zip)) return null;
  if (ZIP_LATLNG_CACHE.has(zip)) return ZIP_LATLNG_CACHE.get(zip);
  try {
    const { data } = await axios.get(`https://api.zippopotam.us/us/${zip}`, { timeout: 2000 });
    const p = data && data.places && data.places[0];
    if (p && p.latitude && p.longitude) {
      const latlng = `${p.latitude},${p.longitude}`;
      ZIP_LATLNG_CACHE.set(zip, latlng);
      return latlng;
    }
  } catch (_) { /* fall through */ }
  ZIP_LATLNG_CACHE.set(zip, null);
  return null;
}

app.get("/api/places/autocomplete", async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Google API key is not configured on the server" });
  }
  try {
    const { input, zip } = req.query;
    if (!input) {
      return res.status(400).json({ error: "Input parameter is required" });
    }

    const params = { input, key: GOOGLE_API_KEY, types: "address", components: "country:us" };
    if (zip) {
      const latlng = await zipToLatLng(String(zip));
      if (latlng) {
        params.location = latlng;
        params.radius = 50000; // 50 km soft bias; does not exclude far results
      }
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
      { params }
    );

    const { status, error_message, predictions } = response.data;

    if (status !== "OK" && status !== "ZERO_RESULTS") {
      console.error(`Google Places Autocomplete error: ${status} — ${error_message || "no detail"}`);
      return res.status(502).json({ error: `Google Places API error: ${status}`, detail: error_message || "" });
    }

    res.json({ predictions: predictions || [] });
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error("Error with Places Autocomplete API:", detail);
    res.status(500).json({ error: "Failed to fetch suggestions", detail: String(detail) });
  }
});

app.get("/api/places/details", async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Google API key is not configured on the server" });
  }
  try {
    const { place_id } = req.query;
    if (!place_id) {
      return res.status(400).json({ error: "place_id parameter is required" });
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id,
          fields: "address_component,formatted_address",
          key: GOOGLE_API_KEY,
        },
      }
    );

    const { status, error_message } = response.data;
    if (status !== "OK") {
      console.error(`Google Places Details error: ${status} — ${error_message || "no detail"}`);
      return res.status(502).json({ error: `Google Places API error: ${status}`, detail: error_message || "" });
    }

    const addressComponents = response.data.result.address_components || [];
    const formattedAddress = response.data.result.formatted_address || "";

    const addressData = {
      street: "",
      city: "",
      state: "",
      zipcode: "",
    };

    let streetNumber = "";
    let route = "";

    addressComponents.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number")) {
        streetNumber = component.long_name;
      } else if (types.includes("route")) {
        route = component.long_name;
      } else if (types.includes("locality")) {
        addressData.city = component.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        addressData.state = component.short_name;
      } else if (types.includes("postal_code")) {
        addressData.zipcode = component.long_name;
      }
    });

    if (streetNumber && route) {
      addressData.street = `${streetNumber} ${route}`.trim();
    } else if (formattedAddress) {
      const parts = formattedAddress.split(",");
      if (parts.length >= 1) {
        addressData.street = parts[0].trim();
      }

      if (!addressData.city && parts.length >= 2) {
        const cityPart = parts[1].trim();
        addressData.city = cityPart.split(" ")[0];
      }
    }

    if (!addressData.street && (addressData.city || addressData.state)) {
      addressData.street =
          formattedAddress.split(",")[0] || "Address details incomplete";
    }

    res.json(addressData);
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error("Error with Place Details API:", detail);
    res.status(500).json({ error: "Failed to fetch place details", detail: String(detail) });
  }
});

// --- Reverse Geocoding: lat/lng → address ---
app.get("/api/places/geocode", async (req, res) => {
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: "Google API key is not configured on the server" });
  }
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng parameters are required" });
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      { params: { latlng: `${lat},${lng}`, key: GOOGLE_API_KEY } }
    );

    const { status, error_message, results } = response.data;
    if (status !== "OK" || !results?.length) {
      console.error(`Google Geocode error: ${status} — ${error_message || "no detail"}`);
      return res.status(502).json({ error: `Google Geocode API error: ${status}`, detail: error_message || "" });
    }

    const addressData = { street: "", city: "", state: "", zipcode: "" };

    // Search through all results to find the best street address
    for (const result of results) {
      const components = result.address_components || [];
      let streetNumber = "";
      let route = "";

      components.forEach((c) => {
        if (c.types.includes("street_number")) streetNumber = c.long_name;
        else if (c.types.includes("route")) route = c.long_name;
        else if (c.types.includes("locality") && !addressData.city) addressData.city = c.long_name;
        else if (c.types.includes("administrative_area_level_1") && !addressData.state) addressData.state = c.short_name;
        else if (c.types.includes("postal_code") && !addressData.zipcode) addressData.zipcode = c.long_name;
      });

      if (!addressData.street && streetNumber && route) {
        addressData.street = `${streetNumber} ${route}`;
      }
    }

    // Fallback: use formatted_address from the first result
    if (!addressData.street && results[0].formatted_address) {
      addressData.street = results[0].formatted_address.split(",")[0].trim();
    }

    res.json(addressData);
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error("Error with Geocode API:", detail);
    res.status(500).json({ error: "Failed to reverse geocode", detail: String(detail) });
  }
});

// --- Zod schema for your 9-step form ---
const LeadSchema = z.object({
  service: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  roofingType: z.string().optional().or(z.literal("")),
  roofCount: z.string().optional().or(z.literal("")),
  material: z.string().optional().or(z.literal("")),
  windowType: z.string().optional().or(z.literal("")),
  windowCount: z.string().optional().or(z.literal("")),
  windowStyle: z.string().optional().or(z.literal("")),
  solarType: z.string().optional().or(z.literal("")),
  electricBill: z.string().optional().or(z.literal("")),
  roofSize: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal("")),
  postalCode: z.string().optional().or(z.literal("")),
  buyTimeFrame: z.string().optional().or(z.literal("")),
  buyTimeframe: z.string().optional().or(z.literal("")),
  partnerSourceId: z.string().optional().or(z.literal("")),
  publisherSubId: z.string().optional().or(z.literal("")),
  leadIDToken: z.string().optional().or(z.literal("")),
  isOwner: z.boolean().nullable().optional(),
  canMakeChanges: z.boolean().nullable().optional(),
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  ownHome: z.string().optional().or(z.literal("")),
  // NEW (add these so Zod won’t drop them)
  bathshowerType: z.string().optional().or(z.literal("")),
  bathwallType: z.string().optional().or(z.literal("")),
  gutterMaterial: z.string().optional().or(z.literal("")),
  gutterType: z.string().optional().or(z.literal("")),
  walkinType: z.string().optional().or(z.literal("")),
  bathNeeds: z.string().optional().or(z.literal("")),
  tubReason: z.string().optional().or(z.literal("")),
  sunExposure: z.string().optional().or(z.literal("")),
  trustedFormToken: z.string().optional().or(z.literal("")),
  homePhoneConsentLanguage: z.string().optional().or(z.literal("")),
  rt_ad:     z.string().optional().or(z.literal("")),
  fbclid:    z.string().optional().or(z.literal("")),
  clickid:   z.string().optional().or(z.literal("")),
  source_id: z.string().optional().or(z.literal("")),
});

app.post("/api/leads", async (req, res) => {
  try {
    const data = LeadSchema.parse(normalizeLeadInput(req.body));

    const ua = req.get("user-agent") ?? null;
    const clientIp =
        (req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? req.ip)?.trim() || null;

    const leadId = randomUUID();
    const createdAt = new Date().toISOString();

    let partnerDelivery = { enabled: LP_ENABLED, skipped: !LP_ENABLED };
    try {
      partnerDelivery = await sendLeadProsperPingThenPost(data, { clientIp, userAgent: ua });
    } catch (partnerErr) {
      console.error("LeadProsper delivery error:", partnerErr.message);
      console.error(
        "LeadProsper response:",
        JSON.stringify(partnerErr.partnerResponse || null)
      );
      console.error(
        "LeadProsper request:",
        JSON.stringify(partnerErr.partnerRequest || null)
      );
      partnerDelivery = {
        enabled: LP_ENABLED,
        delivered: false,
        error: partnerErr.message,
        status: partnerErr.status || null,
        partnerUrl: partnerErr.url || null,
        partnerResponse: partnerErr.partnerResponse || null,
        partnerRequest: partnerErr.partnerRequest || null,
      };
    }

    const normalizedServiceCode = resolvePartnerServiceCode(data);
    const partnerReq = partnerDelivery?.debug?.postPayload || partnerDelivery?.debug?.payload || {};
    const leadRow = {
      id: leadId,
      service: data.service || null,
      normalized_service: normalizedServiceCode || null,
      first_name: data.firstName || null,
      last_name: data.lastName || null,
      email: data.email || null,
      phone: normalizePhone(data.phone) || null,
      address: data.address || null,
      city: data.city || null,
      state: (data.state || "").toUpperCase() || null,
      postal_code: normalizeZip(data.postalCode || data.zipcode) || null,
      own_home: normalizeOwnHome(data) || null,
      buy_timeframe: normalizeBuyTimeframe(data.buyTimeFrame || data.buyTimeframe) || null,
      is_owner: boolToUInt8(data.isOwner),
      can_make_changes: boolToUInt8(data.canMakeChanges),
      roofing_type: data.roofingType || null,
      roofing_plan: partnerReq.RoofingPlan || null,
      roof_count: data.roofCount || null,
      roof_size: data.roofSize || null,
      material: data.material || null,
      number_of_windows: partnerReq.NumberOfWindows || data.windowCount || null,
      windows_project_scope: partnerReq.WindowsProjectScope || data.windowType || null,
      window_style: data.windowStyle || null,
      opt_in_1: partnerReq.OptIn1 || null,
      interest: partnerReq.Interest || null,
      bath_needs: data.bathNeeds || null,
      tub_reason: data.tubReason || null,
      bathshower_type: data.bathshowerType || null,
      bathwall_type: data.bathwallType || null,
      walkin_type: data.walkinType || null,
      gutter_material: data.gutterMaterial || null,
      gutter_type: data.gutterType || null,
      solar_type: data.solarType || null,
      sun_exposure: data.sunExposure || null,
      electric_bill: data.electricBill || null,
      tag_id: partnerReq.tagId || null,
      publisher_sub_id: partnerReq.publisherSubId || data.publisherSubId || null,
      partner_source_id: partnerReq.partnerSourceId || data.partnerSourceId || null,
      trusted_form_token: normalizeTrustedFormToken(data.trustedFormToken) || null,
      lead_id_token: data.leadIDToken || null,
      ping_token: partnerDelivery?.pingId || null,
      home_phone_consent_language:
        data.homePhoneConsentLanguage || LP_TCPA_TEXT || null,
      landing_page_url: partnerReq.landing_page_url || null,
      lp_campaign_id: partnerReq.lp_campaign_id || null,
      lp_supplier_id: partnerReq.lp_supplier_id || null,
      lp_ping_id: partnerDelivery?.pingId || null,
      partner_lead_id: partnerDelivery?.leadId || null,
      partner_delivered: boolToUInt8(partnerDelivery?.delivered === true),
      partner_payout: Number(partnerDelivery?.payout || 0) || null,
      partner_status:
        partnerDelivery?.postResponse?.status ||
        partnerDelivery?.reason ||
        null,
      client_ip: clientIp,
      user_agent: ua,
      created_at: createdAt,
    };

    let dbInsert = { saved: false };
    try {
      if (!clickhouse) {
        throw new Error("ClickHouse is not configured. Set CLICKHOUSE_* values in backend/.env");
      }
      await clickhouse.insert({
        table: CLICKHOUSE_TABLE,
        values: [leadRow],
        format: "JSONEachRow",
      });
      dbInsert = {
        saved: true,
        id: leadId,
        created_at: createdAt,
      };
    } catch (dbErr) {
      if (!ALLOW_LEAD_WITHOUT_DB) throw dbErr;
      console.error("DB insert skipped due to ALLOW_LEAD_WITHOUT_DB:", dbErr.message);
      dbInsert = {
        saved: false,
        error: dbErr.message,
      };
    }

    res.status(201).json({
      ok: true,
      id: dbInsert.id || null,
      created_at: dbInsert.created_at || null,
      dbInsert,
      partnerDelivery,
    });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ ok: false, error: "VALIDATION_ERROR", details: err.issues });
    }
    console.error("Insert error:", err);
    res.status(500).json({ ok: false, error: "SERVER_ERROR", message: err.message, code: err.code || null });
  }
});


// TEMP: simple migration endpoint for ClickHouse table create
app.post("/api/dev/migrate", async (_req, res) => {
  try {
    if (!clickhouse) {
      throw new Error("ClickHouse is not configured. Set CLICKHOUSE_* values in backend/.env");
    }
    await clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${CLICKHOUSE_TABLE}
        (
          id UUID DEFAULT generateUUIDv4(),
          service Nullable(String),
          normalized_service Nullable(String),
          first_name Nullable(String),
          last_name Nullable(String),
          email Nullable(String),
          phone Nullable(String),
          address Nullable(String),
          city Nullable(String),
          state Nullable(String),
          postal_code Nullable(String),
          own_home Nullable(String),
          buy_timeframe Nullable(String),
          is_owner Nullable(UInt8),
          can_make_changes Nullable(UInt8),
          roofing_type Nullable(String),
          roofing_plan Nullable(String),
          roof_count Nullable(String),
          roof_size Nullable(String),
          material Nullable(String),
          number_of_windows Nullable(String),
          windows_project_scope Nullable(String),
          window_style Nullable(String),
          opt_in_1 Nullable(String),
          interest Nullable(String),
          bath_needs Nullable(String),
          tub_reason Nullable(String),
          bathshower_type Nullable(String),
          bathwall_type Nullable(String),
          walkin_type Nullable(String),
          gutter_material Nullable(String),
          gutter_type Nullable(String),
          solar_type Nullable(String),
          sun_exposure Nullable(String),
          electric_bill Nullable(String),
          tag_id Nullable(String),
          publisher_sub_id Nullable(String),
          partner_source_id Nullable(String),
          trusted_form_token Nullable(String),
          lead_id_token Nullable(String),
          ping_token Nullable(String),
          home_phone_consent_language Nullable(String),
          landing_page_url Nullable(String),
          lp_campaign_id Nullable(String),
          lp_supplier_id Nullable(String),
          lp_ping_id Nullable(String),
          partner_lead_id Nullable(String),
          partner_delivered Nullable(UInt8),
          partner_payout Nullable(Float64),
          partner_status Nullable(String),
          client_ip Nullable(String),
          user_agent Nullable(String),
          created_at DateTime64(3, 'UTC') DEFAULT now64(3)
        )
        ENGINE = MergeTree
        ORDER BY (created_at, id)
      `,
    });
    res.json({ ok: true, migrated: true });
  } catch (e) {
    console.error("Migration error:", e);
    res.status(500).json({ ok: false, error: e.message, code: e.code || null });
  }
});

// --- health ---
app.get("/healthz", (_req, res) => res.send("ok"));

// --- root ---
app.get("/", (_req, res) => {
  res.send("Server is running properly");
});



// Fix DNS lookup and timeout issues
app.get("/api/verify-email", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Basic format validation
  const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidFormat) {
    return res.json({
      format_valid: false,
      mx_found: false,
      message: "Invalid email format"
    });
  }

  const domain = email.split('@')[1].toLowerCase();
  const username = email.split('@')[0];

  // List of common domains we consider valid
  const commonDomains = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
    "aol.com", "icloud.com", "protonmail.com", "mail.com",
    "live.com", "msn.com", "ymail.com", "yahoo.co.in",
    "yahoo.co.uk", "outlook.in", "rediffmail.com", "zoho.com",
    "me.com", "mac.com", "comcast.net", "verizon.net",
    "att.net", "sbcglobal.net", "bellsouth.net", "cox.net",
    "charter.net", "earthlink.net", "juno.com", "frontier.com"
  ];
  
  // For common domains, accept if format is valid
  if (commonDomains.includes(domain)) {
    return res.json({
      format_valid: true,
      mx_found: true,
      is_disposable: false,
      email: email,
      message: "Email verified"
    });
  }

  // For non-common domains, try API but always allow through if format is valid
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.apilayer.com/email_verification/check?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: { apikey: process.env.APILAYER_KEY },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`API status ${response.status}`);

    const data = await response.json();

    // Even if API says invalid, only reject if format_valid is explicitly false
    if (data.format_valid === false) {
      return res.json({ format_valid: false, mx_found: false, message: "Invalid email address" });
    }

    return res.json({
      format_valid: true,
      mx_found: data.mx_found ?? true,
      is_disposable: data.disposable ?? false,
      email: email,
      message: "Email verified"
    });
  } catch (err) {
    console.error("Email verification error:", err.message);

    // If API fails, allow through — the format is already validated
    return res.json({
      format_valid: true,
      mx_found: true,
      is_disposable: false,
      email: email,
      message: "Email accepted"
    });
  }
});

app.get("/api/verify-phone", async (req, res) => {
  const phone = req.query.phone;
  if (!phone) return res.status(400).json({ error: "Phone number is required" });

  // Basic format validation — 10 digits
  const isValidFormat = /^\d{10}$/.test(phone);
  if (!isValidFormat) {
    return res.json({
      valid: false,
      country_code: null,
      message: "Please enter a valid 10-digit US phone number"
    });
  }

  // Reject known invalid patterns (555 numbers, all-same digits, sequential)
  const areaCode = phone.substring(0, 3);
  const isFakeNumber = (
    areaCode === "555" ||
    /^(\d)\1{9}$/.test(phone) ||  // all same digit
    phone === "1234567890"
  );
  
  if (isFakeNumber) {
    return res.json({
      valid: false,
      country_code: "US",
      message: "Please enter a real phone number"
    });
  }

  try {
    const fullNumber = `+1${phone}`;
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Phone API timeout")), 6000)
    );
    
    const fetchPromise = fetch(
      `https://api.apilayer.com/number_verification/validate?number=${fullNumber}`,
      {
        method: "GET",
        headers: { apikey: process.env.APILAYER_KEY }
      }
    );

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    return res.json(data);
    
  } catch (err) {
    console.error("Phone verification error:", err.message);
    
    // Format validated — allow through
    return res.json({
      valid: true,
      country_code: "US",
      carrier: "",
      line_type: "",
      number: `+1${phone}`,
      message: "Phone accepted (API verification unavailable)"
    });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
