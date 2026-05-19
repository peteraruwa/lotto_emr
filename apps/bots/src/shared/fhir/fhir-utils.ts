import type { MedplumClient } from '@medplum/core';
import type {
  Patient,
  Observation,
  AllergyIntolerance,
  Condition,
  MedicationRequest,
  Task,
  Reference,
} from '@medplum/fhirtypes';

/**
 * Fetches all active AllergyIntolerances for a patient.
 */
export async function getPatientAllergies(
  medplum: MedplumClient,
  patientId: string
): Promise<AllergyIntolerance[]> {
  return medplum.searchResources('AllergyIntolerance', {
    patient: `Patient/${patientId}`,
    'clinical-status': 'active',
  });
}

/**
 * Fetches active conditions for a patient.
 */
export async function getActiveConditions(
  medplum: MedplumClient,
  patientId: string
): Promise<Condition[]> {
  return medplum.searchResources('Condition', {
    patient: `Patient/${patientId}`,
    'clinical-status': 'active',
  });
}

/**
 * Fetches active medication requests for a patient.
 */
export async function getActiveMedications(
  medplum: MedplumClient,
  patientId: string
): Promise<MedicationRequest[]> {
  return medplum.searchResources('MedicationRequest', {
    patient: `Patient/${patientId}`,
    status: 'active',
  });
}

/**
 * Fetches recent observations (lab results, vitals) for a patient.
 */
export async function getRecentObservations(
  medplum: MedplumClient,
  patientId: string,
  count = 50
): Promise<Observation[]> {
  return medplum.searchResources('Observation', {
    patient: `Patient/${patientId}`,
    _sort: '-date',
    _count: String(count),
  });
}

/**
 * Creates an urgent Task resource to flag a critical finding for immediate review.
 */
export async function createCriticalTask(
  medplum: MedplumClient,
  options: {
    patientId: string;
    description: string;
    focusReference: Reference;
    priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  }
): Promise<Task> {
  const task: Task = {
    resourceType: 'Task',
    status: 'requested',
    intent: 'order',
    priority: options.priority ?? 'stat',
    code: {
      text: 'Critical Value Review',
      coding: [
        {
          system: 'https://lotto-hospital.local/fhir/CodeSystem/task-codes',
          code: 'critical-value-review',
        },
      ],
    },
    description: options.description,
    for: { reference: `Patient/${options.patientId}` },
    focus: options.focusReference,
    authoredOn: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    meta: {
      tag: [
        {
          system: 'https://lotto-hospital.local/fhir/task-category',
          code: 'critical-alert',
        },
      ],
    },
  };

  return medplum.createResource(task);
}

/**
 * Extracts the LOINC code from an Observation.
 */
export function getLoincCode(observation: Observation): string | undefined {
  return observation.code?.coding?.find(
    (c) => c.system === 'http://loinc.org'
  )?.code;
}

/**
 * Extracts the RxNorm code from a MedicationRequest.
 */
export function getRxNormCode(medRequest: MedicationRequest): string | undefined {
  const concept = medRequest.medicationCodeableConcept;
  return concept?.coding?.find(
    (c) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
  )?.code;
}

/**
 * Gets the medication name from a MedicationRequest.
 */
export function getMedicationName(medRequest: MedicationRequest): string {
  return (
    medRequest.medicationCodeableConcept?.text ??
    medRequest.medicationCodeableConcept?.coding?.[0]?.display ??
    'Unknown medication'
  );
}

/**
 * Gets the allergy substance name from an AllergyIntolerance.
 */
export function getAllergySubstanceName(allergy: AllergyIntolerance): string {
  return (
    allergy.code?.text ??
    allergy.code?.coding?.[0]?.display ??
    allergy.reaction?.[0]?.substance?.text ??
    'Unknown substance'
  );
}
