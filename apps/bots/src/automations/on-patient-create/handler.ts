import type { BotEvent, MedplumClient } from '@medplum/core';
import type { Patient } from '@medplum/fhirtypes';

/**
 * Automation Bot: on-patient-create
 *
 * Triggered by a Medplum Subscription on Patient creation.
 *
 * Generates a hospital MRN in the format: LCH-YYYYNNNNNN
 *   - LCH  = Lotto Central Hospital prefix
 *   - YYYY = current year (4 digits)
 *   - NNNNNN = zero-padded 6-digit sequential number (from a counter stored in a NamingSystem resource)
 *
 * Example: LCH-2024000042
 *
 * The MRN is stored as a Patient identifier with the hospital's MRN system URL.
 */

const MRN_SYSTEM = 'https://lotto-hospital.local/fhir/identifier/mrn';
const MRN_COUNTER_KEY = 'patient-mrn-counter';

async function getNextMRNSequence(medplum: MedplumClient): Promise<number> {
  // Use a Basic resource as a simple counter — not atomic in multi-server setups,
  // but sufficient for single-server on-premises deployment.
  // For production multi-server, replace with a database sequence.
  try {
    const existing = await medplum.searchOne('Basic', {
      identifier: `https://lotto-hospital.local/counters|${MRN_COUNTER_KEY}`,
    });

    if (existing) {
      const currentValue = parseInt(
        (existing as any).extension?.find(
          (e: any) => e.url === 'https://lotto-hospital.local/fhir/StructureDefinition/counter-value'
        )?.valueInteger ?? '0',
        10
      );

      const nextValue = currentValue + 1;

      await medplum.updateResource({
        ...existing,
        extension: [
          {
            url: 'https://lotto-hospital.local/fhir/StructureDefinition/counter-value',
            valueInteger: nextValue,
          },
        ],
      } as any);

      return nextValue;
    } else {
      // Initialize counter
      await medplum.createResource({
        resourceType: 'Basic',
        code: {
          coding: [
            {
              system: 'https://lotto-hospital.local/fhir/CodeSystem/resource-types',
              code: 'Counter',
            },
          ],
          text: 'Patient MRN Counter',
        },
        identifier: [
          {
            system: 'https://lotto-hospital.local/counters',
            value: MRN_COUNTER_KEY,
          },
        ],
        extension: [
          {
            url: 'https://lotto-hospital.local/fhir/StructureDefinition/counter-value',
            valueInteger: 1,
          },
        ],
      } as any);

      return 1;
    }
  } catch (err) {
    // If counter fails (e.g., race condition), generate a time-based fallback
    console.warn('[on-patient-create] MRN counter error, using timestamp fallback:', err);
    return Date.now() % 1_000_000;
  }
}

export async function handler(medplum: MedplumClient, event: BotEvent): Promise<Patient> {
  const patient = event.input as Patient;

  if (!patient?.id) {
    throw new Error('Patient resource with ID is required');
  }

  // Check if MRN is already set (avoid duplicate assignment)
  const existingMRN = patient.identifier?.find((id) => id.system === MRN_SYSTEM);
  if (existingMRN) {
    console.log(`[on-patient-create] Patient ${patient.id} already has MRN: ${existingMRN.value}`);
    return patient;
  }

  // Generate the MRN
  const year = new Date().getFullYear();
  const sequence = await getNextMRNSequence(medplum);
  const mrn = `LCH-${year}${String(sequence).padStart(6, '0')}`;

  console.log(`[on-patient-create] Assigning MRN ${mrn} to Patient ${patient.id}`);

  // Add the MRN identifier to the patient
  const updatedPatient = await medplum.patchResource('Patient', patient.id, [
    {
      op: 'add',
      path: '/identifier/-',
      value: {
        system: MRN_SYSTEM,
        value: mrn,
        use: 'official',
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical Record Number',
            },
          ],
          text: 'MRN',
        },
        assigner: {
          display: 'Lotto Central Hospital',
        },
      },
    },
  ]);

  return updatedPatient;
}
