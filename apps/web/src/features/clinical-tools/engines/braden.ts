import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface BradenInputs {
  sensory: number;   // 1-4
  moisture: number;  // 1-4
  activity: number;  // 1-4
  mobility: number;  // 1-4
  nutrition: number; // 1-4
  friction: number;  // 1-3
}

const SENSORY: Record<number, string> = { 1: 'Completely Limited', 2: 'Very Limited', 3: 'Slightly Limited', 4: 'No Impairment' };
const MOISTURE: Record<number, string> = { 1: 'Constantly Moist', 2: 'Very Moist', 3: 'Occasionally Moist', 4: 'Rarely Moist' };
const ACTIVITY: Record<number, string> = { 1: 'Bedfast', 2: 'Chairfast', 3: 'Walks Occasionally', 4: 'Walks Frequently' };
const MOBILITY: Record<number, string> = { 1: 'Completely Immobile', 2: 'Very Limited', 3: 'Slightly Limited', 4: 'No Limitation' };
const NUTRITION: Record<number, string> = { 1: 'Very Poor', 2: 'Probably Inadequate', 3: 'Adequate', 4: 'Excellent' };
const FRICTION: Record<number, string> = { 1: 'Problem', 2: 'Potential Problem', 3: 'No Apparent Problem' };

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: BradenInputs = {
    sensory: Number(inputs.sensory) || 4,
    moisture: Number(inputs.moisture) || 4,
    activity: Number(inputs.activity) || 4,
    mobility: Number(inputs.mobility) || 4,
    nutrition: Number(inputs.nutrition) || 4,
    friction: Number(inputs.friction) || 3,
  };

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Sensory Perception', value: `${SENSORY[i.sensory] ?? i.sensory} (${i.sensory})`, points: i.sensory, explanation: 'Ability to respond to discomfort' },
    { parameter: 'Moisture', value: `${MOISTURE[i.moisture] ?? i.moisture} (${i.moisture})`, points: i.moisture, explanation: 'Degree of skin exposure to moisture' },
    { parameter: 'Activity', value: `${ACTIVITY[i.activity] ?? i.activity} (${i.activity})`, points: i.activity, explanation: 'Degree of physical activity' },
    { parameter: 'Mobility', value: `${MOBILITY[i.mobility] ?? i.mobility} (${i.mobility})`, points: i.mobility, explanation: 'Ability to change body position' },
    { parameter: 'Nutrition', value: `${NUTRITION[i.nutrition] ?? i.nutrition} (${i.nutrition})`, points: i.nutrition, explanation: 'Usual food intake pattern' },
    { parameter: 'Friction and Shear', value: `${FRICTION[i.friction] ?? i.friction} (${i.friction})`, points: i.friction, explanation: 'Movement friction in bed/chair' },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total <= 9) {
    risk = 'critical';
    label = 'VERY HIGH RISK';
    interpretation = 'Very high risk for pressure ulcer development.';
    recommendation = 'Intensive preventive measures required: 2-hourly repositioning, pressure-relieving mattress, nutritional review, skin care plan.';
  } else if (total <= 12) {
    risk = 'high';
    label = 'HIGH RISK';
    interpretation = 'High risk for pressure ulcer development.';
    recommendation = 'Preventive care essential: regular repositioning, specialist mattress, skin inspection.';
  } else if (total <= 14) {
    risk = 'moderate';
    label = 'MODERATE RISK';
    interpretation = 'Moderate risk for pressure ulcer development.';
    recommendation = 'Preventive measures required: turning schedule, skin assessment every shift.';
  } else if (total <= 18) {
    risk = 'moderate';
    label = 'MILD RISK';
    interpretation = 'Mild risk for pressure ulcer development.';
    recommendation = 'Preventive measures recommended: encourage mobility, manage moisture, monitor nutrition.';
  } else {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'Low risk for pressure ulcer development.';
    recommendation = 'Routine care. Reassess if clinical condition changes.';
  }

  return {
    toolId: 'braden',
    toolName: 'Braden Scale',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Sensory Perception': SENSORY[i.sensory] ?? `${i.sensory}`,
      'Moisture': MOISTURE[i.moisture] ?? `${i.moisture}`,
      'Activity': ACTIVITY[i.activity] ?? `${i.activity}`,
      'Mobility': MOBILITY[i.mobility] ?? `${i.mobility}`,
      'Nutrition': NUTRITION[i.nutrition] ?? `${i.nutrition}`,
      'Friction and Shear': FRICTION[i.friction] ?? `${i.friction}`,
    },
  };
}

export const BRADEN_TOOL: ToolDefinition = {
  id: 'braden',
  name: 'Braden Scale for Pressure Ulcer Risk',
  shortName: 'Braden',
  description: 'Validated nursing tool to assess risk of pressure ulcer development. Six subscales scored 1–4 (friction 1–3).',
  group: 'nursing',
  reference: 'Bergstrom N, Braden BJ. Res Nurs Health. 1987',
  nurseVisible: true,
  fields: [
    {
      id: 'sensory',
      label: 'Sensory Perception',
      type: 'select',
      options: [
        { value: 1, label: '1 — Completely Limited' },
        { value: 2, label: '2 — Very Limited' },
        { value: 3, label: '3 — Slightly Limited' },
        { value: 4, label: '4 — No Impairment' },
      ],
    },
    {
      id: 'moisture',
      label: 'Moisture',
      type: 'select',
      options: [
        { value: 1, label: '1 — Constantly Moist' },
        { value: 2, label: '2 — Very Moist' },
        { value: 3, label: '3 — Occasionally Moist' },
        { value: 4, label: '4 — Rarely Moist' },
      ],
    },
    {
      id: 'activity',
      label: 'Activity',
      type: 'select',
      options: [
        { value: 1, label: '1 — Bedfast' },
        { value: 2, label: '2 — Chairfast' },
        { value: 3, label: '3 — Walks Occasionally' },
        { value: 4, label: '4 — Walks Frequently' },
      ],
    },
    {
      id: 'mobility',
      label: 'Mobility',
      type: 'select',
      options: [
        { value: 1, label: '1 — Completely Immobile' },
        { value: 2, label: '2 — Very Limited' },
        { value: 3, label: '3 — Slightly Limited' },
        { value: 4, label: '4 — No Limitation' },
      ],
    },
    {
      id: 'nutrition',
      label: 'Nutrition',
      type: 'select',
      options: [
        { value: 1, label: '1 — Very Poor' },
        { value: 2, label: '2 — Probably Inadequate' },
        { value: 3, label: '3 — Adequate' },
        { value: 4, label: '4 — Excellent' },
      ],
    },
    {
      id: 'friction',
      label: 'Friction and Shear',
      type: 'select',
      options: [
        { value: 1, label: '1 — Problem' },
        { value: 2, label: '2 — Potential Problem' },
        { value: 3, label: '3 — No Apparent Problem' },
      ],
    },
  ],
  compute,
};
