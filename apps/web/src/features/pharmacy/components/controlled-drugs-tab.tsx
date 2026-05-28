'use client';
import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { PharmacyPrescription } from '../types';
import { PrescriptionStatusChip } from './prescription-status-chip';
import { useUpdatePrescription } from '../hooks/use-update-prescription';
import { SafetyFlagsDisplay } from './safety-flags-display';

interface ControlledDrugsTabProps {
  prescriptions: PharmacyPrescription[];
}

export function ControlledDrugsTab({ prescriptions }: ControlledDrugsTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [witnessName, setWitnessName] = useState('');
  const [justification, setJustification] = useState('');
  const { mutateAsync, isPending } = useUpdatePrescription();

  const controlled = prescriptions.filter(rx => rx.isControlled);

  if (controlled.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Lock className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">No controlled drug requests</p>
      </div>
    );
  }

  async function handleApprove(rx: PharmacyPrescription) {
    if (!witnessName.trim() || !justification.trim()) return;
    await mutateAsync({
      prescriptionId: rx.id,
      newStatus: 'verified',
      reason: `Controlled drug approved. Witness: ${witnessName}. ${justification}`,
      pharmacistName: 'Pharmacist',
      pharmacistId: 'pharmacist',
      details: `Witness: ${witnessName}`,
    });
    setSelectedId(null);
    setWitnessName('');
    setJustification('');
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
        <p className="text-xs font-bold text-purple-700">Controlled Drug Protocol</p>
        <p className="text-[11px] text-purple-600 mt-1">All controlled drug requests require double verification. A witness pharmacist must be present for dispensing.</p>
      </div>

      {controlled.map(rx => {
        const isOpen = selectedId === rx.id;
        const pending = ['pending','under-review'].includes(rx.pharmacyStatus);
        return (
          <div key={rx.id} className="rounded-xl border border-purple-200 bg-white overflow-hidden">
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Lock className="h-3.5 w-3.5 text-purple-600" />
                    {rx.priority === 'stat' && <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">STAT</span>}
                    <PrescriptionStatusChip status={rx.pharmacyStatus} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{rx.drugName} — {rx.dose}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{rx.patientName} · {rx.prescriberName}</p>
                </div>
                {pending && (
                  <button
                    onClick={() => setSelectedId(isOpen ? null : rx.id)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0',
                      isOpen ? 'bg-gray-200 text-gray-700' : 'bg-purple-600 text-white hover:bg-purple-700')}>
                    {isOpen ? 'Close' : 'Review'}
                  </button>
                )}
              </div>

              {rx.safetyFlags.length > 0 && (
                <div className="mt-2">
                  <SafetyFlagsDisplay flags={rx.safetyFlags.slice(0, 1)} compact />
                </div>
              )}
            </div>

            {isOpen && pending && (
              <div className="border-t border-purple-100 p-4 bg-purple-50 space-y-3">
                <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">Double Verification Required</p>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Witness Pharmacist Name *</label>
                  <input
                    type="text"
                    value={witnessName}
                    onChange={e => setWitnessName(e.target.value)}
                    placeholder="Full name of witness pharmacist"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Clinical Justification *</label>
                  <textarea
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    rows={2}
                    placeholder="Clinical reason for controlled drug use..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(rx)}
                    disabled={!witnessName.trim() || !justification.trim() || isPending}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {isPending ? 'Verifying...' : 'Approve (Double-Verified)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
