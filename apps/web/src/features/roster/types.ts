import type { Department, Ward, Shift } from './data/staff-data';

/** A single shift assignment stored in Medplum (staff ID only — names resolved at display time). */
export interface StoredRosterEntry {
  date: string;       // "YYYY-MM-DD"
  shift: Shift;       // "morning" | "night"
  staffId: string;    // "D001"
  department: Department;
  ward?: Ward;
}
