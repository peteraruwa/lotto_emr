'use client';

import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import { format, startOfDay } from 'date-fns';

const DEPT_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/department';
const ROLE_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/system-role';

export interface SuperadminDashboardData {
  totalEmployees: number;
  newHiresThisMonth: number;
  totalPatients: number;
  todayRegistrations: number;
  departmentBreakdown: { department: string; count: number }[];
  roleBreakdown: { role: string; count: number }[];
  recentHires: { id: string; fullName: string; jobTitle: string; department: string; systemRole: string; hiredAt: string }[];
}

export function useSuperadminDashboardData() {
  const medplum = useMedplum();
  const today   = new Date();

  return useQuery({
    queryKey: ['dashboard-superadmin', format(today, 'yyyy-MM')],
    queryFn: async (): Promise<SuperadminDashboardData> => {
      const [practitioners, totalPatients, todayPatients] = await Promise.all([
        medplum.searchResources('Practitioner', { _count: '200', _sort: '-_lastUpdated' }),
        medplum.searchResources('Patient', { active: 'true', _count: '1' }),
        medplum.searchResources('Patient', {
          _lastUpdated: `ge${startOfDay(today).toISOString()}`,
          _count: '1',
        }),
      ]);

      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const newHires   = practitioners.filter((p: any) => (p.meta?.lastUpdated ?? '') >= monthStart);

      const deptMap: Record<string, number> = {};
      const roleMap: Record<string, number> = {};

      practitioners.forEach((p: any) => {
        const dept = p.extension?.find((e: any) => e.url === DEPT_EXT)?.valueString ?? 'Unknown';
        const role = p.extension?.find((e: any) => e.url === ROLE_EXT)?.valueString ?? 'Unknown';
        deptMap[dept] = (deptMap[dept] ?? 0) + 1;
        roleMap[role] = (roleMap[role] ?? 0) + 1;
      });

      const recentHires = practitioners.slice(0, 6).map((p: any) => {
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
        totalPatients:      totalPatients.length,
        todayRegistrations: todayPatients.length,
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
