import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface BmiInputs {
  weightKg: number;
  heightCm: number;
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: BmiInputs = {
    weightKg: Number(inputs.weightKg) || 0,
    heightCm: Number(inputs.heightCm) || 0,
  };

  const heightM = i.heightCm / 100;
  const bmi = heightM > 0 ? i.weightKg / (heightM * heightM) : 0;
  const bmiRounded = Math.round(bmi * 10) / 10;

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (bmi < 16) {
    risk = 'critical';
    label = 'SEVERE THINNESS';
    interpretation = 'BMI < 16 — Severe thinness.';
    recommendation = 'Urgent nutritional assessment. Investigate for underlying cause.';
  } else if (bmi < 17) {
    risk = 'high';
    label = 'MODERATE THINNESS';
    interpretation = 'BMI 16–16.99 — Moderate thinness.';
    recommendation = 'Nutritional review. Investigate underlying cause.';
  } else if (bmi < 18.5) {
    risk = 'moderate';
    label = 'MILD THINNESS';
    interpretation = 'BMI 17–18.49 — Mild thinness.';
    recommendation = 'Nutritional advice. Monitor weight trend.';
  } else if (bmi < 25) {
    risk = 'low';
    label = 'NORMAL WEIGHT';
    interpretation = 'BMI 18.5–24.99 — Normal weight.';
    recommendation = 'Maintain healthy lifestyle. Routine weight monitoring.';
  } else if (bmi < 30) {
    risk = 'moderate';
    label = 'OVERWEIGHT';
    interpretation = 'BMI 25–29.99 — Overweight (pre-obese).';
    recommendation = 'Lifestyle modification: diet, exercise. Assess cardiovascular risk factors.';
  } else if (bmi < 35) {
    risk = 'high';
    label = 'OBESE CLASS I';
    interpretation = 'BMI 30–34.99 — Obese Class I.';
    recommendation = 'Structured weight management. Screen for diabetes, hypertension, dyslipidaemia.';
  } else if (bmi < 40) {
    risk = 'high';
    label = 'OBESE CLASS II';
    interpretation = 'BMI 35–39.99 — Obese Class II.';
    recommendation = 'Specialist weight management. Consider pharmacotherapy and bariatric referral.';
  } else {
    risk = 'critical';
    label = 'OBESE CLASS III';
    interpretation = 'BMI ≥ 40 — Obese Class III (morbid).';
    recommendation = 'Bariatric referral. Comprehensive metabolic and cardiovascular assessment.';
  }

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Weight', value: `${i.weightKg} kg`, points: 0, explanation: '' },
    { parameter: 'Height', value: `${i.heightCm} cm`, points: 0, explanation: '' },
    { parameter: 'BMI', value: `${bmiRounded} kg/m²`, points: 0, explanation: label },
  ];

  return {
    toolId: 'bmi',
    toolName: 'Body Mass Index',
    score: `${bmiRounded} kg/m²`,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Weight': `${i.weightKg} kg`,
      'Height': `${i.heightCm} cm`,
      'BMI': `${bmiRounded} kg/m²`,
      'Classification': label,
    },
  };
}

export const BMI_TOOL: ToolDefinition = {
  id: 'bmi',
  name: 'Body Mass Index (BMI)',
  shortName: 'BMI',
  description: 'Weight-for-height index. WHO adult classification.',
  group: 'medical',
  reference: 'World Health Organization (WHO)',
  nurseVisible: true,
  fields: [
    { id: 'weightKg', label: 'Weight', type: 'number', unit: 'kg', min: 0, max: 400, step: 0.1, placeholder: 'e.g. 70' },
    { id: 'heightCm', label: 'Height', type: 'number', unit: 'cm', min: 0, max: 260, step: 0.1, placeholder: 'e.g. 170' },
  ],
  compute,
};
