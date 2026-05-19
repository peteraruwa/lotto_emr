import type { BotEvent, MedplumClient } from '@medplum/core';
import type { Observation } from '@medplum/fhirtypes';
import { createCriticalTask, getLoincCode } from '../../shared/fhir/fhir-utils';
import criticalLabValues from '../../shared/rules/critical-lab-values.json';

interface CriticalRule {
  name: string;
  loinc: string;
  displayName: string;
  unit: string;
  criticalLow?: number;
  criticalHigh?: number;
  actionLow?: string;
  actionHigh?: string;
}

/**
 * Automation Bot: on-observation-create
 *
 * Triggered by a Medplum Subscription on Observation creation.
 *
 * Checks if the new Observation value falls outside critical lab value ranges.
 * If critical, creates a STAT Task resource to flag it for urgent clinician review.
 *
 * The Task is visible in the task queue and triggers a notification to the responsible
 * practitioner (notification delivery is handled by the Medplum subscription system).
 */
export async function handler(medplum: MedplumClient, event: BotEvent): Promise<void> {
  const observation = event.input as Observation;

  if (!observation?.id) {
    throw new Error('Observation resource with ID is required');
  }

  // Only evaluate final or amended observations
  if (!['final', 'amended', 'corrected', 'preliminary'].includes(observation.status ?? '')) {
    return;
  }

  // Must have a numeric value to check
  const value = (observation as any).valueQuantity?.value;
  if (typeof value !== 'number') {
    return;
  }

  const loincCode = getLoincCode(observation);
  if (!loincCode) {
    return;
  }

  // Find a matching critical rule
  const rule = (criticalLabValues.rules as CriticalRule[]).find(
    (r) => r.loinc === loincCode
  );

  if (!rule) {
    return;
  }

  let isCritical = false;
  let criticalMessage = '';
  let criticalDirection: 'low' | 'high' = 'high';

  if (rule.criticalLow !== undefined && value < rule.criticalLow) {
    isCritical = true;
    criticalDirection = 'low';
    criticalMessage = `Critical LOW ${rule.displayName}: ${value} ${rule.unit} (critical threshold: < ${rule.criticalLow} ${rule.unit})`;
    if (rule.actionLow) {
      criticalMessage += `\nAction required: ${rule.actionLow}`;
    }
  } else if (rule.criticalHigh !== undefined && value > rule.criticalHigh) {
    isCritical = true;
    criticalDirection = 'high';
    criticalMessage = `Critical HIGH ${rule.displayName}: ${value} ${rule.unit} (critical threshold: > ${rule.criticalHigh} ${rule.unit})`;
    if (rule.actionHigh) {
      criticalMessage += `\nAction required: ${rule.actionHigh}`;
    }
  }

  if (!isCritical) {
    return;
  }

  const patientReference = (observation as any).subject?.reference;
  const patientId = patientReference?.split('/')?.[1];

  if (!patientId) {
    console.warn(`[on-observation-create] Cannot create Task: no patient reference on Observation ${observation.id}`);
    return;
  }

  console.log(`[on-observation-create] Critical value detected: ${criticalMessage}`);

  try {
    const task = await createCriticalTask(medplum, {
      patientId,
      description: criticalMessage,
      focusReference: { reference: `Observation/${observation.id}` },
      priority: 'stat',
    });

    console.log(
      `[on-observation-create] Created critical Task ${task.id} for Patient ${patientId}, Observation ${observation.id}`
    );

    // Also update the observation interpretation code to flag it as critical
    await medplum.patchResource('Observation', observation.id, [
      {
        op: 'add',
        path: '/interpretation',
        value: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                code: criticalDirection === 'low' ? 'LL' : 'HH',
                display: criticalDirection === 'low' ? 'Critical Low' : 'Critical High',
              },
            ],
            text: criticalDirection === 'low' ? 'Critical Low' : 'Critical High',
          },
        ],
      },
    ]);
  } catch (err) {
    console.error(`[on-observation-create] Failed to create critical Task:`, err);
    // Don't rethrow — the observation was saved successfully even if the Task fails
  }
}
