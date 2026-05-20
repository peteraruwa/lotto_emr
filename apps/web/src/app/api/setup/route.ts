import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import type { Practitioner } from '@medplum/fhirtypes';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const STAFF_ID_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/staff-id';

const ACCOUNTS = [
  {
    email: 'hr@lotto-hospital.ng',
    password: 'HRAdmin@2026!',
    firstName: 'Chukwudi',
    lastName: 'Eze',
    jobTitle: 'HR & Systems Administrator',
    department: 'Human Resources',
    role: 'superadmin',
    staffId: 'LCH-2026-00001',
  },
  {
    email: 'admin@lotto-hospital.ng',
    password: 'Admin@2026!',
    firstName: 'Blessing',
    lastName: 'Okafor',
    jobTitle: 'Administrative Officer',
    department: 'Administration',
    role: 'admin',
    staffId: 'LCH-2026-00002',
  },
  {
    email: 'dr.okonkwo@lotto-hospital.ng',
    password: 'Doctor@2026!',
    firstName: 'Chukwuemeka',
    lastName: 'Okonkwo',
    jobTitle: 'Senior Medical Officer',
    department: 'Clinical',
    role: 'doctor',
    staffId: 'LCH-2026-00003',
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.adminEmail || !body?.adminPassword) {
    return NextResponse.json({ error: 'adminEmail and adminPassword are required' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
  // Server-side in-memory storage — avoids sessionStorage (browser-only)
  const store = new Map<string, string>();
  const storage = {
    clear:     () => store.clear(),
    getString: (k: string) => store.get(k),
    setString: (k: string, v: string | undefined) => { v === undefined ? store.delete(k) : store.set(k, v); },
    getObject: <T>(k: string): T | undefined => { const v = store.get(k); return v ? JSON.parse(v) : undefined; },
    setObject: <T>(k: string, v: T | undefined) => { v === undefined ? store.delete(k) : store.set(k, JSON.stringify(v)); },
  };
  const medplum = new MedplumClient({ baseUrl, fetch, storage });

  // Authenticate as the Medplum project owner
  let loginResult: Awaited<ReturnType<typeof medplum.startLogin>>;
  try {
    loginResult = await medplum.startLogin({
      email: body.adminEmail,
      password: body.adminPassword,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Login failed: ${(err as Error).message}` },
      { status: 401 },
    );
  }

  if (!loginResult.code) {
    return NextResponse.json(
      { error: 'Login did not return a code — MFA or unexpected response. Disable MFA and retry.' },
      { status: 401 },
    );
  }

  await medplum.processCode(loginResult.code);

  const projectId = medplum.getProject()?.id;
  if (!projectId) {
    return NextResponse.json({ error: 'Could not determine project ID after login' }, { status: 500 });
  }

  const results: { email: string; role: string; password: string; status: string; error?: string }[] = [];

  for (const account of ACCOUNTS) {
    try {
      const existing = await medplum.searchOne('ProjectMembership', { profile: `Practitioner?telecom=${account.email}` } as any);
      if (existing) {
        results.push({ email: account.email, role: account.role, password: account.password, status: 'already_exists' });
        continue;
      }

      const practitioner = await medplum.createResource<Practitioner>({
        resourceType: 'Practitioner',
        active: true,
        identifier: [{ system: STAFF_ID_SYSTEM, value: account.staffId }],
        name: [{ use: 'official', given: [account.firstName], family: account.lastName }],
        telecom: [{ system: 'email', value: account.email, use: 'work' }],
        qualification: [{ code: { text: account.jobTitle } }],
        extension: [
          { url: 'https://lotto-hospital.local/fhir/StructureDefinition/department',        valueString: account.department },
          { url: 'https://lotto-hospital.local/fhir/StructureDefinition/system-role',       valueString: account.role },
          { url: 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment',valueDate:   new Date().toISOString().slice(0, 10) },
        ],
      });

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

      results.push({ email: account.email, role: account.role, password: account.password, status: 'created' });
    } catch (err) {
      results.push({
        email: account.email,
        role: account.role,
        password: account.password,
        status: 'error',
        error: (err as Error).message,
      });
    }
  }

  return NextResponse.json({ projectId, results });
}
