/**
 * Dev Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds all test users from dev-test-users.ts into a local Medplum instance.
 * Uses password "1234" for every account — FOR DEVELOPMENT ONLY.
 *
 * Usage:
 *   MEDPLUM_BASE_URL=http://localhost:8103 \
 *   MEDPLUM_CLIENT_ID=<id> \
 *   MEDPLUM_CLIENT_SECRET=<secret> \
 *   npx ts-node medplum/seed/dev-seed.ts
 *
 * Re-running is safe — existing users are skipped (idempotent).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { MedplumClient } from '@medplum/core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { testUsers, type DevTestUser } from './dev-test-users';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const DEPT_EXT_URL    = 'https://lotto-hospital.local/fhir/StructureDefinition/department';

async function getMedplumClient(): Promise<MedplumClient> {
  const baseUrl      = process.env.MEDPLUM_BASE_URL ?? 'http://localhost:8103/';
  const clientId     = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET must be set');
  }

  const medplum = new MedplumClient({ baseUrl });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log(`Connected to Medplum at ${baseUrl}`);
  return medplum;
}

async function ensureAccessPolicy(medplum: MedplumClient, role: string): Promise<string> {
  const policyFile = join(__dirname, '../access-policies', `${role}.json`);
  const policyData = JSON.parse(readFileSync(policyFile, 'utf-8'));

  const existing = await medplum.searchOne('AccessPolicy', { name: policyData.name });
  if (existing?.id) return existing.id;

  const created = await medplum.createResource(policyData);
  console.log(`  Created access policy "${policyData.name}" (id=${created.id})`);
  return created.id as string;
}

function splitDisplayName(displayName: string): { given: string[]; family: string } {
  const parts = displayName.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  const family = parts.pop() ?? '';
  return { given: parts.length ? parts : [displayName], family };
}

async function seedDevUser(
  medplum: MedplumClient,
  user: DevTestUser,
  projectId: string,
): Promise<void> {
  console.log(`\n  ${user.username} (${user.role} / ${user.department})`);

  const policyId = await ensureAccessPolicy(medplum, user.role);

  // Skip if already invited
  const existing = await medplum.searchOne('ProjectMembership', { email: user.email });
  if (existing) {
    console.log(`    Already exists — skipping`);
    return;
  }

  const { given, family } = splitDisplayName(user.displayName);

  const practitioner = await medplum.createResource({
    resourceType: 'Practitioner',
    name: [{ use: 'official', family, given }],
    telecom: [{ system: 'email', value: user.email, use: 'work' }],
    extension: [
      { url: DEPT_EXT_URL, valueString: user.department },
    ],
    qualification: [
      {
        code: {
          text: user.jobTitle,
          coding: [{ system: 'http://snomed.info/sct', display: user.jobTitle }],
        },
      },
    ],
  });

  await medplum.post(`admin/projects/${projectId}/invite`, {
    resourceType: 'Practitioner',
    firstName:   given[0],
    lastName:    family,
    email:       user.email,
    password:    user.password,
    sendEmail:   false,
    membership: {
      accessPolicy: { reference: `AccessPolicy/${policyId}` },
      profile:      { reference: `Practitioner/${practitioner.id}` },
      meta: {
        tag: [
          {
            system:  ROLE_TAG_SYSTEM,
            code:    user.role,
            display: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          },
        ],
      },
    },
  });

  console.log(`    Created — login: ${user.email} / password: ${user.password}`);
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: dev-seed must not be run in production.');
    process.exit(1);
  }

  console.log('══════════════════════════════════════════════════════════════');
  console.log('  Lotto Central Hospital EMR — Dev Seed (navigation testing)');
  console.log('  ⚠  Password for all users: 1234  —  NEVER use in production');
  console.log('══════════════════════════════════════════════════════════════');

  const medplum   = await getMedplumClient();
  const project   = await medplum.searchOne('Project', {});
  const projectId = project?.id;
  if (!projectId) throw new Error('Could not determine project ID');

  console.log(`\nSeeding ${testUsers.length} test users into project ${projectId}...\n`);

  let created = 0;
  let skipped = 0;

  for (const user of testUsers) {
    try {
      const before = created;
      await seedDevUser(medplum, user, projectId);
      if (created === before) skipped++;
      else created++;
    } catch (err) {
      console.error(`    ERROR for ${user.username}:`, err);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  Done — ${testUsers.length} users processed`);
  console.log(`         Skipped (already exist): ${skipped}`);
  console.log('');
  console.log('  CREDENTIALS SUMMARY');
  console.log('  ─────────────────────────────────────────────────────────');

  const byRole: Record<string, DevTestUser[]> = {};
  for (const u of testUsers) {
    (byRole[u.role] ??= []).push(u);
  }

  for (const [role, users] of Object.entries(byRole)) {
    console.log(`\n  ${role.toUpperCase()}`);
    for (const u of users) {
      console.log(`    ${u.username.padEnd(14)} ${u.email.padEnd(32)} → ${u.department}`);
    }
  }

  console.log('\n  All passwords: 1234');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
