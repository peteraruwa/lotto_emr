import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

const MRN_SYSTEM   = 'https://lotto-hospital.local/fhir/identifier/mrn';
const LOINC_SYSTEM = 'http://loinc.org';

// ── Seed data ─────────────────────────────────────────────────────────────────
// 25 patients — 16 Nigerian, 3 Chinese, 3 Indian, 3 European
// No name overlaps with mock/staff data.

interface PatientSeed {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dob: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  bloodGroup: string;
  genotype: string;
}

const PATIENTS: PatientSeed[] = [
  // ── Nigerian – Igbo ─────────────────────────────────────────────────────────
  { firstName: 'Ifeanyi',    lastName: 'Okafor',    gender: 'male',   dob: '1985-06-12', phone: '08021001001', city: 'Onitsha',  state: 'Anambra', country: 'NG', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Chisom',     lastName: 'Nwosu',     gender: 'female', dob: '1992-03-28', phone: '08031002002', city: 'Owerri',   state: 'Imo',     country: 'NG', bloodGroup: 'A+',  genotype: 'AS' },
  { firstName: 'Emeka',      lastName: 'Okoye',     gender: 'male',   dob: '1966-09-22', phone: '08041003003', city: 'Nnewi',    state: 'Anambra', country: 'NG', bloodGroup: 'AB+', genotype: 'AA' },
  { firstName: 'Adaora',     lastName: 'Okonkwo',   gender: 'female', dob: '2000-01-14', phone: '08051004004', city: 'Asaba',    state: 'Delta',   country: 'NG', bloodGroup: 'B+',  genotype: 'AA' },
  { firstName: 'Chidi',      lastName: 'Ezema',     gender: 'male',   dob: '1983-10-11', phone: '08061005005', city: 'Enugu',    state: 'Enugu',   country: 'NG', bloodGroup: 'AB-', genotype: 'AA' },
  // ── Nigerian – Yoruba ───────────────────────────────────────────────────────
  { firstName: 'Segun',      lastName: 'Adeyemi',   gender: 'male',   dob: '1978-11-04', phone: '08071006006', city: 'Ibadan',   state: 'Oyo',     country: 'NG', bloodGroup: 'B+',  genotype: 'AS' },
  { firstName: 'Bukola',     lastName: 'Adeleke',   gender: 'female', dob: '1995-07-17', phone: '08081007007', city: 'Osogbo',   state: 'Osun',    country: 'NG', bloodGroup: 'O-',  genotype: 'AA' },
  { firstName: 'Folake',     lastName: 'Balogun',   gender: 'female', dob: '1988-01-30', phone: '08091008008', city: 'Abeokuta', state: 'Ogun',    country: 'NG', bloodGroup: 'A-',  genotype: 'AA' },
  { firstName: 'Kehinde',    lastName: 'Oduola',    gender: 'male',   dob: '1976-02-16', phone: '08101009009', city: 'Lagos',    state: 'Lagos',   country: 'NG', bloodGroup: 'A+',  genotype: 'AS' },
  { firstName: 'Sade',       lastName: 'Afolabi',   gender: 'female', dob: '1997-04-25', phone: '08111010010', city: 'Lagos',    state: 'Lagos',   country: 'NG', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Damilola',   lastName: 'Adewale',   gender: 'male',   dob: '2003-08-05', phone: '08121011011', city: 'Sagamu',   state: 'Ogun',    country: 'NG', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Keji',       lastName: 'Oyelaran',  gender: 'female', dob: '1961-11-29', phone: '08131012012', city: 'Ilorin',   state: 'Kwara',   country: 'NG', bloodGroup: 'A-',  genotype: 'AA' },
  // ── Nigerian – Hausa / Northern ─────────────────────────────────────────────
  { firstName: 'Ibrahim',    lastName: 'Musa',      gender: 'male',   dob: '1959-08-03', phone: '08141013013', city: 'Katsina',  state: 'Katsina', country: 'NG', bloodGroup: 'A+',  genotype: 'AA' },
  { firstName: 'Amina',      lastName: 'Bello',     gender: 'female', dob: '2001-12-14', phone: '08151014014', city: 'Kano',     state: 'Kano',    country: 'NG', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Abubakar',   lastName: 'Aliyu',     gender: 'male',   dob: '1970-05-19', phone: '08161015015', city: 'Kaduna',   state: 'Kaduna',  country: 'NG', bloodGroup: 'B-',  genotype: 'AA' },
  // ── Nigerian – Rivers / South-South ─────────────────────────────────────────
  { firstName: 'Ikenna',     lastName: 'Dike',      gender: 'male',   dob: '1990-03-07', phone: '08171016016', city: 'Port Harcourt', state: 'Rivers', country: 'NG', bloodGroup: 'O+', genotype: 'AS' },
  // ── Chinese ─────────────────────────────────────────────────────────────────
  { firstName: 'Wei',        lastName: 'Zhang',     gender: 'male',   dob: '1980-07-15', phone: '+8613811001700', city: 'Lagos', state: 'Lagos', country: 'CN', bloodGroup: 'B+',  genotype: 'AA' },
  { firstName: 'Mei Ling',   lastName: 'Chen',      gender: 'female', dob: '1993-11-22', phone: '+8613811001800', city: 'Lagos', state: 'Lagos', country: 'CN', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Jian',       lastName: 'Wang',      gender: 'male',   dob: '1971-04-08', phone: '+8613811001900', city: 'Lagos', state: 'Lagos', country: 'CN', bloodGroup: 'A+',  genotype: 'AA' },
  // ── Indian ──────────────────────────────────────────────────────────────────
  { firstName: 'Raj',        lastName: 'Patel',     gender: 'male',   dob: '1977-09-30', phone: '+919911002000', city: 'Lagos', state: 'Lagos', country: 'IN', bloodGroup: 'B+',  genotype: 'AA' },
  { firstName: 'Priya',      lastName: 'Sharma',    gender: 'female', dob: '1989-02-14', phone: '+919911002100', city: 'Lagos', state: 'Lagos', country: 'IN', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Arjun',      lastName: 'Nair',      gender: 'male',   dob: '1994-06-27', phone: '+919911002200', city: 'Lagos', state: 'Lagos', country: 'IN', bloodGroup: 'A-',  genotype: 'AA' },
  // ── European ────────────────────────────────────────────────────────────────
  { firstName: 'James',      lastName: 'Harrison',  gender: 'male',   dob: '1965-12-03', phone: '+447700900100', city: 'Lagos', state: 'Lagos', country: 'GB', bloodGroup: 'A+',  genotype: 'AA' },
  { firstName: 'Sophie',     lastName: 'Müller',    gender: 'female', dob: '1987-08-19', phone: '+4917600900200', city: 'Lagos', state: 'Lagos', country: 'DE', bloodGroup: 'O+',  genotype: 'AA' },
  { firstName: 'Pierre',     lastName: 'Dubois',    gender: 'male',   dob: '1972-05-11', phone: '+33612900300',  city: 'Lagos', state: 'Lagos', country: 'FR', bloodGroup: 'B-',  genotype: 'AA' },
];

// ── Today's schedule (25 slots, 7:30 AM – 4:20 PM) ───────────────────────────
// First 5 → fulfilled (seen); 6–7 → arrived (in room); 8–25 → booked (upcoming)

const SCHEDULE: { hour: number; minute: number; visitType: string; status: string }[] = [
  { hour:  7, minute: 30, visitType: 'General Consultation',  status: 'fulfilled' },
  { hour:  8, minute:  0, visitType: 'Internal Medicine',     status: 'fulfilled' },
  { hour:  8, minute: 30, visitType: 'Surgical Consultation', status: 'fulfilled' },
  { hour:  8, minute: 50, visitType: 'Antenatal Care',        status: 'fulfilled' },
  { hour:  9, minute: 10, visitType: 'Obs / Gynecology',      status: 'fulfilled' },
  { hour:  9, minute: 30, visitType: 'General Consultation',  status: 'arrived'   },
  { hour:  9, minute: 50, visitType: 'Cardiology Consult',    status: 'arrived'   },
  { hour: 10, minute: 10, visitType: 'General Consultation',  status: 'booked'    },
  { hour: 10, minute: 30, visitType: 'Diabetes Review',       status: 'booked'    },
  { hour: 10, minute: 50, visitType: 'Internal Medicine',     status: 'booked'    },
  { hour: 11, minute: 10, visitType: 'Physiotherapy',         status: 'booked'    },
  { hour: 11, minute: 30, visitType: 'ENT',                   status: 'booked'    },
  { hour: 11, minute: 50, visitType: 'General Consultation',  status: 'booked'    },
  { hour: 12, minute: 10, visitType: 'Dermatology',           status: 'booked'    },
  { hour: 12, minute: 40, visitType: 'General Consultation',  status: 'booked'    },
  { hour: 13, minute: 10, visitType: 'Internal Medicine',     status: 'booked'    },
  { hour: 13, minute: 30, visitType: 'Post-op Review',        status: 'booked'    },
  { hour: 13, minute: 50, visitType: 'General Consultation',  status: 'booked'    },
  { hour: 14, minute: 10, visitType: 'Obs / Gynecology',      status: 'booked'    },
  { hour: 14, minute: 30, visitType: 'Paediatrics',           status: 'booked'    },
  { hour: 14, minute: 50, visitType: 'General Consultation',  status: 'booked'    },
  { hour: 15, minute: 10, visitType: 'Surgical Consultation', status: 'booked'    },
  { hour: 15, minute: 30, visitType: 'Eye Clinic',            status: 'booked'    },
  { hour: 15, minute: 50, visitType: 'General Consultation',  status: 'booked'    },
  { hour: 16, minute: 20, visitType: 'Internal Medicine',     status: 'booked'    },
];

function todayAt(hour: number, minute: number): { start: string; end: string } {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  const start = d.toISOString();
  d.setMinutes(d.getMinutes() + 30);
  const end = d.toISOString();
  return { start, end };
}

// ── Vitals ────────────────────────────────────────────────────────────────────

function vitalsFor(patientId: string, effectiveDate: string) {
  const rand = (min: number, max: number, dp = 1) =>
    parseFloat((min + Math.random() * (max - min)).toFixed(dp));

  const systolic  = rand(100, 145, 0);
  const diastolic = rand(60,  95,  0);
  const hr        = rand(58,  105, 0);
  const temp      = rand(36.1, 37.6);
  const spo2      = rand(95,  100, 0);
  const weight    = rand(50,  100);
  const height    = rand(155, 190);

  return [
    {
      resourceType: 'Observation',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
      code: { coding: [{ system: LOINC_SYSTEM, code: '55284-4', display: 'Blood pressure' }], text: 'Blood pressure' },
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: effectiveDate,
      component: [
        { code: { coding: [{ system: LOINC_SYSTEM, code: '8480-6', display: 'Systolic blood pressure'  }] }, valueQuantity: { value: systolic,  unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
        { code: { coding: [{ system: LOINC_SYSTEM, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: diastolic, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
      ],
    },
    { resourceType: 'Observation', status: 'final', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }], code: { coding: [{ system: LOINC_SYSTEM, code: '8867-4',  display: 'Heart rate'        }], text: 'Heart rate'        }, subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate, valueQuantity: { value: hr,     unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' } },
    { resourceType: 'Observation', status: 'final', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }], code: { coding: [{ system: LOINC_SYSTEM, code: '8310-5',  display: 'Body temperature'  }], text: 'Body temperature'  }, subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate, valueQuantity: { value: temp,   unit: 'Cel',  system: 'http://unitsofmeasure.org', code: 'Cel'  } },
    { resourceType: 'Observation', status: 'final', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }], code: { coding: [{ system: LOINC_SYSTEM, code: '59408-5', display: 'Oxygen saturation'  }], text: 'Oxygen saturation'  }, subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate, valueQuantity: { value: spo2,   unit: '%',    system: 'http://unitsofmeasure.org', code: '%'    } },
    { resourceType: 'Observation', status: 'final', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }], code: { coding: [{ system: LOINC_SYSTEM, code: '29463-7', display: 'Body weight'        }], text: 'Body weight'        }, subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate, valueQuantity: { value: weight, unit: 'kg',   system: 'http://unitsofmeasure.org', code: 'kg'   } },
    { resourceType: 'Observation', status: 'final', category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }], code: { coding: [{ system: LOINC_SYSTEM, code: '8302-2',  display: 'Body height'       }], text: 'Body height'       }, subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate, valueQuantity: { value: height, unit: 'cm',   system: 'http://unitsofmeasure.org', code: 'cm'   } },
  ];
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

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

  const h = fhirHeaders(token);
  const results: {
    name: string; mrn: string; country: string;
    visitType: string; apptStatus: string; status: string; error?: string;
  }[] = [];

  for (let i = 0; i < PATIENTS.length; i++) {
    const p        = PATIENTS[i];
    const slot     = SCHEDULE[i];
    const mrn      = `LCH-2026-${String(100001 + i).padStart(6, '0')}`;
    const fullName = `${p.firstName} ${p.lastName}`;

    try {
      // 1. Create Patient
      const patRes = await fetch(`${base}fhir/R4/Patient`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          resourceType: 'Patient',
          active: true,
          identifier: [
            {
              system: MRN_SYSTEM, value: mrn, use: 'official',
              type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }], text: 'MRN' },
            },
          ],
          name:      [{ use: 'official', given: p.firstName.split(' '), family: p.lastName }],
          gender:    p.gender,
          birthDate: p.dob,
          telecom:   [{ system: 'phone', value: p.phone, use: 'mobile' }],
          address:   [{ use: 'home', city: p.city, state: p.state, country: p.country }],
          extension: [
            { url: 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group', valueString: p.bloodGroup },
            { url: 'https://lotto-hospital.local/fhir/StructureDefinition/genotype',    valueString: p.genotype  },
          ],
        }),
      });
      const patient = await patRes.json();
      if (!patRes.ok) throw new Error(patient?.issue?.[0]?.details?.text ?? `Patient create failed (${patRes.status})`);
      const patientId = patient.id as string;

      // 2. Create vital observations (dated within last 7 days)
      const effectiveDate = new Date(Date.now() - Math.random() * 7 * 86400000).toISOString();
      for (const obs of vitalsFor(patientId, effectiveDate)) {
        await fetch(`${base}fhir/R4/Observation`, { method: 'POST', headers: h, body: JSON.stringify(obs) });
      }

      // 3. Create today's appointment (include display name so it resolves without _include)
      const { start, end } = todayAt(slot.hour, slot.minute);
      const apptRes = await fetch(`${base}fhir/R4/Appointment`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          resourceType: 'Appointment',
          status:      slot.status,
          serviceType: [{ text: slot.visitType }],
          start,
          end,
          participant: [
            {
              actor:  { reference: `Patient/${patientId}`, display: fullName },
              status: 'accepted',
            },
          ],
        }),
      });
      const appt = await apptRes.json();
      if (!apptRes.ok) throw new Error(appt?.issue?.[0]?.details?.text ?? `Appointment create failed (${apptRes.status})`);

      results.push({ name: fullName, mrn, country: p.country, visitType: slot.visitType, apptStatus: slot.status, status: 'created' });
    } catch (err) {
      results.push({ name: fullName, mrn, country: p.country, visitType: slot.visitType, apptStatus: slot.status, status: 'error', error: (err as Error).message });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;
  return NextResponse.json({
    message: `Seeded ${created}/${PATIENTS.length} patients with vitals and appointments`,
    breakdown: {
      nigerian: results.filter((r) => r.country === 'NG').length,
      chinese:  results.filter((r) => r.country === 'CN').length,
      indian:   results.filter((r) => r.country === 'IN').length,
      european: results.filter((r) => ['GB', 'DE', 'FR'].includes(r.country)).length,
    },
    results,
  });
}
