/**
 * Typed environment configuration for the web app.
 *
 * Validates required environment variables at startup and throws
 * an informative error if any are missing.
 */

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Set it in your .env file or deployment environment.`
    );
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  /** Base URL for the Medplum FHIR server (public, used in browser) */
  medplumBaseUrl: optionalEnv(
    'NEXT_PUBLIC_MEDPLUM_BASE_URL',
    'http://localhost:8103/'
  ),

  /** OAuth2 client ID for the web app (public) */
  medplumClientId: optionalEnv('NEXT_PUBLIC_MEDPLUM_CLIENT_ID'),

  /** Server-side: internal Medplum URL (not exposed to browser) */
  medplumServerUrl: optionalEnv('MEDPLUM_BASE_URL', 'http://localhost:8103/'),

  /** Current Node environment */
  nodeEnv: optionalEnv('NODE_ENV', 'development'),

  /** Whether we are running in production */
  isProduction: process.env.NODE_ENV === 'production',

  /** Whether we are running in development */
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

export type Env = typeof env;
