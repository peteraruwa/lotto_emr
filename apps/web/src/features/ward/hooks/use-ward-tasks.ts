'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { Task } from '@medplum/fhirtypes';
import { differenceInMinutes, parseISO } from 'date-fns';
import type { WardTask, TaskType, TaskPriority, TaskStatus } from '../types';

const PRIORITY_VALUES = ['routine', 'urgent', 'stat'] as const;

function parseTask(task: Task): WardTask {
  const dueAt =
    task.executionPeriod?.start ??
    task.authoredOn ??
    new Date().toISOString();

  let minutesUntilDue = 0;
  try {
    minutesUntilDue = differenceInMinutes(parseISO(dueAt), new Date());
  } catch {
    minutesUntilDue = 0;
  }

  let taskStatus: TaskStatus;
  if (task.status === 'completed') taskStatus = 'completed';
  else if (task.status === 'in-progress') taskStatus = 'in-progress';
  else if (minutesUntilDue < -15) taskStatus = 'overdue';
  else if (minutesUntilDue <= 30) taskStatus = 'due';
  else taskStatus = 'upcoming';

  // Parse metadata from note (ward/bedNumber/patientName stashed there)
  let meta: { ward?: string; bedNumber?: string; patientName?: string } = {};
  try {
    meta = JSON.parse(task.note?.[0]?.text ?? '{}');
  } catch {
    meta = {};
  }

  const priority = (PRIORITY_VALUES as readonly string[]).includes(task.priority ?? '')
    ? (task.priority as TaskPriority)
    : 'routine';

  return {
    id: task.id ?? '',
    patientId: task.for?.reference?.replace('Patient/', '') ?? '',
    patientName: task.for?.display ?? meta.patientName ?? 'Unknown Patient',
    ward: meta.ward ?? '',
    bedNumber: meta.bedNumber ?? '',
    type: (task.code?.coding?.[0]?.code as TaskType) ?? 'other',
    description: task.description ?? task.code?.text ?? 'Nursing task',
    priority,
    dueAt,
    status: taskStatus,
    assignedTo: task.owner?.display,
    completedAt: task.executionPeriod?.end,
    minutesUntilDue,
  };
}

export function useWardTasks(patientIds?: string[]) {
  const medplum = useMedplum();

  return useQuery<WardTask[]>({
    queryKey: ['ward-tasks', patientIds?.join(',') ?? 'all'],
    staleTime: 30_000,
    queryFn: async () => {
      const tasks = (await medplum.searchResources('Task', {
        status: 'requested,in-progress,accepted',
        _sort: '-_lastUpdated',
        _count: '200',
      })) as Task[];

      const parsed = tasks.map(parseTask);
      const filtered = patientIds && patientIds.length > 0
        ? parsed.filter(t => patientIds.includes(t.patientId))
        : parsed;

      return filtered.sort((a, b) => a.minutesUntilDue - b.minutesUntilDue);
    },
  });
}

export interface CreateWardTaskInput {
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  type: TaskType;
  description: string;
  priority: TaskPriority;
  dueAt: string;
  assignedTo?: string;
}

export function useCreateWardTask() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWardTaskInput) => {
      const task: Task = {
        resourceType: 'Task',
        status: 'requested',
        intent: 'order',
        priority: input.priority,
        code: { coding: [{ code: input.type }], text: input.description },
        description: input.description,
        for: { reference: `Patient/${input.patientId}`, display: input.patientName },
        executionPeriod: { start: input.dueAt },
        note: [{
          text: JSON.stringify({
            ward: input.ward,
            bedNumber: input.bedNumber,
            patientName: input.patientName,
          }),
        }],
        ...(input.assignedTo ? { owner: { display: input.assignedTo } } : {}),
      };
      return medplum.createResource(task);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ward-tasks'] });
      qc.invalidateQueries({ queryKey: ['nursing-tasks'] });
    },
  });
}

export function useCompleteWardTask() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const task = (await medplum.readResource('Task', taskId)) as Task;
      const next: Task = {
        ...task,
        status: 'completed',
        executionPeriod: {
          ...(task.executionPeriod ?? {}),
          end: new Date().toISOString(),
        },
        ...(notes
          ? { output: [{ type: { text: 'note' }, valueString: notes } as any] }
          : {}),
      };
      return medplum.updateResource(next);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ward-tasks'] });
      qc.invalidateQueries({ queryKey: ['nursing-tasks'] });
    },
  });
}

export function useReassignWardTask() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, assignedTo }: { taskId: string; assignedTo: string }) => {
      const task = (await medplum.readResource('Task', taskId)) as Task;
      const next: Task = {
        ...task,
        owner: { display: assignedTo },
      };
      return medplum.updateResource(next);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ward-tasks'] }),
  });
}
