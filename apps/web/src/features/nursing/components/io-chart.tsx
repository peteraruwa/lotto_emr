'use client';
import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@lotto-emr/ui';
import type { NursingPatient, IOSubtype } from '../types';
import { useIOChart } from '../hooks/use-io-chart';
import { IO_SUBTYPE_LABELS } from '../constants';

interface IOChartProps {
  patients: NursingPatient[];
  defaultPatientId?: string;
}

const INTAKE_TYPES: IOSubtype[] = ['oral', 'iv_fluid', 'ng_feed'];
const OUTPUT_TYPES: IOSubtype[] = ['urine', 'drain', 'emesis'];

function balanceColor(balance: number) {
  if (balance > 500)  return 'text-blue-700';
  if (balance < -200) return 'text-red-700';
  return 'text-green-700';
}

export function IOChart({ patients, defaultPatientId }: IOChartProps) {
  const [patientId, setPatientId] = useState(defaultPatientId ?? patients[0]?.patientId ?? '');
  const [subtype,   setSubtype]   = useState<IOSubtype>('oral');
  const [amount,    setAmount]    = useState('');
  const [note,      setNote]      = useState('');

  const patient = patients.find(p => p.patientId === patientId);
  const { query, add } = useIOChart(patientId);
  const { data: summary } = query;

  async function handleAdd() {
    if (!amount || Number(amount) <= 0 || !patient?.encounterId) return;
    await add.mutateAsync({ subtype, amount: Number(amount), note: note || undefined, encounterId: patient.encounterId });
    setAmount('');
    setNote('');
  }

  return (
    <div className="space-y-4">
      {/* Patient selector */}
      <div className="relative">
        <select
          value={patientId}
          onChange={e => setPatientId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 pr-8 text-sm font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-hospital-400"
        >
          {patients.map(p => (
            <option key={p.patientId} value={p.patientId}>
              {p.patientName} — Bed {p.bed}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Balance summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
            <p className="text-[10px] font-bold text-blue-500 uppercase">Intake</p>
            <p className="text-base font-bold text-blue-800">{summary.totalIntake} mL</p>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase">Output</p>
            <p className="text-base font-bold text-red-800">{summary.totalOutput} mL</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Balance</p>
            <p className={cn('text-base font-bold', balanceColor(summary.balance))}>
              {summary.balance >= 0 ? '+' : ''}{summary.balance} mL
            </p>
          </div>
        </div>
      )}

      {/* Add entry */}
      <div className="rounded-xl border border-gray-100 p-3 space-y-3 bg-white">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Add Entry</p>

        {/* Type selector: intake/output grouped */}
        <div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1.5">Intake</p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {INTAKE_TYPES.map(t => (
              <button key={t} onClick={() => setSubtype(t)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors', subtype === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-200')}>
                {IO_SUBTYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1.5">Output</p>
          <div className="flex gap-1.5 flex-wrap">
            {OUTPUT_TYPES.map(t => (
              <button key={t} onClick={() => setSubtype(t)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors', subtype === t ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-200')}>
                {IO_SUBTYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[11px] text-gray-500 font-semibold">Amount (mL)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 250"
              inputMode="numeric"
              className="mt-0.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-hospital-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-gray-500 font-semibold">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Colour, clarity..."
              className="mt-0.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-hospital-400"
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={add.isPending || !amount || Number(amount) <= 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-hospital-600 text-white text-sm font-bold hover:bg-hospital-700 disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {add.isPending ? 'Adding...' : `Add ${IO_SUBTYPE_LABELS[subtype]}`}
        </button>
      </div>

      {/* Entry list */}
      {(summary?.entries ?? []).length > 0 && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-3 py-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Today's Entries</p>
          </div>
          <div className="divide-y divide-gray-50">
            {summary!.entries.map(entry => (
              <div key={entry.id} className="px-3 py-2.5 flex items-center justify-between">
                <div>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase mr-2',
                    entry.type === 'intake' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>
                    {entry.type}
                  </span>
                  <span className="text-xs font-medium text-gray-700">{IO_SUBTYPE_LABELS[entry.subtype]}</span>
                  {entry.note && <span className="text-xs text-gray-400 ml-2">· {entry.note}</span>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-gray-700">{entry.amount} mL</p>
                  <p className="text-[10px] text-gray-400">
                    {entry.recordedAt ? format(parseISO(entry.recordedAt), 'HH:mm') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
