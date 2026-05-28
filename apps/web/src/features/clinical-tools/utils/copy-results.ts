import type { ToolResult } from '../types';

/**
 * Format a ToolResult as a structured plain-text clinical summary
 * suitable for pasting into notes, chat, or handover documents.
 */
export function formatResultForCopy(result: ToolResult): string {
  const lines: string[] = [];
  lines.push(`═══ ${result.toolName.toUpperCase()} ═══`);
  lines.push(`Score: ${result.score} — ${result.label}`);
  lines.push('');

  if (result.patientName) {
    lines.push(`Patient: ${result.patientName}`);
    if (result.patientId) lines.push(`ID: ${result.patientId}`);
    lines.push('');
  }

  lines.push('INPUT PARAMETERS:');
  Object.entries(result.inputSummary).forEach(([k, v]) => {
    lines.push(`  ${k}: ${v}`);
  });
  lines.push('');

  lines.push('SCORE BREAKDOWN:');
  result.breakdown.forEach((item) => {
    const sign = item.points > 0 ? '+' : '';
    const pts = ` [${sign}${item.points}]`;
    lines.push(`  ${item.parameter}: ${item.value}${pts}`);
    if (item.explanation) lines.push(`    → ${item.explanation}`);
  });
  lines.push('');

  lines.push(`INTERPRETATION: ${result.interpretation}`);
  lines.push(`RECOMMENDATION: ${result.recommendation}`);
  lines.push('');
  lines.push(`Computed: ${new Date(result.timestamp).toLocaleString()}`);
  lines.push('NOTE: Computed using deterministic clinical rules. Not AI-generated.');

  return lines.join('\n');
}
