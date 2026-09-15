import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/**
 * Loads backend/.env into process.env.
 *
 * This lives in its own module and is imported first by server.js
 * because ES imports are hoisted: putting this code inline would run it
 * *after* lp.js had already read LEADPROSPER_API_KEY and captured
 * undefined.
 *
 * Values already present in the environment win, so a shell override
 * still takes effect.
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
    process.env[key] = line.slice(eq + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
  }
}
