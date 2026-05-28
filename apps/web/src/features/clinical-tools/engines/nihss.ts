import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface NihssInputs {
  loc: number;        // 0-3
  locQuestions: number; // 0-2
  locCommands: number;  // 0-2
  gaze: number;        // 0-2
  visualFields: number; // 0-3
  facialPalsy: number;  // 0-3
  motorArmLeft: number; // 0-4
  motorArmRight: number;// 0-4
  sensory: number;      // 0-2
  language: number;     // 0-3
  dysarthria: number;   // 0-2
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: NihssInputs = {
    loc: Number(inputs.loc) || 0,
    locQuestions: Number(inputs.locQuestions) || 0,
    locCommands: Number(inputs.locCommands) || 0,
    gaze: Number(inputs.gaze) || 0,
    visualFields: Number(inputs.visualFields) || 0,
    facialPalsy: Number(inputs.facialPalsy) || 0,
    motorArmLeft: Number(inputs.motorArmLeft) || 0,
    motorArmRight: Number(inputs.motorArmRight) || 0,
    sensory: Number(inputs.sensory) || 0,
    language: Number(inputs.language) || 0,
    dysarthria: Number(inputs.dysarthria) || 0,
  };

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Level of Consciousness (1a)', value: i.loc, points: i.loc, explanation: '0=Alert, 3=Coma' },
    { parameter: 'LOC Questions (1b)', value: i.locQuestions, points: i.locQuestions, explanation: 'Month and age' },
    { parameter: 'LOC Commands (1c)', value: i.locCommands, points: i.locCommands, explanation: 'Open/close eyes; grip/release hand' },
    { parameter: 'Best Gaze (2)', value: i.gaze, points: i.gaze, explanation: 'Horizontal eye movement' },
    { parameter: 'Visual Fields (3)', value: i.visualFields, points: i.visualFields, explanation: 'Confrontation test' },
    { parameter: 'Facial Palsy (4)', value: i.facialPalsy, points: i.facialPalsy, explanation: '0=Normal, 3=Complete paralysis' },
    { parameter: 'Motor Arm — Left (5a)', value: i.motorArmLeft, points: i.motorArmLeft, explanation: '0=No drift, 4=No movement' },
    { parameter: 'Motor Arm — Right (5b)', value: i.motorArmRight, points: i.motorArmRight, explanation: '0=No drift, 4=No movement' },
    { parameter: 'Sensory (8)', value: i.sensory, points: i.sensory, explanation: 'Pin prick' },
    { parameter: 'Language / Aphasia (9)', value: i.language, points: i.language, explanation: '0=Normal, 3=Mute/global aphasia' },
    { parameter: 'Dysarthria (10)', value: i.dysarthria, points: i.dysarthria, explanation: 'Speech clarity' },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total === 0) {
    risk = 'low';
    label = 'NO STROKE SYMPTOMS';
    interpretation = 'No stroke symptoms on NIHSS.';
    recommendation = 'Continue clinical evaluation. Repeat NIHSS if symptoms develop.';
  } else if (total <= 4) {
    risk = 'low';
    label = 'MINOR STROKE';
    interpretation = 'Minor stroke (NIHSS 1–4).';
    recommendation = 'Stroke unit admission. Consider tPA if within window. CT imaging.';
  } else if (total <= 15) {
    risk = 'moderate';
    label = 'MODERATE STROKE';
    interpretation = 'Moderate stroke (NIHSS 5–15).';
    recommendation = 'Urgent neurology review. Thrombolysis assessment. Stroke unit care.';
  } else if (total <= 20) {
    risk = 'high';
    label = 'MODERATELY SEVERE STROKE';
    interpretation = 'Moderately severe stroke (NIHSS 16–20).';
    recommendation = 'Aggressive management. Consider thrombectomy. HDU/stroke unit.';
  } else {
    risk = 'critical';
    label = 'SEVERE STROKE';
    interpretation = 'Severe stroke (NIHSS 21–42).';
    recommendation = 'ICU consideration. Discuss thrombectomy. Senior neurology involvement.';
  }

  return {
    toolId: 'nihss',
    toolName: 'NIH Stroke Scale',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'LOC': i.loc,
      'LOC Questions': i.locQuestions,
      'LOC Commands': i.locCommands,
      'Gaze': i.gaze,
      'Visual Fields': i.visualFields,
      'Facial Palsy': i.facialPalsy,
      'Motor Arm Left': i.motorArmLeft,
      'Motor Arm Right': i.motorArmRight,
      'Sensory': i.sensory,
      'Language': i.language,
      'Dysarthria': i.dysarthria,
      'Total NIHSS': total,
    },
  };
}

const range = (max: number) =>
  Array.from({ length: max + 1 }, (_, n) => ({ value: n, label: `${n}` }));

export const NIHSS_TOOL: ToolDefinition = {
  id: 'nihss',
  name: 'NIH Stroke Scale (NIHSS)',
  shortName: 'NIHSS',
  description: 'Standardised assessment of stroke severity. Simplified 11-item version.',
  group: 'neurology',
  reference: 'National Institutes of Health',
  nurseVisible: false,
  fields: [
    { id: 'loc', label: '1a. Level of Consciousness', type: 'select', options: range(3) },
    { id: 'locQuestions', label: '1b. LOC Questions', type: 'select', options: range(2) },
    { id: 'locCommands', label: '1c. LOC Commands', type: 'select', options: range(2) },
    { id: 'gaze', label: '2. Best Gaze', type: 'select', options: range(2) },
    { id: 'visualFields', label: '3. Visual Fields', type: 'select', options: range(3) },
    { id: 'facialPalsy', label: '4. Facial Palsy', type: 'select', options: range(3) },
    { id: 'motorArmLeft', label: '5a. Motor Arm — Left', type: 'select', options: range(4) },
    { id: 'motorArmRight', label: '5b. Motor Arm — Right', type: 'select', options: range(4) },
    { id: 'sensory', label: '8. Sensory', type: 'select', options: range(2) },
    { id: 'language', label: '9. Language / Aphasia', type: 'select', options: range(3) },
    { id: 'dysarthria', label: '10. Dysarthria', type: 'select', options: range(2) },
  ],
  compute,
};
