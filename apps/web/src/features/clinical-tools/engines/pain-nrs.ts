import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface PainNrsInputs {
  painScore: number; // 0-10
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: PainNrsInputs = {
    painScore: Math.max(0, Math.min(10, Number(inputs.painScore) || 0)),
  };

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;
  let bandDescription: string;

  if (i.painScore === 0) {
    risk = 'low';
    label = 'NO PAIN';
    bandDescription = 'No pain';
    interpretation = 'Patient reports no pain.';
    recommendation = 'Continue routine care. Reassess as per ward protocol.';
  } else if (i.painScore <= 3) {
    risk = 'low';
    label = 'MILD PAIN';
    bandDescription = 'Mild pain (1–3)';
    interpretation = 'Mild pain reported.';
    recommendation = 'Reassess regularly. Non-pharmacological measures (positioning, distraction). Simple analgesia if needed.';
  } else if (i.painScore <= 6) {
    risk = 'moderate';
    label = 'MODERATE PAIN';
    bandDescription = 'Moderate pain (4–6)';
    interpretation = 'Moderate pain affecting comfort.';
    recommendation = 'Analgesia review required. Consider stepping up the WHO analgesic ladder.';
  } else if (i.painScore <= 9) {
    risk = 'high';
    label = 'SEVERE PAIN';
    bandDescription = 'Severe pain (7–9)';
    interpretation = 'Severe pain — significant impact on patient.';
    recommendation = 'Prompt pain management intervention required. Consider strong opioids. Reassess within 30 minutes.';
  } else {
    risk = 'critical';
    label = 'WORST POSSIBLE PAIN';
    bandDescription = 'Worst possible pain (10)';
    interpretation = 'Worst possible pain — patient in distress.';
    recommendation = 'Urgent analgesia. Senior clinical review. Investigate underlying cause.';
  }

  const breakdown: ScoreRuleItem[] = [
    {
      parameter: 'Pain Score (0–10)',
      value: i.painScore,
      points: i.painScore,
      explanation: bandDescription,
    },
  ];

  return {
    toolId: 'pain-nrs',
    toolName: 'Pain NRS',
    score: i.painScore,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Pain Score': `${i.painScore}/10`,
      'Band': bandDescription,
    },
  };
}

export const PAIN_NRS_TOOL: ToolDefinition = {
  id: 'pain-nrs',
  name: 'Pain Numeric Rating Scale (NRS)',
  shortName: 'Pain NRS',
  description: '0–10 patient-rated numeric pain intensity. 0 = no pain, 10 = worst possible pain.',
  group: 'nursing',
  reference: 'McCaffery M, Beebe A. Pain Clinical Manual.',
  nurseVisible: true,
  fields: [
    {
      id: 'painScore',
      label: 'Pain Score',
      type: 'range',
      min: 0,
      max: 10,
      step: 1,
      hint: '0 = no pain, 10 = worst pain imaginable',
    },
  ],
  compute,
};
