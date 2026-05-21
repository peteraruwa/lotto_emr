/**
 * Seed script — creates all dev/test users in Medplum (local or cloud).
 *
 * Usage:
 *   MEDPLUM_BASE_URL=https://api.medplum.com/ \
 *   MEDPLUM_CLIENT_ID=<client-id> \
 *   MEDPLUM_CLIENT_SECRET=<client-secret> \
 *   MEDPLUM_PROJECT_ID=<project-uuid> \
 *   npx ts-node medplum/seed/seed.ts
 *
 * WARNING: DEV / QA only. Never run against production.
 */

import { MedplumClient } from '@medplum/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { testUsers, DEV_PASSWORD, DevTestUser } from './dev-test-users';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const DEPT_EXTENSION  = 'https://lotto-hospital.local/fhir/StructureDefinition/department';
const ROLE_EXTENSION  = 'https://lotto-hospital.local/fhir/StructureDefinition/system-role';
const HIRE_EXTENSION  = 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment';

async function ensureAccessPolicy(medplum: MedplumClient, role: string): Promise<string> {
  const policyFile = join(__dirname, '../access-policies', `${role}.json`);
  const policyData = JSON.parse(readFileSync(policyFile, 'utf-8'));

  const existing = await medplum.searchOne('AccessPolicy', { name: policyData.name });
  if (existing?.id) return existing.id;

  const created = await medplum.createResource(policyData);
  console.log(`  ✓ Access policy "${policyData.name}" created (${created.id})`);
  return created.id as string;
}

function parseName(displayName: string): { given: string[]; family: string } {
  const clean = displayName.replace(/^Dr\.\s*/i, '');
  const parts  = clean.split(' ');
  const family = parts.pop() ?? '';
  return { given: parts, family };
}

async function seedUser(medplum: MedplumClient, projectId: string, user: DevTestUser): Promise<void> {
  console.log(`\n→ ${user.role.padEnd(11)} ${user.email}`);

  const existing = await medplum.searchOne('ProjectMembership', { email: user.email } as any);
  if (existing) {
    console.log(`  ✓ Already exists — skipping`);
    return;
  }

  const policyId = await ensureAccessPolicy(medplum, user.role);
  const { given, family } = parseName(user.displayName);

  const practitioner = await medplum.createResource({
    resourceType: 'Practitioner',
    active: true,
    name: [{ use: 'official', family, given }],
    telecom: [{ system: 'email', value: user.email, use: 'work' }],
    qualification: [{ code: { text: user.jobTitle } }],
    extension: [
      { url: DEPT_EXTENSION, valueString: user.department },
      { url: ROLE_EXTENSION, valueString: user.role },
      { url: HIRE_EXTENSION, valueDate: new Date().toISOString().slice(0, 10) },
    ],
  });
  console.log(`  ✓ Practitioner created (${practitioner.id})`);

  await medplum.post(`admin/projects/${projectId}/invite`, {
    resourceType: 'Practitioner',
    firstName:    given[0] ?? user.displayName,
    lastName:     family,
    email:        user.email,
    password:     user.password,
    sendEmail:    false,
    membership: {
      accessPolicy: { reference: `AccessPolicy/${policyId}` },
      profile:      { reference: `Practitioner/${practitioner.id}` },
      meta: {
        tag: [{
          system:  ROLE_TAG_SYSTEM,
          code:    user.role,
          display: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        }],
      },
    },
  });
  console.log(`  ✓ Login created — password: ${user.password}`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Seed script must not be run in production.');
    process.exit(1);
  }

  const baseUrl      = process.env.MEDPLUM_BASE_URL      ?? 'https://api.medplum.com/';
  const clientId     = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;
  const projectId    = process.env.MEDPLUM_PROJECT_ID;

  if (!clientId || !clientSecret) {
    console.error('ERROR: Set MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET');
    process.exit(1);
  }
  if (!projectId) {
    console.error('ERROR: Set MEDPLUM_PROJECT_ID (Medplum Admin → Project details)');
    process.exit(1);
  }

  console.log('=== Lotto Central Hospital EMR — Dev Seed ===');
  console.log(`Target:   ${baseUrl}`);
  console.log(`Project:  ${projectId}`);
  console.log(`Users:    ${testUsers.length}`);
  console.log(`Password: ${DEV_PASSWORD}\n`);

  const medplum = new MedplumClient({ baseUrl });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log('✓ Authenticated\n');

  for (const user of testUsers) {
    try {
      await seedUser(medplum, projectId, user);
    } catch (err) {
      console.error(`  ✗ Failed for ${user.email}:`, (err as Error).message);
    }
  }

  console.log('\n=== Seed complete ===');
  console.log('\nCredentials (all users):');
  console.log('  Role        Email                       Password');
  console.log('  ──────────  ──────────────────────────  ─────────────');
  for (const u of testUsers) {
    console.log(`  ${u.role.padEnd(10)}  ${u.email.padEnd(26)}  ${u.password}`);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
