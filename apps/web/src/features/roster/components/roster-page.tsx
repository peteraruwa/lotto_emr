'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  format, getDaysInMonth, startOfMonth, getDay, isToday,
} from 'date-fns';
import {
  CalendarRange, MessageCircle, Phone, ChevronLeft, ChevronRight,
  X, Sun, Moon, Users, Pencil, Save, Ban, Plus, Upload, Loader2,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { STAFF, DEPT_META, WARD_META, SHIFT_META } from '../data/staff-data';
import type { Department, Ward, Shift } from '../data/staff-data';
import { formatDate } from '../data/roster-generator';
import type { RosterEntry } from '../data/roster-generator';
import { useRosterData } from '../hooks/use-roster-data';
import { useSaveRoster } from '../hooks/use-save-roster';
import type { StoredRosterEntry } from '../types';

// ─── Converter ────────────────────────────────────────────────────────────────

function storedToRoster(e: StoredRosterEntry): RosterEntry {
  const s = STAFF.find((x) => x.id === e.staffId);
  return {
    id:         `${e.staffId}-${e.date}-${e.shift}`,
    staffId:    e.staffId,
    name:       s?.name       ?? e.staffId,
    role:       s?.role       ?? '',
    phone:      s?.phone      ?? '',
    department: e.department,
    ward:       e.ward,
    shift:      e.shift,
    date:       e.date,
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPT_ORDER:     Department[] = ['doctors', 'nurses', 'lab', 'pharmacy', 'radiology', 'records'];
const WARD_ORDER:     Ward[]       = ['opd', 'ae', 'female'];
const DOW_LABELS                   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEPT_DOT: Record<Department, string> = {
  doctors: 'bg-blue-400', nurses: 'bg-green-400', lab: 'bg-purple-400',
  pharmacy: 'bg-orange-400', radiology: 'bg-cyan-400', records: 'bg-gray-400',
};

const FILTER_OPTIONS: { key: Department | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'doctors', label: 'Doctors' },
  { key: 'nurses', label: 'Nurses' }, { key: 'lab', label: 'Lab' },
  { key: 'pharmacy', label: 'Pharmacy' }, { key: 'radiology', label: 'Radiology' },
  { key: 'records', label: 'Records' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function padDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getInitials(name: string): string {
  return name.split(' ').filter((w) => !['Dr.', 'Sr.', 'Bro.', 'Mr.', 'Ms.'].includes(w))
    .slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// ─── Staff Row (read mode) ────────────────────────────────────────────────────

function StaffRow({
  entry, editMode, onRemove,
}: {
  entry: RosterEntry;
  editMode: boolean;
  onRemove?: () => void;
}) {
  const dm = DEPT_META[entry.department];
  return (
    <div className="flex items-center gap-3 py-2 group">
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold', dm.iconBg, dm.iconText)}>
        {getInitials(entry.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{entry.name}</p>
        <p className="text-xs text-gray-500 truncate">{entry.role}</p>
      </div>
      {editMode ? (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Remove from this shift"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <a href={`tel:${entry.phone.replace(/-/g, '')}`} className="p-1.5 rounded-md text-gray-400 hover:text-hospital-600 hover:bg-hospital-50 transition-colors">
            <Phone className="w-3.5 h-3.5" />
          </a>
          <Link href={`/messages?to=${entry.staffId}`} className="p-1.5 rounded-md text-gray-400 hover:text-hospital-600 hover:bg-hospital-50 transition-colors">
            <MessageCircle className="w-3.5 h-3.5" />
          </Link>
          <span className="text-xs text-gray-400 font-mono hidden sm:block ml-1">{entry.phone}</span>
        </div>
      )}
    </div>
  );
}

// ─── Add-Staff picker ─────────────────────────────────────────────────────────

function AddStaffPicker({
  date, shift, assigned,
  onAdd,
}: {
  date: string;
  shift: Shift;
  assigned: StoredRosterEntry[];
  onAdd: (e: StoredRosterEntry) => void;
}) {
  const [search, setSearch] = useState('');
  const assignedIds = new Set(assigned.filter((e) => e.date === date && e.shift === shift).map((e) => e.staffId));

  const candidates = STAFF.filter((s) =>
    !assignedIds.has(s.id) &&
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="mt-3 border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50">
      <p className="text-xs font-semibold text-gray-500 mb-2">Add staff to {shift} shift</p>
      <input
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:border-hospital-400 bg-white"
        placeholder="Search by name or ID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-40 overflow-y-auto space-y-0.5">
        {candidates.length === 0 ? (
          <p className="text-xs text-gray-400 py-2 text-center">No staff available</p>
        ) : (
          candidates.map((s) => {
            const dm = DEPT_META[s.department];
            return (
              <button
                key={s.id}
                onClick={() => {
                  onAdd({ date, shift, staffId: s.id, department: s.department, ward: s.ward });
                  setSearch('');
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left group"
              >
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0', dm.iconBg, dm.iconText)}>
                  {getInitials(s.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400">{s.role} · {s.id}</p>
                </div>
                <Plus className="w-3.5 h-3.5 text-hospital-500 opacity-0 group-hover:opacity-100 flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────

function DayDetailPanel({
  date, entries, allEntries, deptFilter, editMode, onClose, onRemove, onAdd, onCopyWeek,
}: {
  date: Date;
  entries: RosterEntry[];
  allEntries: StoredRosterEntry[];
  deptFilter: Department | 'all';
  editMode: boolean;
  onClose: () => void;
  onRemove: (staffId: string, shift: Shift) => void;
  onAdd: (e: StoredRosterEntry) => void;
  onCopyWeek: (sourceDate: string) => void;
}) {
  const [addingShift, setAddingShift] = useState<Shift | null>(null);
  const shifts: Shift[] = ['morning', 'night'];
  const filtered = deptFilter === 'all' ? entries : entries.filter((e) => e.department === deptFilter);
  const dateStr  = formatDate(date);

  return (
    <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className={cn(
        'flex items-center justify-between px-5 py-4 border-b border-gray-100',
        editMode ? 'bg-amber-50' : 'bg-hospital-50',
      )}>
        <div>
          <h2 className={cn('text-base font-semibold', editMode ? 'text-amber-800' : 'text-hospital-800')}>
            {format(date, 'EEEE, d MMMM yyyy')}
            {editMode && <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Editing</span>}
          </h2>
          <p className={cn('text-xs mt-0.5', editMode ? 'text-amber-600' : 'text-hospital-600')}>
            {filtered.length} staff member{filtered.length !== 1 ? 's' : ''} assigned
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <button
              onClick={() => onCopyWeek(dateStr)}
              className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
              title="Copy this week's pattern to next week"
            >
              Copy week →
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {shifts.map((shift) => {
          const shiftEntries = filtered.filter((e) => e.shift === shift);
          const meta = SHIFT_META[shift];
          const isAdding = addingShift === shift;

          return (
            <div key={shift} className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold', meta.bg, meta.text)}>
                  {shift === 'morning' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span>{meta.label} Shift</span>
                  <span className="opacity-70">{meta.time}</span>
                </div>
                {editMode && (
                  <button
                    onClick={() => setAddingShift(isAdding ? null : shift)}
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                      isAdding
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-hospital-50 text-hospital-700 hover:bg-hospital-100',
                    )}
                  >
                    {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {isAdding ? 'Cancel' : 'Add staff'}
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {DEPT_ORDER.map((dept) => {
                  const deptEntries = shiftEntries.filter((e) => e.department === dept);
                  if (deptEntries.length === 0) return null;
                  const dm = DEPT_META[dept];
                  const hasWards = dept === 'doctors' || dept === 'nurses';

                  return (
                    <div key={dept}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold', dm.badgeBg, dm.badgeText)}>
                          <Users className="w-3 h-3" />{dm.label}
                        </span>
                      </div>
                      {hasWards ? (
                        <div className="space-y-3 pl-2">
                          {WARD_ORDER.map((ward) => {
                            const we = deptEntries.filter((e) => e.ward === ward);
                            if (we.length === 0) return null;
                            return (
                              <div key={ward}>
                                <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{WARD_META[ward].label}</p>
                                <div className="divide-y divide-gray-50">
                                  {we.map((e) => (
                                    <StaffRow key={e.id} entry={e} editMode={editMode}
                                      onRemove={() => onRemove(e.staffId, shift)} />
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pl-2 divide-y divide-gray-50">
                          {deptEntries.map((e) => (
                            <StaffRow key={e.id} entry={e} editMode={editMode}
                              onRemove={() => onRemove(e.staffId, shift)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {shiftEntries.length === 0 && !isAdding && (
                  <p className="text-xs text-gray-400 italic pl-2">No staff assigned</p>
                )}
              </div>

              {isAdding && (
                <AddStaffPicker date={dateStr} shift={shift} assigned={allEntries} onAdd={(e) => { onAdd(e); }} />
              )}
            </div>
          );
        })}

        {filtered.length === 0 && !editMode && (
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

function CalendarCell({
  day, date, entries, deptFilter, isSelected, editMode, onClick,
}: {
  day: number; date: Date; entries: RosterEntry[];
  deptFilter: Department | 'all'; isSelected: boolean; editMode: boolean;
  onClick: () => void;
}) {
  const today   = isToday(date);
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const filtered = deptFilter === 'all' ? entries : entries.filter((e) => e.department === deptFilter);
  const morningDepts = [...new Set(filtered.filter((e) => e.shift === 'morning').map((e) => e.department))];
  const nightDepts   = [...new Set(filtered.filter((e) => e.shift === 'night').map((e) => e.department))];

  return (
    <button
      onClick={onClick}
      className={cn(
        'min-h-[80px] sm:min-h-[96px] p-2 rounded-lg border text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-hospital-500 focus:ring-offset-1',
        weekend ? 'bg-gray-50/60' : 'bg-white',
        isSelected ? 'border-hospital-400 shadow-md ring-2 ring-hospital-200' : 'border-gray-100 hover:border-hospital-200',
        today && !isSelected && 'ring-2 ring-hospital-400 border-hospital-300',
        editMode && 'hover:border-amber-300 hover:ring-amber-200',
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn(
          'text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full',
          today ? 'bg-hospital-600 text-white' : weekend ? 'text-gray-400' : 'text-gray-800',
        )}>
          {day}
        </span>
        {filtered.length > 0 && <span className="text-[10px] text-gray-400 font-medium">{filtered.length}</span>}
      </div>
      {morningDepts.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mb-1">
          {morningDepts.slice(0, 4).map((d) => <span key={d} className={cn('w-2 h-2 rounded-full flex-shrink-0', DEPT_DOT[d])} />)}
        </div>
      )}
      {nightDepts.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {nightDepts.slice(0, 4).map((d) => <span key={d} className={cn('w-2 h-2 rounded-full flex-shrink-0 opacity-50', DEPT_DOT[d])} />)}
        </div>
      )}
      {filtered.length > 0 && (
        <div className="mt-1.5 flex gap-1.5">
          {filtered.filter((e) => e.shift === 'morning').length > 0 && (
            <span className="text-[9px] font-medium text-amber-600 bg-amber-50 px-1 rounded">
              {filtered.filter((e) => e.shift === 'morning').length}M
            </span>
          )}
          {filtered.filter((e) => e.shift === 'night').length > 0 && (
            <span className="text-[9px] font-medium text-indigo-600 bg-indigo-50 px-1 rounded">
              {filtered.filter((e) => e.shift === 'night').length}N
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Month config ─────────────────────────────────────────────────────────────

type MonthKey = 'april' | 'may';
const MONTHS: { key: MonthKey; label: string; year: number; month: number }[] = [
  { key: 'april', label: 'April 2026', year: 2026, month: 4 },
  { key: 'may',   label: 'May 2026',   year: 2026, month: 5 },
];

// ─── Main RosterPage ──────────────────────────────────────────────────────────

export function RosterPage() {
  const [activeMonth, setActiveMonth] = useState<MonthKey>('may');
  const [deptFilter,  setDeptFilter]  = useState<Department | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<number | null>(25);
  const [editMode,    setEditMode]    = useState(false);
  // Local copy of entries mutated during edit session
  const [editedEntries, setEditedEntries] = useState<StoredRosterEntry[] | null>(null);

  const monthConfig = MONTHS.find((m) => m.key === activeMonth) ?? MONTHS[1];
  const { data: rosterData, isLoading } = useRosterData(monthConfig.year, monthConfig.month);
  const saveRoster = useSaveRoster(monthConfig.year, monthConfig.month);

  // The entries actually displayed — use edited copy while in edit mode
  const activeEntries: StoredRosterEntry[] = editMode && editedEntries !== null
    ? editedEntries
    : (rosterData ?? []);

  // Convert to RosterEntry map by day
  const rosterByDay = useMemo(() => {
    const map = new Map<number, RosterEntry[]>();
    for (const e of activeEntries) {
      const day = parseInt(e.date.split('-')[2], 10);
      const arr = map.get(day) ?? [];
      arr.push(storedToRoster(e));
      map.set(day, arr);
    }
    return map;
  }, [activeEntries]);

  const daysInMonth    = getDaysInMonth(new Date(monthConfig.year, monthConfig.month - 1, 1));
  const startOffset    = (getDay(startOfMonth(new Date(monthConfig.year, monthConfig.month - 1, 1))) + 6) % 7;
  const selectedDate   = selectedDay !== null ? new Date(monthConfig.year, monthConfig.month - 1, selectedDay) : null;
  const selectedDateStr = selectedDay !== null ? padDate(monthConfig.year, monthConfig.month, selectedDay) : '';
  const selectedEntries = selectedDay !== null ? (rosterByDay.get(selectedDay) ?? []) : [];

  // ── Edit mode actions ────────────────────────────────────────────────────────

  const enterEditMode = useCallback(() => {
    setEditedEntries(rosterData ? [...rosterData] : []);
    setEditMode(true);
  }, [rosterData]);

  const discardEdits = useCallback(() => {
    setEditedEntries(null);
    setEditMode(false);
  }, []);

  const saveEdits = useCallback(async () => {
    if (!editedEntries) return;
    await saveRoster.mutateAsync(editedEntries);
    setEditedEntries(null);
    setEditMode(false);
  }, [editedEntries, saveRoster]);

  const handleRemove = useCallback((staffId: string, shift: Shift) => {
    if (!selectedDateStr) return;
    setEditedEntries((prev) => (prev ?? []).filter(
      (e) => !(e.date === selectedDateStr && e.shift === shift && e.staffId === staffId),
    ));
  }, [selectedDateStr]);

  const handleAdd = useCallback((entry: StoredRosterEntry) => {
    setEditedEntries((prev) => {
      const arr = prev ?? [];
      const dup = arr.some((e) => e.date === entry.date && e.shift === entry.shift && e.staffId === entry.staffId);
      return dup ? arr : [...arr, entry];
    });
  }, []);

  /** Copy the current week's pattern (Mon–Sun containing sourceDate) to the next week. */
  const handleCopyWeek = useCallback((sourceDate: string) => {
    if (!editedEntries) return;
    const base = new Date(sourceDate);
    const dow  = (base.getDay() + 6) % 7; // Mon=0
    const mon  = new Date(base); mon.setDate(base.getDate() - dow);

    const weekEntries: StoredRosterEntry[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const dateStr = formatDate(d);
      weekEntries.push(...editedEntries.filter((e) => e.date === dateStr));
    }

    // Remap to next week
    const newEntries = weekEntries.map((e) => {
      const d = new Date(e.date); d.setDate(d.getDate() + 7);
      return { ...e, date: formatDate(d) };
    });

    setEditedEntries((prev) => {
      const arr = [...(prev ?? [])];
      // Remove existing next-week entries for same staff
      const nextWeekDates = new Set(newEntries.map((e) => e.date));
      const without = arr.filter((e) => !nextWeekDates.has(e.date));
      return [...without, ...newEntries];
    });
  }, [editedEntries]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  function navigateMonth(dir: -1 | 1) {
    const idx  = MONTHS.findIndex((m) => m.key === activeMonth);
    const next = MONTHS[idx + dir];
    if (next) { setActiveMonth(next.key); setSelectedDay(null); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page header ── */}
      <div className={cn('border-b', editMode ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', editMode ? 'bg-amber-100' : 'bg-hospital-100')}>
                <CalendarRange className={cn('w-5 h-5', editMode ? 'text-amber-600' : 'text-hospital-600')} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Roster</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editMode ? '✏️ Edit mode — click any day to modify assignments' : 'Monthly on-call and shift assignments'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={discardEdits}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Ban className="w-4 h-4" /> Discard
                  </button>
                  <button
                    onClick={saveEdits}
                    disabled={saveRoster.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {saveRoster.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Roster
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/roster/upload"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Upload CSV
                  </Link>
                  <button
                    onClick={enterEditMode}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-hospital-600 hover:bg-hospital-700 rounded-lg transition-colors disabled:opacity-60"
                  >
                    <Pencil className="w-4 h-4" /> Edit Roster
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Month tabs */}
          <div className="mt-5 flex items-center gap-2">
            <button onClick={() => navigateMonth(-1)} disabled={activeMonth === 'april'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {MONTHS.map((m) => (
                <button key={m.key}
                  onClick={() => { setActiveMonth(m.key); setSelectedDay(null); }}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                    activeMonth === m.key ? 'bg-white text-hospital-700 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700',
                  )}>
                  {m.label}
                </button>
              ))}
            </div>
            <button onClick={() => navigateMonth(1)} disabled={activeMonth === 'may'}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Department filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {FILTER_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setDeptFilter(opt.key as Department | 'all')}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
                deptFilter === opt.key
                  ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-hospital-300 hover:text-hospital-600',
              )}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={cn('bg-white rounded-xl border shadow-sm overflow-hidden', editMode ? 'border-amber-200' : 'border-gray-200')}>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DOW_LABELS.map((label, i) => (
              <div key={label} className={cn('py-3 text-center text-xs font-semibold uppercase tracking-wide', i >= 5 ? 'text-gray-400' : 'text-gray-500')}>
                {label}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-px bg-gray-100 p-px">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-white min-h-[80px] sm:min-h-[96px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-100 p-px">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`e-${i}`} className="bg-white min-h-[80px] sm:min-h-[96px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <CalendarCell key={day} day={day}
                    date={new Date(monthConfig.year, monthConfig.month - 1, day)}
                    entries={rosterByDay.get(day) ?? []}
                    deptFilter={deptFilter}
                    isSelected={selectedDay === day}
                    editMode={editMode}
                    onClick={() => setSelectedDay((p) => p === day ? null : day)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDay !== null && selectedDate !== null && (
          <DayDetailPanel
            date={selectedDate}
            entries={selectedEntries}
            allEntries={activeEntries}
            deptFilter={deptFilter}
            editMode={editMode}
            onClose={() => setSelectedDay(null)}
            onRemove={handleRemove}
            onAdd={handleAdd}
            onCopyWeek={handleCopyWeek}
          />
        )}

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl border border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Department Key</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {DEPT_ORDER.map((dept) => (
              <div key={dept} className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', DEPT_DOT[dept])} />
                <span className="text-xs text-gray-600">{DEPT_META[dept].label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Brighter dots = Morning shift · Faded dots = Night shift</p>
        </div>
      </div>
    </div>
  );
}
