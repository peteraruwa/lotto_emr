// Deterministic roster generator for April and May 2026.
// Uses a rotation algorithm so each day a different subset of staff is on duty.

import { STAFF } from './staff-data';
import type { Department, Ward, Shift } from './staff-data';

export interface RosterEntry {
  id: string;        // unique key: e.g. "D001-2026-04-01-morning"
  staffId: string;
  name: string;
  role: string;
  phone: string;
  department: Department;
  ward?: Ward;
  shift: Shift;
  date: string;      // YYYY-MM-DD
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

function isWeekend(date: Date): boolean {
  const d = date.getDay(); // 0 = Sunday, 6 = Saturday
  return d === 0 || d === 6;
}

/** Deterministic pick of `count` items from `pool` using a rotating window. */
function pickStaff<T>(pool: T[], count: number, seed: number): T[] {
  if (pool.length === 0) return [];
  const n = Math.min(count, pool.length);
  const start = ((seed % pool.length) + pool.length) % pool.length;
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(pool[(start + i) % pool.length]);
  }
  return result;
}

// ─── Core generation ────────────────────────────────────────────────────────

function generateDayRoster(date: Date): RosterEntry[] {
  const dateStr = formatDate(date);
  const doy = dayOfYear(date);
  const weekend = isWeekend(date);
  const entries: RosterEntry[] = [];

  // ── Helper to add entries ──────────────────────────────────────────────────
  function addEntries(
    poolIds: string[],
    morningCount: number,
    nightCount: number,
    shiftOffset: number,
  ) {
    const pool = STAFF.filter((s) => poolIds.includes(s.id));
    if (pool.length === 0) return;

    const morningSeed = (doy * 7 + shiftOffset) % pool.length;
    const nightSeed   = (doy * 7 + shiftOffset + pool.length + 3) % pool.length;

    const morningStaff = pickStaff(pool, morningCount, morningSeed);
    const nightStaff   = pickStaff(
      pool.filter((s) => !morningStaff.includes(s)),
      nightCount,
      nightSeed,
    );

    for (const s of morningStaff) {
      entries.push({
        id:         `${s.id}-${dateStr}-morning`,
        staffId:    s.id,
        name:       s.name,
        role:       s.role,
        phone:      s.phone,
        department: s.department,
        ward:       s.ward,
        shift:      'morning',
        date:       dateStr,
      });
    }
    for (const s of nightStaff) {
      entries.push({
        id:         `${s.id}-${dateStr}-night`,
        staffId:    s.id,
        name:       s.name,
        role:       s.role,
        phone:      s.phone,
        department: s.department,
        ward:       s.ward,
        shift:      'night',
        date:       dateStr,
      });
    }
  }

  // ── Doctors – OPD: morning only ───────────────────────────────────────────
  {
    const pool = ['D001','D002','D003','D004'];
    addEntries(pool, weekend ? 1 : 2, 0, 0);
  }

  // ── Doctors – A&E / Male Ward: morning + night ────────────────────────────
  {
    const pool = ['D005','D006','D007','D008'];
    addEntries(pool, weekend ? 1 : 2, 1, 10);
  }

  // ── Doctors – Female Ward: morning + night ────────────────────────────────
  {
    const pool = ['D009','D010','D011','D012'];
    addEntries(pool, weekend ? 1 : 2, 1, 20);
  }

  // ── Nurses – OPD: morning + night ────────────────────────────────────────
  {
    const pool = ['N001','N002','N003','N004'];
    addEntries(pool, weekend ? 1 : 2, 1, 30);
  }

  // ── Nurses – A&E / Male Ward: morning + night ─────────────────────────────
  {
    const pool = ['N005','N006','N007','N008'];
    addEntries(pool, weekend ? 1 : 2, 1, 40);
  }

  // ── Nurses – Female Ward: morning + night ────────────────────────────────
  {
    const pool = ['N009','N010','N011','N012'];
    addEntries(pool, weekend ? 1 : 2, 1, 50);
  }

  // ── Lab: morning + night ──────────────────────────────────────────────────
  {
    const pool = ['L001','L002','L003','L004'];
    addEntries(pool, weekend ? 1 : 2, 1, 60);
  }

  // ── Pharmacy: morning + night ─────────────────────────────────────────────
  {
    const pool = ['P001','P002','P003','P004'];
    addEntries(pool, weekend ? 1 : 2, 1, 70);
  }

  // ── Radiology: morning always, night weekdays only ────────────────────────
  // Weekday: 2 morning, 1 night; Weekend: 1 morning, 0 night
  {
    const pool = ['R001','R002','R003','R004'];
    const mCount = weekend ? 1 : 2;
    const nCount = weekend ? 0 : 1;
    addEntries(pool, mCount, nCount, 80);
  }

  // ── Records: morning only ─────────────────────────────────────────────────
  // Weekday: 2 morning, Weekend: 1 morning
  {
    const pool = ['M001','M002','M003','M004'];
    const mCount = weekend ? 1 : 2;
    addEntries(pool, mCount, 0, 90);
  }

  return entries;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generateMonthRoster(year: number, month: number): RosterEntry[] {
  // month is 1-based
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: RosterEntry[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    result.push(...generateDayRoster(date));
  }
  return result;
}

// ─── Exported rosters ───────────────────────────────────────────────────────

export const APRIL_2026_ROSTER: RosterEntry[] = generateMonthRoster(2026, 4);
export const MAY_2026_ROSTER:   RosterEntry[] = generateMonthRoster(2026, 5);

const ALL_ROSTER = [...APRIL_2026_ROSTER, ...MAY_2026_ROSTER];

// ─── Utility functions ───────────────────────────────────────────────────────

export function getRosterForDate(date: string): RosterEntry[] {
  return ALL_ROSTER.filter((e) => e.date === date);
}

/**
 * Returns the current shift based on the current wall-clock time.
 * Morning: 09:00 – 17:00; Night: 17:00 – 09:00 (next day)
 */
export function getCurrentShift(): Shift {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 9 && hour < 17 ? 'morning' : 'night';
}

/**
 * Returns today's roster entries.
 * If today is outside April–May 2026, falls back to 2026-05-25 for demo purposes.
 */
export function getTodayRoster(): RosterEntry[] {
  const today = formatDate(new Date());
  const entries = getRosterForDate(today);
  if (entries.length > 0) return entries;
  // fallback to demo date
  return getRosterForDate('2026-05-25');
}

/**
 * Returns today's roster filtered to the current shift.
 */
export function getTodayOnDutyTeam(): RosterEntry[] {
  const shift = getCurrentShift();
  return getTodayRoster().filter((e) => e.shift === shift);
}
