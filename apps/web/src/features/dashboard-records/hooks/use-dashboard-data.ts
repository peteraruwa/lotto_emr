'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, startOfDay } from 'date-fns';

export interface RecordsDashboardData {
  totalPatients: number;
  newPatientsToday: number;
  totalDocuments: number;
  documentsToday: number;
  recentDocuments: {
    id: string;
    title: string;
    patientName: string;
    patientId: string;
    docStatus: string;
    date: string;
  }[];
  recentPatients: {
    id: string;
    fullName: string;
    mrn: string;
    gender: string;
    registeredAt: string;
  }[];
}

export function useRecordsDashboardData() {
  const medplum = useMedplum();
  const today   = new Date();

  return useQuery({
    queryKey: ['dashboard-records', format(today, 'yyyy-MM-dd')],
    queryFn: async (): Promise<RecordsDashboardData> => {
      const todayStr = startOfDay(today).toISOString();

      const [patients, todayPatients, documents, todayDocuments] = await Promise.all([
        medplum.searchResources('Patient', { active: 'true', _count: '1', _summary: 'count' }),
        medplum.searchResources('Patient', { _lastUpdated: `ge${todayStr}`, _count: '20', _sort: '-_lastUpdated' }),
        medplum.searchResources('DocumentReference', { status: 'current', _count: '1', _summary: 'count' }),
        medplum.searchResources('DocumentReference', { _lastUpdated: `ge${todayStr}`, _count: '20', _sort: '-_lastUpdated' }),
      ]);

      const recentDocuments = await Promise.all(
        todayDocuments.slice(0, 8).map(async (doc: any) => {
          const patientRef = doc.subject?.reference ?? '';
          const patientId  = patientRef.replace('Patient/', '');
          let patientName  = 'Unknown Patient';

          if (patientId) {
            try {
              const pt = await medplum.readResource('Patient', patientId);
              const given  = (pt as any).name?.[0]?.given?.join(' ') ?? '';
              const family = (pt as any).name?.[0]?.family ?? '';
              patientName = `${given} ${family}`.trim() || patientName;
            } catch {
              // patient fetch failed — keep default
            }
          }

          return {
            id:          doc.id ?? '',
            title:       doc.type?.text ?? doc.type?.coding?.[0]?.display ?? 'Document',
            patientName,
            patientId,
            docStatus:   doc.docStatus ?? doc.status ?? 'unknown',
            date:        doc.date ?? doc.meta?.lastUpdated ?? '',
          };
        }),
      );

      const recentPatients = todayPatients.slice(0, 6).map((p: any) => {
        const identifier = p.identifier?.find((id: any) => id.system?.includes('mrn'));
        const given  = p.name?.[0]?.given?.join(' ') ?? '';
        const family = p.name?.[0]?.family ?? '';
        return {
          id:           p.id ?? '',
          fullName:     `${given} ${family}`.trim() || 'Unknown',
          mrn:          identifier?.value ?? '—',
          gender:       p.gender ?? 'unknown',
          registeredAt: p.meta?.lastUpdated ?? '',
        };
      });

      return {
        totalPatients:    (patients as any)?.total ?? patients.length,
        newPatientsToday: todayPatients.length,
        totalDocuments:   (documents as any)?.total ?? documents.length,
        documentsToday:   todayDocuments.length,
        recentDocuments,
        recentPatients,
      };
    },
  });
}
