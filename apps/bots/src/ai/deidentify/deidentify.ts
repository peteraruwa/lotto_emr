import type { Patient, Observation, Condition, MedicationRequest } from '@medplum/fhirtypes';

/**
 * De-identification utilities for patient data before sending to Gemini AI.
 *
 * PRIVACY POLICY: No identifiable patient data (name, DOB, address, phone,
 * MRN, email, NIN) may be sent to external AI services.
 *
 * This module replaces PHI with [REDACTED] placeholders or generic descriptors.
 * The AI receives clinical context only — enough to generate a useful draft,
 * without any data that could identify the patient.
 */

export interface DeidentifiedContext {
  patientDescriptor: string; // e.g. "Adult male, 45 years old"
  activeConditions: string[];
  activeMedications: string[];
  recentResults: string[];
  allergyList: string[];
  chiefComplaint?: string;
}

/**
 * Creates a de-identified patient descriptor from a FHIR Patient resource.
 * Returns only age, sex, and generic demographic info — no name, DOB, or ID.
 */
export function deidentifyPatient(patient: Patient): string {
  const gender = patient.gender ?? 'unknown gender';
  const isAdult = patient.birthDate
    ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() >= 18
    : true;

  const ageGroup = (() => {
    if (!patient.birthDate) return 'Adult';
    const age = Math.floor(
      (Date.now() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );
    if (age < 2) return 'Infant';
    if (age < 12) return 'Child';
    if (age < 18) return 'Adolescent';
    if (age < 65) return 'Adult';
    return 'Elderly adult';
  })();

  const ageYears = patient.birthDate
    ? Math.floor(
        (Date.now() - new Date(patient.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      )
    : null;

  return `${ageGroup} ${gender}${ageYears !== null ? `, ${ageYears} years old` : ''}`;
}

/**
 * De-identifies a list of Condition resources.
 * Keeps only the clinical condition name — no references to patient identifiers.
 */
export function deidentifyConditions(conditions: Condition[]): string[] {
  return conditions
    .map(
      (c) =>
        c.code?.text ??
        c.code?.coding?.[0]?.display ??
        'Unknown condition'
    )
    .filter(Boolean) as string[];
}

/**
 * De-identifies a list of MedicationRequest resources.
 * Keeps medication name and dose — no patient references.
 */
export function deidentifyMedications(medications: MedicationRequest[]): string[] {
  return medications.map((med) => {
    const name =
      (med as any).medicationCodeableConcept?.text ??
      (med as any).medicationCodeableConcept?.coding?.[0]?.display ??
      'Unknown medication';

    const doseText =
      (med as any).dosageInstruction?.[0]?.text ??
      (med as any).dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity
        ? `${(med as any).dosageInstruction[0].doseAndRate[0].doseQuantity.value} ${(med as any).dosageInstruction[0].doseAndRate[0].doseQuantity.unit}`
        : '';

    const frequency = (med as any).dosageInstruction?.[0]?.timing?.code?.text ?? '';

    return [name, doseText, frequency].filter(Boolean).join(' ');
  });
}

/**
 * De-identifies a list of Observation resources.
 * Keeps test name, value, and unit — no patient references or dates that could aid re-identification.
 */
export function deidentifyObservations(observations: Observation[]): string[] {
  return observations.map((obs) => {
    const name =
      obs.code?.text ??
      obs.code?.coding?.[0]?.display ??
      'Observation';

    let value = '';
    if ((obs as any).valueQuantity) {
      value = `${(obs as any).valueQuantity.value} ${(obs as any).valueQuantity.unit ?? ''}`.trim();
    } else if ((obs as any).valueString) {
      value = (obs as any).valueString;
    } else if ((obs as any).valueCodeableConcept) {
      value = (obs as any).valueCodeableConcept.text ?? (obs as any).valueCodeableConcept.coding?.[0]?.display ?? '';
    }

    const status = obs.status ?? '';
    return `${name}: ${value}${status === 'final' ? '' : ` (${status})`}`.trim();
  });
}

/**
 * Strips all PHI from a freetext string using a regex-based approach.
 * Replaces names, phone numbers, email addresses, and numeric identifiers.
 *
 * NOTE: This is a best-effort heuristic. The primary de-identification
 * strategy is to never include raw patient resources in AI prompts — use
 * the structured functions above instead.
 */
export function stripPhiFromText(text: string): string {
  return text
    // Nigerian phone numbers
    .replace(/(\+?234|0)[789]\d{9}/g, '[PHONE REDACTED]')
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
    // Dates of birth (common formats)
    .replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, '[DATE REDACTED]')
    // National Identification Numbers (11 digits)
    .replace(/\b\d{11}\b/g, '[ID REDACTED]')
    // MRN pattern (LCH-YYYYNNNNNN)
    .replace(/\bLCH-\d{10}\b/gi, '[MRN REDACTED]')
    // Names prefixed by common Nigerian name patterns (heuristic only)
    .replace(/\b(Mr|Mrs|Miss|Dr|Prof|Chief|Alhaji|Alhaja)\.\s+\w+\s+\w+/gi, '[NAME REDACTED]');
}
