import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

const MRN_SYSTEM   = 'https://lotto-hospital.local/fhir/identifier/mrn';
const LOINC_SYSTEM = 'http://loinc.org';

// ── Seed data ─────────────────────────────────────────────────────────────────

const PATIENTS = [
  { firstName: 'Adaeze',      lastName: 'Okonkwo',  gender: 'female', dob: '1990-03-14', phone: '08012345001', state: 'Anambra',  bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Emeka',       lastName: 'Chukwu',   gender: 'male',   dob: '1979-07-22', phone: '08023456002', state: 'Enugu',    bloodGroup: 'A+',  genotype: 'AS' },
  { firstName: 'Ngozi',       lastName: 'Eze',      gender: 'female', dob: '1996-11-05', phone: '08034567003', state: 'Imo',      bloodGroup: 'B+',  genotype: 'AA' },
  { firstName: 'Chukwuemeka', lastName: 'Nwosu',    gender: 'male',   dob: '1962-01-18', phone: '08045678004', state: 'Abia',     bloodGroup: 'AB+', genotype: 'AA' },
  { firstName: 'Amara',       lastName: 'Obi',      gender: 'female', dob: '2005-09-30', phone: '08056789005', state: 'Lagos',    bloodGroup: 'O-',  genotype: 'AS' },
  { firstName: 'Femi',        lastName: 'Adeyemi',  gender: 'male',   dob: '1986-04-08', phone: '08067890006', state: 'Ogun',     bloodGroup: 'A-',  genotype: 'AA' },
  { firstName: 'Chidinma',    lastName: 'Okeke',    gender: 'female', dob: '1969-06-25', phone: '08078901007', state: 'Anambra',  bloodGroup: 'B-',  genotype: 'AS' },
  { firstName: 'Babatunde',   lastName: 'Afolabi',  gender: 'male',   dob: '1982-12-11', phone: '08089012008', state: 'Ekiti',    bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Yetunde',     lastName: 'Olawale',  gender: 'female', dob: '1993-08-19', phone: '08090123009', state: 'Oyo',      bloodGroup: 'A+',  genotype: 'AA' },
  { firstName: 'Nnamdi',      lastName: 'Igwe',     gender: 'male',   dob: '1974-02-27', phone: '08001234010', state: 'Rivers',   bloodGroup: 'AB-', genotype: 'SS' },
];

// Each patient gets randomised but clinically plausible vitals
function vitalsFor(patientId: string, effectiveDate: string) {
  const rand = (min: number, max: number, dp = 1) =>
    parseFloat((min + Math.random() * (max - min)).toFixed(dp));

  const systolic  = rand(100, 145, 0);
  const diastolic = rand(60, 95, 0);
  const hr        = rand(58, 105, 0);
  const temp      = rand(36.1, 37.6);
  const spo2      = rand(95, 100, 0);
  const weight    = rand(50, 100);
  const height    = rand(155, 190);

  const obs = (loinc: string, display: string, value: number, unit: string, component?: object) => ({
    resourceType: 'Observation',
    status: 'final',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
    code: { coding: [{ system: LOINC_SYSTEM, code: loinc, display }], text: display },
    subject: { reference: `Patient/${patientId}` },
    effectiveDateTime: effectiveDate,
    valueQuantity: component ? undefined : { value, unit, system: 'http://unitsofmeasure.org', code: unit },
    ...(component ?? {}),
  });

  return [
    // Blood pressure (panel)
    {
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: LOINC_SYSTEM, code: '55284-4', display: 'Blood pressure' }], text: 'Blood pressure' },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: effectiveDate,
      component: [
        { code: { coding: [{ system: LOINC_SYSTEM, code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: systolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        { code: { coding: [{ system: LOINC_SYSTEM, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
      ],
    },
    obs('8867-4', 'Heart rate',         hr,     '/min'),
    obs('8310-5', 'Body temperature',   temp,   'Cel'),
    obs('59408-5','Oxygen saturation',  spo2,   '%'),
    obs('29463-7','Body weight',        weight, 'kg'),
    obs('8302-2', 'Body height',        height, 'cm'),
  ];
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getToken(base: string, email: string, password: string): Promise<string> {
  const verifier  = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const loginRes = await fetch(`${base}auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember: false, codeChallenge: challenge, codeChallengeMethod: 'S256' }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginData?.code) throw new Error(loginData?.issue?.[0]?.details?.text ?? `Login failed (${loginRes.status})`);

  const tokenRes = await fetch(`${base}oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: loginData.code, code_verifier: verifier }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) throw new Error(tokenData?.error_description ?? 'Token exchange failed');
  return tokenData.access_token as string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/fhir+json' };
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

  const h = authHeaders(token);
  const results: { name: string; mrn: string; status: string; error?: string }[] = [];

  for (const p of PATIENTS) {
    const mrn = `LCH-2026-${String(100000 + results.length + 1).padStart(6, '0')}`;
    const fullName = `${p.firstName} ${p.lastName}`;

    try {
      // Create Patient
      const patRes = await fetch(`${base}fhir/R4/Patient`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          resourceType: 'Patient',
          active: true,
          identifier: [
            { system: MRN_SYSTEM, value: mrn, use: 'official', type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }], text: 'MRN' } },
          ],
          name: [{ use: 'official', given: [p.firstName], family: p.lastName }],
          gender: p.gender,
          birthDate: p.dob,
          telecom: [{ system: 'phone', value: p.phone, use: 'mobile' }],
          address: [{ use: 'home', city: 'Lagos', state: p.state, country: 'NG' }],
          extension: [
            { url: 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group', valueString: p.bloodGroup },
            { url: 'https://lotto-hospital.local/fhir/StructureDefinition/genotype',    valueString: p.genotype },
          ],
        }),
      });

      const patient = await patRes.json();
      if (!patRes.ok) throw new Error(patient?.issue?.[0]?.details?.text ?? `Patient create failed (${patRes.status})`);

      const patientId = patient.id as string;
      const effectiveDate = new Date(Date.now() - Math.random() * 7 * 86400000).toISOString();

      // Create vital observations
      const vitals = vitalsFor(patientId, effectiveDate);
      for (const obs of vitals) {
        await fetch(`${base}fhir/R4/Observation`, { method: 'POST', headers: h, body: JSON.stringify(obs) });
      }

      results.push({ name: fullName, mrn, status: 'created' });
    } catch (err) {
      results.push({ name: fullName, mrn, status: 'error', error: (err as Error).message });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  return NextResponse.json({ message: `Seeded ${created}/${PATIENTS.length} patients`, results });
}
