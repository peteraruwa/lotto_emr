import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface WellsDvtInputs {
  activeCancer: boolean;
  paralysis: boolean;
  recentBedrest: boolean;
  tenderness: boolean;
  legSwollen: boolean;
  calfSwelling: boolean;
  pittingOedema: boolean;
  collateralVeins: boolean;
  previousDvt: boolean;
  altDiagnosis: boolean;
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: WellsDvtInputs = {
    activeCancer: Boolean(inputs.activeCancer),
    paralysis: Boolean(inputs.paralysis),
    recentBedrest: Boolean(inputs.recentBedrest),
    tenderness: Boolean(inputs.tenderness),
    legSwollen: Boolean(inputs.legSwollen),
    calfSwelling: Boolean(inputs.calfSwelling),
    pittingOedema: Boolean(inputs.pittingOedema),
    collateralVeins: Boolean(inputs.collateralVeins),
    previousDvt: Boolean(inputs.previousDvt),
    altDiagnosis: Boolean(inputs.altDiagnosis),
  };

  const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Active cancer', value: yesNo(i.activeCancer), points: i.activeCancer ? 1 : 0, explanation: i.activeCancer ? 'Treatment ongoing, within 6 months, or palliative' : '' },
    { parameter: 'Paralysis / paresis / recent plaster immobilisation', value: yesNo(i.paralysis), points: i.paralysis ? 1 : 0, explanation: i.paralysis ? 'Lower extremity immobilisation' : '' },
    { parameter: 'Recently bedridden >3 days OR major surgery <12 weeks', value: yesNo(i.recentBedrest), points: i.recentBedrest ? 1 : 0, explanation: i.recentBedrest ? 'Recent immobilisation or surgery (GA/RA)' : '' },
    { parameter: 'Localised tenderness along deep venous system', value: yesNo(i.tenderness), points: i.tenderness ? 1 : 0, explanation: '' },
    { parameter: 'Entire leg swollen', value: yesNo(i.legSwollen), points: i.legSwollen ? 1 : 0, explanation: '' },
    { parameter: 'Calf swelling >3 cm vs asymptomatic leg', value: yesNo(i.calfSwelling), points: i.calfSwelling ? 1 : 0, explanation: i.calfSwelling ? 'Measured 10 cm below tibial tuberosity' : '' },
    { parameter: 'Pitting oedema (symptomatic leg)', value: yesNo(i.pittingOedema), points: i.pittingOedema ? 1 : 0, explanation: '' },
    { parameter: 'Collateral superficial veins (non-varicose)', value: yesNo(i.collateralVeins), points: i.collateralVeins ? 1 : 0, explanation: '' },
    { parameter: 'Previously documented DVT', value: yesNo(i.previousDvt), points: i.previousDvt ? 1 : 0, explanation: '' },
    { parameter: 'Alternative diagnosis at least as likely', value: yesNo(i.altDiagnosis), points: i.altDiagnosis ? -2 : 0, explanation: i.altDiagnosis ? 'Subtract 2 points' : '' },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total >= 3) {
    risk = 'high';
    label = 'HIGH PROBABILITY';
    interpretation = 'High probability of DVT (~75%).';
    recommendation = 'Perform proximal leg ultrasound immediately. Consider empirical anticoagulation if delay anticipated.';
  } else if (total >= 1) {
    risk = 'moderate';
    label = 'MODERATE PROBABILITY';
    interpretation = 'Moderate probability of DVT (~17%).';
    recommendation = 'Perform proximal leg ultrasound. Consider D-dimer if ultrasound unavailable.';
  } else {
    risk = 'low';
    label = 'LOW PROBABILITY';
    interpretation = 'Low probability of DVT (~3%).';
    recommendation = 'DVT unlikely. Consider D-dimer to rule out.';
  }

  return {
    toolId: 'wells-dvt',
    toolName: 'Wells Score for DVT',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Active cancer': yesNo(i.activeCancer),
      'Paralysis/Immobilisation': yesNo(i.paralysis),
      'Recent bedrest/surgery': yesNo(i.recentBedrest),
      'Tenderness': yesNo(i.tenderness),
      'Leg swollen': yesNo(i.legSwollen),
      'Calf swelling >3cm': yesNo(i.calfSwelling),
      'Pitting oedema': yesNo(i.pittingOedema),
      'Collateral veins': yesNo(i.collateralVeins),
      'Previous DVT': yesNo(i.previousDvt),
      'Alternative diagnosis likely': yesNo(i.altDiagnosis),
    },
  };
}

export const WELLS_DVT_TOOL: ToolDefinition = {
  id: 'wells-dvt',
  name: 'Wells Score for DVT',
  shortName: 'Wells DVT',
  description: 'Clinical pre-test probability for deep vein thrombosis.',
  group: 'medical',
  reference: 'Wells PS et al. Lancet. 1997',
  nurseVisible: false,
  fields: [
    { id: 'activeCancer', label: 'Active cancer (treatment within 6 months or palliative)', type: 'boolean' },
    { id: 'paralysis', label: 'Paralysis, paresis, or recent plaster immobilisation', type: 'boolean' },
    { id: 'recentBedrest', label: 'Bedridden >3 days OR major surgery <12 weeks', type: 'boolean' },
    { id: 'tenderness', label: 'Localised tenderness along deep venous system', type: 'boolean' },
    { id: 'legSwollen', label: 'Entire leg swollen', type: 'boolean' },
    { id: 'calfSwelling', label: 'Calf swelling >3 cm vs asymptomatic leg', type: 'boolean' },
    { id: 'pittingOedema', label: 'Pitting oedema (symptomatic leg only)', type: 'boolean' },
    { id: 'collateralVeins', label: 'Collateral superficial veins (non-varicose)', type: 'boolean' },
    { id: 'previousDvt', label: 'Previously documented DVT', type: 'boolean' },
    { id: 'altDiagnosis', label: 'Alternative diagnosis at least as likely (−2)', type: 'boolean' },
  ],
  compute,
};
