'use client';

import { useMedplum } from '@medplum/react';
import type { ProfileResource } from '@medplum/core';

interface UseAuthReturn {
  user: ProfileResource | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

/**
 * Returns current auth state and sign-out function.
 */
export function useAuth(): UseAuthReturn {
  const medplum = useMedplum();

  const isAuthenticated = !!medplum.getActiveLogin();
  const isLoading = medplum.isLoading();
  const user = medplum.getProfile() as ProfileResource | undefined;

  async function signOut() {
    await medplum.signOut();
    window.location.href = '/login';
  }

  return { user, isAuthenticated, isLoading, signOut };
}
