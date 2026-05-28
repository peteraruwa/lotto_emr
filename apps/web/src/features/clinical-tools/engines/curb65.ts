import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface Curb65Inputs {
  confusion: boolean;
  urea: number; // mmol/L
  respRate: number;
  sbp: number;
  dbp: number;
  age: number;
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: Curb65Inputs = {
    confusion: Boolean(inputs.confusion),
    urea: Number(inputs.urea) || 0,
    respRate: Number(inputs.respRate) || 0,
    sbp: Number(inputs.sbp) || 0,
    dbp: Number(inputs.dbp) || 0,
    age: Number(inputs.age) || 0,
  };

  const confPts = i.confusion ? 1 : 0;
  const ureaPts = i.urea > 7 ? 1 : 0;
  const rrPts = i.respRate >= 30 ? 1 : 0;
  const bpPts = (i.sbp < 90 || i.dbp <= 60) ? 1 : 0;
  const agePts = i.age >= 65 ? 1 : 0;

  const breakdown: ScoreRuleItem[] = [
    {
      parameter: 'Confusion (new)',
      value: i.confusion ? 'Yes' : 'No',
      points: confPts,
      explanation: confPts ? 'New mental confusion present' : 'No new confusion',
    },
    {
      parameter: 'Urea > 7 mmol/L',
      value: `${i.urea} mmol/L`,
      points: ureaPts,
      explanation: ureaPts ? 'Elevated urea suggests dehydration / AKI' : 'Urea within normal range',
    },
    {
      parameter: 'Respiratory Rate ≥ 30/min',
      value: `${i.respRate}/min`,
      points: rrPts,
      explanation: rrPts ? 'Severe tachypnea' : 'RR below severe threshold',
    },
    {
      parameter: 'Blood Pressure (SBP < 90 or DBP ≤ 60)',
      value: `${i.sbp}/${i.dbp} mmHg`,
      points: bpPts,
      explanation: bpPts ? 'Hemodynamic compromise' : 'BP within acceptable range',
    },
    {
      parameter: 'Age ≥ 65 years',
      value: `${i.age} yrs`,
      points: agePts,
      explanation: agePts ? 'Elderly — increased mortality risk' : 'Age below 65',
    },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total >= 3) {
    risk = 'high';
    label = 'HIGH RISK';
    interpretation = 'Severe community-acquired pneumonia.';
    recommendation = total >= 4
      ? 'Hospital admission essential. Score 4–5: consider ICU admission.'
      : 'Hospital admission. Consider HDU/ICU based on overall clinical picture.';
  } else if (total === 2) {
    risk = 'moderate';
    label = 'MODERATE RISK';
    interpretation = 'Moderate severity pneumonia.';
    recommendation = 'Consider short admission or supervised outpatient treatment.';
  } else {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'Low severity pneumonia.';
    recommendation = 'Consider home treatment with oral antibiotics. Follow-up arranged.';
  }

  return {
    toolId: 'curb65',
    toolName: 'CURB-65',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Confusion': i.confusion ? 'Yes' : 'No',
      'Urea': `${i.urea} mmol/L`,
      'Respiratory Rate': `${i.respRate}/min`,
      'BP': `${i.sbp}/${i.dbp} mmHg`,
      'Age': `${i.age} yrs`,
    },
  };
}

export const CURB65_TOOL: ToolDefinition = {
  id: 'curb65',
  name: 'CURB-65 — Pneumonia Severity Score',
  shortName: 'CURB-65',
  description: 'Severity assessment for community-acquired pneumonia to guide admission decisions.',
  group: 'respiratory',
  reference: 'Lim WS et al. Thorax. 2003',
  nurseVisible: false,
  fields: [
    { id: 'confusion', label: 'New Confusion (AMTS ≤ 8)', type: 'boolean' },
    { id: 'urea', label: 'Blood Urea', type: 'number', unit: 'mmol/L', min: 0, max: 60, step: 0.1, placeholder: 'e.g. 8.5' },
    { id: 'respRate', label: 'Respiratory Rate', type: 'number', unit: '/min', min: 0, max: 60, step: 1, placeholder: 'e.g. 32' },
    { id: 'sbp', label: 'Systolic BP', type: 'number', unit: 'mmHg', min: 40, max: 260, step: 1, placeholder: 'e.g. 90' },
    { id: 'dbp', label: 'Diastolic BP', type: 'number', unit: 'mmHg', min: 20, max: 150, step: 1, placeholder: 'e.g. 60' },
    { id: 'age', label: 'Age', type: 'number', unit: 'yrs', min: 0, max: 120, step: 1, placeholder: 'e.g. 72' },
  ],
  compute,
};
