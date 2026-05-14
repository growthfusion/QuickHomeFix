import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@clickhouse/client";
import cron from "node-cron";
import { fetchMeta } from "./jobs/fetchMeta.js";
import { fetchLeadProsper } from "./jobs/fetchLeadProsper.js";
import { fetchRedTrack } from "./jobs/fetchRedTrack.js";

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

const STATE_MAP = {
  AL: "AL", ALABAMA: "AL",
  AK: "AK", ALASKA: "AK",
  AZ: "AZ", ARIZONA: "AZ",
  AR: "AR", ARKANSAS: "AR",
  CA: "CA", CALIFORNIA: "CA", CALIF: "CA", CALI: "CA",
  CO: "CO", COLORADO: "CO",
  CT: "CT", CONNECTICUT: "CT", CONN: "CT",
  DE: "DE", DELAWARE: "DE",
  DC: "DC", "DISTRICT OF COLUMBIA": "DC", "WASHINGTON DC": "DC", "WASHINGTON D C": "DC",
  FL: "FL", FLORIDA: "FL", FLA: "FL",
  GA: "GA", GEORGIA: "GA",
  HI: "HI", HAWAII: "HI",
  ID: "ID", IDAHO: "ID",
  IL: "IL", ILLINOIS: "IL", ILL: "IL",
  IN: "IN", INDIANA: "IN", IND: "IN",
  IA: "IA", IOWA: "IA",
  KS: "KS", KANSAS: "KS",
  KY: "KY", KENTUCKY: "KY",
  LA: "LA", LOUISIANA: "LA",
  ME: "ME", MAINE: "ME",
  MD: "MD", MARYLAND: "MD",
  MA: "MA", MASSACHUSETTS: "MA", MASS: "MA",
  MI: "MI", MICHIGAN: "MI", MICH: "MI",
  MN: "MN", MINNESOTA: "MN", MINN: "MN",
  MS: "MS", MISSISSIPPI: "MS", MISS: "MS",
  MO: "MO", MISSOURI: "MO",
  MT: "MT", MONTANA: "MT", MONT: "MT",
  NE: "NE", NEBRASKA: "NE", NEB: "NE", NEBR: "NE",
  NV: "NV", NEVADA: "NV",
  NH: "NH", "NEW HAMPSHIRE": "NH", NEWHAMPSHIRE: "NH",
  NJ: "NJ", "NEW JERSEY": "NJ", NEWJERSEY: "NJ",
  NM: "NM", "NEW MEXICO": "NM", NEWMEXICO: "NM",
  NY: "NY", "NEW YORK": "NY", NEWYORK: "NY", NEWYROK: "NY",
  NC: "NC", "NORTH CAROLINA": "NC", NORTHCAROLINA: "NC",
  ND: "ND", "NORTH DAKOTA": "ND", NORTHDAKOTA: "ND",
  OH: "OH", OHIO: "OH",
  OK: "OK", OKLAHOMA: "OK", OKLA: "OK",
  OR: "OR", OREGON: "OR", ORE: "OR", ORGAN: "OR", OREGAN: "OR",
  PA: "PA", PENNSYLVANIA: "PA", PENN: "PA", PENNA: "PA",
  RI: "RI", "RHODE ISLAND": "RI", RHODEISLAND: "RI",
  SC: "SC", "SOUTH CAROLINA": "SC", SOUTHCAROLINA: "SC",
  SD: "SD", "SOUTH DAKOTA": "SD", SOUTHDAKOTA: "SD",
  TN: "TN", TENNESSEE: "TN", TENN: "TN",
  TX: "TX", TEXAS: "TX", TEX: "TX",
  UT: "UT", UTAH: "UT",
  VT: "VT", VERMONT: "VT",
  VA: "VA", VIRGINIA: "VA",
  WA: "WA", WASHINGTON: "WA", WASH: "WA",
  WV: "WV", "WEST VIRGINIA": "WV", WESTVIRGINIA: "WV",
  WI: "WI", WISCONSIN: "WI", WISC: "WI", WIS: "WI",
  WY: "WY", WYOMING: "WY", WYO: "WY",
  PR: "PR", "PUERTO RICO": "PR", PUERTORICO: "PR",
  VI: "VI", "VIRGIN ISLANDS": "VI",
  GU: "GU", GUAM: "GU",
  AS: "AS", "AMERICAN SAMOA": "AS",
  MP: "MP", "NORTHERN MARIANA ISLANDS": "MP",
};

function normalizeState(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const key = raw.toUpperCase().replace(/[.\-_,]/g, " ").replace(/\s+/g, " ").trim();
  if (STATE_MAP[key]) return STATE_MAP[key];
  const collapsed = key.replace(/\s+/g, "");
  if (STATE_MAP[collapsed]) return STATE_MAP[collapsed];
  console.warn(`[normalizeState] unknown state value: "${raw}" — falling back to uppercase`);
  return raw.toUpperCase();
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
  const upperState = normalizeState(data.state);
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
      phone: cleanedPhone,
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
      ...(isTub ? { Interest: tubInterestDirect } : {}),
      ...(isRoofing ? { RoofingPlan: normalizeRoofingPlan(data.roofingType) } : {}),
      rt_ad:     String(data.rt_ad     || ""),
      fbclid:    String(data.fbclid    || ""),
      clickid:   String(data.clickid   || ""),
      source_id: String(data.source_id || ""),
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
        phone: cleanedPhone,
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
        phone: cleanedPhone,
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
        phone: cleanedPhone,
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
        phone: cleanedPhone,
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

// --- Static frontend ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'frontend'), { extensions: ['html'] }));

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

export function inferFormTypeFromLead(normalizedService, landingPageUrl) {
  if (normalizedService) {
    const s = normalizedService.toUpperCase();
    if (s.includes('BATH') || s.includes('TUB') || s.includes('SHOWER')) return 'bath';
    if (s.includes('ROOF')) return 'roof';
    if (s.includes('WINDOW')) return 'windo';
  }
  if (landingPageUrl) {
    const p = landingPageUrl.toLowerCase();
    if (p.includes('/bath') || p.includes('/shower')) return 'bath';
    if (p.includes('/roof')) return 'roof';
    if (p.includes('/window')) return 'windo';
  }
  return 'other';
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
      state: normalizeState(data.state) || null,
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

    const migrationQueries = [
      // QuickHomeFix leads table
      `
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
      // Meta Ads stats table
      `
        CREATE TABLE IF NOT EXISTS meta_ad_stats (
          fetched_at         DateTime64(3, 'UTC') DEFAULT now64(3),
          date               Date,
          campaign_id        String,
          campaign_name      String,
          adset_id           String,
          adset_name         String,
          ad_id              String,
          ad_name            String,
          publisher_platform String,
          placement          String,
          device             String,
          os                 String,
          state              String,
          region             String,
          clicks             UInt32,
          impressions        UInt32,
          ctr                Float64,
          spend              Float64
        ) ENGINE = MergeTree()
        ORDER BY (date, campaign_id, adset_id, ad_id, placement, device, os, state)
      `,
      // LeadProsper stats table
      `
        CREATE TABLE IF NOT EXISTS leadprosper_stats (
          fetched_at      DateTime64(3, 'UTC') DEFAULT now64(3),
          date            Date,
          campaign_id     String,
          campaign_name   String,
          leads_total     UInt32,
          leads_accepted  UInt32,
          leads_failed    UInt32,
          leads_returned  UInt32,
          total_buy       Float64,
          total_sell      Float64,
          net_profit      Float64
        ) ENGINE = MergeTree()
        ORDER BY (date, campaign_id)
      `,
      // RedTrack stats table (includes breakdown_type + group_key for per-dimension rows)
      `
        CREATE TABLE IF NOT EXISTS redtrack_stats (
          fetched_at     DateTime64(3, 'UTC') DEFAULT now64(3),
          date           Date,
          breakdown_type String DEFAULT 'daily',
          group_key      String DEFAULT '',
          campaign_id    String,
          campaign_name  String,
          landing        String,
          lp_views       UInt32,
          clicks         UInt32,
          conversions    UInt32,
          revenue        Float64,
          cost           Float64,
          epc            Float64,
          roi            Float64
        ) ENGINE = MergeTree()
        ORDER BY (date, breakdown_type, group_key, campaign_id)
      `,
      // Safe no-ops for existing tables that predate the new columns
      `ALTER TABLE redtrack_stats ADD COLUMN IF NOT EXISTS lp_views UInt32 DEFAULT 0`,
      `ALTER TABLE redtrack_stats ADD COLUMN IF NOT EXISTS breakdown_type String DEFAULT 'daily'`,
      `ALTER TABLE redtrack_stats ADD COLUMN IF NOT EXISTS group_key String DEFAULT ''`,
      // campaign_mapping table (Fix B)
      `
        CREATE TABLE IF NOT EXISTS campaign_mapping (
          meta_campaign_id  String,
          lp_campaign_id    String,
          rt_source_id      String,
          form_type         String,
          label             Nullable(String),
          created_at        DateTime64(3, 'UTC') DEFAULT now64(3)
        ) ENGINE = ReplacingMergeTree(created_at)
        ORDER BY (meta_campaign_id)
      `,
    ];

    // Execute all migrations sequentially
    for (const query of migrationQueries) {
      await clickhouse.command({ query });
    }

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
  if (!clientId || !clientSecret || !authUrl || !process.env.THUMBTACK_API_BASE) {
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

// POST /api/thumbtack/businesses  { searchQuery, zipCode, utmData }
app.post("/api/thumbtack/businesses", async (req, res) => {
  const { searchQuery, zipCode, utmData } = req.body || {};
  const cleanZip = String(zipCode || "").trim();

  if (!searchQuery || !cleanZip) {
    return res.status(400).json({ error: "searchQuery and zipCode are required" });
  }
  if (!/^\d{5}$/.test(cleanZip)) {
    return res.status(400).json({ error: "zipCode must be a 5-digit US ZIP code" });
  }

  // Whitelist of UTM keys Thumbtack accepts.
  // utm_medium and utm_tt_session are explicitly disallowed by Thumbtack.
  const ALLOWED_UTM_KEYS = [
    "utm_source",
    "utm_campaign",
    "utm_content",
    "utm_subid",
    "utm_user_hash",
    "utm_google_click_id",
  ];

  // Always force a valid utm_source (must match ^cma-[a-zA-Z0-9-_]+$, ≤48 chars).
  const cleanUtm = { utm_source: "cma-growthfusion" };
  if (utmData && typeof utmData === "object") {
    ALLOWED_UTM_KEYS.forEach(function (k) {
      const v = utmData[k];
      if (typeof v === "string" && v.trim()) {
        cleanUtm[k] = v.trim().slice(0, 200);
      }
    });
    // Re-validate utm_source against Thumbtack's pattern; fall back if invalid.
    if (!/^cma-[a-zA-Z0-9-_]{1,44}$/.test(cleanUtm.utm_source)) {
      cleanUtm.utm_source = "cma-growthfusion";
    }
  }

  const payload = {
    searchQuery: String(searchQuery).slice(0, 200),
    zipCode:     cleanZip,
    utmData:     cleanUtm,
  };

  try {
    const token = await getThumbTackToken();
    const apiBase = process.env.THUMBTACK_API_BASE;
    console.log("[thumbtack/businesses] → upstream:", JSON.stringify(payload));
    const response = await axios.post(
      `${apiBase}/api/v4/businesses/search`,
      payload,
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

// --- Initial API sync on startup ---
Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()])
  .then(() => console.log('[startup] Initial API sync complete'));

// --- Hourly cron scheduler ---
cron.schedule('0 * * * *', () => {
  console.log('[cron] Starting hourly API sync...');
  Promise.allSettled([fetchMeta(), fetchLeadProsper(), fetchRedTrack()])
    .then(() => console.log('[cron] Hourly sync complete'));
});

// --- GET endpoints for latest stats snapshots ---
app.get("/api/stats/meta", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM meta_ad_stats WHERE fetched_at = (SELECT max(fetched_at) FROM meta_ad_stats) ORDER BY date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/meta]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/stats/leadprosper", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM leadprosper_stats WHERE fetched_at = (SELECT max(fetched_at) FROM leadprosper_stats) ORDER BY date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/leadprosper]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/stats/redtrack", async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(
      `SELECT * FROM redtrack_stats WHERE fetched_at = (SELECT max(fetched_at) FROM redtrack_stats) ORDER BY date DESC`
    );
    res.json({ ok: true, rows });
  } catch (e) {
    console.error('[/api/stats/redtrack]', e.message);
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Debug: inspect raw RT API responses (one per group dimension)
app.get("/api/debug/rt-raw", async (_req, res) => {
  try {
    const apiKey = process.env.REDTRACK_API_KEY;
    if (!apiKey) return res.status(400).json({ error: 'REDTRACK_API_KEY not set' });
    const now = new Date();
    const date_to = now.toISOString().slice(0, 10);
    const date_from = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const makeUrl = (groups) => {
      const p = new URLSearchParams();
      p.append('api_key', apiKey);
      p.append('date_from', date_from);
      p.append('date_to', date_to);
      for (const g of (Array.isArray(groups) ? groups : [groups])) p.append('group[]', g);
      return `https://api.redtrack.io/report?${p.toString()}`;
    };

    const results = {};
    for (const [label, groups] of [
      ['date', 'date'],
      ['date+os', ['date', 'os']],
      ['date+device', ['date', 'device']],
      ['date+country', ['date', 'country']],
      ['date+offer', ['date', 'offer']],
    ]) {
      try {
        const r = await axios.get(makeUrl(groups));
        const data = Array.isArray(r.data) ? r.data : [];
        results[label] = { total: data.length, sample: data.slice(0, 2), keys: data[0] ? Object.keys(data[0]) : [] };
      } catch (e) {
        results[label] = { error: e.message };
      }
    }
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Debug: show row counts from ClickHouse stats tables
app.get("/api/debug/stats-summary", async (_req, res) => {
  try {
    if (!clickhouse) return res.status(500).json({ error: 'ClickHouse not configured' });

    const [rtCounts, metaCounts, lpCounts] = await Promise.all([
      runClickhouseSelect(
        `SELECT breakdown_type, count() as n, max(fetched_at) as latest
         FROM redtrack_stats GROUP BY breakdown_type ORDER BY breakdown_type`
      ).catch(e => [{ error: e.message }]),
      runClickhouseSelect(
        `SELECT count() as total, countIf(publisher_platform != '') as has_publisher,
                countIf(device != '') as has_device, countIf(region != '') as has_region,
                max(fetched_at) as latest FROM meta_ad_stats`
      ).catch(e => [{ error: e.message }]),
      runClickhouseSelect(
        `SELECT count() as total, max(fetched_at) as latest FROM leadprosper_stats`
      ).catch(e => [{ error: e.message }]),
    ]);

    res.json({ redtrack: rtCounts, meta: metaCounts, leadprosper: lpCounts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Manually trigger all three fetch jobs and return results
app.post("/api/dev/force-fetch", async (_req, res) => {
  try {
    const [metaResult, lpResult, rtResult] = await Promise.allSettled([
      fetchMeta(),
      fetchLeadProsper(),
      fetchRedTrack(),
    ]);
    res.json({
      meta:       metaResult.status === 'fulfilled' ? 'ok' : metaResult.reason?.message,
      leadprosper: lpResult.status === 'fulfilled'  ? 'ok' : lpResult.reason?.message,
      redtrack:   rtResult.status === 'fulfilled'   ? 'ok' : rtResult.reason?.message,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stats/lp-form-map', async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(`
      SELECT
        lp_campaign_id,
        any(normalized_service) AS sample_service,
        any(landing_page_url)   AS sample_url
      FROM leads
      WHERE created_at >= now() - INTERVAL 90 DAY
        AND lp_campaign_id IS NOT NULL
        AND lp_campaign_id != ''
      GROUP BY lp_campaign_id
    `);
    const result = rows.map(r => ({
      lp_campaign_id: r.lp_campaign_id,
      form_type: inferFormTypeFromLead(r.sample_service, r.sample_url),
    }));
    res.json(result);
  } catch (e) {
    console.error('[lp-form-map]', e.message);
    res.json([]);
  }
});

const CampaignMappingSchema = z.object({
  meta_campaign_id: z.string().min(1),
  lp_campaign_id:   z.string().min(1),
  rt_source_id:     z.string().default(''),
  form_type:        z.enum(['bath', 'roof', 'windo', 'other']),
  label:            z.string().optional(),
});

app.get('/api/campaign-mapping', async (_req, res) => {
  try {
    const rows = await runClickhouseSelect(`
      SELECT * FROM campaign_mapping FINAL
      ORDER BY form_type, meta_campaign_id
    `);
    res.json(rows);
  } catch (e) {
    console.error('[campaign-mapping GET]', e.message);
    res.json([]);
  }
});

app.post('/api/campaign-mapping', async (req, res) => {
  let data;
  try {
    data = CampaignMappingSchema.parse(req.body);
  } catch (err) {
    return res.status(400).json({ error: 'validation failed', details: err?.issues });
  }
  try {
    await clickhouse.insert({
      table: 'campaign_mapping',
      values: [data],
      format: 'JSONEachRow',
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[campaign-mapping POST]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/campaign-mapping/:meta_campaign_id', async (req, res) => {
  const id = req.params.meta_campaign_id;
  if (!id || id.trim() === '') {
    return res.status(400).json({ error: 'meta_campaign_id is required' });
  }
  try {
    await clickhouse.command({
      query: `ALTER TABLE campaign_mapping DELETE WHERE meta_campaign_id = {id:String}`,
      query_params: { id },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[campaign-mapping DELETE]', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stats/leads-breakdown', async (_req, res) => {
  try {
    const [stateRows, deviceRows, osRows, dailyRows] = await Promise.all([
      runClickhouseSelect(`
        SELECT
          state,
          multiIf(
            normalized_service LIKE '%BATH%' OR
            normalized_service LIKE '%TUB%' OR
            normalized_service LIKE '%SHOWER%', 'bath',
            normalized_service LIKE '%ROOF%',   'roof',
            normalized_service LIKE '%WINDOW%', 'windo',
            'other'
          ) AS form_type,
          toDate(created_at) AS date,
          count()                AS leads,
          sum(partner_delivered) AS sold,
          sum(partner_payout)    AS revenue
        FROM leads
        WHERE created_at >= now() - INTERVAL 30 DAY
          AND state IS NOT NULL
          AND state != ''
        GROUP BY state, form_type, date
        ORDER BY date DESC, leads DESC
      `).catch(e => { console.error('[leads-breakdown query]', e.message); return []; }),

      runClickhouseSelect(`
        SELECT
          multiIf(
            user_agent LIKE '%Mobile%' OR
            user_agent LIKE '%Android%', 'mobile',
            'desktop'
          ) AS device,
          multiIf(
            normalized_service LIKE '%BATH%' OR
            normalized_service LIKE '%TUB%' OR
            normalized_service LIKE '%SHOWER%', 'bath',
            normalized_service LIKE '%ROOF%',   'roof',
            normalized_service LIKE '%WINDOW%', 'windo',
            'other'
          ) AS form_type,
          toDate(created_at) AS date,
          count()                AS leads,
          sum(partner_delivered) AS sold,
          sum(partner_payout)    AS revenue
        FROM leads
        WHERE created_at >= now() - INTERVAL 30 DAY
          AND user_agent IS NOT NULL
          AND user_agent != ''
        GROUP BY device, form_type, date
        ORDER BY date DESC, leads DESC
      `).catch(e => { console.error('[leads-breakdown query]', e.message); return []; }),

      runClickhouseSelect(`
        SELECT
          multiIf(
            user_agent LIKE '%iPhone%' OR
            user_agent LIKE '%iPad%' OR
            user_agent LIKE '%iPod%',    'ios',
            user_agent LIKE '%Android%', 'android',
            user_agent LIKE '%Windows%', 'windows',
            user_agent LIKE '%Macintosh%', 'macos',
            'other'
          ) AS os,
          multiIf(
            normalized_service LIKE '%BATH%' OR
            normalized_service LIKE '%TUB%' OR
            normalized_service LIKE '%SHOWER%', 'bath',
            normalized_service LIKE '%ROOF%',   'roof',
            normalized_service LIKE '%WINDOW%', 'windo',
            'other'
          ) AS form_type,
          toDate(created_at) AS date,
          count()                AS leads,
          sum(partner_delivered) AS sold,
          sum(partner_payout)    AS revenue
        FROM leads
        WHERE created_at >= now() - INTERVAL 30 DAY
          AND user_agent IS NOT NULL
          AND user_agent != ''
        GROUP BY os, form_type, date
        ORDER BY date DESC, leads DESC
      `).catch(e => { console.error('[leads-breakdown query]', e.message); return []; }),

      runClickhouseSelect(`
        SELECT
          toDate(created_at) AS date,
          multiIf(
            normalized_service LIKE '%BATH%' OR
            normalized_service LIKE '%TUB%' OR
            normalized_service LIKE '%SHOWER%', 'bath',
            normalized_service LIKE '%ROOF%',   'roof',
            normalized_service LIKE '%WINDOW%', 'windo',
            'other'
          ) AS form_type,
          count()                AS leads,
          sum(partner_delivered) AS sold,
          sum(partner_payout)    AS revenue
        FROM leads
        WHERE created_at >= now() - INTERVAL 30 DAY
        GROUP BY date, form_type
        ORDER BY date DESC
      `).catch(e => { console.error('[leads-breakdown query]', e.message); return []; }),
    ]);

    res.json({ state: stateRows, device: deviceRows, os: osRows, daily: dailyRows });
  } catch (e) {
    console.error('[leads-breakdown]', e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
