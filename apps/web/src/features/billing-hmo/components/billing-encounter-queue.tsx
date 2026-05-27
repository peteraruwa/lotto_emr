'use client';

import React, { useState } from 'react';
import { Clock, Search, AlertTriangle, Building2, DollarSign, RefreshCw } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { BillingStatusChip } from './billing-status-chip';
import { useBillingQueue } from '../hooks/use-billing-queue';
import type { FullBillingItem } from '../types';

type FilterTab = 'all' | 'self_pay' | 'hmo_pending' | 'hmo_approved' | 'emergency_deferred' | 'closed';

const FILTER_TABS: { value: FilterTab; label: string; icon?: React.ElementType }[] = [
  { value: 'all',                label: 'All'                },
  { value: 'self_pay',           label: 'Self-Pay',          icon: DollarSign    },
  { value: 'hmo_pending',        label: 'HMO Pending',       icon: Building2     },
  { value: 'hmo_approved',       label: 'HMO Approved',      icon: Building2     },
  { value: 'emergency_deferred', label: 'Emergency',         icon: AlertTriangle },
  { value: 'closed',             label: 'Closed',            icon: Clock         },
];

function matchesFilter(item: FullBillingItem, filter: FilterTab): boolean {
  const { billingStatus, paymentMode } = item.billingNote;
  if (filter === 'all')                return true;
  if (filter === 'self_pay')           return paymentMode === 'cash' || paymentMode === 'waiver';
  if (filter === 'hmo_pending')        return (paymentMode === 'hmo' || paymentMode === 'nhis') && billingStatus !== 'hmo_approved' && billingStatus !== 'closed' && billingStatus !== 'denied';
  if (filter === 'hmo_approved')       return billingStatus === 'hmo_approved';
  if (filter === 'emergency_deferred') return billingStatus === 'emergency_deferred' || billingStatus === 'reconciled';
  if (filter === 'closed')             return billingStatus === 'closed' || billingStatus === 'denied';
  return true;
}

interface BillingEncounterQueueProps {
  selectedId?: string;
  onSelect: (item: FullBillingItem) => void;
}

function fmtDate(iso: string) {
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'd MMM, HH:mm') : iso;
  } catch { return iso; }
}

export function BillingEncounterQueue({ selectedId, onSelect }: BillingEncounterQueueProps) {
  const { data: allItems = [], isLoading, error, refetch } = useBillingQueue();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = allItems
    .filter(item => matchesFilter(item, filter))
    .filter(item => !search || item.patientName.toLowerCase().includes(search.toLowerCase()));

  const pendingCount   = allItems.filter(i => ['init', 'invoiced', 'verified'].includes(i.billingNote.billingStatus)).length;
  const emergencyCount = allItems.filter(i => i.billingNote.billingStatus === 'emergency_deferred').length;

  return (
    <div className="flex flex-col h-full">
      {/* Queue header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">Billing Queue</h2>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold leading-none">
                {pendingCount}
              </span>
            )}
            {emergencyCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold leading-none">
                {emergencyCount} ⚡
              </span>
            )}
          </div>
          <button onClick={() => refetch()} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient..."
            className="w-full rounded-lg bg-gray-100 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-all"
          />
        </div>
      </div>

      {/* Filter tabs — horizontally scrollable */}
      <div className="flex gap-0 border-b bg-white overflow-x-auto px-2 flex-shrink-0">
        {FILTER_TABS.map(({ value, label, icon: Icon }) => {
          const count = value === 'all' ? allItems.length : allItems.filter(i => matchesFilter(i, value)).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                filter === value
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {Icon && <Icon className={`h-3 w-3 ${value === 'emergency_deferred' ? 'text-red-500' : ''}`} />}
              {label}
              {count > 0 && (
                <span className={`ml-0.5 text-[10px] ${filter === value ? 'text-indigo-400' : 'text-gray-400'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="py-12 text-center">
            <Clock className="h-6 w-6 text-gray-200 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-gray-400">Loading queue...</p>
          </div>
        )}
        {error && (
          <div className="py-12 text-center text-xs text-red-500">
            Failed to load billing queue.
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="py-12 text-center">
            <Clock className="h-7 w-7 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No items in this view.</p>
          </div>
        )}
        {!isLoading && filtered.map(item => {
          const { billingStatus, paymentMode, totalEstimate, isEmergency, invoiceNumber } = item.billingNote;
          const isSelected = selectedId === item.basketId;
          const totalPaid = (item.billingNote.payments ?? []).reduce((s, p) => s + p.amount, 0);

          return (
            <button
              key={item.basketId}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full text-left px-3 py-3 border-b transition-colors ${
                isSelected
                  ? 'bg-indigo-50 border-l-[3px] border-l-indigo-500'
                  : 'hover:bg-gray-50 border-l-[3px] border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isEmergency && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.patientName}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <BillingStatusChip status={billingStatus} />
                    <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-wide">{paymentMode}</span>
                  </div>
                  {invoiceNumber && (
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{invoiceNumber}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono font-semibold text-gray-700">
                    ₦{totalEstimate.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  {totalPaid > 0 && (
                    <p className="text-[10px] font-mono text-green-600">+₦{totalPaid.toLocaleString()}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(item.submittedAt)}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
