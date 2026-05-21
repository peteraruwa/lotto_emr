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
  UsersRound,
  Calendar,
  ClipboardList,
  FlaskConical,
  Activity,
  Pill,
  BarChart2,
  Scan,
  FileText,
  FolderOpen,
  BedDouble,
  DollarSign,
  LogOut,
  Menu,
  X,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  UsersRound,
  Calendar,
  ClipboardList,
  FlaskConical,
  Activity,
  Pill,
  BarChart2,
  Scan,
  FileText,
  FolderOpen,
  BedDouble,
  DollarSign,
};

function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.icon] ?? ChevronRight;
  const isActive =
    pathname === item.href ||
    (item.href !== '/' && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center rounded-lg text-sm font-medium transition-colors group relative',
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
        isActive
          ? 'bg-hospital-100 text-hospital-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />

      {/* Label — hidden when collapsed */}
      {!collapsed && <span className="truncate">{item.label}</span>}

      {/* Tooltip shown when collapsed */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
          {item.label}
        </span>
      )}
    </Link>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [collapsed,  setCollapsed]    = useState(false);

  const medplum    = useMedplum();
  const role       = useRole();
  const membership = medplum.getProjectMembership();

  const config   = role ? getRoleConfig(role) : null;
  const navItems = config?.navItems ?? [];

  const displayName =
    membership?.profile?.display ??
    medplum.getProfile()?.name?.[0]?.text ??
    'User';

  async function handleSignOut() {
    await medplum.signOut();
    window.location.href = '/login';
  }

  // ── Desktop sidebar ─────────────────────────────────────────────────────────

  const desktopSidebar = (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-white flex-shrink-0 transition-all duration-200',
        collapsed ? 'md:w-14' : 'md:w-60',
      )}
    >
      {/* Logo row */}
      <div
        className={cn(
          'flex items-center border-b flex-shrink-0',
          collapsed ? 'justify-center px-0 py-4' : 'gap-3 px-4 py-5',
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-hospital-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
          LC
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Lotto Central</p>
            <p className="text-xs text-gray-500">Hospital EMR</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-4 space-y-0.5 overflow-y-auto', collapsed ? 'px-1' : 'px-3')}>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User + collapse toggle */}
      <div className={cn('border-t py-3', collapsed ? 'px-1 space-y-1' : 'px-3 space-y-1')}>
        {/* User info */}
        {collapsed ? (
          <div
            title={`${displayName} · ${role ?? ''}`}
            className="flex justify-center py-2"
          >
            <div className="w-7 h-7 rounded-full bg-hospital-200 flex items-center justify-center text-hospital-700 text-xs font-bold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-hospital-200 flex items-center justify-center text-hospital-700 text-xs font-bold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{role ?? 'Unknown role'}</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'w-full flex items-center rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && 'Sign out'}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full flex items-center rounded-lg text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors',
            collapsed ? 'justify-center px-2 py-2' : 'gap-2 px-3 py-2',
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <><PanelLeftClose className="h-4 w-4" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );

  // ── Mobile sidebar overlay ──────────────────────────────────────────────────

  const mobileSidebar = mobileOpen && (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="fixed inset-0 bg-gray-600/75"
        onClick={() => setMobileOpen(false)}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-60 bg-white flex flex-col shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b">
          <div className="w-8 h-8 bg-hospital-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            LC
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Lotto Central</p>
            <p className="text-xs text-gray-500">Hospital EMR</p>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={false}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>
        {/* User */}
        <div className="border-t px-3 py-3 space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-hospital-200 flex items-center justify-center text-hospital-700 text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{role ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </aside>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {desktopSidebar}
      {mobileSidebar}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-gray-900">Lotto Central Hospital</p>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b flex-shrink-0">
          <p className="text-sm font-semibold text-gray-800">Lotto Central Hospital</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 capitalize">{role ?? ''}</span>
            <div className="w-7 h-7 rounded-full bg-hospital-200 flex items-center justify-center text-hospital-700 text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
