import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface Chads2VascInputs {
  chf: boolean;
  hypertension: boolean;
  age: number; // years
  diabetes: boolean;
  strokeTia: boolean;
  vascularDisease: boolean;
  sex: 'male' | 'female';
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: Chads2VascInputs = {
    chf: Boolean(inputs.chf),
    hypertension: Boolean(inputs.hypertension),
    age: Number(inputs.age) || 0,
    diabetes: Boolean(inputs.diabetes),
    strokeTia: Boolean(inputs.strokeTia),
    vascularDisease: Boolean(inputs.vascularDisease),
    sex: (inputs.sex as 'male' | 'female') || 'male',
  };

  const ageOver75Pts = i.age >= 75 ? 2 : 0;
  const age6574Pts = i.age >= 65 && i.age <= 74 ? 1 : 0;
  const sexPts = i.sex === 'female' ? 1 : 0;
  const chfPts = i.chf ? 1 : 0;
  const htnPts = i.hypertension ? 1 : 0;
  const dmPts = i.diabetes ? 1 : 0;
  const strokePts = i.strokeTia ? 2 : 0;
  const vascPts = i.vascularDisease ? 1 : 0;

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Congestive heart failure / LVEF < 40%', value: i.chf ? 'Yes' : 'No', points: chfPts, explanation: i.chf ? 'CHF history present' : '' },
    { parameter: 'Hypertension', value: i.hypertension ? 'Yes' : 'No', points: htnPts, explanation: '' },
    { parameter: 'Age ≥ 75', value: i.age >= 75 ? 'Yes' : 'No', points: ageOver75Pts, explanation: i.age >= 75 ? 'Elderly — +2' : '' },
    { parameter: 'Diabetes mellitus', value: i.diabetes ? 'Yes' : 'No', points: dmPts, explanation: '' },
    { parameter: 'Stroke / TIA / thromboembolism', value: i.strokeTia ? 'Yes' : 'No', points: strokePts, explanation: i.strokeTia ? 'Prior thromboembolic event — +2' : '' },
    { parameter: 'Vascular disease (MI / PAD / aortic plaque)', value: i.vascularDisease ? 'Yes' : 'No', points: vascPts, explanation: '' },
    { parameter: 'Age 65–74', value: i.age >= 65 && i.age <= 74 ? 'Yes' : 'No', points: age6574Pts, explanation: age6574Pts ? '+1 for age 65–74' : '' },
    { parameter: 'Sex category — Female', value: i.sex === 'female' ? 'Yes' : 'No', points: sexPts, explanation: sexPts ? '+1 (only adds to total when other risk factors present)' : '' },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total >= 2) {
    risk = 'high';
    label = 'HIGH RISK';
    interpretation = `CHA₂DS₂-VASc = ${total} — Significant stroke risk in atrial fibrillation.`;
    recommendation = 'Oral anticoagulation recommended (unless contraindicated). Assess bleeding risk using HAS-BLED.';
  } else if (total === 1 && i.sex === 'male') {
    risk = 'moderate';
    label = 'MODERATE RISK';
    interpretation = 'CHA₂DS₂-VASc = 1 (male) — Intermediate stroke risk.';
    recommendation = 'Consider anticoagulation (preference for DOAC). Assess bleeding risk.';
  } else if (total === 1 && i.sex === 'female') {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'CHA₂DS₂-VASc = 1 (female-only point) — Female sex alone is not sufficient for anticoagulation.';
    recommendation = 'Anticoagulation generally not recommended. Reassess if other risk factors develop.';
  } else {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'CHA₂DS₂-VASc = 0 — Very low annual stroke risk.';
    recommendation = 'Anticoagulation not recommended.';
  }

  return {
    toolId: 'chads2vasc',
    toolName: 'CHA₂DS₂-VASc',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'CHF': i.chf ? 'Yes' : 'No',
      'Hypertension': i.hypertension ? 'Yes' : 'No',
      'Age': `${i.age} yrs`,
      'Diabetes': i.diabetes ? 'Yes' : 'No',
      'Stroke/TIA': i.strokeTia ? 'Yes' : 'No',
      'Vascular Disease': i.vascularDisease ? 'Yes' : 'No',
      'Sex': i.sex,
    },
  };
}

export const CHADS2VASC_TOOL: ToolDefinition = {
  id: 'chads2vasc',
  name: 'CHA₂DS₂-VASc Score',
  shortName: 'CHA₂DS₂-VASc',
  description: 'Stroke risk stratification in non-valvular atrial fibrillation. Guides anticoagulation decisions.',
  group: 'cardiology',
  reference: 'Lip GYH et al. Chest. 2010',
  nurseVisible: false,
  fields: [
    { id: 'chf', label: 'Congestive Heart Failure / LVEF < 40%', type: 'boolean' },
    { id: 'hypertension', label: 'Hypertension', type: 'boolean' },
    { id: 'age', label: 'Age', type: 'number', unit: 'yrs', min: 0, max: 120, step: 1, placeholder: 'e.g. 68' },
    { id: 'diabetes', label: 'Diabetes Mellitus', type: 'boolean' },
    { id: 'strokeTia', label: 'Stroke / TIA / Thromboembolism history', type: 'boolean' },
    { id: 'vascularDisease', label: 'Vascular Disease (MI, PAD, aortic plaque)', type: 'boolean' },
    {
      id: 'sex',
      label: 'Sex',
      type: 'select',
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female (+1)' },
      ],
    },
  ],
  compute,
};
