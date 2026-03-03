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
const LEADPOST_PING_URL = process.env.LEADPOST_PING_URL || "";
const LEADPOST_POST_URL = process.env.LEADPOST_POST_URL || "";
const LEADPOST_STAGE_TAG_ID = process.env.LEADPOST_STAGE_TAG_ID || "204670250";
const LEADPOST_TAG_ID = process.env.LEADPOST_TAG_ID || LEADPOST_STAGE_TAG_ID;
const LEADPOST_GROWTH_FUSION_TAG_ID =
  process.env.LEADPOST_GROWTH_FUSION_TAG_ID || "204696034";
const LEADPOST_PARTNER_SOURCE_ID = process.env.LEADPOST_PARTNER_SOURCE_ID || "CampaignA";
const LEADPOST_PUBLISHER_SUB_ID = process.env.LEADPOST_PUBLISHER_SUB_ID || "123456";
const LEADPOST_DEFAULT_BUY_TIMEFRAME =
  process.env.LEADPOST_DEFAULT_BUY_TIMEFRAME || "Immediately";
const LEADPOST_DEFAULT_OWN_HOME =
  process.env.LEADPOST_DEFAULT_OWN_HOME || "Yes";
const LEADPOST_HOME_PHONE_CONSENT_LANGUAGE =
  process.env.LEADPOST_HOME_PHONE_CONSENT_LANGUAGE ||
  "By submitting, you authorize QuickHomeFix and up to four home improvement companies, to make marketing calls and texts to the phone number provided to discuss your home improvement project.";
const LEADPOST_ENABLED = Boolean(LEADPOST_PING_URL && LEADPOST_POST_URL);
const ALLOW_LEAD_WITHOUT_DB = String(process.env.ALLOW_LEAD_WITHOUT_DB || "").toLowerCase() === "true";
const LEADPOST_DEBUG = String(process.env.LEADPOST_DEBUG || "").toLowerCase() === "true";
const LEADPOST_DUPLICATE_COOLDOWN_MS = Number(
  process.env.LEADPOST_DUPLICATE_COOLDOWN_MS || 10 * 60 * 1000
);
const recentLeadFingerprintMap = new Map();

function normalizeTrustedFormToken(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("cert.trustedform.com/")) {
    return raw.split("/").pop()?.trim() || "";
  }
  return raw;
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeZip(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

function normalizeServiceForPartner(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const serviceMap = {
    windows: "WINDOWS",
    window: "WINDOWS",
    roof: "ROOFING",
    roofing: "ROOFING",
    solar: "SOLAR",
    bath: "BATHROOM",
    shower: "SHOWER",
    tub: "TUB",
    gutter: "GUTTER",
  };
  return serviceMap[normalized] || String(value || "").trim().toUpperCase();
}

function toYesNoOwner(isOwner, canMakeChanges) {
  if (canMakeChanges === true) return "Yes";
  if (isOwner === true) return "Yes";
  if (isOwner === false) return "No";
  return "";
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
    isOwner: normalizeBooleanChoice(input.isOwner),
    canMakeChanges: normalizeBooleanChoice(input.canMakeChanges),
    ownHome: normalizeYesNo(input.ownHome),
  };
}

function makeRuntimeId(prefix = "qhf") {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${rand}`;
}

function makeLeadFingerprint({
  service,
  postalCode,
  phone,
  email,
  address,
  firstName,
  lastName,
}) {
  const parts = [
    String(service || "").trim().toUpperCase(),
    String(postalCode || "").trim(),
    String(phone || "").replace(/\D/g, ""),
    String(email || "").trim().toLowerCase(),
    String(address || "").trim().toLowerCase(),
    String(firstName || "").trim().toLowerCase(),
    String(lastName || "").trim().toLowerCase(),
  ];
  return parts.join("|");
}

function isRecentDuplicateLead(fingerprint) {
  const now = Date.now();
  const last = recentLeadFingerprintMap.get(fingerprint);
  if (last && now - last < LEADPOST_DUPLICATE_COOLDOWN_MS) return true;
  recentLeadFingerprintMap.set(fingerprint, now);

  // Light cleanup to keep map bounded.
  if (recentLeadFingerprintMap.size > 2000) {
    for (const [key, ts] of recentLeadFingerprintMap.entries()) {
      if (now - ts > LEADPOST_DUPLICATE_COOLDOWN_MS) {
        recentLeadFingerprintMap.delete(key);
      }
    }
  }
  return false;
}

function extractPingToken(payload) {
  return (
    payload?.pingToken ||
    payload?.ping_token ||
    payload?.PingToken ||
    payload?.pingtoken ||
    payload?.token ||
    payload?.data?.pingToken ||
    payload?.data?.ping_token ||
    payload?.data?.PingToken ||
    payload?.data?.token ||
    payload?.result?.pingToken ||
    payload?.result?.ping_token ||
    payload?.result?.token ||
    ""
  );
}

function buildCompactPayload(fields) {
  const payload = {};
  Object.entries(fields).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    payload[k] = v;
  });
  return payload;
}

async function postJson(url, fields) {
  const payload = buildCompactPayload(fields);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`Partner HTTP ${res.status}`);
    err.status = res.status;
    err.url = url;
    err.partnerResponse = data;
    err.partnerRequest = payload;
    throw err;
  }
  return data;
}

async function sendLeadpostPingThenPost(data, { clientIp, userAgent }) {
  if (!LEADPOST_ENABLED) {
    return { enabled: false, skipped: true };
  }

  const trustedFormToken = normalizeTrustedFormToken(data.trustedFormToken);
  const cleanedPhone = normalizePhone(data.phone);
  const cleanedZip = normalizeZip(data.zipcode);
  const upperState = (data.state || "").toUpperCase();
  const normalizedService = normalizeServiceForPartner(data.service);
  const ownHomeText =
    normalizeYesNo(data.ownHome) ||
    toYesNoOwner(data.isOwner, data.canMakeChanges) ||
    normalizeYesNo(LEADPOST_DEFAULT_OWN_HOME) ||
    "Yes";
  const ownHomeBool = ownHomeText === "Yes";
  const partnerSourceId =
    String(data.partnerSourceId || "").trim() || LEADPOST_PARTNER_SOURCE_ID;
  const publisherSubIdFromInput = String(data.publisherSubId || "").trim();
  const leadIDTokenFromInput = String(data.leadIDToken || "").trim();
  const runtimeLeadIdToken = leadIDTokenFromInput || makeRuntimeId("lead");
  const publisherSubId =
    publisherSubIdFromInput ||
    (LEADPOST_PUBLISHER_SUB_ID
      ? `${LEADPOST_PUBLISHER_SUB_ID}-${runtimeLeadIdToken}`
      : runtimeLeadIdToken);
  const buyTimeFrame =
    String(data.buyTimeFrame || data.buyTimeframe || "").trim() ||
    LEADPOST_DEFAULT_BUY_TIMEFRAME;
  const leadIDToken = runtimeLeadIdToken;
  const homePhoneConsentLanguage =
    String(data.homePhoneConsentLanguage || "").trim() ||
    LEADPOST_HOME_PHONE_CONSENT_LANGUAGE;
  const leadFingerprint = makeLeadFingerprint({
    service: normalizedService,
    postalCode: cleanedZip,
    phone: cleanedPhone,
    email: data.email,
    address: data.address,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  if (isRecentDuplicateLead(leadFingerprint)) {
    return {
      enabled: true,
      delivered: false,
      skipped: true,
      reason: "DUPLICATE_SUPPRESSED",
      message: "Duplicate lead suppressed within cooldown window.",
      cooldownMs: LEADPOST_DUPLICATE_COOLDOWN_MS,
    };
  }

  const commonPayload = {
    tagId: LEADPOST_TAG_ID,
    service: normalizedService,
    postalCode: cleanedZip,
    ownHome: ownHomeText,
    ownhome: ownHomeText,
    isHomeOwner: ownHomeBool,
    homeowner: ownHomeBool,
    partnerSourceId,
    publisherSubId,
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    email: data.email || "",
    phone: cleanedPhone,
    address: data.address || "",
    city: data.city || "",
    state: upperState,
    trustedFormToken,
    homePhoneConsentLanguage,
    ipAddress: clientIp || "", // optional passthrough if partner accepts
    userAgent: userAgent || "", // optional passthrough if partner accepts
  };

  const pingPayload = {
    tagId: commonPayload.tagId,
    service: commonPayload.service,
    postalCode: commonPayload.postalCode,
    buyTimeFrame,
    ownHome: commonPayload.ownHome,
    ownhome: commonPayload.ownhome,
    isHomeOwner: commonPayload.isHomeOwner,
    homeowner: commonPayload.homeowner,
    partnerSourceId: commonPayload.partnerSourceId,
    publisherSubId: commonPayload.publisherSubId,
    leadIDToken,
  };
  let pingResponse;
  try {
    pingResponse = await postJson(LEADPOST_PING_URL, pingPayload);
  } catch (pingErr) {
    const partnerMsg = String(pingErr?.partnerResponse?.message || "");
    if (/duplicate ping request/i.test(partnerMsg)) {
      return {
        enabled: true,
        delivered: false,
        skipped: true,
        reason: "PARTNER_DUPLICATE",
        message: partnerMsg,
        partnerUrl: pingErr.url || LEADPOST_PING_URL,
        partnerResponse: pingErr.partnerResponse || null,
      };
    }
    throw pingErr;
  }
  const pingToken = extractPingToken(pingResponse);
  if (!pingToken) {
    const err = new Error("PING succeeded but pingToken is missing");
    err.status = 400;
    err.url = LEADPOST_PING_URL;
    err.partnerResponse = pingResponse;
    err.partnerRequest = buildCompactPayload(pingPayload);
    throw err;
  }

  const postPayload = {
    ...commonPayload,
    pingToken,
    buyTimeframe: buyTimeFrame,
    ...(leadIDToken ? { leadIDToken } : {}),
    ...(normalizedService === "WINDOWS" && data.windowCount
      ? { NumberOfWindows: String(data.windowCount) }
      : {}),
    ...(normalizedService === "WINDOWS" && data.windowType
      ? { WindowsProjectScope: String(data.windowType) }
      : {}),
  };
  const postResponse = await postJson(LEADPOST_POST_URL, postPayload);
  const delivery = {
    enabled: true,
    delivered: true,
    pingToken,
    pingResponse,
    postResponse,
  };
  if (LEADPOST_DEBUG) {
    delivery.debug = {
      pingUrl: LEADPOST_PING_URL,
      postUrl: LEADPOST_POST_URL,
      pingPayload: buildCompactPayload(pingPayload),
      postPayload: buildCompactPayload(postPayload),
    };
  }
  return delivery;
}

// --- Security & basics ---
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

app.get("/api/places/autocomplete", async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) {
      return res.status(400).json({ error: "Input parameter is required" });
    }

    const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        { params: { input, key: GOOGLE_API_KEY } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error with Places API:", error.message);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

app.get("/api/places/details", async (req, res) => {
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
    console.error("Error with Place Details API:", error.message);
    res.status(500).json({ error: "Failed to fetch place details" });
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
  roofSize: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipcode: z.string().optional().or(z.literal("")),
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
  captchaToken: z.string().optional().or(z.literal("")),
  trustedFormToken: z.string().optional().or(z.literal("")),
  homePhoneConsentLanguage: z.string().optional().or(z.literal("")),
});

app.post("/api/leads", async (req, res) => {
  try {
    const data = LeadSchema.parse(normalizeLeadInput(req.body));

    // Verify reCAPTCHA token
    const captchaToken = data.captchaToken;
    if (captchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      try {
        const captchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
        });
        const captchaData = await captchaRes.json();
        if (!captchaData.success) {
          return res.status(400).json({ ok: false, error: "CAPTCHA_FAILED", message: "reCAPTCHA verification failed. Please try again." });
        }
      } catch (captchaErr) {
        console.error("reCAPTCHA verification error:", captchaErr.message);
        // Allow through if verification service is down
      }
    }

    const ua = req.get("user-agent") ?? null;
    const clientIp =
        (req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? req.ip)?.trim() || null;

    const leadId = randomUUID();
    const createdAt = new Date().toISOString();
    const leadRow = {
      id: leadId,
      service: data.service,
      email: data.email || null,
      roofing_type: data.roofingType || null,
      roof_count: data.roofCount || null,
      material: data.material || null,
      window_type: data.windowType || null,
      window_count: data.windowCount || null,
      window_style: data.windowStyle || null,
      solar_type: data.solarType || null,
      roof_size: data.roofSize || null,
      address: data.address || null,
      city: data.city || null,
      state: (data.state || "").toUpperCase() || null,
      zipcode: data.zipcode || null,
      is_owner: boolToUInt8(data.isOwner),
      can_make_changes: boolToUInt8(data.canMakeChanges),
      first_name: data.firstName || null,
      last_name: data.lastName || null,
      phone: data.phone || null,
      client_ip: clientIp,
      user_agent: ua,
      bathshower_type: data.bathshowerType || null,
      bathwall_type: data.bathwallType || null,
      gutter_material: data.gutterMaterial || null,
      gutter_type: data.gutterType || null,
      walkin_type: data.walkinType || null,
      bath_needs: data.bathNeeds || null,
      tub_reason: data.tubReason || null,
      sunexposure: data.sunExposure || null,
      created_at: createdAt,
    };

    let partnerDelivery = { enabled: LEADPOST_ENABLED, skipped: !LEADPOST_ENABLED };
    try {
      partnerDelivery = await sendLeadpostPingThenPost(data, { clientIp, userAgent: ua });
    } catch (partnerErr) {
      console.error("LeadPost delivery error:", partnerErr.message);
      partnerDelivery = {
        enabled: LEADPOST_ENABLED,
        delivered: false,
        error: partnerErr.message,
        status: partnerErr.status || null,
        partnerUrl: partnerErr.url || null,
        partnerResponse: partnerErr.partnerResponse || null,
        partnerRequest: partnerErr.partnerRequest || null,
      };
    }

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
          service String,
          email Nullable(String),
          roofing_type Nullable(String),
          roof_count Nullable(String),
          material Nullable(String),
          window_type Nullable(String),
          window_count Nullable(String),
          window_style Nullable(String),
          solar_type Nullable(String),
          roof_size Nullable(String),
          address Nullable(String),
          city Nullable(String),
          state Nullable(String),
          zipcode Nullable(String),
          is_owner Nullable(UInt8),
          can_make_changes Nullable(UInt8),
          first_name Nullable(String),
          last_name Nullable(String),
          phone Nullable(String),
          client_ip Nullable(String),
          user_agent Nullable(String),
          bathshower_type Nullable(String),
          bathwall_type Nullable(String),
          gutter_material Nullable(String),
          gutter_type Nullable(String),
          walkin_type Nullable(String),
          bath_needs Nullable(String),
          tub_reason Nullable(String),
          sunexposure Nullable(String),
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
