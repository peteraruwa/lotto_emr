import type {
  Patient,
  HumanName,
  Encounter,
  Observation,
  Identifier,
  Reference,
} from '@medplum/fhirtypes';
import { CriticalityLevel } from './types';

// ── Patient helpers ────────────────────────────────────────────────────────────

/**
 * Formats a FHIR HumanName array into a display string.
 * Prefers the 'official' use name; falls back to the first entry.
 */
export function formatPatientName(names: HumanName[] | undefined): string {
  if (!names || names.length === 0) return 'Unknown';

  const official = names.find((n) => n.use === 'official') ?? names[0];
  const given = (official.given ?? []).join(' ');
  const family = official.family ?? '';

  if (!given && !family) return official.text ?? 'Unknown';
  return `${given} ${family}`.trim();
}

/**
 * Extracts the hospital MRN from a Patient's identifiers.
 * Looks for the LCH-specific identifier system.
 */
export function formatPatientMRN(patient: Patient): string {
  const mrnIdentifier = patient.identifier?.find(
    (id: Identifier) =>
      id.system === 'https://lotto-hospital.local/fhir/identifier/mrn' ||
      id.type?.coding?.some((c) => c.code === 'MR')
  );
  return mrnIdentifier?.value ?? 'N/A';
}

/**
 * Finds the current active or in-progress encounter for a patient
 * from a list of encounters.
 */
export function getActiveEncounter(encounters: Encounter[]): Encounter | undefined {
  return encounters.find(
    (e) => e.status === 'in-progress' || e.status === 'arrived' || e.status === 'triaged'
  );
}

/**
 * Calculates the patient's age in whole years from their date of birth.
 */
export function getPatientAge(dateOfBirth: string | undefined): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Builds a FHIR Reference to a Patient resource.
 */
export function buildPatientReference(patientId: string): Reference<Patient> {
  return { reference: `Patient/${patientId}` };
}

// ── Observation helpers ────────────────────────────────────────────────────────

interface CriticalRange {
  loinc?: string;
  name: string;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
}

const CRITICAL_RANGES: CriticalRange[] = [
  { loinc: '718-7', name: 'Hemoglobin', criticalLow: 7, criticalHigh: 20, unit: 'g/dL' },
  { loinc: '2823-3', name: 'Potassium', criticalLow: 2.5, criticalHigh: 6.0, unit: 'mEq/L' },
  { loinc: '2951-2', name: 'Sodium', criticalLow: 120, criticalHigh: 160, unit: 'mEq/L' },
  { loinc: '2345-7', name: 'Glucose', criticalLow: 2.8, criticalHigh: 27.8, unit: 'mmol/L' },
  { loinc: '6598-7', name: 'Troponin T', criticalHigh: 0.04, unit: 'ng/mL' },
  { loinc: '10839-9', name: 'Troponin I', criticalHigh: 0.04, unit: 'ng/mL' },
  { loinc: '3094-0', name: 'Urea Nitrogen (BUN)', criticalHigh: 36, unit: 'mmol/L' },
  { loinc: '2160-0', name: 'Creatinine', criticalHigh: 884, unit: 'umol/L' },
];

/**
 * Determines whether an Observation value is outside critical range.
 * Returns a CriticalityLevel based on the observation's value and LOINC code.
 */
export function isObservationCritical(observation: Observation): CriticalityLevel {
  const value = observation.valueQuantity?.value;
  if (value === undefined || value === null) return 'normal';

  const loincCode = observation.code?.coding?.find(
    (c) => c.system === 'http://loinc.org'
  )?.code;

  const range = CRITICAL_RANGES.find((r) => r.loinc === loincCode);
  if (!range) return 'normal';

  if (range.criticalLow !== undefined && value < range.criticalLow) {
    return 'critical-low';
  }
  if (range.criticalHigh !== undefined && value > range.criticalHigh) {
    return 'critical-high';
  }

  // Check reference range from the observation itself
  const obsRefRange = observation.referenceRange?.[0];
  if (obsRefRange) {
    const refLow = obsRefRange.low?.value;
    const refHigh = obsRefRange.high?.value;
    if (refLow !== undefined && value < refLow) return 'low';
    if (refHigh !== undefined && value > refHigh) return 'high';
  }

  return 'normal';
}

/**
 * Formats an Observation's value and unit into a display string.
 */
export function formatObservationValue(observation: Observation): string {
  if (observation.valueQuantity) {
    const { value, unit } = observation.valueQuantity;
    return `${value} ${unit}`;
  }
  if (observation.valueString) return observation.valueString;
  if (observation.valueCodeableConcept) {
    return (
      observation.valueCodeableConcept.text ??
      observation.valueCodeableConcept.coding?.[0]?.display ??
      'Coded value'
    );
  }
  if (observation.valueBoolean !== undefined) {
    return observation.valueBoolean ? 'Positive' : 'Negative';
  }
  return 'N/A';
}
