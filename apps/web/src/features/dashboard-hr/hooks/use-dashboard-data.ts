'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, startOfDay, startOfMonth } from 'date-fns';

const DEPT_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/department';
const ROLE_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/system-role';

export interface HrDashboardData {
  totalEmployees: number;
  newHiresThisMonth: number;
  presentToday: number;
  departmentBreakdown: { department: string; count: number }[];
  roleBreakdown: { role: string; count: number }[];
  recentHires: {
    id: string;
    fullName: string;
    jobTitle: string;
    department: string;
    systemRole: string;
    hiredAt: string;
  }[];
}

export function useHrDashboardData() {
  const medplum = useMedplum();
  const today   = new Date();

  return useQuery({
    queryKey: ['dashboard-hr', format(today, 'yyyy-MM')],
    queryFn: async (): Promise<HrDashboardData> => {
      const [practitioners, todayPractitioners] = await Promise.all([
        medplum.searchResources('Practitioner', { _count: '200', _sort: '-_lastUpdated' }),
        medplum.searchResources('Practitioner', {
          _lastUpdated: `ge${startOfDay(today).toISOString()}`,
          _count: '50',
        }),
      ]);

      const monthStart = startOfMonth(today).toISOString();
      const newHires   = practitioners.filter((p: any) => (p.meta?.lastUpdated ?? '') >= monthStart);

      const deptMap: Record<string, number> = {};
      const roleMap: Record<string, number> = {};

      practitioners.forEach((p: any) => {
        const dept = p.extension?.find((e: any) => e.url === DEPT_EXT)?.valueString ?? 'Unassigned';
        const role = p.extension?.find((e: any) => e.url === ROLE_EXT)?.valueString ?? 'Unknown';
        deptMap[dept] = (deptMap[dept] ?? 0) + 1;
        roleMap[role] = (roleMap[role] ?? 0) + 1;
      });

      const recentHires = practitioners.slice(0, 8).map((p: any) => {
        const given  = p.name?.[0]?.given?.join(' ') ?? '';
        const family = p.name?.[0]?.family ?? '';
        return {
          id:         p.id ?? '',
          fullName:   `${given} ${family}`.trim() || 'Unknown',
          jobTitle:   p.qualification?.[0]?.code?.text ?? '—',
          department: p.extension?.find((e: any) => e.url === DEPT_EXT)?.valueString ?? '—',
          systemRole: p.extension?.find((e: any) => e.url === ROLE_EXT)?.valueString ?? '—',
          hiredAt:    p.meta?.lastUpdated ?? '',
        };
      });

      return {
        totalEmployees:     practitioners.length,
        newHiresThisMonth:  newHires.length,
        presentToday:       todayPractitioners.length,
        departmentBreakdown: Object.entries(deptMap)
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count),
        roleBreakdown: Object.entries(roleMap)
          .map(([role, count]) => ({ role, count }))
          .sort((a, b) => b.count - a.count),
        recentHires,
      };
    },
  });
}
