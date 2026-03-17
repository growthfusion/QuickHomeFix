// Simple, safe fetch wrapper for your app
// Empty string means requests go through Vite proxy in dev (avoids CORS)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const timeoutFromEnv = Number(import.meta.env.VITE_API_TIMEOUT_MS || 90000);
const API_TIMEOUT_MS =
    Number.isFinite(timeoutFromEnv) && timeoutFromEnv > 0 ? timeoutFromEnv : 90000;

function assertApiBase() {
    // allow empty string (Vite proxy mode)
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
    let didTimeout = false;
    const timeout = setTimeout(() => {
        didTimeout = true;
        ctrl.abort();
    }, API_TIMEOUT_MS);

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
    } catch (err) {
        if (err?.name === "AbortError") {
            const message = didTimeout
                ? `Request timed out after ${Math.round(API_TIMEOUT_MS / 1000)} seconds. Please try again.`
                : "Request was cancelled. Please try again.";
            throw new Error(message);
        }
        throw err;
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
