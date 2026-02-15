/**
 * Frontend configuration from environment (.env).
 * VITE_API_URL defaults to localhost:8000 when unset so the app runs without .env.
 */

function getEnv(key: string): string {
  const val = import.meta.env[key]
  return typeof val === 'string' ? val.trim() : ''
}

const VITE_API_URL = getEnv('VITE_API_URL') || 'http://localhost:8000'

export const config = {
  apiUrl: VITE_API_URL,
} as const
