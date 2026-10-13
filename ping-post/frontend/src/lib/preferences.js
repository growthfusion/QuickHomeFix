/**
 * Per-browser preferences, saved to localStorage.
 *
 * There is no login yet -- the header's Account ID/IP are fixed
 * placeholders, not a real session -- so "settings" here means
 * per-device defaults, not a per-user profile. Read once at filter
 * initialisation, same as any other default.
 */
const KEY = 'hsp:preferences'

const DEFAULTS = {
  defaultPeriod: 'mtd',
  defaultVertical: '',
}

export function getPreferences() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function setPreferences(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getPreferences(), ...next }))
  } catch {
    // Private window or storage disabled: preferences just don't persist.
  }
}
