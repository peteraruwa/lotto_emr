'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  DollarSign, Clock, CheckCircle2, XCircle,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@lotto-emr/ui';
import { useBillingQueue } from '../hooks/use-billing-queue';
import { BillingEncounterQueue } from './billing-encounter-queue';
import { BillingDetailPanel } from './billing-detail-panel';
import type { FullBillingItem } from '../types';

function StatChip({ label, value, color, icon: Icon }: { label: string; value: number | string; color: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingControlTower() {
  const { data: allItems = [] } = useBillingQueue();
  const [selectedBilling, setSelectedBilling] = useState<FullBillingItem | null>(null);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayItems = allItems.filter(i => new Date(i.submittedAt) >= todayStart);

  const stats = {
    totalToday: todayItems.length,
    pending:    allItems.filter(i => ['init', 'invoiced', 'verified'].includes(i.billingNote.billingStatus)).length,
    paid:       allItems.filter(i => ['paid', 'hmo_approved', 'closed'].includes(i.billingNote.billingStatus)).length,
    emergency:  allItems.filter(i => i.billingNote.billingStatus === 'emergency_deferred').length,
    denied:     allItems.filter(i => i.billingNote.billingStatus === 'denied').length,
    revenue:    allItems
      .filter(i => ['paid', 'hmo_approved', 'closed'].includes(i.billingNote.billingStatus))
      .reduce((s, i) => s + (i.billingNote.payments ?? []).reduce((ps, p) => ps + p.amount, 0), 0),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Billing Control Tower</h1>
          <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
            <DollarSign className="h-3.5 w-3.5" />
            Billing Department
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StatChip label="Today's Bills"        value={stats.totalToday}  color="bg-indigo-600"  icon={DollarSign}    />
          <StatChip label="Pending Action"        value={stats.pending}     color="bg-amber-500"   icon={Clock}         />
          <StatChip label="Settled"               value={stats.paid}        color="bg-green-600"   icon={CheckCircle2}  />
          <StatChip label="Emergency Deferred"    value={stats.emergency}   color="bg-red-600"     icon={AlertTriangle} />
          <StatChip label="Denied"                value={stats.denied}      color="bg-gray-500"    icon={XCircle}       />
          <StatChip label="Revenue (₦)"           value={`₦${(stats.revenue / 1000).toFixed(0)}k`} color="bg-teal-600" icon={TrendingUp} />
        </div>
      </div>

      {/* Main layout: queue left, detail right */}
      <div className="flex flex-1 min-h-0">
        {/* Queue panel */}
        <div className={`border-r bg-white flex flex-col transition-all ${selectedBilling ? 'w-80 flex-shrink-0' : 'flex-1'}`}>
          <BillingEncounterQueue
            selectedId={selectedBilling?.basketId}
            onSelect={setSelectedBilling}
          />
        </div>

        {/* Detail panel */}
        {selectedBilling ? (
          <div className="flex-1 min-w-0 bg-white flex flex-col overflow-hidden">
            <BillingDetailPanel
              billing={selectedBilling}
              onClose={() => setSelectedBilling(null)}
            />
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Select a billing record</p>
              <p className="text-xs text-gray-300">Click any item in the queue to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
