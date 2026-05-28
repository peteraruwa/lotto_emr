'use client';
import React from 'react';
import { CheckCircle2, Clock, ClipboardList } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@lotto-emr/ui';
import { useNursingTasks } from '../hooks/use-nursing-tasks';

const PRIORITY_STYLES: Record<string, string> = {
  stat:    'bg-red-100 text-red-700 border-l-red-500',
  urgent:  'bg-amber-50 text-amber-700 border-l-amber-500',
  routine: 'bg-white text-gray-700 border-l-gray-200',
};

function fmtDue(iso?: string) {
  if (!iso) return null;
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'HH:mm') : null;
  } catch { return null; }
}

export function TasksTab() {
  const { query, complete } = useNursingTasks();
  const { data: tasks = [], isLoading } = query;

  if (isLoading) {
    return <div className="flex justify-center py-16"><ClipboardList className="h-8 w-8 text-gray-200 animate-pulse" /></div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">No pending tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const dueLabel = fmtDue(task.dueAt);
        return (
          <div
            key={task.id}
            className={cn(
              'rounded-xl border border-gray-100 border-l-4 p-3 flex items-start justify-between gap-3',
              PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.routine
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {task.priority === 'stat'   && <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">STAT</span>}
                {task.priority === 'urgent' && <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">URGENT</span>}
                <p className="text-sm font-semibold text-gray-800 truncate">{task.description}</p>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-xs text-gray-500">{task.patientName}</p>
                {task.ward && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{task.ward}</span>}
                {task.category && <span className="text-[10px] text-gray-400">{task.category}</span>}
                {dueLabel && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
                    <Clock className="h-3 w-3" /> Due {dueLabel}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => complete.mutate(task.id)}
              disabled={complete.isPending}
              className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </button>
          </div>
        );
      })}
    </div>
  );
}
