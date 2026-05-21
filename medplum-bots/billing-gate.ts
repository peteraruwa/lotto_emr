/**
 * Billing Gate Bot
 * ────────────────────────────────────────────────────────────────────────────
 * PURPOSE
 *   Enforce the rule: "No lab, radiology, or pharmacy order executes without
 *   an approved billing authorisation."
 *
 * HOW IT WORKS
 *   This bot is triggered by a Medplum Subscription every time a ServiceRequest
 *   or MedicationRequest is created or updated to status = 'active'.
 *
 *   It checks whether the patient has an approved order basket (RequestGroup
 *   with status = 'completed'). If they don't, it reverts the order to 'draft'
 *   and leaves a note explaining why.
 *
 * WHY THIS APPROACH
 *   Enforcing business rules in the frontend (React code) is unreliable —
 *   anyone who knows the API can bypass it. Running this logic inside Medplum
 *   means the rule is enforced at the data layer, for EVERY client.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * HOW TO DEPLOY (step by step)
 *
 * 1. Open your Medplum project → Admin → Bots → "New Bot"
 * 2. Name it "Billing Gate"
 * 3. Paste this file's code into the bot editor
 * 4. Save and Deploy
 *
 * 5. Create a Subscription to trigger it:
 *    - Resource type: ServiceRequest
 *    - Criteria: ServiceRequest?status=active
 *    - Channel: rest-hook → point at your bot's invoke URL
 *
 * 6. Repeat step 5 for MedicationRequest
 *
 * That's it. Every time an order goes 'active', this bot runs automatically.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { BotEvent, MedplumClient } from '@medplum/core';
import type { ServiceRequest, MedicationRequest, RequestGroup } from '@medplum/fhirtypes';

// Orders that require billing approval before execution
// (Follow-up appointments do not require pre-authorisation)
const BILLABLE_CATEGORIES = ['laboratory', 'imaging', 'pharmacy', 'procedure'];

export async function handler(
  medplum: MedplumClient,
  event: BotEvent<ServiceRequest | MedicationRequest>,
): Promise<void> {
  const order = event.input;

  // Only act on orders that are being activated
  if (order.status !== 'active') {
    return;
  }

  // Identify the patient this order belongs to
  const patientReference = order.subject?.reference;
  if (!patientReference) {
    console.log('Order has no patient reference — skipping billing check');
    return;
  }

  // Check if this order type requires billing approval
  // ServiceRequest has a category; MedicationRequest always needs approval
  if (order.resourceType === 'ServiceRequest') {
    const categoryCode = order.category?.[0]?.coding?.[0]?.code ?? '';
    const categoryText = (order.category?.[0]?.text ?? '').toLowerCase();
    const needsApproval =
      BILLABLE_CATEGORIES.some((c) => categoryCode.includes(c) || categoryText.includes(c));

    if (!needsApproval) {
      console.log(`ServiceRequest category "${categoryCode}" does not require billing — allowing`);
      return;
    }
  }

  // Look for an approved billing basket for this patient
  // In our system, approval = RequestGroup with status 'completed'
  const approvedBaskets = await medplum.searchResources('RequestGroup', {
    subject: patientReference,
    status: 'completed',
  }) as RequestGroup[];

  if (approvedBaskets.length > 0) {
    // ✅ Billing approved — order may proceed
    console.log(
      `Billing gate PASSED for ${order.resourceType}/${order.id} ` +
      `(basket: ${approvedBaskets[0].id})`
    );
    return;
  }

  // ❌ No approved basket — revert the order to draft
  console.log(
    `Billing gate BLOCKED: ${order.resourceType}/${order.id} ` +
    `reverted to draft — no approved RequestGroup for ${patientReference}`
  );

  const denialNote = [
    ...(order.note ?? []),
    {
      time: new Date().toISOString(),
      text: 'Order held: billing authorisation required. ' +
            'Please submit an order basket for HMO/billing approval before this order can be activated.',
    },
  ];

  await medplum.updateResource({
    ...order,
    status: 'draft',
    note: denialNote,
  });
}
