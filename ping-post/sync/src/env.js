import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * Loads sync/.env into process.env.
 *
 * Mirrors backend/src/env.js. It lives in its own module and is imported
 * first because ES imports are hoisted: inline code here would run
 * *after* clickhouse.js had already read CLICKHOUSE_URL and captured the
 * localhost default -- which fails silently against the wrong server
 * rather than erroring.
 *
 * Values already in the environment win, so Cloud Run's injected config
 * and shell overrides still take precedence over the file.
 */
const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue

    const key = line.slice(0, eq).trim()
    if (process.env[key] !== undefined) continue

    // Strip one layer of matching quotes; anything else is literal.
    // Trailing inline comments are NOT stripped -- a value containing
    // '#' is legal, so keep them on their own line.
    process.env[key] = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
}
