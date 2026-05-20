import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import type { Practitioner } from '@medplum/fhirtypes';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const STAFF_ID_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/staff-id';

const ACCOUNTS = [
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

// ── Auth helpers (raw fetch — no MedplumClient, no browser APIs) ──────────────

async function getAccessToken(baseUrl: string, email: string, password: string): Promise<string> {
  // PKCE using Node.js crypto (no window/sessionStorage)
  const verifier  = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  // Step 1 — login
  const loginRes = await fetch(`${baseUrl}auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      remember:            false,
      codeChallenge:       challenge,
      codeChallengeMethod: 'S256',
    }),
  });

  const loginData = await loginRes.json().catch(() => ({}));

  if (!loginRes.ok) {
    throw new Error(
      loginData?.issue?.[0]?.details?.text ??
      loginData?.error_description ??
      `Login failed (HTTP ${loginRes.status})`,
    );
  }
  if (loginData?.mfaRequired) {
    throw new Error('MFA is enabled — disable it in Medplum settings and retry.');
  }
  if (!loginData?.code) {
    throw new Error('Medplum did not return an auth code. Check your email / password.');
  }

  // Step 2 — exchange code for token
  const tokenRes = await fetch(`${baseUrl}oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code:          loginData.code,
      code_verifier: verifier,
    }),
  });

  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData?.error_description ?? 'Token exchange failed');
  }
  return tokenData.access_token as string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function getProjectId(baseUrl: string, token: string): Promise<string> {
  // Try decoding the JWT claim first (fastest, no extra request)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (payload.project) return payload.project as string;
  } catch { /* fall through */ }

  // Fallback: query ProjectMembership
  const res    = await fetch(`${baseUrl}fhir/R4/ProjectMembership?_count=1`, { headers: authHeaders(token) });
  const bundle = await res.json().catch(() => ({}));
  const ref    = bundle?.entry?.[0]?.resource?.project?.reference as string | undefined;
  if (ref) return ref.split('/')[1];

  throw new Error('Could not determine project ID — ensure this Medplum account owns a project.');
}

async function provisionAccount(
  baseUrl: string,
  token:   string,
  projectId: string,
  account: typeof ACCOUNTS[number],
): Promise<'created' | 'already_exists'> {
  const h = authHeaders(token);

  // Skip if staff ID already registered
  const searchRes = await fetch(
    `${baseUrl}fhir/R4/Practitioner?identifier=${encodeURIComponent(STAFF_ID_SYSTEM + '|' + account.staffId)}`,
    { headers: h },
  );
  const bundle = await searchRes.json().catch(() => ({}));
  if ((bundle?.total ?? 0) > 0) return 'already_exists';

  // Create Practitioner
  const practRes = await fetch(`${baseUrl}fhir/R4/Practitioner`, {
    method:  'POST',
    headers: { ...h, 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify({
      resourceType: 'Practitioner',
      active:       true,
      identifier:   [{ system: STAFF_ID_SYSTEM, value: account.staffId }],
      name:         [{ use: 'official', given: [account.firstName], family: account.lastName }],
      telecom:      [{ system: 'email', value: account.email, use: 'work' }],
      qualification:[{ code: { text: account.jobTitle } }],
      extension: [
        { url: 'https://lotto-hospital.local/fhir/StructureDefinition/department',         valueString: account.department },
        { url: 'https://lotto-hospital.local/fhir/StructureDefinition/system-role',        valueString: account.role },
        { url: 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment', valueDate:   new Date().toISOString().slice(0, 10) },
      ],
    } satisfies Partial<Practitioner>),
  });

  const practitioner = await practRes.json();
  if (!practRes.ok) {
    throw new Error(practitioner?.issue?.[0]?.details?.text ?? `Practitioner create failed (${practRes.status})`);
  }

  // Invite — creates login + ProjectMembership with role tag
  const inviteRes = await fetch(`${baseUrl}admin/projects/${projectId}/invite`, {
    method:  'POST',
    headers: h,
    body: JSON.stringify({
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
    }),
  });

  if (!inviteRes.ok) {
    const err = await inviteRes.json().catch(() => ({}));
    throw new Error(err?.issue?.[0]?.details?.text ?? `Invite failed (${inviteRes.status})`);
  }

  return 'created';
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.adminEmail || !body?.adminPassword) {
    return NextResponse.json({ error: 'adminEmail and adminPassword are required' }, { status: 400 });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/').replace(/\/?$/, '/');

  let accessToken: string;
  try {
    accessToken = await getAccessToken(baseUrl, body.adminEmail, body.adminPassword);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }

  let projectId: string;
  try {
    projectId = await getProjectId(baseUrl, accessToken);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  const results: { email: string; role: string; password: string; status: string; error?: string }[] = [];

  for (const account of ACCOUNTS) {
    try {
      const status = await provisionAccount(baseUrl, accessToken, projectId, account);
      results.push({ email: account.email, role: account.role, password: account.password, status });
    } catch (err) {
      results.push({ email: account.email, role: account.role, password: account.password, status: 'error', error: (err as Error).message });
    }
  }

  return NextResponse.json({ projectId, results });
}
