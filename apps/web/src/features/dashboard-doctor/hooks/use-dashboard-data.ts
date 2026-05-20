'use client';

import { useQueries } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { formatPatientName } from '@lotto-emr/core';
import type { Patient } from '@medplum/fhirtypes';

export interface AppointmentRow {
  id: string;
  patientName: string;
  patientRef: string;
  time: string;
  visitType: string;
  status: string;
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
  recentEncounters:   EncounterRow[];
  pendingResults:     PendingResult[];
  pendingOrders:      { id: string; title: string; patientName: string; priority: string }[];
}

export function useDoctorDashboardData(): { data: DoctorDashboardData | null; isLoading: boolean } {
  const medplum = useMedplum();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [apptQ, orderQ, reportQ, encounterQ] = useQueries({
    queries: [
      {
        queryKey: ['doctor-dash', 'appointments', todayStr],
        // Use search() (returns Bundle) so _include brings patient names in one request
        queryFn: async () => {
          const bundle = await medplum.search('Appointment', {
            date:      `ge${todayStr}`,
            _sort:     'date',
            _count:    '20',
            _include:  'Appointment:patient',
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
    ],
  });

  const isLoading = apptQ.isLoading || orderQ.isLoading || reportQ.isLoading || encounterQ.isLoading;
  if (isLoading) return { data: null, isLoading };

  // Extract appointments and included patients from the bundle
  const apptBundle  = apptQ.data as any;
  const entries     = (apptBundle?.entry ?? []) as any[];
  const appointments = entries.filter((e) => e.resource?.resourceType === 'Appointment').map((e) => e.resource);
  const patientMap: Record<string, string> = {};
  entries
    .filter((e) => e.resource?.resourceType === 'Patient')
    .forEach((e) => {
      const p = e.resource as Patient;
      if (p.id) patientMap[p.id] = formatPatientName(p.name);
    });

  const orders     = (orderQ.data   ?? []) as any[];
  const reports    = (reportQ.data  ?? []) as any[];
  const encounters = (encounterQ.data ?? []) as any[];

  const schedule: AppointmentRow[] = appointments.map((a: any) => {
    const patientParticipant = a.participant?.find((p: any) =>
      p.actor?.reference?.startsWith('Patient/'),
    );
    const patientId  = patientParticipant?.actor?.reference?.replace('Patient/', '');
    const patientName =
      (patientId && patientMap[patientId])          // from _include
      ?? patientParticipant?.actor?.display         // inline display (if set)
      ?? 'Unknown Patient';

    return {
      id:          a.id ?? '',
      patientName,
      patientRef:  patientParticipant?.actor?.reference ?? '',
      time:        a.start ?? '',
      visitType:   a.serviceType?.[0]?.text ?? a.reasonCode?.[0]?.text ?? 'General Consultation',
      status:      a.status ?? 'booked',
    };
  });

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
      todayAppointments:   schedule.length,
      pendingResultsCount: reports.length,
      activeEncounters:    activeCount,
      pendingOrdersCount:  orders.length,
      schedule,
      recentEncounters,
      pendingResults,
      pendingOrders,
    },
  };
}
