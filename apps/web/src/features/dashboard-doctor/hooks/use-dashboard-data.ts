'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { formatPatientName } from '@lotto-emr/core';
import type { Patient } from '@medplum/fhirtypes';

export interface AppointmentRow {
  id: string;
  patientId: string;
  patientName: string;
  patientRef: string;
  time: string;
  visitType: string;
  status: string;
  isMock?: boolean;
}

export interface SeenPatientRow {
  id: string;
  patientId: string;
  patientName: string;
  timeSeen: string;   // ISO
  reason: string;
  duration?: number;  // minutes
  isMock?: boolean;
}

export interface EncounterRow {
  id: string;
  patientId: string;
  patientName: string;
  status: string;
  start: string;
  reason: string;
}

export interface PendingResult {
  id: string;
  title: string;
  patientName: string;
  issued: string;
  status: string;
}

export interface DoctorDashboardData {
  todayAppointments:  number;
  pendingResultsCount: number;
  activeEncounters:   number;
  pendingOrdersCount: number;
  schedule:           AppointmentRow[];
  seenToday:          SeenPatientRow[];
  recentEncounters:   EncounterRow[];
  pendingResults:     PendingResult[];
  pendingOrders:      { id: string; title: string; patientName: string; priority: string }[];
}

// ── Mock seed data ─────────────────────────────────────────────────────────────

const MOCK_NAMES = [
  'Chukwuemeka Okafor',  'Adaeze Nwosu',         'Babatunde Adeyemi',
  'Ngozi Eze',           'Oluwaseun Abiodun',     'Ifeoma Okonkwo',
  'Uche Nwachukwu',      'Kemi Adeyemi',          'Chioma Obi',
  'Tunde Fashola',       'Amaka Obiora',           'Seun Oduola',
  'Yetunde Afolabi',     'Blessing Nwofor',        'Rotimi Amaechi',
  'Bolanle Abiodun',     'Obinna Uzoma',           'Chiamaka Dike',
  'Nnamdi Eze',          'Titilayo Adesanya',
];

const VISIT_TYPES = [
  'General Consultation', 'Follow-up Visit',        'Acute Illness',
  'Chronic Disease Mgmt', 'Antenatal Care',          'Post-op Review',
  'Referral Review',      'Well-baby Check',         'BP Monitoring',
  'Diabetes Review',
];

const SEEN_REASONS = [
  'Hypertension follow-up',   'Malaria treatment review', 'Antenatal check (28 wks)',
  'Upper respiratory tract infection', 'Type 2 diabetes management',
  'Wound dressing review',    'Abdominal pain evaluation', 'Chronic back pain',
  'Skin rash assessment',     'Post-discharge review',
];

/** Deterministic pseudo-random int seeded by date + index */
function seededRand(seed: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return Math.floor(Math.abs(x - Math.floor(x)) * max);
}

function todaySeed(): number {
  const t = new Date();
  return t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
}

/** Generate mock AppointmentRows to pad the queue to `target` entries */
function padQueue(existing: AppointmentRow[], target: number): AppointmentRow[] {
  if (existing.length >= target) return existing;
  const seed = todaySeed();
  const needed = target - existing.length;

  // Figure out the real names already in the queue so we don't duplicate
  const usedNames = new Set(existing.map((r) => r.patientName));

  // Build a pool of names not yet used
  const availableNames = MOCK_NAMES.filter((n) => !usedNames.has(n));

  // Queue times: 9:00 AM to 4:30 PM in 30-min slots
  const todayBase = new Date();
  todayBase.setHours(9, 0, 0, 0);

  // Existing times to avoid collision
  const usedSlots = new Set(existing.map((r) => r.time));

  const extras: AppointmentRow[] = [];
  let slotIdx = 0;

  for (let i = 0; i < needed; i++) {
    // Pick a name
    const nameIdx = seededRand(seed + i * 7, availableNames.length || MOCK_NAMES.length);
    const name = availableNames[nameIdx] ?? MOCK_NAMES[i % MOCK_NAMES.length];

    // Pick a slot (30-min increments)
    let slotTime: Date;
    do {
      const slotDate = new Date(todayBase);
      slotDate.setMinutes(slotIdx * 30);
      slotTime = slotDate;
      slotIdx++;
    } while (usedSlots.has(slotTime.toISOString()) && slotIdx < 20);
    usedSlots.add(slotTime.toISOString());

    const hour = slotTime.getHours();
    const isEarly = hour < new Date().getHours() - 1;
    const statusOpts = isEarly
      ? ['fulfilled', 'fulfilled', 'arrived'] // earlier slots mostly done
      : ['booked', 'booked', 'booked', 'arrived', 'proposed'];
    const status = statusOpts[seededRand(seed + i * 3, statusOpts.length)];
    const visitType = VISIT_TYPES[seededRand(seed + i * 11, VISIT_TYPES.length)];

    extras.push({
      id:          `mock-appt-${i}`,
      patientId:   '',
      patientName: name,
      patientRef:  '',
      time:        slotTime.toISOString(),
      visitType,
      status,
      isMock:      true,
    });
  }

  return [...existing, ...extras];
}

/** Generate mock SeenPatientRows to pad the seen-today list to `target` entries */
function padSeenToday(existing: SeenPatientRow[], target: number): SeenPatientRow[] {
  if (existing.length >= target) return existing;
  const seed = todaySeed();
  const needed = target - existing.length;

  const usedNames = new Set(existing.map((r) => r.patientName));
  const availableNames = MOCK_NAMES.filter((n) => !usedNames.has(n));

  const now = new Date();
  const extras: SeenPatientRow[] = [];

  for (let i = 0; i < needed; i++) {
    // Spread seen times evenly through the morning
    const hoursAgo = 0.5 + i * 0.6; // 30 min to ~5 h ago
    const seenTime = new Date(now.getTime() - hoursAgo * 3_600_000);

    const nameIdx = seededRand(seed + i * 13 + 50, availableNames.length || MOCK_NAMES.length);
    const name    = availableNames[nameIdx] ?? MOCK_NAMES[(i + 5) % MOCK_NAMES.length];
    const reason  = SEEN_REASONS[seededRand(seed + i * 17 + 100, SEEN_REASONS.length)];
    const duration = 10 + seededRand(seed + i * 5 + 200, 20); // 10-29 min

    extras.push({
      id:          `mock-seen-${i}`,
      patientId:   '',
      patientName: name,
      timeSeen:    seenTime.toISOString(),
      reason,
      duration,
      isMock:      true,
    });
  }

  // Return sorted newest-first
  return [...existing, ...extras].sort(
    (a, b) => new Date(b.timeSeen).getTime() - new Date(a.timeSeen).getTime(),
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useDoctorDashboardData(): { data: DoctorDashboardData | null; isLoading: boolean } {
  const medplum  = useMedplum();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [apptQ, orderQ, reportQ, encounterQ, seenQ] = useQueries({
    queries: [
      {
        queryKey: ['doctor-dash', 'appointments', todayStr],
        queryFn: async () => {
          const bundle = await medplum.search('Appointment', {
            date:     `ge${todayStr}`,
            _sort:    'date',
            _count:   '50',
            _include: 'Appointment:patient',
          });
          return bundle;
        },
      },
      {
        queryKey: ['doctor-dash', 'orders'],
        queryFn: () =>
          medplum.searchResources('ServiceRequest', {
            status: 'active,draft',
            _sort:  '-authored',
            _count: '10',
          }),
      },
      {
        queryKey: ['doctor-dash', 'reports'],
        queryFn: () =>
          medplum.searchResources('DiagnosticReport', {
            status: 'registered,preliminary,partial',
            _sort:  '-issued',
            _count: '10',
          }),
      },
      {
        queryKey: ['doctor-dash', 'encounters'],
        queryFn: () =>
          medplum.searchResources('Encounter', {
            _sort:  '-date',
            _count: '8',
          }),
      },
      {
        // Encounters finished today — "patients seen by me today"
        queryKey: ['doctor-dash', 'seen-today', todayStr],
        queryFn: () =>
          medplum.searchResources('Encounter', {
            date:    `ge${todayStr}`,
            status:  'finished',
            _sort:   '-date',
            _count:  '30',
          }),
      },
    ],
  });

  const isLoading =
    apptQ.isLoading || orderQ.isLoading || reportQ.isLoading ||
    encounterQ.isLoading || seenQ.isLoading;

  if (isLoading) return { data: null, isLoading };

  // ── Appointments ─────────────────────────────────────────────────────────────
  const apptBundle = apptQ.data as any;
  const entries    = (apptBundle?.entry ?? []) as any[];

  const appointments = entries
    .filter((e) => e.resource?.resourceType === 'Appointment')
    .map((e) => e.resource);

  const patientMap: Record<string, string> = {};
  entries
    .filter((e) => e.resource?.resourceType === 'Patient')
    .forEach((e) => {
      const p = e.resource as Patient;
      if (p.id) patientMap[p.id] = formatPatientName(p.name);
    });

  const rawSchedule: AppointmentRow[] = appointments.map((a: any) => {
    const patientParticipant = a.participant?.find((p: any) =>
      p.actor?.reference?.startsWith('Patient/'),
    );
    const patientId   = patientParticipant?.actor?.reference?.replace('Patient/', '');
    const patientName =
      (patientId && patientMap[patientId])
      ?? patientParticipant?.actor?.display
      ?? 'Unknown Patient';
    return {
      id:          a.id ?? '',
      patientId:   patientId ?? '',
      patientName,
      patientRef:  patientParticipant?.actor?.reference ?? '',
      time:        a.start ?? '',
      visitType:   a.serviceType?.[0]?.text ?? a.reasonCode?.[0]?.text ?? 'General Consultation',
      status:      a.status ?? 'booked',
    };
  });

  // Pad to at least 10
  const schedule = padQueue(rawSchedule, 10);

  // ── Orders ────────────────────────────────────────────────────────────────────
  const orders  = (orderQ.data  ?? []) as any[];
  const reports = (reportQ.data ?? []) as any[];
  const encounters = (encounterQ.data ?? []) as any[];
  const finishedToday = (seenQ.data ?? []) as any[];

  // ── Seen today ────────────────────────────────────────────────────────────────
  const rawSeenToday: SeenPatientRow[] = finishedToday.map((e: any) => {
    const patientId = e.subject?.reference?.replace('Patient/', '');
    return {
      id:          e.id ?? '',
      patientId:   patientId ?? '',
      patientName: (patientId && patientMap[patientId]) ?? e.subject?.display ?? 'Patient',
      timeSeen:    e.period?.end ?? e.period?.start ?? e.meta?.lastUpdated ?? '',
      reason:      e.reasonCode?.[0]?.text ?? e.type?.[0]?.text ?? 'Consultation',
      duration:    e.period?.start && e.period?.end
        ? Math.round((new Date(e.period.end).getTime() - new Date(e.period.start).getTime()) / 60000)
        : undefined,
    };
  });

  // Pad seen-today to at least 5
  const seenToday = padSeenToday(rawSeenToday, 5);

  // ── Other data ────────────────────────────────────────────────────────────────
  const recentEncounters: EncounterRow[] = encounters.map((e: any) => {
    const patientId = e.subject?.reference?.replace('Patient/', '');
    return {
      id:          e.id ?? '',
      patientId:   patientId ?? '',
      patientName: (patientId && patientMap[patientId]) ?? e.subject?.display ?? 'Patient',
      status:      e.status ?? 'unknown',
      start:       e.period?.start ?? '',
      reason:      e.reasonCode?.[0]?.text ?? e.type?.[0]?.text ?? 'Encounter',
    };
  });

  const pendingResults: PendingResult[] = reports.map((r: any) => ({
    id:          r.id ?? '',
    title:       r.code?.text ?? r.code?.coding?.[0]?.display ?? 'Diagnostic Report',
    patientName: r.subject?.display ?? 'Patient',
    issued:      r.issued ?? r.effectiveDateTime ?? '',
    status:      r.status ?? '',
  }));

  const pendingOrders = orders.map((o: any) => ({
    id:          o.id ?? '',
    title:       o.code?.text ?? o.code?.coding?.[0]?.display ?? 'Order',
    patientName: o.subject?.display ?? 'Patient',
    priority:    o.priority ?? 'routine',
  }));

  const activeCount = encounters.filter((e: any) =>
    ['in-progress', 'arrived', 'onleave'].includes(e.status),
  ).length;

  return {
    isLoading,
    data: {
      todayAppointments:   schedule.filter((r) => !r.isMock).length || schedule.length,
      pendingResultsCount: reports.length,
      activeEncounters:    activeCount,
      pendingOrdersCount:  orders.length,
      schedule,
      seenToday,
      recentEncounters,
      pendingResults,
      pendingOrders,
    },
  };
}
