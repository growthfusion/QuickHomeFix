import { createMockClient } from './mockClient.js'
import { createHttpClient } from './httpClient.js'

/**
 * Selects the LeadProsper client. This is the seam between "data we made
 * up" and "data from the source of record" -- keeping it to one function
 * means nothing else in the codebase needs to know which is in use.
 */
export function createLeadProsperClient(env = process.env) {
  const mode = env.LEADPROSPER_MODE ?? 'mock'

  switch (mode) {
    case 'mock':
      return createMockClient({
        seed: Number(env.MOCK_SEED ?? 42),
        days: Number(env.MOCK_DAYS ?? 180),
        baseDaily: Number(env.MOCK_BASE_DAILY ?? 60),
      })

    case 'live':
      return createHttpClient({
        apiKey: env.LEADPROSPER_API_KEY,
        timezone: env.LP_TIMEZONE ?? 'America/New_York',
        // Must include the /public prefix: the endpoints live under it,
        // and a bare host here overrides httpClient's correct default
        // and yields 401 on every call.
        baseUrl: env.LEADPROSPER_BASE_URL ?? 'https://api.leadprosper.io/public',
      })

    default:
      throw new Error(`unknown LEADPROSPER_MODE: ${mode} (expected mock|live)`)
  }
}
