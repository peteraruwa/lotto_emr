import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface MapInputs {
  sbp: number;
  dbp: number;
  hr: number;
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: MapInputs = {
    sbp: Number(inputs.sbp) || 0,
    dbp: Number(inputs.dbp) || 0,
    hr: Number(inputs.hr) || 0,
  };

  const map = i.dbp + (i.sbp - i.dbp) / 3;
  const mapRounded = Math.round(map);
  const shockIndex = i.sbp > 0 ? i.hr / i.sbp : 0;
  const shockRounded = Math.round(shockIndex * 100) / 100;

  let mapRisk: ScoreRisk;
  let mapNote: string;
  if (map < 60) {
    mapRisk = 'critical';
    mapNote = 'Critically low — Tissue perfusion compromised';
  } else if (map < 70) {
    mapRisk = 'high';
    mapNote = 'Low — Closely monitor, consider fluid challenge';
  } else if (map <= 100) {
    mapRisk = 'low';
    mapNote = 'Normal perfusion pressure';
  } else {
    mapRisk = 'moderate';
    mapNote = 'Elevated — Consider antihypertensive if symptomatic';
  }

  let siRisk: ScoreRisk;
  let siNote: string;
  if (shockIndex < 1.0) {
    siRisk = 'low';
    siNote = 'Normal';
  } else if (shockIndex < 1.2) {
    siRisk = 'moderate';
    siNote = 'Possible haemodynamic compromise';
  } else {
    siRisk = 'high';
    siNote = 'Significant haemodynamic instability';
  }

  const riskOrder: ScoreRisk[] = ['low', 'moderate', 'high', 'critical'];
  const risk: ScoreRisk = riskOrder[Math.max(riskOrder.indexOf(mapRisk), riskOrder.indexOf(siRisk))];

  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (risk === 'critical') {
    label = 'CRITICAL';
    interpretation = `MAP ${mapRounded} mmHg — Critically low perfusion pressure.`;
    recommendation = 'Urgent fluid resuscitation. Consider vasopressors. Senior review immediately.';
  } else if (risk === 'high') {
    label = 'HIGH RISK';
    interpretation = `MAP ${mapRounded} mmHg, Shock Index ${shockRounded} — Significant concern.`;
    recommendation = 'Urgent assessment. Fluid challenge. Identify cause of haemodynamic compromise.';
  } else if (risk === 'moderate') {
    label = 'MODERATE';
    interpretation = `MAP ${mapRounded} mmHg, Shock Index ${shockRounded}.`;
    recommendation = 'Close monitoring. Reassess vitals every 15–30 minutes.';
  } else {
    label = 'NORMAL';
    interpretation = `MAP ${mapRounded} mmHg, Shock Index ${shockRounded} — Within normal range.`;
    recommendation = 'Routine monitoring.';
  }

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Systolic BP', value: `${i.sbp} mmHg`, points: 0, explanation: '' },
    { parameter: 'Diastolic BP', value: `${i.dbp} mmHg`, points: 0, explanation: '' },
    { parameter: 'Heart Rate', value: `${i.hr} bpm`, points: 0, explanation: '' },
    { parameter: 'MAP = DBP + (SBP − DBP)/3', value: `${mapRounded} mmHg`, points: 0, explanation: mapNote },
    { parameter: 'Shock Index = HR / SBP', value: `${shockRounded}`, points: 0, explanation: siNote },
  ];

  return {
    toolId: 'map',
    toolName: 'MAP & Shock Index',
    score: `MAP ${mapRounded} · SI ${shockRounded}`,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Systolic BP': `${i.sbp} mmHg`,
      'Diastolic BP': `${i.dbp} mmHg`,
      'Heart Rate': `${i.hr} bpm`,
      'MAP': `${mapRounded} mmHg`,
      'Shock Index': `${shockRounded}`,
    },
  };
}

export const MAP_TOOL: ToolDefinition = {
  id: 'map',
  name: 'Mean Arterial Pressure & Shock Index',
  shortName: 'MAP/SI',
  description: 'MAP estimates organ perfusion pressure. Shock Index (HR/SBP) flags occult haemodynamic compromise.',
  group: 'emergency-icu',
  reference: 'Bedside haemodynamic assessment',
  nurseVisible: true,
  fields: [
    { id: 'sbp', label: 'Systolic BP', type: 'number', unit: 'mmHg', min: 40, max: 260, step: 1, placeholder: 'e.g. 110' },
    { id: 'dbp', label: 'Diastolic BP', type: 'number', unit: 'mmHg', min: 20, max: 160, step: 1, placeholder: 'e.g. 70' },
    { id: 'hr', label: 'Heart Rate', type: 'number', unit: 'bpm', min: 20, max: 250, step: 1, placeholder: 'e.g. 85' },
  ],
  compute,
};
