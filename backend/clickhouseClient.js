import { createClient } from "@clickhouse/client";

// Build the connection config from CLICKHOUSE_* env vars. Mirrors the robust URL
// handling that used to live in server.js (accepts an http(s):// prefix, injects
// the port when missing, otherwise composes protocol://host:port).
function readConfig() {
  const host     = String(process.env.CLICKHOUSE_HOST || process.env.CLICKHOUSE_URL || "").trim();
  const port     = Number(process.env.CLICKHOUSE_PORT || 8443);
  const protocol = String(process.env.CLICKHOUSE_PROTOCOL || "https").trim();
  const database = String(process.env.CLICKHOUSE_DATABASE || "default").trim();
  const username = String(process.env.CLICKHOUSE_USERNAME || "default").trim();
  const password = String(process.env.CLICKHOUSE_PASSWORD || "").trim();

  let url = "";
  if (host) {
    if (/^https?:\/\//i.test(host)) {
      const parsed = new URL(host);
      if (!parsed.port) parsed.port = String(port);
      url = parsed.toString().replace(/\/$/, "");
    } else {
      url = `${protocol}://${host}:${port}`;
    }
  }
  return { url, database, username, password };
}

let _client = null;
let _resolved = false; // cache the null (unconfigured) result too

// Returns a single shared, connection-pooled ClickHouse client reused across the
// server and all cron jobs. Returns null when CLICKHOUSE_* is not configured
// (callers already null-check). Lazy + memoized so env is read after dotenv runs.
export function getClickhouse() {
  if (_resolved) return _client;
  const { url, database, username, password } = readConfig();
  if (!(url && username && password)) {
    _client = null;
    _resolved = true;
    return null;
  }
  _client = createClient({
    url,
    database,
    username,
    password,
    request_timeout: 45000,
    keep_alive: { enabled: true },
    max_open_connections: Number(process.env.CLICKHOUSE_MAX_OPEN_CONNECTIONS || 10),
  });
  _resolved = true;
  return _client;
}

// Close the shared client once on process shutdown.
export async function closeClickhouse() {
  if (_client) {
    try { await _client.close(); } catch { /* ignore */ }
  }
  _client = null;
  _resolved = false;
}

// Test-only: forget the memoized client. Vitest isolates module state per file,
// not per case, so tests can reset between cases if needed.
export function __resetClickhouseForTests() {
  _client = null;
  _resolved = false;
}
