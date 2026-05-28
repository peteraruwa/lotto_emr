import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface EgfrInputs {
  creatinineUmol: number; // µmol/L
  age: number;
  sex: 'male' | 'female';
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: EgfrInputs = {
    creatinineUmol: Number(inputs.creatinineUmol) || 0,
    age: Number(inputs.age) || 0,
    sex: (inputs.sex as 'male' | 'female') || 'male',
  };

  // Convert µmol/L to mg/dL for CKD-EPI 2021 formula (1 mg/dL = 88.4 µmol/L)
  const scrMgDl = i.creatinineUmol > 0 ? i.creatinineUmol / 88.4 : 0;

  const kappa = i.sex === 'female' ? 0.7 : 0.9;
  const alpha = i.sex === 'female' ? -0.241 : -0.302;
  const sexCoefficient = i.sex === 'female' ? 1.012 : 1.0;

  let egfr = 0;
  if (scrMgDl > 0 && i.age > 0) {
    const ratio = scrMgDl / kappa;
    const minPart = Math.pow(Math.min(ratio, 1), alpha);
    const maxPart = Math.pow(Math.max(ratio, 1), -1.200);
    egfr = 142 * minPart * maxPart * Math.pow(0.9938, i.age) * sexCoefficient;
  }

  const egfrRounded = Math.round(egfr);

  let stage: string;
  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (egfrRounded >= 90) {
    stage = 'G1';
    risk = 'low';
    label = 'G1 — NORMAL';
    interpretation = 'G1: Normal or high GFR.';
    recommendation = 'Routine monitoring. Investigate further if proteinuria/haematuria present.';
  } else if (egfrRounded >= 60) {
    stage = 'G2';
    risk = 'low';
    label = 'G2 — MILDLY DECREASED';
    interpretation = 'G2: Mildly decreased GFR.';
    recommendation = 'Annual review. Modify cardiovascular risk factors.';
  } else if (egfrRounded >= 45) {
    stage = 'G3a';
    risk = 'moderate';
    label = 'G3a — MILDLY-MODERATELY DECREASED';
    interpretation = 'G3a: Mildly to moderately decreased GFR.';
    recommendation = 'Review medications (avoid nephrotoxins). Monitor 6-monthly. Manage BP, glucose, lipids.';
  } else if (egfrRounded >= 30) {
    stage = 'G3b';
    risk = 'moderate';
    label = 'G3b — MODERATELY-SEVERELY DECREASED';
    interpretation = 'G3b: Moderately to severely decreased GFR.';
    recommendation = 'Consider nephrology referral. Anaemia, bone-mineral disease screening. 3–6 monthly review.';
  } else if (egfrRounded >= 15) {
    stage = 'G4';
    risk = 'high';
    label = 'G4 — SEVERELY DECREASED';
    interpretation = 'G4: Severely decreased GFR.';
    recommendation = 'Nephrology referral recommended. Prepare for renal replacement therapy.';
  } else {
    stage = 'G5';
    risk = 'critical';
    label = 'G5 — KIDNEY FAILURE';
    interpretation = 'G5: Kidney failure.';
    recommendation = 'Urgent nephrology input. Dialysis planning required.';
  }

  const breakdown: ScoreRuleItem[] = [
    {
      parameter: 'Serum Creatinine',
      value: `${i.creatinineUmol} µmol/L (${scrMgDl.toFixed(2)} mg/dL)`,
      points: 0,
      explanation: 'Converted to mg/dL for CKD-EPI 2021 formula',
    },
    { parameter: 'Age', value: `${i.age} yrs`, points: 0, explanation: '' },
    { parameter: 'Sex', value: i.sex, points: 0, explanation: i.sex === 'female' ? 'κ=0.7, α=-0.241, ×1.012' : 'κ=0.9, α=-0.302' },
    { parameter: 'eGFR (CKD-EPI 2021)', value: `${egfrRounded} mL/min/1.73m²`, points: 0, explanation: `Stage ${stage}` },
  ];

  return {
    toolId: 'egfr',
    toolName: 'eGFR (CKD-EPI 2021)',
    score: `${egfrRounded} mL/min/1.73m² (${stage})`,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Creatinine': `${i.creatinineUmol} µmol/L`,
      'Age': `${i.age} yrs`,
      'Sex': i.sex,
      'eGFR': `${egfrRounded} mL/min/1.73m²`,
      'CKD Stage': stage,
    },
  };
}

export const EGFR_TOOL: ToolDefinition = {
  id: 'egfr',
  name: 'eGFR — CKD-EPI 2021 (race-free)',
  shortName: 'eGFR',
  description: 'Estimated glomerular filtration rate using CKD-EPI 2021 race-free equation. Stages G1–G5.',
  group: 'renal-metabolic',
  reference: 'Inker LA et al. NEJM. 2021',
  nurseVisible: false,
  fields: [
    { id: 'creatinineUmol', label: 'Serum Creatinine', type: 'number', unit: 'µmol/L', min: 0, max: 2000, step: 1, placeholder: 'e.g. 88' },
    { id: 'age', label: 'Age', type: 'number', unit: 'yrs', min: 0, max: 120, step: 1, placeholder: 'e.g. 55' },
    {
      id: 'sex',
      label: 'Sex',
      type: 'select',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
  ],
  compute,
};
