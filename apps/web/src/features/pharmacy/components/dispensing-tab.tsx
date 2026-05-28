'use client';
import React, { useState } from 'react';
import { Package, CheckCircle2 } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { PharmacyPrescription } from '../types';
import { PrescriptionStatusChip } from './prescription-status-chip';
import { DispensePanel } from './dispense-panel';

interface DispensingTabProps {
  prescriptions: PharmacyPrescription[];
}

export function DispensingTab({ prescriptions }: DispensingTabProps) {
  const [dispensing, setDispensing] = useState<string | null>(null);

  const readyToDispense = prescriptions.filter(rx =>
    ['verified', 'safety-cleared', 'dispensing'].includes(rx.pharmacyStatus)
  );

  if (readyToDispense.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 className="h-10 w-10 text-gray-200 mb-3" />
        <p className="text-sm font-medium text-gray-400">No prescriptions ready to dispense</p>
        <p className="text-xs text-gray-300 mt-1">Verified prescriptions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {readyToDispense.map(rx => (
        <div key={rx.id} className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <div className="p-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {rx.priority === 'stat' && <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">STAT</span>}
                {rx.isControlled && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">CONTROLLED</span>}
                <PrescriptionStatusChip status={rx.pharmacyStatus} />
              </div>
              <p className="text-sm font-bold text-gray-900">{rx.drugName} <span className="font-normal text-gray-500 text-xs">— {rx.dose}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{rx.patientName} · Bed {rx.bed ?? '—'} · {rx.route}</p>
            </div>
            <button
              onClick={() => setDispensing(dispensing === rx.id ? null : rx.id)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors',
                dispensing === rx.id
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              )}
            >
              <Package className="h-3.5 w-3.5" />
              {dispensing === rx.id ? 'Close' : 'Dispense'}
            </button>
          </div>

          {dispensing === rx.id && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <DispensePanel rx={rx} onDone={() => setDispensing(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
