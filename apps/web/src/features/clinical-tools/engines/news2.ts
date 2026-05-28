import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface News2Inputs {
  respRate: number;
  spo2: number;
  spo2Scale: 'scale1' | 'scale2';
  onAir: 'air' | 'oxygen';
  suppO2: boolean;
  sbp: number;
  hr: number;
  consciousness: 'A' | 'C' | 'V' | 'P' | 'U';
  temp: number;
}

function scoreRespRate(rr: number): { points: number; explanation: string } {
  if (rr <= 8) return { points: 3, explanation: '≤8 — Critical bradypnea' };
  if (rr <= 11) return { points: 1, explanation: '9–11 — Below normal' };
  if (rr <= 20) return { points: 0, explanation: '12–20 — Normal' };
  if (rr <= 24) return { points: 2, explanation: '21–24 — Tachypnea' };
  return { points: 3, explanation: '≥25 — Severe tachypnea' };
}

function scoreSpo2Scale1(spo2: number): { points: number; explanation: string } {
  if (spo2 <= 91) return { points: 3, explanation: '≤91% — Severe hypoxia' };
  if (spo2 <= 93) return { points: 2, explanation: '92–93% — Moderate hypoxia' };
  if (spo2 <= 95) return { points: 1, explanation: '94–95% — Mild hypoxia' };
  return { points: 0, explanation: '≥96% — Normal' };
}

function scoreSpo2Scale2(spo2: number, onAir: 'air' | 'oxygen'): { points: number; explanation: string } {
  if (spo2 <= 83) return { points: 3, explanation: '≤83% — Severe hypoxia' };
  if (spo2 <= 85) return { points: 2, explanation: '84–85%' };
  if (spo2 <= 87) return { points: 1, explanation: '86–87%' };
  if (spo2 <= 92) return { points: 0, explanation: '88–92% — Target range for hypercapnic patient' };
  if (onAir === 'air') {
    if (spo2 <= 94) return { points: 1, explanation: '93–94% on air' };
    if (spo2 <= 96) return { points: 2, explanation: '95–96% on air' };
    return { points: 3, explanation: '≥97% on air' };
  }
  return { points: 0, explanation: '93–100% on oxygen — Target range' };
}

function scoreSuppO2(suppO2: boolean): { points: number; explanation: string } {
  return suppO2
    ? { points: 2, explanation: 'On supplemental O₂' }
    : { points: 0, explanation: 'On room air' };
}

function scoreSbp(sbp: number): { points: number; explanation: string } {
  if (sbp <= 90) return { points: 3, explanation: '≤90 — Hypotension' };
  if (sbp <= 100) return { points: 2, explanation: '91–100 — Low BP' };
  if (sbp <= 110) return { points: 1, explanation: '101–110 — Slightly low BP' };
  if (sbp <= 219) return { points: 0, explanation: '111–219 — Normal' };
  return { points: 3, explanation: '≥220 — Severe hypertension' };
}

function scoreHr(hr: number): { points: number; explanation: string } {
  if (hr <= 40) return { points: 3, explanation: '≤40 — Severe bradycardia' };
  if (hr <= 50) return { points: 1, explanation: '41–50 — Bradycardia' };
  if (hr <= 90) return { points: 0, explanation: '51–90 — Normal' };
  if (hr <= 110) return { points: 1, explanation: '91–110 — Mild tachycardia' };
  if (hr <= 130) return { points: 2, explanation: '111–130 — Tachycardia' };
  return { points: 3, explanation: '≥131 — Severe tachycardia' };
}

function scoreConsciousness(level: News2Inputs['consciousness']): { points: number; explanation: string } {
  if (level === 'A') return { points: 0, explanation: 'Alert' };
  if (level === 'C') return { points: 3, explanation: 'New confusion' };
  if (level === 'V') return { points: 3, explanation: 'Responds to voice' };
  if (level === 'P') return { points: 3, explanation: 'Responds to pain' };
  return { points: 3, explanation: 'Unresponsive' };
}

function scoreTemp(t: number): { points: number; explanation: string } {
  if (t <= 35.0) return { points: 3, explanation: '≤35.0°C — Severe hypothermia' };
  if (t <= 36.0) return { points: 1, explanation: '35.1–36.0°C — Mild hypothermia' };
  if (t <= 38.0) return { points: 0, explanation: '36.1–38.0°C — Normal' };
  if (t <= 39.0) return { points: 1, explanation: '38.1–39.0°C — Pyrexia' };
  return { points: 2, explanation: '≥39.1°C — High pyrexia' };
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: News2Inputs = {
    respRate: Number(inputs.respRate) || 0,
    spo2: Number(inputs.spo2) || 0,
    spo2Scale: (inputs.spo2Scale as News2Inputs['spo2Scale']) || 'scale1',
    onAir: (inputs.onAir as News2Inputs['onAir']) || 'air',
    suppO2: Boolean(inputs.suppO2),
    sbp: Number(inputs.sbp) || 0,
    hr: Number(inputs.hr) || 0,
    consciousness: (inputs.consciousness as News2Inputs['consciousness']) || 'A',
    temp: Number(inputs.temp) || 0,
  };

  const rr = scoreRespRate(i.respRate);
  const spo2 = i.spo2Scale === 'scale1' ? scoreSpo2Scale1(i.spo2) : scoreSpo2Scale2(i.spo2, i.onAir);
  const supp = scoreSuppO2(i.suppO2);
  const sbpScore = scoreSbp(i.sbp);
  const hrScore = scoreHr(i.hr);
  const conscScore = scoreConsciousness(i.consciousness);
  const tempScore = scoreTemp(i.temp);

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Respiratory Rate', value: `${i.respRate}/min`, points: rr.points, explanation: rr.explanation },
    {
      parameter: `SpO₂ (${i.spo2Scale === 'scale1' ? 'Scale 1' : 'Scale 2 — hypercapnic'})`,
      value: `${i.spo2}%`,
      points: spo2.points,
      explanation: spo2.explanation,
    },
    { parameter: 'Supplemental O₂', value: i.suppO2 ? 'Yes' : 'No', points: supp.points, explanation: supp.explanation },
    { parameter: 'Systolic BP', value: `${i.sbp} mmHg`, points: sbpScore.points, explanation: sbpScore.explanation },
    { parameter: 'Heart Rate', value: `${i.hr} bpm`, points: hrScore.points, explanation: hrScore.explanation },
    { parameter: 'Consciousness (ACVPU)', value: i.consciousness, points: conscScore.points, explanation: conscScore.explanation },
    { parameter: 'Temperature', value: `${i.temp}°C`, points: tempScore.points, explanation: tempScore.explanation },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);
  const hasRed = breakdown.some((b) => b.points >= 3);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total >= 7) {
    risk = 'high';
    label = 'HIGH RISK';
    interpretation = 'High clinical risk — Aggregate score ≥7.';
    recommendation = 'Immediate clinical review. Consider ICU/HDU transfer. Alert critical care team.';
  } else if (total >= 5) {
    risk = 'moderate';
    label = 'MODERATE RISK';
    interpretation = 'Moderate clinical risk — Aggregate score 5–6.';
    recommendation = 'Urgent review by ward doctor. Increase monitoring frequency. Consider HDU.';
  } else if (hasRed) {
    risk = 'moderate';
    label = 'MODERATE RISK — Single Red Flag';
    interpretation = 'Single parameter scored 3 — Red flag requires attention even with low total.';
    recommendation = 'Urgent ward-based review by clinician competent in acute illness assessment.';
  } else if (total >= 1) {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'Low clinical risk — Aggregate score 1–4.';
    recommendation = 'Minimum 4–6 hourly monitoring.';
  } else {
    risk = 'low';
    label = 'LOW RISK';
    interpretation = 'No physiological derangement.';
    recommendation = 'Minimum 12-hourly monitoring.';
  }

  return {
    toolId: 'news2',
    toolName: 'NEWS2',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Respiratory Rate': `${i.respRate}/min`,
      'SpO₂': `${i.spo2}% (${i.spo2Scale})`,
      'Supplemental O₂': i.suppO2 ? 'Yes' : 'No',
      'Systolic BP': `${i.sbp} mmHg`,
      'Heart Rate': `${i.hr} bpm`,
      'Consciousness': i.consciousness,
      'Temperature': `${i.temp}°C`,
    },
  };
}

export const NEWS2_TOOL: ToolDefinition = {
  id: 'news2',
  name: 'NEWS2 — National Early Warning Score 2',
  shortName: 'NEWS2',
  description: 'Standardised aggregate early-warning score for adult acutely ill patients (Royal College of Physicians, 2017).',
  group: 'emergency-icu',
  reference: 'Royal College of Physicians (RCP) 2017',
  nurseVisible: true,
  fields: [
    { id: 'respRate', label: 'Respiratory Rate', type: 'number', unit: '/min', min: 0, max: 60, step: 1, placeholder: 'e.g. 18' },
    {
      id: 'spo2Scale',
      label: 'SpO₂ Scale',
      type: 'select',
      options: [
        { value: 'scale1', label: 'Scale 1 — Default (target 94–98%)' },
        { value: 'scale2', label: 'Scale 2 — Hypercapnic (COPD, target 88–92%)' },
      ],
    },
    { id: 'spo2', label: 'SpO₂', type: 'number', unit: '%', min: 50, max: 100, step: 1, placeholder: 'e.g. 98' },
    {
      id: 'onAir',
      label: 'On Air or O₂',
      type: 'select',
      options: [
        { value: 'air', label: 'Room air' },
        { value: 'oxygen', label: 'On supplemental oxygen' },
      ],
      hint: 'Only relevant for Scale 2',
    },
    { id: 'suppO2', label: 'Supplemental Oxygen?', type: 'boolean' },
    { id: 'sbp', label: 'Systolic BP', type: 'number', unit: 'mmHg', min: 40, max: 260, step: 1, placeholder: 'e.g. 120' },
    { id: 'hr', label: 'Heart Rate', type: 'number', unit: 'bpm', min: 20, max: 250, step: 1, placeholder: 'e.g. 80' },
    {
      id: 'consciousness',
      label: 'Consciousness (ACVPU)',
      type: 'select',
      options: [
        { value: 'A', label: 'A — Alert' },
        { value: 'C', label: 'C — New Confusion' },
        { value: 'V', label: 'V — Responds to Voice' },
        { value: 'P', label: 'P — Responds to Pain' },
        { value: 'U', label: 'U — Unresponsive' },
      ],
    },
    { id: 'temp', label: 'Temperature', type: 'number', unit: '°C', min: 25, max: 45, step: 0.1, placeholder: 'e.g. 37.0' },
  ],
  compute,
};
