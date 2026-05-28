import type { ToolDefinition, ToolGroup } from './types';
import { NEWS2_TOOL } from './engines/news2';
import { QSOFA_TOOL } from './engines/qsofa';
import { CURB65_TOOL } from './engines/curb65';
import { WELLS_DVT_TOOL } from './engines/wells-dvt';
import { WELLS_PE_TOOL } from './engines/wells-pe';
import { GCS_TOOL } from './engines/gcs';
import { NIHSS_TOOL } from './engines/nihss';
import { BRADEN_TOOL } from './engines/braden';
import { PAIN_NRS_TOOL } from './engines/pain-nrs';
import { CHADS2VASC_TOOL } from './engines/chads2vasc';
import { EGFR_TOOL } from './engines/egfr';
import { BMI_TOOL } from './engines/bmi';
import { MAP_TOOL } from './engines/map';
import { APGAR_TOOL } from './engines/apgar';

export const TOOL_GROUPS: { id: ToolGroup; label: string; icon: string; color: string }[] = [
  { id: 'emergency-icu',   label: 'Emergency / ICU',  icon: 'AlertTriangle', color: 'text-red-600 bg-red-50' },
  { id: 'medical',         label: 'Medical',          icon: 'Stethoscope',   color: 'text-blue-600 bg-blue-50' },
  { id: 'cardiology',      label: 'Cardiology',       icon: 'Heart',         color: 'text-pink-600 bg-pink-50' },
  { id: 'respiratory',     label: 'Respiratory',      icon: 'Wind',          color: 'text-sky-600 bg-sky-50' },
  { id: 'neurology',       label: 'Neurology',        icon: 'Brain',         color: 'text-purple-600 bg-purple-50' },
  { id: 'renal-metabolic', label: 'Renal / Metabolic', icon: 'Droplets',     color: 'text-amber-600 bg-amber-50' },
  { id: 'surgical',        label: 'Surgical',         icon: 'Scissors',      color: 'text-orange-600 bg-orange-50' },
  { id: 'obstetrics',      label: 'Obstetrics',       icon: 'Baby',          color: 'text-rose-600 bg-rose-50' },
  { id: 'pediatrics',      label: 'Pediatrics',       icon: 'Users',         color: 'text-green-600 bg-green-50' },
  { id: 'nursing',         label: 'Nursing Tools',    icon: 'Activity',      color: 'text-teal-600 bg-teal-50' },
];

export const ALL_TOOLS: ToolDefinition[] = [
  NEWS2_TOOL,
  QSOFA_TOOL,
  CURB65_TOOL,
  WELLS_DVT_TOOL,
  WELLS_PE_TOOL,
  GCS_TOOL,
  NIHSS_TOOL,
  BRADEN_TOOL,
  PAIN_NRS_TOOL,
  CHADS2VASC_TOOL,
  EGFR_TOOL,
  BMI_TOOL,
  MAP_TOOL,
  APGAR_TOOL,
];

export function getToolsByGroup(group: ToolGroup): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.group === group);
}

export function getToolById(id: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}

export const NURSE_TOOLS = ALL_TOOLS.filter((t) => t.nurseVisible);
