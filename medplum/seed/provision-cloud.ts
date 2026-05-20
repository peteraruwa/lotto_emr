/**
 * provision-cloud.ts
 *
 * Creates the three core hospital accounts directly on Medplum Cloud.
 * Run this once after deploying to Vercel to activate login for:
 *
 *   hr@lotto-hospital.ng        / HRAdmin@2026!   (Super Admin / HR)
 *   admin@lotto-hospital.ng     / Admin@2026!     (Admin)
 *   dr.okonkwo@lotto-hospital.ng / Doctor@2026!  (Doctor)
 *
 * Prerequisites
 * ─────────────
 * 1. Log into https://app.medplum.com
 * 2. Open your project → Admin → Client Applications → "New client"
 *    Enable "Client credentials" and copy the Client ID + Client Secret.
 * 3. Find your Project ID: Admin → Project details → copy the UUID from the URL.
 *
 * Run
 * ───
 *   MEDPLUM_BASE_URL=https://api.medplum.com/ \
 *   MEDPLUM_CLIENT_ID=<client-id> \
 *   MEDPLUM_CLIENT_SECRET=<client-secret> \
 *   MEDPLUM_PROJECT_ID=<project-uuid> \
 *   npx ts-node medplum/seed/provision-cloud.ts
 */

import { MedplumClient } from '@medplum/core';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const STAFF_ID_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/staff-id';

interface Account {
  email:      string;
  password:   string;
  firstName:  string;
  lastName:   string;
  jobTitle:   string;
  department: string;
  role:       string;
  staffId:    string;
}

const ACCOUNTS: Account[] = [
  {
    email:      'hr@lotto-hospital.ng',
    password:   'HRAdmin@2026!',
    firstName:  'Chukwudi',
    lastName:   'Eze',
    jobTitle:   'HR & Systems Administrator',
    department: 'Human Resources',
    role:       'superadmin',
    staffId:    'LCH-2026-00001',
  },
  {
    email:      'admin@lotto-hospital.ng',
    password:   'Admin@2026!',
    firstName:  'Blessing',
    lastName:   'Okafor',
    jobTitle:   'Administrative Officer',
    department: 'Administration',
    role:       'admin',
    staffId:    'LCH-2026-00002',
  },
  {
    email:      'dr.okonkwo@lotto-hospital.ng',
    password:   'Doctor@2026!',
    firstName:  'Chukwuemeka',
    lastName:   'Okonkwo',
    jobTitle:   'Senior Medical Officer',
    department: 'Clinical',
    role:       'doctor',
    staffId:    'LCH-2026-00003',
  },
];

async function provisionAccount(
  medplum: MedplumClient,
  projectId: string,
  account: Account,
): Promise<void> {
  console.log(`\n→ Provisioning ${account.role}: ${account.email}`);

  // Skip if membership already exists
  const existing = await medplum.searchOne('ProjectMembership', { email: account.email } as any);
  if (existing) {
    console.log(`  ✓ Already exists — skipping`);
    return;
  }

  // 1. Create Practitioner (biodata)
  const practitioner = await medplum.createResource({
    resourceType: 'Practitioner',
    active: true,
    identifier: [{ system: STAFF_ID_SYSTEM, value: account.staffId }],
    name: [{ use: 'official', given: [account.firstName], family: account.lastName }],
    telecom: [
      { system: 'email', value: account.email, use: 'work' },
    ],
    qualification: [{ code: { text: account.jobTitle } }],
    extension: [
      { url: 'https://lotto-hospital.local/fhir/StructureDefinition/department',   valueString: account.department },
      { url: 'https://lotto-hospital.local/fhir/StructureDefinition/system-role',  valueString: account.role },
      { url: 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment', valueDate: new Date().toISOString().slice(0, 10) },
    ],
  });
  console.log(`  ✓ Practitioner created (id=${practitioner.id})`);

  // 2. Invite — creates login + ProjectMembership with role tag
  await medplum.post(`admin/projects/${projectId}/invite`, {
    resourceType: 'Practitioner',
    firstName:    account.firstName,
    lastName:     account.lastName,
    email:        account.email,
    password:     account.password,
    sendEmail:    false,
    membership: {
      profile: { reference: `Practitioner/${practitioner.id}` },
      meta: {
        tag: [{
          system:  ROLE_TAG_SYSTEM,
          code:    account.role,
          display: account.role.charAt(0).toUpperCase() + account.role.slice(1),
        }],
      },
    },
  });
  console.log(`  ✓ Login created — ${account.email} / ${account.password}`);
}

async function main(): Promise<void> {
  const baseUrl       = process.env.MEDPLUM_BASE_URL       ?? 'https://api.medplum.com/';
  const clientId      = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret  = process.env.MEDPLUM_CLIENT_SECRET;
  const projectId     = process.env.MEDPLUM_PROJECT_ID;

  if (!clientId || !clientSecret) {
    console.error('ERROR: Set MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET');
    process.exit(1);
  }
  if (!projectId) {
    console.error('ERROR: Set MEDPLUM_PROJECT_ID (find it in Medplum Admin → Project)');
    process.exit(1);
  }

  console.log('=== Lotto Central Hospital — Cloud Provisioning ===');
  console.log(`Target: ${baseUrl}`);
  console.log(`Project: ${projectId}`);

  const medplum = new MedplumClient({ baseUrl });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log('✓ Authenticated\n');

  for (const account of ACCOUNTS) {
    try {
      await provisionAccount(medplum, projectId, account);
    } catch (err) {
      console.error(`  ✗ Failed for ${account.email}:`, (err as Error).message);
    }
  }

  console.log('\n=== Done ===');
  console.log('\nLogin credentials:');
  console.log('  Role        Email                            Password');
  console.log('  ──────────  ───────────────────────────────  ─────────────');
  for (const a of ACCOUNTS) {
    console.log(`  ${a.role.padEnd(10)}  ${a.email.padEnd(33)}  ${a.password}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
