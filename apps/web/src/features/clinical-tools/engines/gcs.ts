import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface GcsInputs {
  eye: number;   // 1-4
  verbal: number; // 1-5
  motor: number;  // 1-6
}

const EYE_LABEL: Record<number, string> = {
  4: 'Spontaneous',
  3: 'To sound',
  2: 'To pressure',
  1: 'None',
};

const VERBAL_LABEL: Record<number, string> = {
  5: 'Orientated',
  4: 'Confused',
  3: 'Words',
  2: 'Sounds',
  1: 'None',
};

const MOTOR_LABEL: Record<number, string> = {
  6: 'Obeys commands',
  5: 'Localises',
  4: 'Normal flexion',
  3: 'Abnormal flexion',
  2: 'Extension',
  1: 'None',
};

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: GcsInputs = {
    eye: Number(inputs.eye) || 4,
    verbal: Number(inputs.verbal) || 5,
    motor: Number(inputs.motor) || 6,
  };

  const breakdown: ScoreRuleItem[] = [
    {
      parameter: 'Eye opening (E)',
      value: `${EYE_LABEL[i.eye] ?? i.eye} (${i.eye})`,
      points: i.eye,
      explanation: 'E-score 1–4',
    },
    {
      parameter: 'Verbal response (V)',
      value: `${VERBAL_LABEL[i.verbal] ?? i.verbal} (${i.verbal})`,
      points: i.verbal,
      explanation: 'V-score 1–5',
    },
    {
      parameter: 'Motor response (M)',
      value: `${MOTOR_LABEL[i.motor] ?? i.motor} (${i.motor})`,
      points: i.motor,
      explanation: 'M-score 1–6',
    },
  ];

  const total = i.eye + i.verbal + i.motor;

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total <= 8) {
    risk = 'critical';
    label = 'SEVERE';
    interpretation = 'Severe brain injury — GCS ≤ 8.';
    recommendation = 'Patient at risk of airway compromise. Intubation may be required. Urgent neurosurgical/ICU input.';
  } else if (total <= 12) {
    risk = 'moderate';
    label = 'MODERATE';
    interpretation = 'Moderate brain injury — GCS 9–12.';
    recommendation = 'Urgent neurological assessment. Frequent reassessment.';
  } else {
    risk = 'low';
    label = 'MILD';
    interpretation = 'Mild brain injury — GCS 13–15.';
    recommendation = 'Routine neurological observations. Reassess if deterioration.';
  }

  return {
    toolId: 'gcs',
    toolName: 'Glasgow Coma Scale',
    score: `${total} (E${i.eye} V${i.verbal} M${i.motor})`,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Eye opening (E)': `${EYE_LABEL[i.eye] ?? i.eye} (${i.eye})`,
      'Verbal response (V)': `${VERBAL_LABEL[i.verbal] ?? i.verbal} (${i.verbal})`,
      'Motor response (M)': `${MOTOR_LABEL[i.motor] ?? i.motor} (${i.motor})`,
      'Total': total,
    },
  };
}

export const GCS_TOOL: ToolDefinition = {
  id: 'gcs',
  name: 'Glasgow Coma Scale',
  shortName: 'GCS',
  description: 'Standardised neurological assessment scoring eye, verbal, and motor responses (E + V + M).',
  group: 'emergency-icu',
  reference: 'Teasdale G, Jennett B. Lancet. 1974',
  nurseVisible: true,
  fields: [
    {
      id: 'eye',
      label: 'Eye Opening (E)',
      type: 'select',
      options: [
        { value: 4, label: '4 — Spontaneous' },
        { value: 3, label: '3 — To sound' },
        { value: 2, label: '2 — To pressure' },
        { value: 1, label: '1 — None' },
      ],
    },
    {
      id: 'verbal',
      label: 'Verbal Response (V)',
      type: 'select',
      options: [
        { value: 5, label: '5 — Orientated' },
        { value: 4, label: '4 — Confused' },
        { value: 3, label: '3 — Words' },
        { value: 2, label: '2 — Sounds' },
        { value: 1, label: '1 — None' },
      ],
    },
    {
      id: 'motor',
      label: 'Motor Response (M)',
      type: 'select',
      options: [
        { value: 6, label: '6 — Obeys commands' },
        { value: 5, label: '5 — Localises' },
        { value: 4, label: '4 — Normal flexion' },
        { value: 3, label: '3 — Abnormal flexion (decorticate)' },
        { value: 2, label: '2 — Extension (decerebrate)' },
        { value: 1, label: '1 — None' },
      ],
    },
  ],
  compute,
};
