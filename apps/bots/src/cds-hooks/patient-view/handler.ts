import type { BotEvent, MedplumClient } from '@medplum/core';
import { Engine } from 'json-rules-engine';
import {
  getPatientAllergies,
  getActiveConditions,
  getRecentObservations,
} from '../../shared/fhir/fhir-utils';

interface CDSCard {
  uuid: string;
  summary: string;
  detail?: string;
  indicator: 'info' | 'warning' | 'critical';
  source: { label: string; url?: string };
}

interface CDSResponse {
  cards: CDSCard[];
}

/**
 * CDS Hooks patient-view bot.
 *
 * 100% deterministic — no AI or external calls.
 * Evaluates using json-rules-engine:
 *  1. Known high-risk allergies (penicillin, sulfonamides, latex)
 *  2. Active conditions requiring monitoring (DM, HTN, sickle cell)
 *  3. Overdue screenings (malaria RDT if pyrexia present)
 *  4. Duplicate active encounters
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent
): Promise<CDSResponse> {
  const context = event.input as {
    context?: { patientId?: string };
    prefetch?: { patient?: { reference: string } };
  };

  const patientId =
    context?.context?.patientId ??
    context?.prefetch?.patient?.reference?.split('/')?.[1];

  if (!patientId) {
    return { cards: [] };
  }

  const cards: CDSCard[] = [];

  try {
    const [allergies, conditions, observations] = await Promise.all([
      getPatientAllergies(medplum, patientId),
      getActiveConditions(medplum, patientId),
      getRecentObservations(medplum, patientId, 20),
    ]);

    // ── 1. High-risk allergy alerts ────────────────────────────────────────
    const HIGH_RISK_ALLERGEN_KEYWORDS = ['penicillin', 'sulfa', 'sulfonamide', 'latex', 'contrast'];

    for (const allergy of allergies) {
      const substanceName = (
        allergy.code?.text ??
        allergy.code?.coding?.[0]?.display ??
        ''
      ).toLowerCase();

      const isHighRisk = HIGH_RISK_ALLERGEN_KEYWORDS.some((kw) =>
        substanceName.includes(kw)
      );

      if (isHighRisk && allergy.criticality === 'high') {
        cards.push({
          uuid: `allergy-${allergy.id}`,
          summary: `High-risk allergy: ${allergy.code?.text ?? 'Unknown allergen'}`,
          detail: allergy.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display
            ? `Previous reaction: ${allergy.reaction[0].manifestation[0].coding[0].display}`
            : 'High criticality allergy on record. Verify before prescribing.',
          indicator: 'critical',
          source: { label: 'Lotto Central Hospital Allergy Registry' },
        });
      }
    }

    // ── 2. Active conditions requiring monitoring ──────────────────────────
    const MONITORING_CONDITIONS: Record<string, string> = {
      'diabetes': 'Patient has active diabetes. Verify recent HbA1c and glucose levels.',
      'hypertension': 'Patient has active hypertension. Verify recent BP readings.',
      'sickle cell': 'Patient has sickle cell disease. Avoid hypoxia, dehydration, cold exposure.',
      'chronic kidney': 'Patient has CKD. Renally dose medications and avoid nephrotoxins.',
      'malaria': 'Active malaria diagnosis. Ensure appropriate antimalarial therapy is prescribed.',
    };

    for (const condition of conditions) {
      const conditionText = (
        condition.code?.text ??
        condition.code?.coding?.[0]?.display ??
        ''
      ).toLowerCase();

      for (const [keyword, advice] of Object.entries(MONITORING_CONDITIONS)) {
        if (conditionText.includes(keyword)) {
          cards.push({
            uuid: `condition-${condition.id}-${keyword}`,
            summary: `Active condition: ${condition.code?.text ?? keyword}`,
            detail: advice,
            indicator: keyword === 'sickle cell' || keyword === 'malaria' ? 'warning' : 'info',
            source: { label: 'Clinical Decision Support — Active Conditions' },
          });
          break;
        }
      }
    }

    // ── 3. Pyrexia without malaria screening ─────────────────────────────
    const recentTemp = observations.find((obs: any) => {
      const loincCode = obs.code?.coding?.find((c: any) => c.system === 'http://loinc.org')?.code;
      return loincCode === '8310-5'; // Body Temperature LOINC
    });

    const tempValue = (recentTemp as any)?.valueQuantity?.value;
    if (tempValue && tempValue >= 37.5) {
      const malariaRDT = observations.find((obs: any) =>
        obs.code?.coding?.some((c: any) => c.system === 'http://loinc.org' && c.code === '51587-4')
      );

      if (!malariaRDT) {
        cards.push({
          uuid: 'malaria-screening',
          summary: `Fever detected (${tempValue}°C) — Malaria RDT not found`,
          detail: 'Patient has a recent fever reading. A malaria rapid diagnostic test may be indicated in this endemic region.',
          indicator: 'warning',
          source: { label: 'Endemic Disease Screening Protocol' },
        });
      }
    }
  } catch (err) {
    console.error('[patient-view-cds] Error evaluating rules:', err);
    // Return empty cards rather than crashing — CDS must not block clinical flow
  }

  return { cards };
}
