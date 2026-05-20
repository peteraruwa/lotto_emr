import { Role, ROLES } from './roles';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
}

export interface RoleConfig {
  homeRoute: string;
  navItems: NavItem[];
  allowedActions: string[];
}

/**
 * Role configuration map.
 * Defines the home route, navigation items, and allowed actions for each role.
 *
 * NOTE: This is purely a UX convenience — all security is enforced server-side
 * via Medplum AccessPolicies. Never rely on this for security decisions.
 */
export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  [ROLES.DOCTOR]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard',    href: '/',          icon: 'LayoutDashboard' },
      { label: 'Patients',     href: '/patients',  icon: 'Users' },
      { label: 'Appointments', href: '/schedule',  icon: 'Calendar' },
      { label: 'Ward',         href: '/ward',      icon: 'BedDouble' },
      { label: 'Orders',       href: '/orders',    icon: 'ClipboardList' },
      { label: 'Results',      href: '/results',   icon: 'FlaskConical' },
    ],
    allowedActions: [
      'patient:read',
      'patient:write',
      'encounter:read',
      'encounter:write',
      'order:create',
      'order:read',
      'result:read',
      'note:write',
      'prescription:write',
    ],
  },

  [ROLES.NURSE]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
      { label: 'Patients', href: '/patients', icon: 'Users' },
      { label: 'Schedule', href: '/schedule', icon: 'Calendar' },
      { label: 'Ward', href: '/ward', icon: 'BedDouble' },
      { label: 'Vitals', href: '/results', icon: 'Activity' },
    ],
    allowedActions: [
      'patient:read',
      'encounter:read',
      'encounter:write',
      'vitals:write',
      'medication-admin:write',
      'note:write',
    ],
  },

  [ROLES.PHARMACIST]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
      { label: 'Prescriptions', href: '/orders', icon: 'Pill' },
    ],
    allowedActions: [
      'patient:read',
      'prescription:read',
      'dispense:write',
      'medication:read',
    ],
  },

  [ROLES.LAB]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
      { label: 'Lab Orders', href: '/orders', icon: 'FlaskConical' },
      { label: 'Results', href: '/results', icon: 'BarChart2' },
    ],
    allowedActions: [
      'patient:read',
      'lab-order:read',
      'observation:write',
      'diagnostic-report:write',
      'specimen:write',
    ],
  },

  [ROLES.RADIOLOGIST]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
      { label: 'Imaging Orders', href: '/orders', icon: 'Scan' },
      { label: 'Reports', href: '/results', icon: 'FileText' },
    ],
    allowedActions: [
      'patient:read',
      'imaging-order:read',
      'imaging-study:write',
      'diagnostic-report:write',
    ],
  },

  [ROLES.ADMIN]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
      { label: 'Patients',  href: '/patients',  icon: 'Users' },
      { label: 'Schedule',  href: '/schedule',  icon: 'Calendar' },
      { label: 'Ward',      href: '/ward',      icon: 'BedDouble' },
    ],
    allowedActions: [
      'patient:create', 'patient:update',
      'appointment:write', 'schedule:manage', 'billing:write',
    ],
  },

  [ROLES.SUPERADMIN]: {
    homeRoute: '/',
    navItems: [
      { label: 'Dashboard',  href: '/',          icon: 'LayoutDashboard' },
      { label: 'Employees',  href: '/hr',         icon: 'UsersRound' },
      { label: 'Patients',   href: '/patients',   icon: 'Users' },
      { label: 'Schedule',   href: '/schedule',   icon: 'Calendar' },
      { label: 'Ward',       href: '/ward',       icon: 'BedDouble' },
    ],
    allowedActions: [
      'employee:create', 'employee:read', 'employee:update',
      'patient:create', 'patient:read',
      'appointment:write', 'system:manage',
    ],
  },
};

export function getRoleConfig(role: Role): RoleConfig {
  return ROLE_CONFIG[role];
}
