import { NextRequest, NextResponse } from 'next/server';
import { MedplumClient } from '@medplum/core';
import { createHash, randomBytes } from 'crypto';

// ── Extension URL ─────────────────────────────────────────────────────────────
const EXT_NIN_VERIFIED = 'https://lotto-hospital.local/fhir/StructureDefinition/nin-verified';
const EXT_NIN_VERIFIED_AT = 'https://lotto-hospital.local/fhir/StructureDefinition/nin-verified-at';
const EXT_NIN_VERIFIED_BY = 'https://lotto-hospital.local/fhir/StructureDefinition/nin-verified-by';
const NIN_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/nin';

// ── NIMC / Prembly IdentityPass API ──────────────────────────────────────────
const PREMBLY_API_URL = 'https://api.prembly.com/identitypass/verification/nin_wo_face';
const PREMBLY_API_KEY = process.env.PREMBLY_API_KEY ?? '';
const PREMBLY_APP_ID  = process.env.PREMBLY_APP_ID  ?? '';

// ── Auth helpers (PKCE) ───────────────────────────────────────────────────────
async function getToken(email: string, password: string): Promise<string> {
  const baseUrl      = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
  const clientId     = process.env.MEDPLUM_CLIENT_ID ?? '';
  const verifier     = randomBytes(32).toString('hex');
  const challenge    = createHash('sha256').update(verifier).digest('base64url');

  const authRes = await fetch(`${baseUrl}auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password, clientId,
      codeChallengeMethod: 'S256',
      codeChallenge: challenge,
    }),
  });
  if (!authRes.ok) throw new Error(`Auth login failed: ${authRes.status}`);
  const { code } = await authRes.json();

  const tokenRes = await fetch(`${baseUrl}oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      code_verifier: verifier,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
  const { access_token } = await tokenRes.json();
  return access_token as string;
}

// ── External NIN verification ─────────────────────────────────────────────────
interface NimcResult {
  verified:    boolean;
  firstName?:  string;
  lastName?:   string;
  middleName?: string;
  dateOfBirth?: string;
  gender?:     string;
  phone?:      string;
  provider:    string;
  rawStatus?:  string;
}

async function verifyWithPrembly(nin: string): Promise<NimcResult> {
  if (!PREMBLY_API_KEY || !PREMBLY_APP_ID) {
    // No API key configured — simulate a successful verification for demo use
    return {
      verified:    true,
      provider:    'NIMC (Demo)',
      rawStatus:   'simulated',
    };
  }

  const res = await fetch(PREMBLY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-api-key':     PREMBLY_API_KEY,
      'app-id':        PREMBLY_APP_ID,
    },
    body: JSON.stringify({ number: nin }),
  });

  const data = await res.json();

  // Prembly returns { status: true/false, detail: { ... } }
  if (!res.ok || !data.status) {
    return {
      verified:  false,
      provider:  'NIMC via Prembly',
      rawStatus: data?.detail ?? data?.message ?? 'Verification failed',
    };
  }

  const d = data.detail ?? {};
  return {
    verified:    true,
    firstName:   d.firstname  ?? d.first_name,
    lastName:    d.surname    ?? d.last_name,
    middleName:  d.middlename ?? d.middle_name,
    dateOfBirth: d.birthdate  ?? d.date_of_birth,
    gender:      d.gender,
    phone:       d.phone ?? d.mobile,
    provider:    'NIMC via Prembly',
    rawStatus:   'verified',
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      nin:           string;
      patientId:     string;
      adminEmail:    string;
      adminPassword: string;
    };

    const { nin, patientId, adminEmail, adminPassword } = body;

    if (!nin || !patientId || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'nin, patientId, adminEmail, and adminPassword are required' }, { status: 400 });
    }

    if (!/^\d{11}$/.test(nin)) {
      return NextResponse.json({ error: 'NIN must be exactly 11 digits' }, { status: 400 });
    }

    // ── 1. Verify with NIMC ─────────────────────────────────────────────────
    const nimcResult = await verifyWithPrembly(nin);

    if (!nimcResult.verified) {
      return NextResponse.json({
        verified:  false,
        message:   `NIN could not be verified: ${nimcResult.rawStatus}`,
        provider:  nimcResult.provider,
      }, { status: 200 });
    }

    // ── 2. Update patient resource with verified extension ──────────────────
    const token = await getToken(adminEmail, adminPassword);
    const baseUrl = process.env.MEDPLUM_BASE_URL ?? 'https://api.medplum.com/';
    const medplum = new MedplumClient({ baseUrl, fetch });
    medplum.setAccessToken(token);

    const patient = await medplum.readResource('Patient', patientId);

    // Remove old nin-verified extensions and add fresh ones
    const extensions = (patient.extension ?? []).filter(
      (e) => e.url !== EXT_NIN_VERIFIED && e.url !== EXT_NIN_VERIFIED_AT && e.url !== EXT_NIN_VERIFIED_BY
    );
    extensions.push(
      { url: EXT_NIN_VERIFIED,    valueBoolean:  true },
      { url: EXT_NIN_VERIFIED_AT, valueDateTime: new Date().toISOString() },
      { url: EXT_NIN_VERIFIED_BY, valueString:   nimcResult.provider },
    );

    await medplum.updateResource({ ...patient, extension: extensions });

    return NextResponse.json({
      verified:  true,
      message:   'NIN successfully verified and patient record updated.',
      provider:  nimcResult.provider,
      name:      [nimcResult.firstName, nimcResult.middleName, nimcResult.lastName].filter(Boolean).join(' ') || undefined,
      dob:       nimcResult.dateOfBirth,
    });

  } catch (err) {
    console.error('[verify-nin]', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Internal error' }, { status: 500 });
  }
}
