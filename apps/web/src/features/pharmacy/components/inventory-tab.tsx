'use client';
import React, { useState } from 'react';
import { Package, AlertTriangle, Thermometer, Search } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { usePharmacyInventory } from '../hooks/use-pharmacy-inventory';

const STORAGE_LABELS: Record<string, string> = {
  'room-temp':   'Room Temp',
  refrigerated:  'Refrigerated',
  frozen:        'Frozen',
  controlled:    'Controlled',
};

const STORAGE_COLORS: Record<string, string> = {
  'room-temp':  'bg-gray-100 text-gray-600',
  refrigerated: 'bg-blue-100 text-blue-700',
  frozen:       'bg-cyan-100 text-cyan-700',
  controlled:   'bg-purple-100 text-purple-700',
};

type StockFilter = 'all' | 'low' | 'expiring' | 'controlled' | 'refrigerated';

export function InventoryTab() {
  const { data: items = [], isLoading } = usePharmacyInventory();
  const [filter, setFilter] = useState<StockFilter>('all');
  const [search, setSearch] = useState('');

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    if (q && !item.drugName.toLowerCase().includes(q)) return false;
    if (filter === 'low')          return item.currentStock <= item.minThreshold;
    if (filter === 'expiring')     return item.daysToExpiry !== undefined && item.daysToExpiry <= 60;
    if (filter === 'controlled')   return item.isControlled;
    if (filter === 'refrigerated') return item.storageCondition === 'refrigerated' || item.storageCondition === 'frozen';
    return true;
  });

  const lowCount       = items.filter(i => i.currentStock <= i.minThreshold).length;
  const expiringCount  = items.filter(i => i.daysToExpiry !== undefined && i.daysToExpiry <= 60).length;
  const criticalExpiry = items.filter(i => i.daysToExpiry !== undefined && i.daysToExpiry <= 14).length;

  if (isLoading) return <div className="py-12 text-center text-sm text-gray-400">Loading inventory...</div>;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
          <p className="text-[10px] font-bold text-amber-600 uppercase">Low Stock</p>
          <p className="text-lg font-black text-amber-800">{lowCount}</p>
        </div>
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
          <p className="text-[10px] font-bold text-orange-600 uppercase">Expiring Soon</p>
          <p className="text-lg font-black text-orange-800">{expiringCount}</p>
        </div>
        <div className={cn('rounded-xl border p-3 text-center', criticalExpiry > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100')}>
          <p className={cn('text-[10px] font-bold uppercase', criticalExpiry > 0 ? 'text-red-600' : 'text-green-600')}>{'<'}14 days</p>
          <p className={cn('text-lg font-black', criticalExpiry > 0 ? 'text-red-800' : 'text-green-800')}>{criticalExpiry}</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search drug name..."
          className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['all','low','expiring','controlled','refrigerated'] as StockFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors capitalize',
              filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
            {f}
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {filtered.map(item => {
          const isLow      = item.currentStock <= item.minThreshold;
          const isCritical = item.currentStock <= item.minThreshold * 0.5;
          const isExpiring = item.daysToExpiry !== undefined && item.daysToExpiry <= 60;
          const isExpired  = item.daysToExpiry !== undefined && item.daysToExpiry <= 0;
          const stockPct   = Math.min(100, Math.round((item.currentStock / item.reorderLevel) * 100));

          return (
            <div key={item.id} className={cn(
              'rounded-xl border p-3',
              isExpired  ? 'border-red-300 bg-red-50' :
              isCritical ? 'border-red-200 bg-red-50' :
              isLow      ? 'border-amber-200 bg-amber-50' :
              'border-gray-100 bg-white'
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {isExpired  && <span className="text-[10px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">EXPIRED</span>}
                    {!isExpired && isExpiring && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        item.daysToExpiry! <= 14 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700')}>
                        {item.daysToExpiry}d to expiry
                      </span>
                    )}
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', STORAGE_COLORS[item.storageCondition])}>
                      {STORAGE_LABELS[item.storageCondition]}
                    </span>
                    {item.isControlled && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">CD</span>}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{item.drugName} <span className="text-gray-400 font-normal text-xs">{item.strength} {item.form}</span></p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.location && `📍 ${item.location}`}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={cn('text-sm font-black',
                    isCritical ? 'text-red-700' : isLow ? 'text-amber-700' : 'text-gray-800')}>
                    {item.currentStock} <span className="text-[11px] font-normal text-gray-400">{item.unit}</span>
                  </p>
                  <p className="text-[10px] text-gray-400">min {item.minThreshold}</p>
                </div>
              </div>

              {/* Stock bar */}
              <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', isCritical ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-green-500')}
                  style={{ width: `${stockPct}%` }}
                />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">No items match filter</div>
        )}
      </div>
    </div>
  );
}
