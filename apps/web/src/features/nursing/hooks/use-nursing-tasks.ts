'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Task } from '@medplum/fhirtypes';
import type { NursingTask } from '../types';

export function useNursingTasks() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  const query = useQuery<NursingTask[]>({
    queryKey: ['nursing-tasks'],
    staleTime: 30_000,
    queryFn: async () => {
      const tasks = await medplum.searchResources('Task', {
        status: 'requested,in-progress',
        _sort: 'priority,-authored-on',
        _count: '50',
      }) as Task[];

      return tasks.map((t): NursingTask => ({
        id: t.id ?? '',
        patientId: t.for?.reference?.replace('Patient/', '') ?? '',
        patientName: t.for?.display ?? 'Unknown Patient',
        ward: (t as any).location?.display ?? 'General Ward',
        description: t.description ?? t.code?.text ?? 'Nursing task',
        priority: (['routine','urgent','stat'].includes(t.priority ?? '') ? t.priority : 'routine') as NursingTask['priority'],
        dueAt: (t as any).restriction?.period?.end,
        status: (['requested','in-progress','completed'].includes(t.status ?? '') ? t.status : 'requested') as NursingTask['status'],
        category: t.code?.coding?.[0]?.display ?? t.code?.text ?? 'General',
      }));
    },
  });

  const complete = useMutation({
    mutationFn: async (taskId: string) => {
      const task = await medplum.readResource('Task', taskId) as Task;
      return medplum.updateResource({ ...task, status: 'completed' } as Task);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nursing-tasks'] }),
  });

  return { query, complete };
}
