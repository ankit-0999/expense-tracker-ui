/**
 * Frontend configuration from environment (.env).
 * All values are loaded via Vite's import.meta.env; no hardcoded defaults.
 */

function getEnv(key: string): string {
  const val = import.meta.env[key]
  return typeof val === 'string' ? val.trim() : ''
}

const VITE_API_URL = getEnv('VITE_API_URL')

if (!VITE_API_URL) {
  throw new Error(
    'VITE_API_URL is not set. Copy .env.example to .env and set VITE_API_URL (e.g. your backend URL).'
  )
}

export const config = {
  apiUrl: VITE_API_URL,
} as const
