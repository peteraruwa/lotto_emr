'use client';
import React, { useState } from 'react';
import {
  CheckCircle2, XCircle, PauseCircle, MessageSquare, X,
  User, Pill, AlertTriangle, Shield, ClipboardList, ChevronDown,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@lotto-emr/ui';
import type { PharmacyPrescription, PharmacyStatus } from '../types';
import { SafetyFlagsDisplay } from './safety-flags-display';
import { PrescriptionStatusChip } from './prescription-status-chip';
import { useUpdatePrescription } from '../hooks/use-update-prescription';

// Inline route labels
const ROUTE_MAP: Record<string, string> = {
  PO: 'Oral', IV: 'IV', IM: 'IM', SC: 'SC', SL: 'Sublingual',
  TOP: 'Topical', INH: 'Inhalation', PR: 'Rectal', NGT: 'Nasogastric',
};

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { const d = parseISO(iso); return isValid(d) ? format(d, 'dd MMM yyyy HH:mm') : '—'; } catch { return '—'; }
}

const ACTIONS: { id: PharmacyStatus; label: string; color: string; requiresReason: boolean; condition: (s: PharmacyStatus) => boolean }[] = [
  { id: 'verified',       label: 'Verify',            color: 'bg-teal-600 hover:bg-teal-700',   requiresReason: false, condition: s => ['pending','under-review'].includes(s) },
  { id: 'safety-cleared', label: 'Safety Override',   color: 'bg-green-600 hover:bg-green-700', requiresReason: true,  condition: s => s === 'verified' },
  { id: 'dispensing',     label: 'Send to Dispensing',color: 'bg-indigo-600 hover:bg-indigo-700',requiresReason: false, condition: s => ['verified','safety-cleared'].includes(s) },
  { id: 'on-hold',        label: 'Put on Hold',       color: 'bg-amber-500 hover:bg-amber-600', requiresReason: true,  condition: s => !['dispensed','rejected','on-hold'].includes(s) },
  { id: 'rejected',       label: 'Reject',            color: 'bg-red-600 hover:bg-red-700',     requiresReason: true,  condition: s => !['dispensed','rejected'].includes(s) },
];

interface PrescriptionDetailPanelProps {
  rx: PharmacyPrescription;
  onClose: () => void;
  onDispense: (rx: PharmacyPrescription) => void;
}

export function PrescriptionDetailPanel({ rx, onClose, onDispense }: PrescriptionDetailPanelProps) {
  const [pendingAction, setPendingAction] = useState<PharmacyStatus | null>(null);
  const [reason, setReason] = useState('');
  const { mutateAsync, isPending } = useUpdatePrescription();

  const availableActions = ACTIONS.filter(a => a.condition(rx.pharmacyStatus));
  const hasCritical = rx.safetyFlags.some(f => f.severity === 'critical');

  async function handleAction(actionId: PharmacyStatus, actionRequiresReason: boolean) {
    if (actionRequiresReason && !reason.trim()) {
      setPendingAction(actionId);
      return;
    }
    await mutateAsync({
      prescriptionId: rx.id,
      newStatus: actionId,
      reason: reason || undefined,
      pharmacistName: 'Pharmacist', // In real app: from useMedplumProfile()
      pharmacistId: 'pharmacist',
    });
    setPendingAction(null);
    setReason('');
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-100">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h2 className="text-sm font-black text-gray-900">{rx.drugName}</h2>
          <p className="text-xs text-gray-500">{rx.patientName} · MRN {rx.mrn}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Status + Priority row */}
        <div className="flex items-center gap-2 flex-wrap">
          <PrescriptionStatusChip status={rx.pharmacyStatus} />
          {rx.priority === 'stat' && <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">STAT</span>}
          {rx.isControlled && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">CONTROLLED DRUG</span>}
          {rx.isHighAlert  && (
            <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              <Shield className="h-2.5 w-2.5" /> HIGH ALERT
            </span>
          )}
        </div>

        {/* Prescription info */}
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
          {[
            ['Drug',       rx.drugName],
            ['Dose',       rx.dose],
            ['Route',      ROUTE_MAP[rx.route.toUpperCase()] ?? rx.route],
            ['Frequency',  rx.timingCode],
            ['Prescriber', rx.prescriberName],
            ['Ordered',    fmtDate(rx.authoredOn)],
            ['Ward / Bed', `${rx.ward ?? '—'} / Bed ${rx.bed ?? '—'}`],
            ['Patient Age',`${rx.patientAge} yrs`],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between px-3 py-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
              <span className="text-xs font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>

        {/* Allergies */}
        {rx.allergies.length > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-xs font-bold text-red-700">Known Allergies</p>
            </div>
            <p className="text-xs text-red-700">{rx.allergies.join(', ')}</p>
          </div>
        )}

        {/* Safety flags */}
        <div>
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide mb-2">Safety Review</p>
          <SafetyFlagsDisplay flags={rx.safetyFlags} />
        </div>

        {/* Rejection / hold reason */}
        {rx.rejectionReason && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-1">Rejection Reason</p>
            <p className="text-xs text-red-700">{rx.rejectionReason}</p>
          </div>
        )}
        {rx.holdReason && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide mb-1">Hold Reason</p>
            <p className="text-xs text-amber-700">{rx.holdReason}</p>
          </div>
        )}

        {/* Clarification request */}
        {rx.clarificationRequest && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide mb-1">Clarification Request</p>
            <p className="text-xs text-blue-700">{rx.clarificationRequest}</p>
          </div>
        )}

        {/* Reason input */}
        {pendingAction && (
          <div className="rounded-xl border border-gray-200 p-3 space-y-2 bg-gray-50">
            <p className="text-xs font-bold text-gray-700">
              Reason for {pendingAction === 'rejected' ? 'Rejection' : pendingAction === 'on-hold' ? 'Hold' : 'Override'} *
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              autoFocus
              placeholder="Enter clinical reason..."
              className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(pendingAction, true)}
                disabled={!reason.trim() || isPending}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => { setPendingAction(null); setReason(''); }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!['dispensed','rejected'].includes(rx.pharmacyStatus) && (
          <div className="space-y-2">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Actions</p>

            {/* Critical safety block */}
            {hasCritical && rx.pharmacyStatus !== 'rejected' && (
              <div className="rounded-xl bg-red-50 border border-red-300 p-3">
                <p className="text-xs font-bold text-red-700">⚠ Critical safety flag — verify with prescriber before proceeding</p>
              </div>
            )}

            {/* Dispense button */}
            {['dispensing'].includes(rx.pharmacyStatus) && (
              <button
                onClick={() => onDispense(rx)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
              >
                <Pill className="h-4 w-4" />
                Dispense Medication
              </button>
            )}

            {availableActions.map(action => (
              <button
                key={action.id}
                onClick={() => {
                  if (action.requiresReason) { setPendingAction(action.id); }
                  else { handleAction(action.id, false); }
                }}
                disabled={isPending || pendingAction !== null}
                className={cn(
                  'w-full py-2.5 rounded-xl text-white text-xs font-bold transition-colors disabled:opacity-50',
                  action.color
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Audit trail */}
        {rx.auditLog.length > 0 && (
          <div>
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-wide mb-2">Audit Trail</p>
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {rx.auditLog.slice(-5).reverse().map(entry => (
                <div key={entry.id} className="px-3 py-2">
                  <div className="flex justify-between">
                    <span className="text-[11px] font-bold text-gray-700 capitalize">{entry.action}</span>
                    <span className="text-[10px] text-gray-400">
                      {format(parseISO(entry.at), 'dd/MM HH:mm')}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">{entry.pharmacistName}</p>
                  {entry.reason && <p className="text-[10px] text-gray-400 italic">{entry.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
