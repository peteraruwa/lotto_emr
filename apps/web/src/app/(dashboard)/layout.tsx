import React from 'react';
import { RouteGuard } from '@/shared/components/route-guard';
import { AppShell } from '@/shared/components/app-shell';

/**
 * Authenticated dashboard shell layout.
 *
 * All routes under (dashboard) require authentication.
 * RouteGuard handles the redirect to /login if the user is not authenticated.
 * AppShell renders the sidebar navigation and header.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
