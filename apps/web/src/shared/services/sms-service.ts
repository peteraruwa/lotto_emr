/**
 * SMS service abstraction layer.
 * Swap the provider implementation without changing call sites.
 *
 * Current implementation: console-logged stub (no external dependency).
 * To integrate a real provider (Twilio, Termii, Vonage, etc.) replace
 * `sendViaSmsProvider` below and add credentials to env.
 */

export interface SmsMessage {
  to: string;       // E.164 phone number, e.g. +2348012345678
  body: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Provider stub ─────────────────────────────────────────────────────────────
async function sendViaSmsProvider(msg: SmsMessage): Promise<SmsSendResult> {
  // Replace this block with a real provider call, e.g.:
  //   const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  //   const result = await client.messages.create({ to: msg.to, from: process.env.TWILIO_FROM, body: msg.body });
  //   return { success: true, messageId: result.sid };

  console.info('[SMS stub] Would send to', msg.to, ':', msg.body);
  return { success: true, messageId: `stub_${Date.now()}` };
}

// ── Retry logic ───────────────────────────────────────────────────────────────
async function sendWithRetry(msg: SmsMessage, maxAttempts = 3): Promise<SmsSendResult> {
  let lastError = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await sendViaSmsProvider(msg);
      if (result.success) return result;
      lastError = result.error ?? 'Unknown error';
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, attempt * 1000));
  }
  return { success: false, error: lastError };
}

// ── Phone validation ───────────────────────────────────────────────────────────
function normalisePhone(phone: string | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  // Prepend + if not already an international number
  return phone.startsWith('+') ? phone : `+${digits}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendAppointmentConfirmation(params: {
  patientName: string;
  phoneNumber: string | undefined;
  facilityName: string;
  dateTime: string;
}): Promise<SmsSendResult> {
  const to = normalisePhone(params.phoneNumber);
  if (!to) return { success: false, error: 'Missing or invalid phone number' };

  return sendWithRetry({
    to,
    body: `Hello ${params.patientName}, your appointment at ${params.facilityName} has been scheduled for ${params.dateTime}. Reply STOP to opt out.`,
  });
}

export async function sendAppointmentReminder(params: {
  patientName: string;
  phoneNumber: string | undefined;
  facilityName: string;
  dateTime: string;
  hoursUntil: number;
}): Promise<SmsSendResult> {
  const to = normalisePhone(params.phoneNumber);
  if (!to) return { success: false, error: 'Missing or invalid phone number' };

  const when = params.hoursUntil === 0
    ? 'today'
    : params.hoursUntil === 24
    ? 'tomorrow'
    : `in ${params.hoursUntil} hour${params.hoursUntil !== 1 ? 's' : ''}`;

  return sendWithRetry({
    to,
    body: `Reminder: ${params.patientName}, you have an appointment at ${params.facilityName} ${when} (${params.dateTime}). Reply STOP to opt out.`,
  });
}

export async function sendMissedAppointmentFollowUp(params: {
  patientName: string;
  phoneNumber: string | undefined;
  facilityName: string;
}): Promise<SmsSendResult> {
  const to = normalisePhone(params.phoneNumber);
  if (!to) return { success: false, error: 'Missing or invalid phone number' };

  return sendWithRetry({
    to,
    body: `Hello ${params.patientName}, we missed you at your appointment at ${params.facilityName}. Please call us to reschedule. Reply STOP to opt out.`,
  });
}
