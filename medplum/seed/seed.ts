/**
 * Seed script: creates test users in a local Medplum instance and assigns role-based access policies.
 *
 * Usage:
 *   MEDPLUM_BASE_URL=http://localhost:8103 \
 *   MEDPLUM_CLIENT_ID=... \
 *   MEDPLUM_CLIENT_SECRET=... \
 *   npx ts-node medplum/seed/seed.ts
 *
 * WARNING: For development/QA environments only. Never run against production.
 */

import { MedplumClient } from '@medplum/core';
import { readFileSync } from 'fs';
import { join } from 'path';

interface SeedUser {
  email: string;
  role: string;
  name: string;
  specialty?: string;
}

interface SeedData {
  _comment: string;
  users: SeedUser[];
}

const TEMP_PASSWORD = 'TestPass!2024';

async function getMedplumClient(): Promise<MedplumClient> {
  const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'http://localhost:8103/';
  const clientId = process.env.MEDPLUM_CLIENT_ID;
  const clientSecret = process.env.MEDPLUM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('MEDPLUM_CLIENT_ID and MEDPLUM_CLIENT_SECRET must be set');
  }

  const medplum = new MedplumClient({ baseUrl });
  await medplum.startClientLogin(clientId, clientSecret);
  console.log(`Connected to Medplum at ${baseUrl}`);
  return medplum;
}

function parseName(fullName: string): { given: string[]; family: string } {
  const parts = fullName.replace(/^Dr\.\s*/i, '').split(' ');
  const family = parts.pop() ?? '';
  return { given: parts, family };
}

async function ensureAccessPolicy(medplum: MedplumClient, role: string): Promise<string> {
  const policyFile = join(__dirname, '../access-policies', `${role}.json`);
  const policyData = JSON.parse(readFileSync(policyFile, 'utf-8'));

  // Try to find an existing policy with the same name
  const existing = await medplum.searchOne('AccessPolicy', {
    name: policyData.name,
  });

  if (existing?.id) {
    console.log(`  Access policy "${policyData.name}" already exists (id=${existing.id})`);
    return existing.id;
  }

  const created = await medplum.createResource(policyData);
  console.log(`  Created access policy "${policyData.name}" (id=${created.id})`);
  return created.id as string;
}

async function seedUser(medplum: MedplumClient, user: SeedUser): Promise<void> {
  console.log(`\nSeeding user: ${user.name} <${user.email}> (role=${user.role})`);

  // 1. Ensure the access policy exists
  const policyId = await ensureAccessPolicy(medplum, user.role);

  // 2. Check if user already exists
  const existingInvite = await medplum.searchOne('ProjectMembership', {
    email: user.email,
  });

  if (existingInvite) {
    console.log(`  User ${user.email} already has a membership. Skipping creation.`);
    return;
  }

  // 3. Create the Practitioner resource
  const { given, family } = parseName(user.name);
  const practitioner = await medplum.createResource({
    resourceType: 'Practitioner',
    name: [{ use: 'official', family, given }],
    telecom: [{ system: 'email', value: user.email, use: 'work' }],
    ...(user.specialty
      ? {
          qualification: [
            {
              code: {
                text: user.specialty,
                coding: [{ system: 'http://snomed.info/sct', display: user.specialty }],
              },
            },
          ],
        }
      : {}),
  });

  console.log(`  Created Practitioner (id=${practitioner.id})`);

  // 4. Invite the user to the project — this creates ProjectMembership
  const project = await medplum.searchOne('Project', {});
  const projectId = project?.id;
  if (!projectId) throw new Error('Could not determine project ID from client credentials');

  const membership = await medplum.post(`admin/projects/${projectId}/invite`, {
    resourceType: 'Practitioner',
    firstName: given[0] ?? user.name,
    lastName: family,
    email: user.email,
    password: TEMP_PASSWORD,
    sendEmail: false,
    membership: {
      accessPolicy: { reference: `AccessPolicy/${policyId}` },
      profile: { reference: `Practitioner/${practitioner.id}` },
      // Store the role as a tag for the useRole() hook to read
      meta: {
        tag: [
          {
            system: 'https://lotto-hospital.local/fhir/role',
            code: user.role,
            display: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          },
        ],
      },
    },
  });

  console.log(`  Invited user (membership=${JSON.stringify(membership)})`);
  console.log(`  Temporary password: ${TEMP_PASSWORD} (user must change on first login)`);
}

async function main(): Promise<void> {
  const env = process.env.NODE_ENV ?? 'development';
  if (env === 'production') {
    console.error('ERROR: Seed script must not be run in production.');
    process.exit(1);
  }

  const seedFile = join(__dirname, 'test-users.json');
  const seedData: SeedData = JSON.parse(readFileSync(seedFile, 'utf-8'));

  console.log('=== Lotto Central Hospital EMR — Seed Script ===');
  console.log(seedData._comment);
  console.log(`Seeding ${seedData.users.length} users...`);

  const medplum = await getMedplumClient();

  for (const user of seedData.users) {
    try {
      await seedUser(medplum, user);
    } catch (err) {
      console.error(`  ERROR seeding ${user.email}:`, err);
    }
  }

  console.log('\n=== Seed complete ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
