import type { BotEvent, MedplumClient } from '@medplum/core';
import { getActiveMedications, getPatientAllergies } from '../../shared/fhir/fhir-utils';
import formulary from '../../shared/formulary/nigerian-formulary.json';

interface CDSCard {
  uuid: string;
  summary: string;
  detail?: string;
  indicator: 'info' | 'warning' | 'critical';
  source: { label: string };
}

/**
 * CDS Hooks order-select bot.
 *
 * Checks when a clinician selects an order (before signing):
 *  1. Duplicate order detection — is this medication/test already active?
 *  2. Formulary compliance — is the drug on the Nigerian National Formulary?
 *  3. Known allergy cross-reference for the selected medication
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent
): Promise<{ cards: CDSCard[] }> {
  const context = event.input as {
    context?: {
      patientId?: string;
      selections?: string[];
      draftOrders?: { entry?: Array<{ resource?: any }> };
    };
  };

  const patientId = context?.context?.patientId;
  const draftOrders = context?.context?.draftOrders?.entry ?? [];

  if (!patientId || draftOrders.length === 0) {
    return { cards: [] };
  }

  const cards: CDSCard[] = [];

  try {
    const [activeMedications, allergies] = await Promise.all([
      getActiveMedications(medplum, patientId),
      getPatientAllergies(medplum, patientId),
    ]);

    const formularyNames = new Set(
      formulary.medications.map((m) => m.name.toLowerCase())
    );

    const formularyRxNorms = new Set(
      formulary.medications.map((m) => m.rxnorm)
    );

    for (const entry of draftOrders) {
      const resource = entry.resource;
      if (!resource) continue;

      const resourceType = resource.resourceType;

      if (resourceType === 'MedicationRequest') {
        const medicationName = (
          resource.medicationCodeableConcept?.text ??
          resource.medicationCodeableConcept?.coding?.[0]?.display ??
          ''
        ).toLowerCase();

        const medicationRxNorm = resource.medicationCodeableConcept?.coding?.find(
          (c: any) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
        )?.code;

        // ── 1. Duplicate order check ─────────────────────────────────────
        const isDuplicate = activeMedications.some((activeMed: any) => {
          const activeName = (
            activeMed.medicationCodeableConcept?.text ??
            activeMed.medicationCodeableConcept?.coding?.[0]?.display ??
            ''
          ).toLowerCase();

          const activeRxNorm = activeMed.medicationCodeableConcept?.coding?.find(
            (c: any) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
          )?.code;

          return (
            (medicationRxNorm && activeRxNorm && medicationRxNorm === activeRxNorm) ||
            (medicationName && activeName && medicationName === activeName)
          );
        });

        if (isDuplicate) {
          cards.push({
            uuid: `duplicate-${resourceType}-${medicationName}`,
            summary: `Duplicate order: ${resource.medicationCodeableConcept?.text ?? 'Medication'} is already active`,
            detail: 'This medication appears to already be prescribed and active for this patient. Review before placing a second order.',
            indicator: 'warning',
            source: { label: 'Duplicate Order Detection' },
          });
        }

        // ── 2. Formulary compliance ──────────────────────────────────────
        const isOnFormulary =
          formularyRxNorms.has(medicationRxNorm) ||
          [...formularyNames].some((name) => medicationName.includes(name));

        if (!isOnFormulary && medicationName) {
          cards.push({
            uuid: `formulary-${medicationName}`,
            summary: `Off-formulary medication: ${resource.medicationCodeableConcept?.text ?? 'Medication'}`,
            detail: 'This medication may not be on the Nigerian National Formulary. Confirm availability in the hospital pharmacy before prescribing.',
            indicator: 'info',
            source: { label: 'Nigerian National Formulary Check' },
          });
        }

        // ── 3. Allergy cross-reference ────────────────────────────────────
        for (const allergy of allergies) {
          const allergenName = (
            allergy.code?.text ??
            allergy.code?.coding?.[0]?.display ??
            ''
          ).toLowerCase();

          if (allergenName && medicationName.includes(allergenName)) {
            cards.push({
              uuid: `allergy-${allergy.id}-${medicationName}`,
              summary: `Allergy alert: Patient is allergic to ${allergy.code?.text ?? allergenName}`,
              detail: `Prescribing ${resource.medicationCodeableConcept?.text} to a patient with a documented allergy to ${allergy.code?.text ?? allergenName}. Previous reaction: ${allergy.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display ?? 'not recorded'}.`,
              indicator: 'critical',
              source: { label: 'Allergy Cross-Reference' },
            });
          }
        }
      }

      // ServiceRequest duplicate check
      if (resourceType === 'ServiceRequest') {
        const orderedCode = resource.code?.coding?.[0]?.code;
        const orderedText = (resource.code?.text ?? '').toLowerCase();

        if (orderedCode || orderedText) {
          const existingOrders = await medplum.searchResources('ServiceRequest', {
            patient: `Patient/${patientId}`,
            status: 'active',
            _count: '50',
          });

          const isDuplicate = (existingOrders as any[]).some((sr: any) => {
            const srCode = sr.code?.coding?.[0]?.code;
            const srText = (sr.code?.text ?? '').toLowerCase();
            return (orderedCode && srCode && orderedCode === srCode) || (orderedText && srText && orderedText === srText);
          });

          if (isDuplicate) {
            cards.push({
              uuid: `duplicate-servicerequest-${orderedCode ?? orderedText}`,
              summary: `Duplicate order: ${resource.code?.text ?? 'Test'} may already be active`,
              detail: 'A similar test or procedure appears to already be ordered and active for this patient.',
              indicator: 'warning',
              source: { label: 'Duplicate Order Detection' },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[order-select-cds] Error:', err);
  }

  return { cards };
}
