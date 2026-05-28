import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface ApgarInputs {
  appearance: number; // 0-2
  pulse: number;      // 0-2
  grimace: number;    // 0-2
  activity: number;   // 0-2
  respiration: number;// 0-2
}

const APPEARANCE: Record<number, string> = { 0: 'Blue/pale all over', 1: 'Body pink, extremities blue', 2: 'Completely pink' };
const PULSE: Record<number, string> = { 0: 'Absent', 1: '<100', 2: '≥100' };
const GRIMACE: Record<number, string> = { 0: 'No response', 1: 'Grimace', 2: 'Cry / sneeze / cough' };
const ACTIVITY: Record<number, string> = { 0: 'None / floppy', 1: 'Some flexion', 2: 'Active motion' };
const RESPIRATION: Record<number, string> = { 0: 'Absent', 1: 'Weak / irregular', 2: 'Strong cry' };

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: ApgarInputs = {
    appearance: Number(inputs.appearance) || 0,
    pulse: Number(inputs.pulse) || 0,
    grimace: Number(inputs.grimace) || 0,
    activity: Number(inputs.activity) || 0,
    respiration: Number(inputs.respiration) || 0,
  };

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Appearance (skin color)', value: `${APPEARANCE[i.appearance] ?? i.appearance}`, points: i.appearance, explanation: '' },
    { parameter: 'Pulse (heart rate)', value: `${PULSE[i.pulse] ?? i.pulse}`, points: i.pulse, explanation: '' },
    { parameter: 'Grimace (reflex irritability)', value: `${GRIMACE[i.grimace] ?? i.grimace}`, points: i.grimace, explanation: '' },
    { parameter: 'Activity (muscle tone)', value: `${ACTIVITY[i.activity] ?? i.activity}`, points: i.activity, explanation: '' },
    { parameter: 'Respiration', value: `${RESPIRATION[i.respiration] ?? i.respiration}`, points: i.respiration, explanation: '' },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total >= 7) {
    risk = 'low';
    label = 'NORMAL';
    interpretation = `APGAR ${total}/10 — Normal.`;
    recommendation = 'Routine newborn care. Reassess at 5 minutes if assessing at 1 minute.';
  } else if (total >= 4) {
    risk = 'moderate';
    label = 'MODERATE CONCERN';
    interpretation = `APGAR ${total}/10 — Moderately depressed.`;
    recommendation = 'Stimulate, dry, supplemental O₂ if needed. Reassess at 5 minutes. Prepare for resuscitation if no improvement.';
  } else {
    risk = 'critical';
    label = 'SEVERELY DEPRESSED';
    interpretation = `APGAR ${total}/10 — Severely depressed.`;
    recommendation = 'Immediate neonatal resuscitation. Bag-mask ventilation. Call neonatal team. Reassess every minute.';
  }

  return {
    toolId: 'apgar',
    toolName: 'APGAR Score',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Appearance': APPEARANCE[i.appearance] ?? `${i.appearance}`,
      'Pulse': PULSE[i.pulse] ?? `${i.pulse}`,
      'Grimace': GRIMACE[i.grimace] ?? `${i.grimace}`,
      'Activity': ACTIVITY[i.activity] ?? `${i.activity}`,
      'Respiration': RESPIRATION[i.respiration] ?? `${i.respiration}`,
      'Total': total,
    },
  };
}

export const APGAR_TOOL: ToolDefinition = {
  id: 'apgar',
  name: 'APGAR Score',
  shortName: 'APGAR',
  description: 'Standardised assessment of newborn at 1 and 5 minutes of life. Five components scored 0–2.',
  group: 'obstetrics',
  reference: 'Apgar V. Curr Res Anesth Analg. 1953',
  nurseVisible: true,
  fields: [
    {
      id: 'appearance',
      label: 'Appearance (skin color)',
      type: 'select',
      options: [
        { value: 0, label: '0 — Blue/pale all over' },
        { value: 1, label: '1 — Body pink, extremities blue' },
        { value: 2, label: '2 — Completely pink' },
      ],
    },
    {
      id: 'pulse',
      label: 'Pulse (heart rate)',
      type: 'select',
      options: [
        { value: 0, label: '0 — Absent' },
        { value: 1, label: '1 — < 100 bpm' },
        { value: 2, label: '2 — ≥ 100 bpm' },
      ],
    },
    {
      id: 'grimace',
      label: 'Grimace (reflex irritability)',
      type: 'select',
      options: [
        { value: 0, label: '0 — No response' },
        { value: 1, label: '1 — Grimace' },
        { value: 2, label: '2 — Cry / sneeze / cough' },
      ],
    },
    {
      id: 'activity',
      label: 'Activity (muscle tone)',
      type: 'select',
      options: [
        { value: 0, label: '0 — None / floppy' },
        { value: 1, label: '1 — Some flexion' },
        { value: 2, label: '2 — Active motion' },
      ],
    },
    {
      id: 'respiration',
      label: 'Respiration',
      type: 'select',
      options: [
        { value: 0, label: '0 — Absent' },
        { value: 1, label: '1 — Weak / irregular' },
        { value: 2, label: '2 — Strong cry' },
      ],
    },
  ],
  compute,
};
