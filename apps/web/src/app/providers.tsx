'use client';

import React, { useState } from 'react';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { env } from '@/shared/config/env';

// Create a stable MedplumClient instance — must be outside the component
// to survive re-renders, but inside the module boundary so it's client-only.
const medplumClient = new MedplumClient({
  baseUrl: env.medplumBaseUrl,
  clientId: env.medplumClientId,
  onUnauthenticated: () => {
    // Redirect to login when the session expires
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root client-side providers for the Lotto Central Hospital EMR.
 *
 * Wraps the component tree with:
 * - MedplumProvider: FHIR client context and auth state
 * - QueryClientProvider: React Query for server state management
 */
export function Providers({ children }: ProvidersProps) {
  // Create the QueryClient inside useState so it's stable across HMR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Clinical data should be reasonably fresh — stale after 30s
            staleTime: 30_000,
            // Retry failed requests up to 2 times (FHIR server might be briefly unavailable)
            retry: 2,
            refetchOnWindowFocus: false, // Avoid unexpected refetches in clinical workflows
          },
          mutations: {
            retry: 0, // Never auto-retry mutations (writes) — be explicit
          },
        },
      })
  );

  return (
    <MedplumProvider medplum={medplumClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MedplumProvider>
  );
}
