import type { SafetyFlag } from '../types';
import { DRUG_INTERACTIONS, RENAL_DOSE_DRUGS, DUPLICATE_DRUG_CLASSES, HIGH_ALERT_MEDICATIONS } from '../constants';

function normalizeDrug(name: string): string {
  return name.toLowerCase().trim();
}

function drugMatches(drugName: string, target: string): boolean {
  const d = normalizeDrug(drugName);
  return d.includes(target) || target.includes(d);
}

// Check if a drug is in an interaction pair
function matchesPair(drug: string, pair: [string, string]): boolean {
  return drugMatches(drug, pair[0]) || drugMatches(drug, pair[1]);
}

/**
 * Run all safety checks for a new prescription against the patient's
 * existing active medications and allergy list.
 *
 * @param newDrug        The drug being prescribed now
 * @param activeDrugs    List of drug names already active for this patient
 * @param patientAllergies  Patient's known allergy strings
 * @param patientAge     Age in years (for paediatric dose flags)
 * @param hasRenalImpairment  Whether patient has documented renal impairment
 */
export function runSafetyChecks(
  newDrug: string,
  activeDrugs: string[],
  patientAllergies: string[],
  patientAge: number,
  hasRenalImpairment = false,
): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  const drugLower = normalizeDrug(newDrug);

  // ── 1. Allergy conflict ─────────────────────────────────────────────────
  for (const allergy of patientAllergies) {
    const allergyLower = normalizeDrug(allergy);
    if (drugMatches(drugLower, allergyLower)) {
      flags.push({
        type: 'allergy',
        severity: 'critical',
        message: `Allergy conflict: patient has documented allergy to ${allergy}`,
        drug: newDrug,
        recommendation: 'Do NOT dispense. Verify with prescriber and patient.',
      });
    }
  }

  // ── 2. Drug-drug interactions ──────────────────────────────────────────
  for (const interaction of DRUG_INTERACTIONS) {
    const [drugA, drugB] = interaction.drugs;
    const newMatchesA = drugMatches(drugLower, drugA);
    const newMatchesB = drugMatches(drugLower, drugB);

    if (newMatchesA || newMatchesB) {
      const partner = newMatchesA ? drugB : drugA;
      const existingMatch = activeDrugs.some(d => drugMatches(normalizeDrug(d), partner));
      if (existingMatch) {
        flags.push({
          type: 'interaction',
          severity: interaction.severity,
          message: interaction.message,
          drug: newDrug,
          recommendation: interaction.recommendation,
        });
      }
    }
  }

  // ── 3. Renal dose adjustment ───────────────────────────────────────────
  if (hasRenalImpairment) {
    const match = RENAL_DOSE_DRUGS.find(r => drugMatches(drugLower, r.drug));
    if (match) {
      flags.push({
        type: 'dose',
        severity: match.severity,
        message: `Renal impairment — ${match.message}`,
        drug: newDrug,
        recommendation: match.message,
      });
    }
  }

  // ── 4. Duplicate therapy detection ────────────────────────────────────
  for (const cls of DUPLICATE_DRUG_CLASSES) {
    const newDrugInClass = cls.drugs.some(d => drugMatches(drugLower, d));
    if (newDrugInClass) {
      const existingInClass = activeDrugs.some(ad =>
        cls.drugs.some(d => drugMatches(normalizeDrug(ad), d))
      );
      if (existingInClass) {
        flags.push({
          type: 'duplicate',
          severity: 'high',
          message: cls.message,
          drug: newDrug,
          recommendation: `Review existing ${cls.class} therapy before dispensing.`,
        });
      }
    }
  }

  // ── 5. High-alert medication flag (always) ─────────────────────────────
  const isHighAlert = [...HIGH_ALERT_MEDICATIONS].some(h => drugMatches(drugLower, h));
  if (isHighAlert) {
    flags.push({
      type: 'contraindication',
      severity: 'moderate',
      message: `High-alert medication: ${newDrug} — requires double-check before dispensing`,
      drug: newDrug,
      recommendation: 'Independent double-check required. Verify dose, route, and patient identity.',
    });
  }

  // ── 6. Paediatric flag for high-risk drugs (age < 12) ──────────────────
  if (patientAge > 0 && patientAge < 12) {
    const adultOnlyDrugs = ['metformin', 'warfarin', 'amiodarone', 'spironolactone'];
    if (adultOnlyDrugs.some(d => drugMatches(drugLower, d))) {
      flags.push({
        type: 'dose',
        severity: 'high',
        message: `Paediatric patient (age ${patientAge}) — verify dosing for ${newDrug}`,
        drug: newDrug,
        recommendation: 'Use paediatric dosing guidelines. Confirm weight-based dose with prescriber.',
      });
    }
  }

  // De-duplicate (same type+drug)
  const seen = new Set<string>();
  return flags.filter(f => {
    const key = `${f.type}-${f.drug}-${f.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function highestSeverity(flags: SafetyFlag[]): SafetyFlag['severity'] | null {
  if (flags.some(f => f.severity === 'critical')) return 'critical';
  if (flags.some(f => f.severity === 'high'))     return 'high';
  if (flags.some(f => f.severity === 'moderate')) return 'moderate';
  if (flags.some(f => f.severity === 'low'))      return 'low';
  return null;
}

export function isSafeToDispense(flags: SafetyFlag[]): boolean {
  return !flags.some(f => f.severity === 'critical');
}
