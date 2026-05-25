'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isToday,
} from 'date-fns';
import {
  CalendarRange,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  Sun,
  Moon,
  Users,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';

import {
  DEPT_META,
  WARD_META,
  SHIFT_META,
  type Department,
  type Ward,
  type Shift,
} from '../data/staff-data';
import {
  APRIL_2026_ROSTER,
  MAY_2026_ROSTER,
  type RosterEntry,
} from '../data/roster-generator';

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthKey = 'april' | 'may';

interface MonthConfig {
  key: MonthKey;
  label: string;
  year: number;
  month: number; // 1-based
  roster: RosterEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS: MonthConfig[] = [
  { key: 'april', label: 'April 2026', year: 2026, month: 4, roster: APRIL_2026_ROSTER },
  { key: 'may',   label: 'May 2026',   year: 2026, month: 5, roster: MAY_2026_ROSTER   },
];

const DEPT_ORDER: Department[] = ['doctors', 'nurses', 'lab', 'pharmacy', 'radiology', 'records'];
const WARD_ORDER: Ward[]       = ['opd', 'ae', 'female'];

const DEPT_DOT_COLOR: Record<Department, string> = {
  doctors:   'bg-blue-400',
  nurses:    'bg-green-400',
  lab:       'bg-purple-400',
  pharmacy:  'bg-orange-400',
  radiology: 'bg-cyan-400',
  records:   'bg-gray-400',
};

const FILTER_OPTIONS: { key: Department | 'all'; label: string }[] = [
  { key: 'all',       label: 'All'        },
  { key: 'doctors',   label: 'Doctors'    },
  { key: 'nurses',    label: 'Nurses'     },
  { key: 'lab',       label: 'Lab'        },
  { key: 'pharmacy',  label: 'Pharmacy'   },
  { key: 'radiology', label: 'Radiology'  },
  { key: 'records',   label: 'Records'    },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function formatDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter((w) => w.length > 0 && !['Dr.', 'Sr.', 'Bro.', 'Mr.', 'Ms.'].includes(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StaffRowProps {
  entry: RosterEntry;
}

function StaffRow({ entry }: StaffRowProps) {
  const deptMeta = DEPT_META[entry.department];
  return (
    <div className="flex items-center gap-3 py-2 group">
      {/* Initials avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
          deptMeta.iconBg,
          deptMeta.iconText,
        )}
      >
        {getInitials(entry.name)}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
        <p className="text-xs text-gray-500 truncate">{entry.role}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`tel:${entry.phone.replace(/-/g, '')}`}
          className="p-1.5 rounded-md text-gray-400 hover:text-hospital-600 hover:bg-hospital-50 transition-colors"
          title={`Call ${entry.name}`}
        >
          <Phone className="w-3.5 h-3.5" />
        </a>
        <Link
          href={`/messages?to=${entry.staffId}`}
          className="p-1.5 rounded-md text-gray-400 hover:text-hospital-600 hover:bg-hospital-50 transition-colors"
          title={`Message ${entry.name}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Phone chip always visible */}
      <span className="flex-shrink-0 text-xs text-gray-400 font-mono hidden sm:block">
        {entry.phone}
      </span>
    </div>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

interface DayDetailProps {
  date: Date;
  entries: RosterEntry[];
  deptFilter: Department | 'all';
  onClose: () => void;
}

function DayDetailPanel({ date, entries, deptFilter, onClose }: DayDetailProps) {
  const shifts: Shift[] = ['morning', 'night'];

  const filtered = deptFilter === 'all' ? entries : entries.filter((e) => e.department === deptFilter);

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-hospital-50">
        <div>
          <h2 className="text-base font-semibold text-hospital-800">
            {format(date, 'EEEE, d MMMM yyyy')}
          </h2>
          <p className="text-xs text-hospital-600 mt-0.5">
            {filtered.length} staff member{filtered.length !== 1 ? 's' : ''} assigned
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
          aria-label="Close day detail"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shifts */}
      <div className="divide-y divide-gray-100">
        {shifts.map((shift) => {
          const shiftEntries = filtered.filter((e) => e.shift === shift);
          const meta = SHIFT_META[shift];
          if (shiftEntries.length === 0) return null;

          return (
            <div key={shift} className="px-5 py-4">
              {/* Shift header */}
              <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4', meta.bg, meta.text)}>
                {shift === 'morning'
                  ? <Sun className="w-3.5 h-3.5" />
                  : <Moon className="w-3.5 h-3.5" />
                }
                <span>{meta.label} Shift</span>
                <span className="opacity-70">{meta.time}</span>
              </div>

              {/* Group by department */}
              <div className="space-y-5">
                {DEPT_ORDER.map((dept) => {
                  const deptEntries = shiftEntries.filter((e) => e.department === dept);
                  if (deptEntries.length === 0) return null;
                  const deptMeta = DEPT_META[dept];

                  const hasWards = dept === 'doctors' || dept === 'nurses';

                  return (
                    <div key={dept}>
                      {/* Dept label */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold',
                            deptMeta.badgeBg,
                            deptMeta.badgeText,
                          )}
                        >
                          <Users className="w-3 h-3" />
                          {deptMeta.label}
                        </span>
                      </div>

                      {hasWards ? (
                        // Group by ward for doctors and nurses
                        <div className="space-y-3 pl-2">
                          {WARD_ORDER.map((ward) => {
                            const wardEntries = deptEntries.filter((e) => e.ward === ward);
                            if (wardEntries.length === 0) return null;
                            return (
                              <div key={ward}>
                                <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                                  {WARD_META[ward].label}
                                </p>
                                <div className="divide-y divide-gray-50">
                                  {wardEntries.map((entry) => (
                                    <StaffRow key={entry.id} entry={entry} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pl-2 divide-y divide-gray-50">
                          {deptEntries.map((entry) => (
                            <StaffRow key={entry.id} entry={entry} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center">
            <CalendarRange className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No staff assigned for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Cell ────────────────────────────────────────────────────────────

interface CalendarCellProps {
  day: number;
  date: Date;
  entries: RosterEntry[];
  deptFilter: Department | 'all';
  isSelected: boolean;
  onClick: () => void;
}

function CalendarCell({ day, date, entries, deptFilter, isSelected, onClick }: CalendarCellProps) {
  const today = isToday(date);
  const weekend = date.getDay() === 0 || date.getDay() === 6;

  const filtered = deptFilter === 'all' ? entries : entries.filter((e) => e.department === deptFilter);

  const morningCount = filtered.filter((e) => e.shift === 'morning').length;
  const nightCount   = filtered.filter((e) => e.shift === 'night').length;

  // Unique departments with morning coverage
  const morningDepts = [...new Set(filtered.filter((e) => e.shift === 'morning').map((e) => e.department))];
  const nightDepts   = [...new Set(filtered.filter((e) => e.shift === 'night').map((e) => e.department))];

  return (
    <button
      onClick={onClick}
      className={cn(
        'min-h-[80px] sm:min-h-[96px] p-2 rounded-lg border text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-hospital-500 focus:ring-offset-1',
        weekend ? 'bg-gray-50/60' : 'bg-white',
        isSelected
          ? 'border-hospital-400 shadow-md ring-2 ring-hospital-200'
          : 'border-gray-100 hover:border-hospital-200',
        today && !isSelected && 'ring-2 ring-hospital-400 border-hospital-300',
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={cn(
            'text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full',
            today
              ? 'bg-hospital-600 text-white'
              : weekend
              ? 'text-gray-400'
              : 'text-gray-800',
          )}
        >
          {day}
        </span>
        {filtered.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium">{filtered.length}</span>
        )}
      </div>

      {/* Morning dots */}
      {morningDepts.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-1">
          {morningDepts.slice(0, 4).map((dept) => (
            <span
              key={dept}
              title={`${DEPT_META[dept].shortLabel} – Morning (${morningCount})`}
              className={cn('w-2 h-2 rounded-full flex-shrink-0', DEPT_DOT_COLOR[dept])}
            />
          ))}
        </div>
      )}

      {/* Night dots */}
      {nightDepts.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {nightDepts.slice(0, 4).map((dept) => (
            <span
              key={dept}
              title={`${DEPT_META[dept].shortLabel} – Night (${nightCount})`}
              className={cn('w-2 h-2 rounded-full flex-shrink-0 opacity-60', DEPT_DOT_COLOR[dept])}
            />
          ))}
        </div>
      )}

      {/* Shift count labels */}
      {filtered.length > 0 && (
        <div className="mt-1.5 flex gap-1.5">
          {morningCount > 0 && (
            <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1 rounded">
              {morningCount}M
            </span>
          )}
          {nightCount > 0 && (
            <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1 rounded">
              {nightCount}N
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Main RosterPage ──────────────────────────────────────────────────────────

export function RosterPage() {
  const [activeMonth, setActiveMonth] = useState<MonthKey>('may');
  const [deptFilter, setDeptFilter]   = useState<Department | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(25); // default to 25th for demo

  const monthConfig = MONTHS.find((m) => m.key === activeMonth) ?? MONTHS[1];

  // Build a map: day → RosterEntry[]
  const rosterByDay = useMemo(() => {
    const map = new Map<number, RosterEntry[]>();
    for (const entry of monthConfig.roster) {
      const day = parseInt(entry.date.split('-')[2], 10);
      const existing = map.get(day) ?? [];
      existing.push(entry);
      map.set(day, existing);
    }
    return map;
  }, [monthConfig]);

  const daysInMonth  = getDaysInMonth(new Date(monthConfig.year, monthConfig.month - 1, 1));
  const firstDayOfWeek = getDay(startOfMonth(new Date(monthConfig.year, monthConfig.month - 1, 1))); // 0=Sun
  // Shift so Monday is first column (0=Mon ... 6=Sun)
  const startOffset  = (firstDayOfWeek + 6) % 7;

  const selectedDate = selectedDay !== null
    ? new Date(monthConfig.year, monthConfig.month - 1, selectedDay)
    : null;

  const selectedEntries = selectedDay !== null ? (rosterByDay.get(selectedDay) ?? []) : [];

  function handleDayClick(day: number) {
    setSelectedDay((prev) => (prev === day ? null : day));
  }

  function navigateMonth(dir: -1 | 1) {
    const idx = MONTHS.findIndex((m) => m.key === activeMonth);
    const next = MONTHS[idx + dir];
    if (next) {
      setActiveMonth(next.key);
      setSelectedDay(null);
    }
  }

  const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-hospital-100 flex items-center justify-center flex-shrink-0">
                <CalendarRange className="w-5 h-5 text-hospital-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Roster</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Monthly on-call and shift assignments
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Morning (9am–5pm)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                Night (5pm–9am)
              </div>
            </div>
          </div>

          {/* ── Month tabs ── */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              disabled={activeMonth === 'april'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {MONTHS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setActiveMonth(m.key); setSelectedDay(null); }}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                    activeMonth === m.key
                      ? 'bg-white text-hospital-700 shadow-sm ring-1 ring-gray-200'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigateMonth(1)}
              disabled={activeMonth === 'may'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Department filter chips ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin scrollbar-thumb-gray-200">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDeptFilter(opt.key as Department | 'all')}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
                deptFilter === opt.key
                  ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-hospital-300 hover:text-hospital-600',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Calendar grid ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DOW_LABELS.map((label, i) => (
              <div
                key={label}
                className={cn(
                  'py-3 text-center text-xs font-semibold uppercase tracking-wide',
                  i >= 5 ? 'text-gray-400' : 'text-gray-500',
                )}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar body */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 p-px">
            {/* Leading empty cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white min-h-[80px] sm:min-h-[96px]" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const date = new Date(monthConfig.year, monthConfig.month - 1, day);
              const entries = rosterByDay.get(day) ?? [];
              return (
                <CalendarCell
                  key={day}
                  day={day}
                  date={date}
                  entries={entries}
                  deptFilter={deptFilter}
                  isSelected={selectedDay === day}
                  onClick={() => handleDayClick(day)}
                />
              );
            })}
          </div>
        </div>

        {/* ── Day detail panel ── */}
        {selectedDay !== null && selectedDate !== null && (
          <DayDetailPanel
            date={selectedDate}
            entries={selectedEntries}
            deptFilter={deptFilter}
            onClose={() => setSelectedDay(null)}
          />
        )}

        {/* ── Dept dot legend ── */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Department Key
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {DEPT_ORDER.map((dept) => (
              <div key={dept} className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', DEPT_DOT_COLOR[dept])} />
                <span className="text-xs text-gray-600">{DEPT_META[dept].label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Brighter dots = Morning shift · Faded dots = Night shift
          </p>
        </div>
      </div>
    </div>
  );
}
