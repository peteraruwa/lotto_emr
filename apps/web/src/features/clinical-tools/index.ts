// Components
export { ClinicalToolsPanel } from './components/clinical-tools-panel';
export { QuickCalculatorPanel } from './components/quick-calculator-panel';
export { ClinicalToolsTrigger } from './components/clinical-tools-trigger';
export { ClinicalToolsPage } from './components/clinical-tools-page';
export { ClinicalRoleGuard } from './components/clinical-role-guard';
export { ToolCard } from './components/tool-card';
export { ScoreBadge } from './components/score-badge';
export { RuleBreakdown } from './components/rule-breakdown';
export { CopyResultsButton } from './components/copy-results-button';

// Data
export { ALL_TOOLS, TOOL_GROUPS, NURSE_TOOLS, getToolsByGroup, getToolById } from './constants';

// Utils
export { formatResultForCopy } from './utils/copy-results';

// Types
export type {
  ScoreRisk,
  ScoreRuleItem,
  ToolResult,
  ToolInputField,
  ToolDefinition,
  ToolGroup,
} from './types';

// RBAC re-export
export { isClinicalRole, CLINICAL_ROLES, NON_CLINICAL_ROLES } from '@/shared/rbac/roles';
