import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

const ROLE_TAG_SYSTEM = 'https://lotto-hospital.local/fhir/role';
const DEPT_EXTENSION  = 'https://lotto-hospital.local/fhir/StructureDefinition/department';
const ROLE_EXTENSION  = 'https://lotto-hospital.local/fhir/StructureDefinition/system-role';
const HIRE_EXTENSION  = 'https://lotto-hospital.local/fhir/StructureDefinition/date-of-employment';

const DEV_PASSWORD = '123456789';

// ── Staff roster ──────────────────────────────────────────────────────────────

const STAFF = [
  { username: 'doctor1',      role: 'doctor',      department: 'clinical-core',  displayName: 'Dr. Ada Osei',         jobTitle: 'Consultant Physician'         },
  { username: 'doctor2',      role: 'doctor',      department: 'clinical-core',  displayName: 'Dr. Emeka Bello',      jobTitle: 'General Surgeon'              },
  { username: 'nurse1',       role: 'nurse',       department: 'triage',         displayName: 'Ngozi Adeyemi',        jobTitle: 'Triage Nurse'                 },
  { username: 'nurse2',       role: 'nurse',       department: 'ward',           displayName: 'Fatima Sule',          jobTitle: 'Ward Nurse'                   },
  { username: 'admin1',       role: 'admin',       department: 'administration', displayName: 'Kemi Adeyinka',        jobTitle: 'Front Desk Officer'           },
  { username: 'admin2',       role: 'admin',       department: 'administration', displayName: 'Dauda Salihu',         jobTitle: 'Scheduling Officer'           },
  { username: 'hr1',          role: 'hr',          department: 'hr-management',  displayName: 'Chinyere Obiora',      jobTitle: 'HR Manager'                   },
  { username: 'hr2',          role: 'hr',          department: 'hr-management',  displayName: 'Musa Lawal',           jobTitle: 'HR Officer'                   },
  { username: 'records1',     role: 'records',     department: 'medical-records',displayName: 'Amaka Eze',            jobTitle: 'Medical Records Officer'      },
  { username: 'records2',     role: 'records',     department: 'medical-records',displayName: 'Tunde Fashola',        jobTitle: 'Medical Records Officer'      },
  { username: 'billing1',     role: 'billing',     department: 'billing',        displayName: 'Blessing Nwachukwu',  jobTitle: 'Billing Officer'              },
  { username: 'billing2',     role: 'billing',     department: 'billing',        displayName: 'Uche Okafor',          jobTitle: 'HMO Liaison Officer'          },
  { username: 'lab1',         role: 'lab',         department: 'laboratory',     displayName: 'Chidera Nwosu',        jobTitle: 'Medical Laboratory Scientist' },
  { username: 'lab2',         role: 'lab',         department: 'laboratory',     displayName: 'Hauwa Abdullahi',      jobTitle: 'Medical Laboratory Scientist' },
  { username: 'rad1',         role: 'radiologist', department: 'radiology',      displayName: 'Segun Adeleke',        jobTitle: 'Radiographer'                 },
  { username: 'rad2',         role: 'radiologist', department: 'radiology',      displayName: 'Ifeoma Dike',          jobTitle: 'Radiographer'                 },
  { username: 'pharmacist1',  role: 'pharmacist',  department: 'pharmacy',       displayName: 'Oluwaseun Adebayo',   jobTitle: 'Clinical Pharmacist'          },
  { username: 'pharmacist2',  role: 'pharmacist',  department: 'pharmacy',       displayName: 'Ramatu Idris',         jobTitle: 'Clinical Pharmacist'          },
  { username: 'superadmin1',  role: 'superadmin',  department: 'infrastructure', displayName: 'Test Superadmin',      jobTitle: 'System Administrator'         },
] as const;

// ── Access policies (inlined) ─────────────────────────────────────────────────

const ACCESS_POLICIES: Record<string, object> = {
  doctor: {
    resourceType: 'AccessPolicy', name: 'Doctor Access Policy',
    resource: [
      { resourceType: 'Patient',            readonly: false },
      { resourceType: 'Encounter',          readonly: false },
      { resourceType: 'Condition',          readonly: false },
      { resourceType: 'Observation',        readonly: false },
      { resourceType: 'DiagnosticReport',   readonly: false },
      { resourceType: 'ServiceRequest',     readonly: false },
      { resourceType: 'MedicationRequest',  readonly: false },
      { resourceType: 'Procedure',          readonly: false },
      { resourceType: 'DocumentReference',  readonly: false },
      { resourceType: 'Appointment',        readonly: false },
      { resourceType: 'RequestGroup',       readonly: false },
      { resourceType: 'Practitioner',       readonly: true  },
      { resourceType: 'Organization',       readonly: true  },
    ],
  },
  nurse: {
    resourceType: 'AccessPolicy', name: 'Nurse Access Policy',
    resource: [
      { resourceType: 'Patient',     readonly: false },
      { resourceType: 'Encounter',   readonly: false },
      { resourceType: 'Observation', readonly: false },
      { resourceType: 'Appointment', readonly: false },
      { resourceType: 'Condition',   readonly: true  },
      { resourceType: 'Practitioner',readonly: true  },
    ],
  },
  pharmacist: {
    resourceType: 'AccessPolicy', name: 'Pharmacist Access Policy',
    resource: [
      { resourceType: 'MedicationRequest', readonly: false },
      { resourceType: 'Patient',           readonly: true  },
      { resourceType: 'Encounter',         readonly: true  },
      { resourceType: 'Practitioner',      readonly: true  },
    ],
  },
  lab: {
    resourceType: 'AccessPolicy', name: 'Laboratory Scientist Access Policy',
    resource: [
      { resourceType: 'ServiceRequest',   readonly: false },
      { resourceType: 'DiagnosticReport', readonly: false },
      { resourceType: 'Observation',      readonly: false },
      { resourceType: 'Patient',          readonly: true  },
      { resourceType: 'Practitioner',     readonly: true  },
    ],
  },
  radiologist: {
    resourceType: 'AccessPolicy', name: 'Radiologist Access Policy',
    resource: [
      { resourceType: 'ServiceRequest',   readonly: false },
      { resourceType: 'DiagnosticReport', readonly: false },
      { resourceType: 'ImagingStudy',     readonly: false },
      { resourceType: 'Patient',          readonly: true  },
      { resourceType: 'Practitioner',     readonly: true  },
    ],
  },
  admin: {
    resourceType: 'AccessPolicy', name: 'Admin Access Policy',
    resource: [
      { resourceType: 'Patient',      readonly: false },
      { resourceType: 'Appointment',  readonly: false },
      { resourceType: 'Encounter',    readonly: true  },
      { resourceType: 'Practitioner', readonly: true  },
      { resourceType: 'Organization', readonly: true  },
    ],
  },
  hr: {
    resourceType: 'AccessPolicy', name: 'HR Staff Access Policy',
    resource: [
      { resourceType: 'Practitioner',     readonly: false },
      { resourceType: 'PractitionerRole', readonly: false },
      { resourceType: 'Organization',     readonly: false },
      { resourceType: 'Location',         readonly: true  },
      { resourceType: 'Schedule',         readonly: true  },
      { resourceType: 'Patient',          readonly: true  },
    ],
  },
  records: {
    resourceType: 'AccessPolicy', name: 'Medical Records Officer Access Policy',
    resource: [
      { resourceType: 'Patient',           readonly: false },
      { resourceType: 'RelatedPerson',     readonly: false },
      { resourceType: 'DocumentReference', readonly: false },
      { resourceType: 'Composition',       readonly: false },
      { resourceType: 'Encounter',         readonly: true  },
      { resourceType: 'DiagnosticReport',  readonly: true  },
      { resourceType: 'Condition',         readonly: true  },
      { resourceType: 'Practitioner',      readonly: true  },
    ],
  },
  billing: {
    resourceType: 'AccessPolicy', name: 'Billing & HMO Officer Access Policy',
    resource: [
      { resourceType: 'Coverage',          readonly: false },
      { resourceType: 'Claim',             readonly: false },
      { resourceType: 'ClaimResponse',     readonly: false },
      { resourceType: 'RequestGroup',      readonly: false },
      { resourceType: 'ServiceRequest',    readonly: true  },
      { resourceType: 'MedicationRequest', readonly: true  },
      { resourceType: 'Patient',           readonly: true  },
      { resourceType: 'Practitioner',      readonly: true  },
    ],
  },
  superadmin: {
    resourceType: 'AccessPolicy', name: 'Super Admin Access Policy',
    resource: [{ resourceType: 'Patient', readonly: false }], // Medplum project-level admin handles the rest
  },
};

// ── Auth helpers (same pattern as seed-patients) ──────────────────────────────

async function getToken(base: string, email: string, password: string): Promise<string> {
  const verifier  = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const loginRes  = await fetch(`${base}auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember: false, codeChallenge: challenge, codeChallengeMethod: 'S256' }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginData?.code) throw new Error(loginData?.issue?.[0]?.details?.text ?? `Login failed (${loginRes.status})`);

  const tokenRes  = await fetch(`${base}oauth2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: loginData.code, code_verifier: verifier }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) throw new Error(tokenData?.error_description ?? 'Token exchange failed');
  return tokenData.access_token as string;
}

function fhirHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/fhir+json' };
}

function adminHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.adminEmail || !body?.adminPassword) {
    return NextResponse.json({ error: 'adminEmail and adminPassword are required' }, { status: 400 });
  }

  const base = (process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/').replace(/\/?$/, '/');

  let token: string;
  try {
    token = await getToken(base, body.adminEmail, body.adminPassword);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }

  const fhirH  = fhirHeaders(token);
  const adminH = adminHeaders(token);

  // Get project ID
  const projRes  = await fetch(`${base}fhir/R4/Project?_count=1`, { headers: fhirH });
  const projData = await projRes.json().catch(() => ({}));
  const projectId = projData?.entry?.[0]?.resource?.id as string | undefined;
  if (!projectId) {
    return NextResponse.json({ error: 'Could not determine Medplum project ID. Ensure the account has project access.' }, { status: 500 });
  }

  // Cache resolved access policy IDs
  const policyIdCache: Record<string, string> = {};

  async function ensurePolicy(role: string): Promise<string | null> {
    if (policyIdCache[role]) return policyIdCache[role];
    const policy = ACCESS_POLICIES[role];
    if (!policy) return null;

    const policyName = (policy as any).name as string;
    const searchRes  = await fetch(`${base}fhir/R4/AccessPolicy?name=${encodeURIComponent(policyName)}&_count=1`, { headers: fhirH });
    const searchData = await searchRes.json().catch(() => ({}));
    const existing   = searchData?.entry?.[0]?.resource?.id as string | undefined;

    if (existing) { policyIdCache[role] = existing; return existing; }

    const createRes  = await fetch(`${base}fhir/R4/AccessPolicy`, { method: 'POST', headers: fhirH, body: JSON.stringify(policy) });
    const created    = await createRes.json().catch(() => ({}));
    if (!createRes.ok) throw new Error(`AccessPolicy create failed for ${role}: ${created?.issue?.[0]?.details?.text ?? createRes.status}`);
    policyIdCache[role] = created.id as string;
    return created.id as string;
  }

  const today   = new Date().toISOString().slice(0, 10);
  const results: { name: string; email: string; role: string; status: 'created' | 'skipped' | 'error'; error?: string }[] = [];

  for (const staff of STAFF) {
    const email = `${staff.username}@lotto.ng`;
    const nameParts = staff.displayName.replace(/^Dr\.\s*/i, '').split(' ');
    const family    = nameParts.pop() ?? '';
    const given     = nameParts;

    try {
      // Check if practitioner with this email already exists
      const existsRes  = await fetch(`${base}fhir/R4/Practitioner?telecom=${encodeURIComponent(email)}&_count=1`, { headers: fhirH });
      const existsData = await existsRes.json().catch(() => ({}));
      if ((existsData?.total ?? 0) > 0) {
        results.push({ name: staff.displayName, email, role: staff.role, status: 'skipped' });
        continue;
      }

      const policyId = await ensurePolicy(staff.role);

      // Create Practitioner
      const practRes = await fetch(`${base}fhir/R4/Practitioner`, {
        method: 'POST', headers: fhirH,
        body: JSON.stringify({
          resourceType: 'Practitioner',
          active: true,
          name: [{ use: 'official', family, given }],
          telecom: [{ system: 'email', value: email, use: 'work' }],
          qualification: [{ code: { text: staff.jobTitle } }],
          extension: [
            { url: DEPT_EXTENSION, valueString: staff.department },
            { url: ROLE_EXTENSION, valueString: staff.role },
            { url: HIRE_EXTENSION, valueDate: today },
          ],
        }),
      });
      const practitioner = await practRes.json().catch(() => ({}));
      if (!practRes.ok) throw new Error(practitioner?.issue?.[0]?.details?.text ?? `Practitioner create failed (${practRes.status})`);

      // Invite user — creates Login + ProjectMembership with role tag
      const inviteBody: Record<string, unknown> = {
        resourceType: 'Practitioner',
        firstName:    given[0] ?? staff.displayName,
        lastName:     family,
        email,
        password:     DEV_PASSWORD,
        sendEmail:    false,
        membership: {
          profile: { reference: `Practitioner/${practitioner.id}` },
          ...(policyId ? { accessPolicy: { reference: `AccessPolicy/${policyId}` } } : {}),
          meta: {
            tag: [{
              system:  ROLE_TAG_SYSTEM,
              code:    staff.role,
              display: staff.role.charAt(0).toUpperCase() + staff.role.slice(1),
            }],
          },
        },
      };

      const inviteRes  = await fetch(`${base}admin/projects/${projectId}/invite`, { method: 'POST', headers: adminH, body: JSON.stringify(inviteBody) });
      const inviteData = await inviteRes.json().catch(() => ({}));
      if (!inviteRes.ok) throw new Error(inviteData?.issue?.[0]?.details?.text ?? inviteData?.error ?? `Invite failed (${inviteRes.status})`);

      results.push({ name: staff.displayName, email, role: staff.role, status: 'created' });
    } catch (err) {
      results.push({ name: staff.displayName, email, role: staff.role, status: 'error', error: (err as Error).message });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  return NextResponse.json({
    message: `${created} created, ${skipped} skipped (already exist), ${results.length - created - skipped} errors`,
    results,
  });
}
