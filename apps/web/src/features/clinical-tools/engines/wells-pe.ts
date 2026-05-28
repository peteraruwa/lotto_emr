import { RISK_COLORS, ScoreRiskUtils } from './_shared';
import type { ScoreRisk, ScoreRuleItem, ToolDefinition, ToolResult } from '../types';

interface WellsPeInputs {
  dvtSigns: boolean;
  peLikely: boolean;
  hrOver100: boolean;
  immobilisation: boolean;
  previousDvtPe: boolean;
  haemoptysis: boolean;
  malignancy: boolean;
}

function compute(inputs: Record<string, unknown>): ToolResult {
  const i: WellsPeInputs = {
    dvtSigns: Boolean(inputs.dvtSigns),
    peLikely: Boolean(inputs.peLikely),
    hrOver100: Boolean(inputs.hrOver100),
    immobilisation: Boolean(inputs.immobilisation),
    previousDvtPe: Boolean(inputs.previousDvtPe),
    haemoptysis: Boolean(inputs.haemoptysis),
    malignancy: Boolean(inputs.malignancy),
  };

  const yesNo = (b: boolean) => (b ? 'Yes' : 'No');

  const breakdown: ScoreRuleItem[] = [
    { parameter: 'Clinical signs/symptoms of DVT', value: yesNo(i.dvtSigns), points: i.dvtSigns ? 3 : 0, explanation: i.dvtSigns ? 'Leg swelling and pain with palpation' : '' },
    { parameter: 'PE is #1 diagnosis OR equally likely', value: yesNo(i.peLikely), points: i.peLikely ? 3 : 0, explanation: i.peLikely ? 'Alternative diagnosis less likely than PE' : '' },
    { parameter: 'Heart rate > 100 bpm', value: yesNo(i.hrOver100), points: i.hrOver100 ? 1.5 : 0, explanation: '' },
    { parameter: 'Immobilisation ≥3 days OR surgery within 4 weeks', value: yesNo(i.immobilisation), points: i.immobilisation ? 1.5 : 0, explanation: '' },
    { parameter: 'Previous DVT or PE', value: yesNo(i.previousDvtPe), points: i.previousDvtPe ? 1.5 : 0, explanation: '' },
    { parameter: 'Haemoptysis', value: yesNo(i.haemoptysis), points: i.haemoptysis ? 1 : 0, explanation: '' },
    { parameter: 'Malignancy (active or treated within 6 months)', value: yesNo(i.malignancy), points: i.malignancy ? 1 : 0, explanation: '' },
  ];

  const total = breakdown.reduce((acc, b) => acc + b.points, 0);

  let risk: ScoreRisk;
  let label: string;
  let interpretation: string;
  let recommendation: string;

  if (total > 6) {
    risk = 'high';
    label = 'HIGH PROBABILITY';
    interpretation = 'High clinical probability of PE.';
    recommendation = 'Start anticoagulation pending imaging. Urgent CT pulmonary angiography (CTPA).';
  } else if (total >= 2) {
    risk = 'moderate';
    label = 'MODERATE PROBABILITY';
    interpretation = 'Moderate clinical probability of PE.';
    recommendation = 'CT pulmonary angiography recommended. Consider D-dimer if not already done.';
  } else {
    risk = 'low';
    label = 'LOW PROBABILITY';
    interpretation = 'Low clinical probability of PE.';
    recommendation = 'D-dimer testing if indicated. PE unlikely if D-dimer negative.';
  }

  return {
    toolId: 'wells-pe',
    toolName: 'Wells Score for PE',
    score: total,
    risk,
    label,
    color: RISK_COLORS[risk],
    interpretation,
    recommendation,
    breakdown,
    timestamp: ScoreRiskUtils.now(),
    inputSummary: {
      'Signs of DVT': yesNo(i.dvtSigns),
      'PE most likely': yesNo(i.peLikely),
      'HR > 100': yesNo(i.hrOver100),
      'Recent immobilisation/surgery': yesNo(i.immobilisation),
      'Previous DVT/PE': yesNo(i.previousDvtPe),
      'Haemoptysis': yesNo(i.haemoptysis),
      'Malignancy': yesNo(i.malignancy),
    },
  };
}

export const WELLS_PE_TOOL: ToolDefinition = {
  id: 'wells-pe',
  name: 'Wells Score for Pulmonary Embolism',
  shortName: 'Wells PE',
  description: 'Clinical pre-test probability for pulmonary embolism (original 3-tier model).',
  group: 'respiratory',
  reference: 'Wells PS et al. Ann Intern Med. 2001',
  nurseVisible: false,
  fields: [
    { id: 'dvtSigns', label: 'Clinical signs/symptoms of DVT (+3)', type: 'boolean' },
    { id: 'peLikely', label: 'Alternative diagnosis less likely than PE (+3)', type: 'boolean' },
    { id: 'hrOver100', label: 'Heart rate > 100 bpm (+1.5)', type: 'boolean' },
    { id: 'immobilisation', label: 'Immobilisation ≥3 days OR surgery <4 weeks (+1.5)', type: 'boolean' },
    { id: 'previousDvtPe', label: 'Previous DVT or PE (+1.5)', type: 'boolean' },
    { id: 'haemoptysis', label: 'Haemoptysis (+1)', type: 'boolean' },
    { id: 'malignancy', label: 'Malignancy (active or treated within 6 months) (+1)', type: 'boolean' },
  ],
  compute,
};
