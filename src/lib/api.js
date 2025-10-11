// Simple, safe fetch wrapper for your app
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function assertApiBase() {
    if (!API_BASE) throw new Error("VITE_API_BASE_URL is not set");
}

// Parse JSON safely (some endpoints may return empty text or HTML error pages)
async function parseJsonSafely(res) {
    const text = await res.text();
    if (!text) return null; // e.g., 204 No Content
    try {
        return JSON.parse(text);
    } catch {
        // return as text to make debugging easier
        return { _raw: text };
    }
}

async function http(path, init) {
    assertApiBase();

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000); // 15s safety

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
            signal: ctrl.signal,
            ...init,
        });

        const data = await parseJsonSafely(res);

        if (!res.ok) {
            const message =
                (data && (data.message || data.error)) ||
                `HTTP ${res.status}` +
                (data && data._raw ? ` — ${String(data._raw).slice(0, 200)}` : "");
            throw new Error(message);
        }
        return data;
    } finally {
        clearTimeout(timeout);
    }
}

/** Save a lead (used in your AddressSteps component) */
export async function submitLead(payload) {
    return http("/api/leads", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/** Optional helpers you’re already hitting from curl */
export async function getLeadsCount() {
    return http("/api/leads/count");
}
export async function getLatestLeads() {
    return http("/api/leads/latest");
}

/** Google Places proxies (your AddressSteps uses these) */
export async function placesAutocomplete(input) {
    const q = new URLSearchParams({ input });
    return http(`/api/places/autocomplete?${q.toString()}`);
}
export async function placeDetails(place_id) {
    const q = new URLSearchParams({ place_id });
    return http(`/api/places/details?${q.toString()}`);
}
