/**
 * DEV / TESTING ONLY
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed test users for role-based navigation and dashboard testing.
 *
 * PASSWORD: "1234" for ALL users — intentionally insecure.
 * This file must NEVER be used in a production or staging environment.
 *
 * SYSTEM ROLES (10 total):
 *   doctor | nurse | pharmacist | lab | radiologist
 *   admin | hr | records | billing | superadmin
 *
 * Run with:
 *   npx ts-node medplum/seed/dev-seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const DEV_PASSWORD = '1234';

export interface DevTestUser {
  /** Login username — also used as email prefix: username@test.emr.local */
  username: string;
  email: string;
  password: string;
  /** Medplum role code stored in ProjectMembership meta.tag */
  role: string;
  /** Department stored in Practitioner extension for routing context */
  department: string;
  displayName: string;
  jobTitle: string;
}

export const testUsers: DevTestUser[] = [

  // ── DOCTORS — clinical-core / encounter ──────────────────────────────────
  {
    username:    'doctor1',
    email:       'doctor1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'doctor',
    department:  'clinical-core',
    displayName: 'Dr. Ada Osei',
    jobTitle:    'Consultant Physician',
  },
  {
    username:    'doctor2',
    email:       'doctor2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'doctor',
    department:  'clinical-core',
    displayName: 'Dr. Emeka Bello',
    jobTitle:    'General Surgeon',
  },

  // ── NURSES — triage / ward ────────────────────────────────────────────────
  {
    username:    'nurse1',
    email:       'nurse1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'nurse',
    department:  'triage',
    displayName: 'Ngozi Adeyemi',
    jobTitle:    'Triage Nurse',
  },
  {
    username:    'nurse2',
    email:       'nurse2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'nurse',
    department:  'ward',
    displayName: 'Fatima Sule',
    jobTitle:    'Ward Nurse',
  },

  // ── ADMIN — front desk / reception / scheduling ───────────────────────────
  {
    username:    'admin1',
    email:       'admin1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'admin',
    department:  'administration',
    displayName: 'Kemi Adeyinka',
    jobTitle:    'Front Desk Officer',
  },
  {
    username:    'admin2',
    email:       'admin2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'admin',
    department:  'administration',
    displayName: 'Dauda Salihu',
    jobTitle:    'Scheduling Officer',
  },

  // ── HR — employee management / staff onboarding ───────────────────────────
  {
    username:    'hr1',
    email:       'hr1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'hr',
    department:  'hr-management',
    displayName: 'Chinyere Obiora',
    jobTitle:    'HR Manager',
  },
  {
    username:    'hr2',
    email:       'hr2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'hr',
    department:  'hr-management',
    displayName: 'Musa Lawal',
    jobTitle:    'HR Officer',
  },

  // ── MEDICAL RECORDS — patient files / document management ─────────────────
  {
    username:    'records1',
    email:       'records1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'records',
    department:  'medical-records',
    displayName: 'Amaka Eze',
    jobTitle:    'Medical Records Officer',
  },
  {
    username:    'records2',
    email:       'records2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'records',
    department:  'medical-records',
    displayName: 'Tunde Fashola',
    jobTitle:    'Medical Records Officer',
  },

  // ── BILLING / HMO — claims, coverage, order authorisation ─────────────────
  {
    username:    'billing1',
    email:       'billing1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'billing',
    department:  'billing',
    displayName: 'Blessing Nwachukwu',
    jobTitle:    'Billing Officer',
  },
  {
    username:    'billing2',
    email:       'billing2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'billing',
    department:  'billing',
    displayName: 'Uche Okafor',
    jobTitle:    'HMO Liaison Officer',
  },

  // ── LABORATORY SCIENTISTS — orders / lab ─────────────────────────────────
  {
    username:    'lab1',
    email:       'lab1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'lab',
    department:  'laboratory',
    displayName: 'Chidera Nwosu',
    jobTitle:    'Medical Laboratory Scientist',
  },
  {
    username:    'lab2',
    email:       'lab2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'lab',
    department:  'laboratory',
    displayName: 'Hauwa Abdullahi',
    jobTitle:    'Medical Laboratory Scientist',
  },

  // ── RADIOLOGY TECHNICIANS — orders / radiology ───────────────────────────
  {
    username:    'rad1',
    email:       'rad1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'radiologist',
    department:  'radiology',
    displayName: 'Segun Adeleke',
    jobTitle:    'Radiographer',
  },
  {
    username:    'rad2',
    email:       'rad2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'radiologist',
    department:  'radiology',
    displayName: 'Ifeoma Dike',
    jobTitle:    'Radiographer',
  },

  // ── PHARMACISTS — orders / pharmacy ──────────────────────────────────────
  {
    username:    'pharmacist1',
    email:       'pharmacist1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'pharmacist',
    department:  'pharmacy',
    displayName: 'Oluwaseun Adebayo',
    jobTitle:    'Clinical Pharmacist',
  },
  {
    username:    'pharmacist2',
    email:       'pharmacist2@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'pharmacist',
    department:  'pharmacy',
    displayName: 'Ramatu Idris',
    jobTitle:    'Clinical Pharmacist',
  },

  // ── SUPERADMIN — infrastructure / system configuration (1 user) ──────────
  {
    username:    'superadmin1',
    email:       'superadmin1@test.emr.local',
    password:    DEV_PASSWORD,
    role:        'superadmin',
    department:  'infrastructure',
    displayName: 'Test Superadmin',
    jobTitle:    'System Administrator',
  },
];

// ── Quick-reference lookup by username ───────────────────────────────────────
export const testUsersByUsername = Object.fromEntries(
  testUsers.map((u) => [u.username, u]),
) as Record<string, DevTestUser>;

// ── Per-role subsets (useful for targeted testing) ────────────────────────────
export const testUsersByRole = testUsers.reduce<Record<string, DevTestUser[]>>(
  (acc, u) => {
    (acc[u.role] ??= []).push(u);
    return acc;
  },
  {},
);
