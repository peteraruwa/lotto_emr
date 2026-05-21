'use client';

import { useMedplum } from '@medplum/react';
import { useQuery } from '@tanstack/react-query';
import type { Bundle, Patient, Encounter, Condition, MedicationRequest } from '@medplum/fhirtypes';
import { subDays, subMonths, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(preset: DateRangePreset, custom?: DateRange): DateRange {
  const end = new Date();
  switch (preset) {
    case '7d':  return { start: subDays(end, 7), end };
    case '30d': return { start: subDays(end, 30), end };
    case '90d': return { start: subDays(end, 90), end };
    case '1y':  return { start: subMonths(end, 12), end };
    default:    return custom ?? { start: subDays(end, 30), end };
  }
}

// ── Overview counts ─────────────────────────────────────────────────────────

export function useTotalPatients() {
  const medplum = useMedplum();
  return useQuery({
    queryKey: ['analytics', 'total-patients'],
    queryFn: async () => {
      const bundle = await medplum.search('Patient', { _count: '0', _total: 'accurate' }) as Bundle<Patient>;
      return bundle.total ?? 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEncounterStats(range: DateRange) {
  const medplum = useMedplum();
  const start = format(range.start, "yyyy-MM-dd'T'HH:mm:ss");
  const end   = format(range.end,   "yyyy-MM-dd'T'HH:mm:ss");

  return useQuery({
    queryKey: ['analytics', 'encounters', start, end],
    queryFn: async () => {
      const [finished, total] = await Promise.all([
        medplum.search('Encounter', { status: 'finished', date: `ge${start}`, _count: '0', _total: 'accurate' }) as Promise<Bundle<Encounter>>,
        medplum.search('Encounter', { date: `ge${start}`, _count: '0', _total: 'accurate' }) as Promise<Bundle<Encounter>>,
      ]);
      return {
        total: total.total ?? 0,
        completed: finished.total ?? 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Patient volume trend (monthly) ──────────────────────────────────────────

export interface MonthlyVolume {
  month: string;       // "Jan", "Feb" …
  patients: number;
  encounters: number;
}

export function useMonthlyVolume(months = 6) {
  const medplum = useMedplum();
  return useQuery({
    queryKey: ['analytics', 'monthly-volume', months],
    queryFn: async (): Promise<MonthlyVolume[]> => {
      const now = new Date();
      const monthRange = eachMonthOfInterval({
        start: startOfMonth(subMonths(now, months - 1)),
        end: endOfMonth(now),
      });

      const results = await Promise.all(
        monthRange.map(async (monthStart) => {
          const monthEnd = endOfMonth(monthStart);
          const s = format(monthStart, "yyyy-MM-dd'T'00:00:00");
          const e = format(monthEnd,   "yyyy-MM-dd'T'23:59:59");

          const [patBundle, encBundle] = await Promise.all([
            medplum.search('Patient', { _lastUpdated: `ge${s}`, _count: '0', _total: 'accurate' }) as Promise<Bundle<Patient>>,
            medplum.search('Encounter', { date: `ge${s}`, date2: `le${e}`, _count: '0', _total: 'accurate' }) as Promise<Bundle<Encounter>>,
          ]);

          return {
            month: format(monthStart, 'MMM'),
            patients: patBundle.total ?? 0,
            encounters: encBundle.total ?? 0,
          };
        }),
      );
      return results;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// ── Top diagnoses ────────────────────────────────────────────────────────────

export interface DiagnosisStat {
  code: string;
  display: string;
  count: number;
}

export function useTopDiagnoses(range: DateRange, limit = 10) {
  const medplum = useMedplum();
  const start = format(range.start, "yyyy-MM-dd");

  return useQuery({
    queryKey: ['analytics', 'top-diagnoses', start, limit],
    queryFn: async (): Promise<DiagnosisStat[]> => {
      const bundle = await medplum.search('Condition', {
        'recorded-date': `ge${start}`,
        _count: '200',
      }) as Bundle<Condition>;

      const counts: Record<string, { display: string; count: number }> = {};

      for (const entry of bundle.entry ?? []) {
        const cond = entry.resource;
        if (!cond) continue;
        const coding = cond.code?.coding?.[0];
        const code = coding?.code ?? 'unknown';
        const display = coding?.display ?? cond.code?.text ?? 'Unknown condition';
        // Skip pregnancy (77386006) from general diagnoses
        if (code === '77386006') continue;
        if (!counts[code]) counts[code] = { display, count: 0 };
        counts[code].count++;
      }

      return Object.entries(counts)
        .map(([code, { display, count }]) => ({ code, display, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Top prescribed medications ────────────────────────────────────────────────

export interface MedStat {
  name: string;
  count: number;
  percentage: number;
}

export function useTopMedications(range: DateRange, limit = 10) {
  const medplum = useMedplum();
  const start = format(range.start, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['analytics', 'top-meds', start, limit],
    queryFn: async (): Promise<MedStat[]> => {
      const bundle = await medplum.search('MedicationRequest', {
        'authored-on': `ge${start}`,
        _count: '200',
      }) as Bundle<MedicationRequest>;

      const counts: Record<string, number> = {};
      let total = 0;

      for (const entry of bundle.entry ?? []) {
        const med = entry.resource;
        if (!med) continue;
        const name =
          med.medicationCodeableConcept?.text ??
          med.medicationCodeableConcept?.coding?.[0]?.display ??
          'Unknown';
        counts[name] = (counts[name] ?? 0) + 1;
        total++;
      }

      const sorted = Object.entries(counts)
        .map(([name, count]) => ({ name, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return sorted;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Encounter type distribution ──────────────────────────────────────────────

export interface DeptStat {
  department: string;
  count: number;
}

export function useDepartmentLoad(range: DateRange) {
  const medplum = useMedplum();
  const start = format(range.start, "yyyy-MM-dd");

  return useQuery({
    queryKey: ['analytics', 'dept-load', start],
    queryFn: async (): Promise<DeptStat[]> => {
      const bundle = await medplum.search('Encounter', {
        date: `ge${start}`,
        _count: '500',
      }) as Bundle<Encounter>;

      const counts: Record<string, number> = {};

      for (const entry of bundle.entry ?? []) {
        const enc = entry.resource;
        if (!enc) continue;
        const dept = enc.serviceType?.text ??
          enc.type?.[0]?.text ??
          enc.class?.display ??
          'General';
        counts[dept] = (counts[dept] ?? 0) + 1;
      }

      return Object.entries(counts)
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── New vs returning patients (simple heuristic) ──────────────────────────────

export function useNewVsReturning(range: DateRange) {
  const medplum = useMedplum();
  const start = format(range.start, "yyyy-MM-dd");

  return useQuery({
    queryKey: ['analytics', 'new-vs-returning', start],
    queryFn: async () => {
      const [newPats, total] = await Promise.all([
        medplum.search('Patient', { _lastUpdated: `ge${start}`, _count: '0', _total: 'accurate' }) as Promise<Bundle<Patient>>,
        medplum.search('Patient', { _count: '0', _total: 'accurate' }) as Promise<Bundle<Patient>>,
      ]);
      const newCount = newPats.total ?? 0;
      const totalCount = total.total ?? 0;
      return {
        newCount,
        returningCount: Math.max(0, totalCount - newCount),
        totalCount,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
