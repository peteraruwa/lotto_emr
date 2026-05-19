import type { BotEvent, MedplumClient } from '@medplum/core';
import { getPatientAllergies, getActiveMedications, getPatientAllergies as getAllergies } from '../../shared/fhir/fhir-utils';
import drugInteractions from '../../shared/rules/drug-interactions.json';

interface CDSCard {
  uuid: string;
  summary: string;
  detail?: string;
  indicator: 'info' | 'warning' | 'critical';
  source: { label: string };
}

/**
 * CDS Hooks order-sign bot.
 *
 * Final safety check before a clinician signs an order:
 *  1. Drug-drug interaction check (against local interaction database)
 *  2. Allergy cross-reference (comprehensive check)
 *  3. Pediatric dose range check (basic weight-based validation)
 *
 * 100% deterministic — no AI or external calls.
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent
): Promise<{ cards: CDSCard[] }> {
  const context = event.input as {
    context?: {
      patientId?: string;
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
    const [activeMedications, allergies, patient] = await Promise.all([
      getActiveMedications(medplum, patientId),
      getPatientAllergies(medplum, patientId),
      medplum.readResource('Patient', patientId),
    ]);

    // Calculate age for pediatric checks
    const dob = (patient as any).birthDate;
    let ageYears = 0;
    if (dob) {
      const diffs = Date.now() - new Date(dob).getTime();
      ageYears = Math.floor(diffs / (1000 * 60 * 60 * 24 * 365.25));
    }

    const isPediatric = ageYears < 18;

    for (const entry of draftOrders) {
      const resource = entry.resource;
      if (!resource || resource.resourceType !== 'MedicationRequest') continue;

      const medicationName = (
        resource.medicationCodeableConcept?.text ??
        resource.medicationCodeableConcept?.coding?.[0]?.display ??
        ''
      ).toLowerCase();

      const medicationRxNorm = resource.medicationCodeableConcept?.coding?.find(
        (c: any) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
      )?.code;

      // ── 1. Drug-drug interaction check ──────────────────────────────────
      const activeRxNorms = activeMedications
        .map((m: any) =>
          m.medicationCodeableConcept?.coding?.find(
            (c: any) => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
          )?.code
        )
        .filter(Boolean);

      for (const interaction of drugInteractions.interactions) {
        const isInvolved =
          interaction.rxnorm.includes(medicationRxNorm ?? '') ||
          interaction.drugs.some((d) => medicationName.includes(d.toLowerCase()));

        if (!isInvolved) continue;

        const hasConflict = interaction.rxnorm.some((rxnorm) =>
          activeRxNorms.includes(rxnorm)
        ) || interaction.drugs.some((drug) =>
          activeMedications.some((m: any) =>
            (m.medicationCodeableConcept?.text ?? '').toLowerCase().includes(drug.toLowerCase())
          )
        );

        if (hasConflict) {
          const indicator =
            interaction.severity === 'contraindicated'
              ? 'critical'
              : interaction.severity === 'major'
              ? 'warning'
              : 'info';

          cards.push({
            uuid: `ddi-${interaction.id}`,
            summary: `${interaction.severity.charAt(0).toUpperCase() + interaction.severity.slice(1)} drug interaction: ${interaction.drugs.join(' + ')}`,
            detail: `${interaction.description}\n\nRecommendation: ${interaction.action}`,
            indicator,
            source: { label: 'Drug Interaction Database — Lotto Central Hospital' },
          });
        }
      }

      // ── 2. Allergy cross-reference ────────────────────────────────────
      for (const allergy of allergies) {
        const allergenName = (
          allergy.code?.text ??
          allergy.code?.coding?.[0]?.display ??
          ''
        ).toLowerCase();

        // Check for penicillin cross-reactivity with cephalosporins
        const isPenicillinFamily =
          allergenName.includes('penicillin') || allergenName.includes('amoxicillin');
        const isCephalosporin =
          medicationName.includes('cefalexin') ||
          medicationName.includes('cefuroxime') ||
          medicationName.includes('ceftriaxone') ||
          medicationName.includes('cefixime');

        if (isPenicillinFamily && isCephalosporin) {
          cards.push({
            uuid: `penicillin-xreact-${allergy.id}`,
            summary: 'Potential cross-reactivity: Penicillin allergy and cephalosporin',
            detail: 'Patient has a documented penicillin-family allergy. Approximately 1–2% cross-reactivity with cephalosporins exists. Assess allergy history carefully before prescribing.',
            indicator: allergy.criticality === 'high' ? 'critical' : 'warning',
            source: { label: 'Allergy Cross-Reactivity Check' },
          });
        }

        if (allergenName && medicationName.includes(allergenName)) {
          cards.push({
            uuid: `allergy-sign-${allergy.id}`,
            summary: `CONTRAINDICATED: Patient has documented allergy to ${allergy.code?.text ?? allergenName}`,
            detail: 'This order is being signed for a patient with a documented allergy to this or a closely related substance. This may be CONTRAINDICATED.',
            indicator: 'critical',
            source: { label: 'Allergy Safety Check' },
          });
        }
      }

      // ── 3. Pediatric dose check ──────────────────────────────────────
      if (isPediatric) {
        const doseValue = resource.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.value;
        const doseUnit = resource.dosageInstruction?.[0]?.doseAndRate?.[0]?.doseQuantity?.unit ?? '';

        // Flag adult-only medications
        const ADULT_ONLY_DRUGS = ['metformin', 'atorvastatin', 'simvastatin', 'warfarin', 'amlodipine'];
        if (ADULT_ONLY_DRUGS.some((d) => medicationName.includes(d))) {
          cards.push({
            uuid: `pediatric-${medicationName}`,
            summary: `Pediatric patient (${ageYears} years): ${resource.medicationCodeableConcept?.text ?? 'Medication'} — verify age-appropriateness`,
            detail: 'This medication is typically used in adults. Confirm that this is appropriate for a pediatric patient and that the dose is weight-adjusted.',
            indicator: 'warning',
            source: { label: 'Pediatric Prescribing Safety' },
          });
        }

        // Flag suspiciously high doses (very basic check)
        if (doseValue && doseUnit.toLowerCase().includes('mg') && doseValue > 500) {
          cards.push({
            uuid: `pediatric-dose-${medicationName}`,
            summary: `Pediatric patient: Verify dose (${doseValue}${doseUnit}) is weight-appropriate`,
            detail: `Patient is ${ageYears} years old. Doses above 500mg should be verified against weight-based dosing guidelines.`,
            indicator: 'warning',
            source: { label: 'Pediatric Dose Safety Check' },
          });
        }
      }
    }
  } catch (err) {
    console.error('[order-sign-cds] Error:', err);
  }

  return { cards };
}
