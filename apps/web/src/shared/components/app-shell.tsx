'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMedplum } from '@medplum/react';
import { useRole } from '@/shared/rbac/use-role';
import { getRoleConfig, NavItem } from '@/shared/rbac/role-config';
import { cn } from '@lotto-emr/ui';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FlaskConical,
  Activity,
  Pill,
  BarChart2,
  Scan,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  FlaskConical,
  Activity,
  Pill,
  BarChart2,
  Scan,
  FileText,
};

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.icon] ?? ChevronRight;
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-hospital-100 text-hospital-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Main application shell with sidebar navigation and header.
 * Navigation items are determined by the current user's role.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const medplum = useMedplum();
  const role = useRole();
  const membership = medplum.getProjectMembership();

  const config = role ? getRoleConfig(role) : null;
  const navItems = config?.navItems ?? [];

  const displayName =
    membership?.profile?.display ??
    medplum.getProfile()?.name?.[0]?.text ??
    'User';

  async function handleSignOut() {
    await medplum.signOut();
    window.location.href = '/login';
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <div className="flex-shrink-0 w-8 h-8 bg-hospital-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
          LC
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Lotto Central</p>
          <p className="text-xs text-gray-500">Hospital EMR</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* User section */}
      <div className="border-t px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-hospital-200 flex items-center justify-center text-hospital-700 text-xs font-bold flex-shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 capitalize">{role ?? 'Unknown role'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:border-r md:bg-white flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white flex flex-col shadow-xl">
            {sidebarContent}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-gray-900">Lotto Central Hospital</p>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
