'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMedplum } from '@medplum/react';

interface RouteGuardProps {
  children: React.ReactNode;
}

/**
 * Client component that protects authenticated routes.
 *
 * Checks the Medplum auth state on mount and after auth state changes.
 * Redirects to /login if the user is not authenticated.
 *
 * Renders a loading state while the auth state is being resolved to avoid
 * flashing unauthenticated content.
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const medplum = useMedplum();
  const router = useRouter();

  const isLoading = medplum.isLoading();
  const isAuthenticated = !!medplum.getActiveLogin();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-hospital-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Will redirect via useEffect — render nothing in the meantime
    return null;
  }

  return <>{children}</>;
}
