import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface QsofaInputs {
  alteredMental: boolean; // GCS < 15
  respRate: number;
  sbp: number;
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: QsofaInputs = {
    alteredMental: Boolean(inputs.alteredMental),
    respRate: Number(inputs.respRate) || 0,
    sbp: Number(inputs.sbp) || 0,
  };

  const mentalPts = i.alteredMental ? 1 : 0;
  const rrPts = i.respRate >= 22 ? 1 : 0;
  const sbpPts = i.sbp <= 100 ? 1 : 0;

  const breakdown: ScoreRuleItem[] = [
    {
      parameter: 'Altered Mental Status (GCS < 15)',
      value: i.alteredMental ? 'Yes' : 'No',
      points: mentalPts,
      explanation: i.alteredMental ? 'GCS less than 15 — altered mentation' : 'GCS = 15 — alert and orientated',
    },
    {
      parameter: 'Respiratory Rate ≥ 22/min',
      value: `${i.respRate}/min`,
      points: rrPts,
      explanation: rrPts ? 'Tachypnea — RR ≥ 22' : 'RR below qSOFA threshold',
    },
    {
      parameter: 'Systolic BP ≤ 100 mmHg',
      value: `${i.sbp} mmHg`,
      points: sbpPts,
      explanation: sbpPts ? 'Hypotension — SBP ≤ 100' : 'SBP above qSOFA threshold',
    },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total >= 2) {
    risk = 'high';
    label = 'HIGH RISK';
    interpretation = 'Meets qSOFA criteria — High risk of poor outcome from sepsis.';
    recommendation = 'Urgent clinical review. Blood cultures, lactate, IV access. Consider full SOFA assessment.';
  } else if (total === 1) {
    risk = 'moderate';
    label = 'MODERATE RISK';
    interpretation = 'One qSOFA criterion present.';
    recommendation = 'Monitor closely. Consider sepsis workup if clinical suspicion.';
  } else {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'Low risk of poor outcome from sepsis.';
    recommendation = 'Routine monitoring. Reassess if clinical condition changes.';
  }

  return {
    toolId: 'qsofa',
    toolName: 'qSOFA',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Altered Mental Status': i.alteredMental ? 'Yes' : 'No',
      'Respiratory Rate': `${i.respRate}/min`,
      'Systolic BP': `${i.sbp} mmHg`,
    },
  };
}

export const QSOFA_TOOL: ToolDefinition = {
  id: 'qsofa',
  name: 'qSOFA — Quick Sequential Organ Failure Assessment',
  shortName: 'qSOFA',
  description: 'Bedside sepsis screening tool for suspected infection outside ICU. Score ≥2 suggests high mortality risk.',
  group: 'emergency-icu',
  reference: 'Singer M et al. JAMA. 2016 (Sepsis-3)',
  nurseVisible: false,
  fields: [
    { id: 'alteredMental', label: 'Altered Mental Status (GCS < 15)', type: 'boolean' },
    { id: 'respRate', label: 'Respiratory Rate', type: 'number', unit: '/min', min: 0, max: 60, step: 1, placeholder: 'e.g. 24' },
    { id: 'sbp', label: 'Systolic BP', type: 'number', unit: 'mmHg', min: 40, max: 260, step: 1, placeholder: 'e.g. 95' },
  ],
  compute,
};
