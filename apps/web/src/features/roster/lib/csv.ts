import { STAFF } from '../data/staff-data';
import type { StoredRosterEntry } from '../types';

export const CSV_HEADERS = ['date', 'shift', 'staffId', 'name', 'department', 'ward'];

/** Build a downloadable CSV string from a list of stored entries. */
export function generateCSV(entries: StoredRosterEntry[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const e of [...entries].sort((a, b) =>
    a.date.localeCompare(b.date) || a.shift.localeCompare(b.shift) || a.staffId.localeCompare(b.staffId),
  )) {
    const staff = STAFF.find((s) => s.id === e.staffId);
    lines.push(
      [e.date, e.shift, e.staffId, `"${staff?.name ?? ''}"`, e.department, e.ward ?? ''].join(','),
    );
  }
  return lines.join('\n');
}

export interface ParseResult {
  entries: StoredRosterEntry[];
  errors: string[];
  warnings: string[];
  /** "YYYY-MM" of the first date found, empty if none */
  month: string;
}

/** Parse a CSV string into StoredRosterEntry[]. Validates staff IDs, dates, shifts. */
export function parseCSV(text: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries: StoredRosterEntry[] = [];
  const seenKeys = new Set<string>();

  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { entries: [], errors: ['CSV is empty or has no data rows.'], warnings: [], month: '' };
  }

  const header = splitLine(lines[0]).map((h) => h.toLowerCase().trim());
  const col = (name: string) => header.indexOf(name);

  const dateIdx  = col('date');
  const shiftIdx = col('shift');
  const staffIdx = col('staffid');

  if (dateIdx === -1 || shiftIdx === -1 || staffIdx === -1) {
    return {
      entries: [],
      errors: ['Missing required columns. Expected: date, shift, staffId'],
      warnings: [],
      month: '',
    };
  }

  const deptIdx = col('department');
  const wardIdx = col('ward');

  const validIds = new Map(STAFF.map((s) => [s.id, s]));
  const months   = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = i + 1;
    const cols = splitLine(lines[i]);

    const date    = cols[dateIdx]?.trim() ?? '';
    const shift   = cols[shiftIdx]?.trim().toLowerCase() ?? '';
    const staffId = cols[staffIdx]?.trim() ?? '';

    if (!date && !shift && !staffId) continue; // skip blank rows

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`Row ${row}: invalid date "${date}" — expected YYYY-MM-DD`);
      continue;
    }
    if (shift !== 'morning' && shift !== 'night') {
      errors.push(`Row ${row}: invalid shift "${shift}" — expected "morning" or "night"`);
      continue;
    }
    const staff = validIds.get(staffId);
    if (!staff) {
      errors.push(`Row ${row}: unknown staff ID "${staffId}"`);
      continue;
    }

    // Duplicate detection
    const key = `${date}|${shift}|${staffId}`;
    if (seenKeys.has(key)) {
      warnings.push(`Row ${row}: duplicate entry for ${staffId} on ${date} (${shift}) — skipped`);
      continue;
    }
    seenKeys.add(key);

    months.add(date.slice(0, 7));

    const dept = (cols[deptIdx]?.trim() as any) || staff.department;
    const ward = (cols[wardIdx]?.trim() as any) || staff.ward || undefined;

    entries.push({ date, shift: shift as 'morning' | 'night', staffId, department: dept, ward });
  }

  if (months.size > 1) {
    warnings.push(
      `CSV spans multiple months (${[...months].join(', ')}). All entries will be imported together.`,
    );
  }

  return { entries, errors, warnings, month: [...months][0] ?? '' };
}

/** Trigger a file download of the given text content. */
export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Internal ─────────────────────────────────────────────────────────────────

function splitLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}
