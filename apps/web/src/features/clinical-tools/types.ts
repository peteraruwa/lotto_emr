export type ScoreRisk = 'low' | 'moderate' | 'high' | 'critical';

export interface ScoreRuleItem {
  parameter: string;
  value: string | number;
  points: number;
  explanation: string;
}

export interface ToolResult {
  toolId: string;
  toolName: string;
  score: number | string;
  risk: ScoreRisk;
  label: string;                    // e.g. "HIGH RISK"
  color: string;                    // tailwind bg class
  interpretation: string;          // clinical meaning
  recommendation: string;          // what to do
  breakdown: ScoreRuleItem[];      // how score was computed
  timestamp: string;               // ISO datetime
  patientId?: string;
  patientName?: string;
  inputSummary: Record<string, string | number | boolean>;
}

export interface ToolInputField {
  id: string;
  label: string;
  type: 'number' | 'select' | 'boolean' | 'range';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  hint?: string;
}

export type ToolGroup =
  | 'emergency-icu'
  | 'medical'
  | 'surgical'
  | 'pediatrics'
  | 'obstetrics'
  | 'neurology'
  | 'cardiology'
  | 'respiratory'
  | 'renal-metabolic'
  | 'nursing';

export interface ToolDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  group: ToolGroup;
  subgroup?: string;
  fields: ToolInputField[];
  compute: (inputs: Record<string, unknown>) => ToolResult;
  nurseVisible: boolean;           // show in nurse simplified view
  reference?: string;              // clinical reference
}

// Helper to map risk to default color classes
export const RISK_COLORS: Record<ScoreRisk, string> = {
  low: 'bg-green-100 text-green-800 border-green-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export const RISK_BORDER: Record<ScoreRisk, string> = {
  low: 'border-l-green-500',
  moderate: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-500',
};
