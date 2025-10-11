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
      origin: process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : true,
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
        "SELECT id, service, city, state, zipcode, created_at FROM leads ORDER BY created_at DESC LIMIT 5"
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
        bathshower_type, bathwall_type, gutter_material, gutter_type, walkin_type, sunexposure
      )
      VALUES (
               $1,$2,$3,$4,$5,
               $6,$7,$8,$9,$10,
               $11,$12,$13,$14,$15,
               $16,$17,$18,$19,$20,
               $21,$22,$23,$24,$25,
               $26,$27
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
