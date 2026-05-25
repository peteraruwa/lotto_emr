'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarRange, MessageCircle, Phone, Sun, Moon,
  ArrowRight, Users, ChevronDown,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { format } from 'date-fns';
import { getTodayOnDutyTeam, getCurrentShift } from '../data/roster-generator';
import type { RosterEntry } from '../data/roster-generator';
import { DEPT_META, WARD_META, SHIFT_META } from '../data/staff-data';
import type { Department, Ward } from '../data/staff-data';

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, deptBg, deptText }: { name: string; deptBg: string; deptText: string }) {
  const initials = name
    .replace(/^(Dr\.|Sr\.|Bro\.|Mr\.|Ms\.)/, '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0', deptBg, deptText)}>
      {initials}
    </div>
  );
}

// ── Staff row ─────────────────────────────────────────────────────────────────

function StaffRow({ entry }: { entry: RosterEntry }) {
  const meta = DEPT_META[entry.department];
  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group">
      <Avatar name={entry.name} deptBg={meta.iconBg} deptText={meta.iconText} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{entry.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{entry.role}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`tel:${entry.phone.replace(/-/g, '')}`}
          className="p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title={entry.phone}
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="h-3 w-3" />
        </a>
        <Link
          href={`/messages?to=${entry.staffId}`}
          className="p-1 rounded-md hover:bg-hospital-100 text-gray-500 hover:text-hospital-700 transition-colors"
          title="Send message"
        >
          <MessageCircle className="h-3 w-3" />
        </Link>
      </div>
      {/* Phone shown always on mobile */}
      <a
        href={`tel:${entry.phone.replace(/-/g, '')}`}
        className="text-[10px] text-gray-400 flex-shrink-0 sm:hidden"
        title={entry.phone}
      >
        {entry.phone}
      </a>
    </div>
  );
}

// ── Department group ──────────────────────────────────────────────────────────

interface DeptGroupProps {
  department: Department;
  entries: RosterEntry[];
}

function DeptGroup({ department, entries }: DeptGroupProps) {
  const meta = DEPT_META[department];

  // For doctors/nurses: group by ward
  const byWard = entries.reduce<Record<string, RosterEntry[]>>((acc, e) => {
    const key = e.ward ?? '_';
    acc[key] = acc[key] ?? [];
    acc[key].push(e);
    return acc;
  }, {});

  const hasWards = entries.some((e) => e.ward);

  return (
    <div className="mb-2">
      <div className={cn('flex items-center gap-1.5 px-3 py-1 rounded-md mx-1', meta.badgeBg)}>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider', meta.iconText)}>
          {meta.label}
        </span>
      </div>

      {hasWards ? (
        Object.entries(byWard).map(([wardKey, wardEntries]) => {
          const wardMeta = WARD_META[wardKey as Ward];
          return (
            <div key={wardKey}>
              <p className="text-[10px] text-gray-400 font-medium px-3 pt-1.5 pb-0.5 uppercase tracking-wide">
                {wardMeta?.shortLabel ?? wardKey}
              </p>
              {wardEntries.map((e) => <StaffRow key={e.id} entry={e} />)}
            </div>
          );
        })
      ) : (
        entries.map((e) => <StaffRow key={e.id} entry={e} />)
      )}
    </div>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export function TodayTeamWidget() {
  const [team, setTeam] = useState<RosterEntry[] | null>(null);
  const [shift, setShift] = useState<'morning' | 'night'>('morning');
  const [today, setToday] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setTeam(getTodayOnDutyTeam());
    setShift(getCurrentShift());
    setToday(format(new Date(), 'EEE, d MMM yyyy'));
  }, []);

  const shiftMeta = SHIFT_META[shift];
  const ShiftIcon = shift === 'morning' ? Sun : Moon;

  // Group by department — preserve order
  const DEPT_ORDER: Department[] = ['doctors', 'nurses', 'lab', 'pharmacy', 'radiology', 'records'];
  const byDept = DEPT_ORDER.reduce<Record<Department, RosterEntry[]>>(
    (acc, d) => ({ ...acc, [d]: [] }),
    {} as Record<Department, RosterEntry[]>,
  );
  if (team) {
    for (const e of team) byDept[e.department]?.push(e);
  }
  const activeDepts = DEPT_ORDER.filter((d) => byDept[d].length > 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header — click anywhere to toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-hospital-50 flex items-center justify-center flex-shrink-0">
            <CalendarRange className="h-3.5 w-3.5 text-hospital-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-tight">On Duty</p>
            <p className="text-[10px] text-gray-400 truncate">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
            shiftMeta.bg, shiftMeta.text, shiftMeta.border,
          )}>
            <ShiftIcon className="h-2.5 w-2.5" />
            {shiftMeta.label}
          </span>
          {/* Stop propagation so the roster link doesn't toggle */}
          <Link
            href="/roster"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 text-xs font-medium text-hospital-600 hover:text-hospital-700 transition-colors"
          >
            All <ArrowRight className="h-3 w-3" />
          </Link>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0',
              open ? 'rotate-180' : 'rotate-0',
            )}
          />
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {/* Body */}
          <div className="py-2 max-h-[480px] overflow-y-auto">
            {team === null ? (
              /* Skeleton */
              <div className="space-y-2 px-3 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-2.5 w-28 bg-gray-100 rounded-full animate-pulse" />
                      <div className="h-2 w-20 bg-gray-100 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeDepts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-xs font-medium text-gray-500">No roster data for today</p>
                <Link
                  href="/roster"
                  className="text-xs text-hospital-600 hover:underline"
                >
                  View full roster →
                </Link>
              </div>
            ) : (
              activeDepts.map((dept) => (
                <DeptGroup key={dept} department={dept} entries={byDept[dept]} />
              ))
            )}
          </div>

          {/* Footer */}
          {team !== null && activeDepts.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <Link
                href="/roster"
                className="flex items-center justify-between text-xs text-hospital-600 hover:text-hospital-700 font-medium transition-colors"
              >
                <span>View full monthly roster</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
