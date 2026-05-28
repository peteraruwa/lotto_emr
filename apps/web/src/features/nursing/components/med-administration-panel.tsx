'use client';
import React, { useState } from 'react';
import { CheckCircle2, PauseCircle, XCircle, AlertTriangle, Stethoscope } from 'lucide-react';
import type { MedScheduleEntry } from '../types';
import { useAdministerMed } from '../hooks/use-administer-med';

interface MedAdminPanelProps {
  entry: MedScheduleEntry;
  onDone: () => void;
}

export function MedAdminPanel({ entry, onDone }: MedAdminPanelProps) {
  const [reason, setReason] = useState('');
  const [pendingAction, setPendingAction] = useState<'completed' | 'on-hold' | 'not-done' | null>(null);
  const { mutateAsync, isPending } = useAdministerMed();

  async function handleAction(action: 'completed' | 'on-hold' | 'not-done') {
    if ((action === 'on-hold' || action === 'not-done') && !reason.trim()) {
      setPendingAction(action);
      return;
    }
    await mutateAsync({
      requestId: entry.requestId,
      patientId: entry.patientId,
      drugName:  entry.drugName,
      dose:      entry.dose,
      route:     entry.route,
      action,
      reason: reason || undefined,
      scheduledTime: entry.scheduledTime.toISOString(),
    });
    onDone();
  }

  return (
    <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-3">
      {/* Safety checks */}
      {entry.allergies.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-700">
            Allergy: {entry.allergies.join(', ')} — Verify before administering
          </p>
        </div>
      )}
      {entry.requiresVitalsBefore && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
          <Stethoscope className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-700">{entry.requiresVitalsBefore}</p>
        </div>
      )}

      {/* Reason input (shown when Hold/Skip selected) */}
      {pendingAction && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-700">
            Reason for {pendingAction === 'on-hold' ? 'Hold' : 'Skip'} *
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Enter clinical reason..."
            autoFocus
            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(pendingAction)}
              disabled={!reason.trim() || isPending}
              className={`flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-colors ${
                pendingAction === 'on-hold' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isPending ? 'Saving...' : `Confirm ${pendingAction === 'on-hold' ? 'Hold' : 'Skip'}`}
            </button>
            <button onClick={() => { setPendingAction(null); setReason(''); }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons — only show if no pending action */}
      {!pendingAction && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleAction('completed')}
            disabled={isPending}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Administer</span>
          </button>
          <button
            onClick={() => setPendingAction('on-hold')}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            <PauseCircle className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Hold</span>
          </button>
          <button
            onClick={() => setPendingAction('not-done')}
            className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <XCircle className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Skip</span>
          </button>
        </div>
      )}
    </div>
  );
}
