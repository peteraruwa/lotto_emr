'use client';
import React, { useState } from 'react';
import { Search, Pill, AlertTriangle, ChevronRight, Shield, Zap } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@lotto-emr/ui';
import type { PharmacyPrescription } from '../types';
import { PrescriptionStatusChip } from './prescription-status-chip';
import { SafetyFlagsDisplay } from './safety-flags-display';

type FilterTab = 'all' | 'pending' | 'stat' | 'controlled' | 'high-alert' | 'completed';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',        label: 'All'        },
  { id: 'pending',    label: 'Pending'    },
  { id: 'stat',       label: 'STAT'       },
  { id: 'controlled', label: 'Controlled' },
  { id: 'high-alert', label: 'High Alert' },
  { id: 'completed',  label: 'Completed'  },
];

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try { const d = parseISO(iso); return isValid(d) ? format(d, 'dd/MM HH:mm') : '—'; } catch { return '—'; }
}

interface WorkQueueTabProps {
  prescriptions: PharmacyPrescription[];
  selectedId?: string;
  onSelect: (rx: PharmacyPrescription) => void;
}

export function WorkQueueTab({ prescriptions, selectedId, onSelect }: WorkQueueTabProps) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = prescriptions.filter(rx => {
    const q = search.toLowerCase();
    if (q && !rx.patientName.toLowerCase().includes(q) && !rx.drugName.toLowerCase().includes(q)) return false;
    if (filter === 'pending')    return ['pending', 'under-review'].includes(rx.pharmacyStatus);
    if (filter === 'stat')       return rx.priority === 'stat';
    if (filter === 'controlled') return rx.isControlled;
    if (filter === 'high-alert') return rx.isHighAlert;
    if (filter === 'completed')  return ['dispensed', 'rejected'].includes(rx.pharmacyStatus);
    return !['dispensed', 'rejected'].includes(rx.pharmacyStatus);
  });

  const pendingCount = prescriptions.filter(r => ['pending', 'under-review'].includes(r.pharmacyStatus)).length;
  const statCount    = prescriptions.filter(r => r.priority === 'stat' && !['dispensed', 'rejected'].includes(r.pharmacyStatus)).length;

  return (
    <div className="h-full flex flex-col">
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search patient or drug..."
          className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3">
        {FILTER_TABS.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors',
              filter === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            {t.label}
            {t.id === 'pending' && pendingCount > 0 && <span className="ml-1 opacity-75">({pendingCount})</span>}
            {t.id === 'stat'    && statCount    > 0 && <span className="ml-1 bg-red-500 rounded-full px-1 text-white text-[9px]">{statCount}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Pill className="h-10 w-10 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">No prescriptions found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filtered.map(rx => {
            const hasCritical = rx.safetyFlags.some(f => f.severity === 'critical');
            const hasHigh     = rx.safetyFlags.some(f => f.severity === 'high');
            const isSelected  = rx.id === selectedId;
            return (
              <button key={rx.id} type="button" onClick={() => onSelect(rx)}
                className={cn('w-full text-left rounded-xl border p-3 transition-all',
                  isSelected ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {rx.priority === 'stat'   && <span className="flex items-center gap-0.5 text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full"><Zap className="h-2.5 w-2.5" /> STAT</span>}
                      {rx.priority === 'urgent' && <span className="text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full">URGENT</span>}
                      {rx.isControlled && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">CONTROLLED</span>}
                      {rx.isHighAlert  && <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full"><Shield className="h-2.5 w-2.5" /> HIGH ALERT</span>}
                      <PrescriptionStatusChip status={rx.pharmacyStatus} />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{rx.drugName} <span className="font-normal text-gray-500 text-xs">{rx.dose}</span></p>
                    <p className="text-xs text-gray-600 mt-0.5">{rx.patientName} · Bed {rx.bed ?? '—'} · {rx.ward ?? '—'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{rx.prescriberName} · {fmtDate(rx.authoredOn)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {hasCritical && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {!hasCritical && hasHigh && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                  </div>
                </div>
                {rx.safetyFlags.length > 0 && (
                  <div className="mt-2"><SafetyFlagsDisplay flags={rx.safetyFlags.slice(0, 1)} compact /></div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
