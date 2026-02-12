import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import pkg from "pg";

dotenv.config();

const app = express();

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

// --- DB pool ---
const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If your Hetzner DB mandates SSL but the CA isn't needed, you can uncomment:
  // ssl: { rejectUnauthorized: false },
});

// --- Google Places proxy (your existing code) ---
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("Warning: GOOGLE_API_KEY is not set in environment variables");
}

app.get("/api/leads/count", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM leads");
    res.json({ ok: true, count: rows[0].n });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, message: e.message, code: e.code || null });
  }
});

app.get("/api/leads/latest", async (_req, res) => {
  try {
    const { rows } = await pool.query(
        "SELECT * FROM leads ORDER BY created_at DESC LIMIT 5"
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
  // NEW (add these so Zod won’t drop them)
  bathshowerType: z.string().optional().or(z.literal("")),
  bathwallType: z.string().optional().or(z.literal("")),
  gutterMaterial: z.string().optional().or(z.literal("")),
  gutterType: z.string().optional().or(z.literal("")),
  walkinType: z.string().optional().or(z.literal("")),
  bathNeeds: z.string().optional().or(z.literal("")),
  tubReason: z.string().optional().or(z.literal("")),
  sunExposure: z.string().optional().or(z.literal("")),
});

app.post("/api/leads", async (req, res) => {
  try {
    const data = LeadSchema.parse(req.body);

    const ua = req.get("user-agent") ?? null;
    const clientIp =
        (req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? req.ip)?.trim() || null;

    const sql = `
      INSERT INTO leads (
        service, email, roofing_type, roof_count, material,
        window_type, window_count, window_style, solar_type, roof_size,
        address, city, state, zipcode, is_owner, can_make_changes, first_name, last_name, phone,client_ip, user_agent,
        bathshower_type, bathwall_type, gutter_material, gutter_type, walkin_type, bath_needs, tub_reason, sunexposure
      )
      VALUES (
               $1,$2,$3,$4,$5,
               $6,$7,$8,$9,$10,
               $11,$12,$13,$14,$15,
               $16,$17,$18,$19,$20,
               $21,$22,$23,$24,$25,
               $26,$27,$28,$29
             )
        RETURNING id, created_at
    `;

    const vals = [
      data.service,
      data.email || null,
      data.roofingType || null,
      data.roofCount || null,
      data.material || null,
      data.windowType || null,
      data.windowCount || null,
      data.windowStyle || null,
      data.solarType || null,
      data.roofSize || null,
      data.address || null,
      data.city || null,
      (data.state || "").toUpperCase() || null,
      data.zipcode || null,
      data.isOwner ?? null,
      data.canMakeChanges ?? null,
      data.firstName || null,
      data.lastName || null,
      data.phone || null,
      clientIp,
      ua,
      // NEW mappings
      data.bathshowerType || null,
      data.bathwallType || null,
      data.gutterMaterial || null,
      data.gutterType || null,
      data.walkinType || null,
      data.bathNeeds || null,
      data.tubReason || null,
      data.sunExposure || null,
    ];

    const { rows } = await pool.query(sql, vals);
    res.status(201).json({ ok: true, id: rows[0].id, created_at: rows[0].created_at });
  } catch (err) {
    if (err?.issues) {
      return res.status(400).json({ ok: false, error: "VALIDATION_ERROR", details: err.issues });
    }
    console.error("Insert error:", err);
    res.status(500).json({ ok: false, error: "SERVER_ERROR", message: err.message, code: err.code || null });
  }
});


// TEMP: simple migration to ensure extension + table exist (remove after first run)
app.post("/api/dev/migrate", async (_req, res) => {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        service text NOT NULL,
        email text,
        roofing_type text,
        roof_count text,
        material text,
        window_type text,
        window_count text,
        window_style text,
        solar_type text,
        bath_shower_type,
        roof_size text,
        bath_wall_type,
        gutter_material,
        gutter_type,
        walkin_type,
        sun_exposure,
        address text,
        city text,
        state text,
        zipcode text,
        is_owner boolean,
        can_make_changes boolean,
        first_name text,
        last_name text,
        phone text,
        client_ip inet,
        user_agent text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
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
  
  // Reject obviously fake patterns
  const isSuspicious = (
    /^(test|fake|asdf|qwerty|abc|xxx|noemail|noreply|admin)@/i.test(email) ||
    username.length < 2 ||
    /^[0-9]+$/.test(username)
  );
  
  if (isSuspicious) {
    return res.json({
      format_valid: false,
      mx_found: false,
      message: "Please enter a valid email address"
    });
  }

  // List of common domains we consider valid (expanded list)
  const commonDomains = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
    "aol.com", "icloud.com", "protonmail.com", "mail.com",
    "live.com", "msn.com", "ymail.com", "yahoo.co.in",
    "yahoo.co.uk", "outlook.in", "rediffmail.com", "zoho.com",
    "me.com", "mac.com", "comcast.net", "verizon.net",
    "att.net", "sbcglobal.net", "bellsouth.net", "cox.net",
    "charter.net", "earthlink.net", "juno.com", "frontier.com"
  ];
  
  // Skip API for common domains to prevent timeouts
  if (commonDomains.includes(domain)) {
    // For Gmail, do some additional validation
    if (domain === "gmail.com") {
      const isValidGmail = (
        username.length >= 5 && 
        /^[a-z]/i.test(username) && 
        /^[a-z0-9.]+$/i.test(username) && 
        !username.includes('..')
      );
      
      if (!isValidGmail) {
        return res.json({
          format_valid: false,
          mx_found: true,
          message: "This Gmail address appears to be invalid"
        });
      }
    }
    
    // Common domain that passes validation
    return res.json({
      format_valid: true,
      mx_found: true,
      is_disposable: false,
      email: email,
      message: "Common domain verified"
    });
  }

  // For non-common domains, try API but be lenient on failure
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("API request timeout")), 5000)
    );
    
    const fetchPromise = fetch(
      `https://api.apilayer.com/email_verification/check?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: { apikey: process.env.APILAYER_KEY }
      }
    );
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Invalid response format");
    }
    
    const data = await response.json();
    return res.json(data);
    
  } catch (err) {
    console.error("Email verification error:", err.message);
    
    // If API fails, allow through — the format is already validated
    return res.json({
      format_valid: true,
      mx_found: true,
      is_disposable: false,
      email: email,
      message: "Email accepted (API verification unavailable)"
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
