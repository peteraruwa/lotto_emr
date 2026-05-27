import { NextRequest, NextResponse } from 'next/server';

// Stub HMO verification API — calls Prembly or returns demo result
export async function POST(req: NextRequest) {
  try {
    const { policyNumber, providerId, enrolleeId } = await req.json();

    if (!policyNumber || !providerId) {
      return NextResponse.json({ error: 'policyNumber and providerId are required' }, { status: 400 });
    }

    const PREMBLY_API_KEY = process.env.PREMBLY_API_KEY ?? '';
    const PREMBLY_APP_ID  = process.env.PREMBLY_APP_ID  ?? '';

    if (!PREMBLY_API_KEY || !PREMBLY_APP_ID) {
      // Demo mode — simulate successful verification
      await new Promise(r => setTimeout(r, 800)); // simulate latency
      return NextResponse.json({
        verified:      true,
        approvalCode:  `AUTH-${Math.floor(Math.random() * 900000) + 100000}`,
        coveredAmount: null, // null = full coverage in demo
        provider:      providerId,
        notes:         'Demo verification (no API credentials configured)',
      });
    }

    // Real Prembly call — HMO eligibility check
    const res = await fetch('https://api.prembly.com/identitypass/verification/hmo', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    PREMBLY_API_KEY,
        'app-id':       PREMBLY_APP_ID,
      },
      body: JSON.stringify({ policy_number: policyNumber, provider_id: providerId, enrollee_id: enrolleeId }),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return NextResponse.json({ verified: false, error: data?.message ?? 'Verification failed' }, { status: 200 });
    }

    return NextResponse.json({
      verified:      true,
      approvalCode:  data.detail?.approval_code ?? data.detail?.auth_code,
      coveredAmount: data.detail?.covered_amount,
      provider:      data.detail?.provider_name ?? providerId,
      notes:         data.detail?.remarks,
    });

  } catch (err) {
    console.error('[verify-hmo]', err);
    return NextResponse.json({ error: (err as Error).message ?? 'Internal error' }, { status: 500 });
  }
}
