import { NextRequest, NextResponse } from 'next/server';

/**
 * CDS Hooks proxy route.
 *
 * Proxies CDS Hooks requests from the frontend to the Medplum Bots endpoint.
 * No business logic lives here — all CDSS logic runs in the Medplum bots.
 *
 * Endpoints:
 *   GET  /api/cds-services        → discovery (list of available services)
 *   POST /api/cds-services/:id    → execute a CDS hook
 */

const MEDPLUM_BASE_URL = process.env.MEDPLUM_BASE_URL ?? 'http://localhost:8103/';
const BOT_BASE_PATH = `${MEDPLUM_BASE_URL.replace(/\/$/, '')}/fhir/R4/Bot`;

async function forwardRequest(
  req: NextRequest,
  botPath: string
): Promise<NextResponse> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = req.method !== 'GET' ? await req.text() : undefined;

  const upstreamResponse = await fetch(`${BOT_BASE_PATH}/${botPath}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body,
  });

  const data = await upstreamResponse.json();
  return NextResponse.json(data, { status: upstreamResponse.status });
}

/** CDS Hooks discovery endpoint */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return forwardRequest(req, 'patient-view-cds/$execute?hook=discovery');
}

/** CDS Hooks execution endpoint — routes to the correct bot by hook id */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const hookId = segments[segments.length - 1];

  const botNameMap: Record<string, string> = {
    'patient-view': 'patient-view-cds',
    'order-select': 'order-select-cds',
    'order-sign': 'order-sign-cds',
  };

  const botName = botNameMap[hookId];
  if (!botName) {
    return NextResponse.json(
      { error: `Unknown CDS hook: ${hookId}` },
      { status: 404 }
    );
  }

  return forwardRequest(req, `${botName}/$execute`);
}
