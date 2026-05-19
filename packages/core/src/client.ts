import { MedplumClient } from '@medplum/core';

let _instance: MedplumClient | null = null;

export interface MedplumClientConfig {
  baseUrl?: string;
  clientId?: string;
  /** Called when the access token is refreshed — use to persist the token. */
  onUnauthenticated?: () => void;
}

/**
 * Returns a singleton MedplumClient configured for Lotto Central Hospital.
 *
 * In the browser (Next.js), the singleton is scoped to the module lifetime.
 * In Node.js (bots, scripts), call `createMedplumClient()` instead to get
 * a fresh instance with explicit credentials.
 */
export function getMedplumClient(config: MedplumClientConfig = {}): MedplumClient {
  if (_instance) {
    return _instance;
  }

  const baseUrl =
    config.baseUrl ??
    (typeof process !== 'undefined' ? process.env.MEDPLUM_BASE_URL : undefined) ??
    'http://localhost:8103/';

  _instance = new MedplumClient({
    baseUrl,
    clientId: config.clientId,
    onUnauthenticated: config.onUnauthenticated,
    // Retry transient failures up to 3 times
    fetch: globalThis.fetch,
  });

  return _instance;
}

/**
 * Creates a new MedplumClient instance (not a singleton).
 * Use in bots and server-side scripts where you need explicit credential control.
 */
export function createMedplumClient(config: MedplumClientConfig = {}): MedplumClient {
  const baseUrl =
    config.baseUrl ??
    (typeof process !== 'undefined' ? process.env.MEDPLUM_BASE_URL : undefined) ??
    'http://localhost:8103/';

  return new MedplumClient({
    baseUrl,
    clientId: config.clientId,
    onUnauthenticated: config.onUnauthenticated,
    fetch: globalThis.fetch,
  });
}

/** Clears the cached singleton — useful in tests. */
export function clearMedplumClientSingleton(): void {
  _instance = null;
}
