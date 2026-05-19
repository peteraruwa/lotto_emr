import { MedplumClient } from '@medplum/core';

let _client: MedplumClient | null = null;

/**
 * Returns the singleton MedplumClient for the web app.
 * Reads connection settings from public environment variables.
 *
 * Only use this outside of React components.
 * Inside React components, use `useMedplum()` from @medplum/react instead.
 */
export function getWebMedplumClient(): MedplumClient {
  if (_client) return _client;

  const baseUrl =
    process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'http://localhost:8103/';
  const clientId = process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID;

  _client = new MedplumClient({
    baseUrl,
    clientId,
    onUnauthenticated: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });

  return _client;
}
