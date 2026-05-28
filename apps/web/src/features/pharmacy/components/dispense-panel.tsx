'use client';
import React, { useState } from 'react';
import { CheckCircle2, Package } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import type { PharmacyPrescription } from '../types';
import { useDispenseMedication } from '../hooks/use-dispense-medication';

interface DispensePanelProps {
  rx: PharmacyPrescription;
  onDone: () => void;
}

export function DispensePanel({ rx, onDone }: DispensePanelProps) {
  const [quantity,    setQuantity]    = useState('1');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate,  setExpiryDate]  = useState('');
  const [notes,       setNotes]       = useState('');
  const [isPartial,   setIsPartial]   = useState(false);
  const [success,     setSuccess]     = useState(false);

  const { mutateAsync, isPending } = useDispenseMedication();

  async function handleDispense() {
    await mutateAsync({
      prescriptionId: rx.id,
      patientId:      rx.patientId,
      drugName:       rx.drugName,
      quantity:       Number(quantity),
      isPartial,
      batchNumber:    batchNumber || undefined,
      expiryDate:     expiryDate  || undefined,
      notes:          notes       || undefined,
      pharmacistId:   'pharmacist',
      pharmacistName: 'Pharmacist',
    });
    setSuccess(true);
    setTimeout(onDone, 1500);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
        <p className="text-sm font-bold text-green-700">Medication Dispensed</p>
        <p className="text-xs text-gray-500">{rx.drugName} — {quantity} unit(s)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
        <p className="text-sm font-bold text-indigo-900">{rx.drugName}</p>
        <p className="text-xs text-indigo-600">{rx.patientName} · {rx.dose} · {rx.route}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Quantity *</label>
          <input
            type="number" min="1" value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Batch No.</label>
          <input
            type="text" value={batchNumber}
            onChange={e => setBatchNumber(e.target.value)}
            placeholder="BN20250301"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Expiry Date</label>
          <input
            type="date" value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            id="partial" type="checkbox" checked={isPartial}
            onChange={e => setIsPartial(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <label htmlFor="partial" className="text-xs font-semibold text-gray-600">Partial Dispense</label>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Notes</label>
        <input
          type="text" value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional dispensing notes"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      {rx.isControlled && (
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
          <p className="text-xs font-bold text-purple-700">⚠ Controlled Drug — double verification required</p>
          <p className="text-[11px] text-purple-600 mt-1">Both dispensing pharmacist and witness signatures required.</p>
        </div>
      )}

      <button
        onClick={handleDispense}
        disabled={isPending || !quantity || Number(quantity) < 1}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <Package className="h-4 w-4" />
        {isPending ? 'Dispensing...' : `Confirm Dispense (${quantity} unit${Number(quantity) !== 1 ? 's' : ''})`}
      </button>
    </div>
  );
}
