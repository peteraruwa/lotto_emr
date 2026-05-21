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
        'flex items-center rounded-xl text-sm font-medium transition-all duration-150 group relative',
        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
        isActive
          ? 'bg-hospital-600 text-white shadow-sm shadow-hospital-600/30'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] flex-shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700',
        )}
      />

      {!collapsed && (
        <span className="truncate leading-none">{item.label}</span>
      )}

      {/* Tooltip shown when collapsed */}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-xl">
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  const medplum    = useMedplum();
  const role       = useRole();
  const membership = medplum.getProjectMembership();

  const config   = role ? getRoleConfig(role) : null;
  const navItems = config?.navItems ?? [];

  const displayName =
    membership?.profile?.display ??
    medplum.getProfile()?.name?.[0]?.text ??
    'User';

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    await medplum.signOut();
    window.location.href = '/login';
  }

  // ── Desktop sidebar ──────────────────────────────────────────────────────────

  const desktopSidebar = (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-gray-100 bg-white flex-shrink-0 transition-all duration-200 ease-in-out',
        collapsed ? 'md:w-[60px]' : 'md:w-[220px]',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b border-gray-100 flex-shrink-0',
          collapsed ? 'justify-center py-[18px] px-0' : 'gap-2.5 px-4 py-[18px]',
        )}
      >
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-hospital-500 to-hospital-700 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-hospital-600/25">
          LC
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">Lotto Central</p>
            <p className="text-[11px] text-gray-400 leading-tight">Hospital EMR</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-3 space-y-0.5 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User + collapse */}
      <div className={cn('border-t border-gray-100 py-3', collapsed ? 'px-2 space-y-1' : 'px-3 space-y-1')}>
        {collapsed ? (
          <div
            title={`${displayName} · ${role ?? ''}`}
            className="flex justify-center py-1.5"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-gray-400 capitalize leading-tight">{role ?? 'Unknown role'}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'w-full flex items-center rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors',
            collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Sign out</span>}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'w-full flex items-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors',
            collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <><PanelLeftClose className="h-4 w-4" /><span className="text-xs font-medium">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );

  // ── Mobile sidebar ───────────────────────────────────────────────────────────

  const mobileSidebar = mobileOpen && (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={() => setMobileOpen(false)}
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col shadow-2xl animate-slide-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-[18px] border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-hospital-500 to-hospital-700 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md shadow-hospital-600/25">
            LC
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Lotto Central</p>
            <p className="text-[11px] text-gray-400 leading-tight">Hospital EMR</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
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
        <div className="border-t border-gray-100 px-3 py-3 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-gray-50">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{displayName}</p>
              <p className="text-[11px] text-gray-400 capitalize leading-tight">{role ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        {/* Close */}
        <button
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </aside>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50/80 overflow-hidden">
      {desktopSidebar}
      {mobileSidebar}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 bg-gradient-to-br from-hospital-500 to-hospital-700 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              LC
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">Lotto Central</p>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className="hidden md:flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">Lotto Central Hospital</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs font-medium text-gray-400 capitalize bg-gray-100 px-2.5 py-1 rounded-full">
              {role ?? ''}
            </span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
