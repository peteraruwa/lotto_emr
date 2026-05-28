'use client';
import React, { useState } from 'react';
import {
  ClipboardList, Package, Warehouse, Lock,
  Bell, FileText, RefreshCw, FlaskConical,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { usePrescriptionQueue }  from '../hooks/use-prescription-queue';
import { usePharmacyAlerts }     from '../hooks/use-pharmacy-alerts';
import { WorkQueueTab }          from './work-queue-tab';
import { DispensingTab }         from './dispensing-tab';
import { InventoryTab }          from './inventory-tab';
import { ControlledDrugsTab }    from './controlled-drugs-tab';
import { AlertsPanel }           from './alerts-panel';
import { AuditTab }              from './audit-tab';
import { PrescriptionDetailPanel } from './prescription-detail-panel';
import { DispensePanel }         from './dispense-panel';
import type { PharmacyPrescription } from '../types';

type TabId = 'queue' | 'dispensing' | 'inventory' | 'controlled' | 'alerts' | 'audit';

interface TabCounts {
  pending: number;
  statPending: number;
  alerts: number;
  readyToDispense: number;
  controlledPending: number;
}

const TABS: { id: TabId; label: string; icon: React.ElementType; badgeFn?: (c: TabCounts) => number }[] = [
  { id: 'queue',      label: 'Work Queue',      icon: ClipboardList, badgeFn: c => c.pending },
  { id: 'dispensing', label: 'Dispensing',       icon: Package,       badgeFn: c => c.readyToDispense },
  { id: 'inventory',  label: 'Inventory',        icon: Warehouse },
  { id: 'controlled', label: 'Controlled Drugs', icon: Lock,          badgeFn: c => c.controlledPending },
  { id: 'alerts',     label: 'Alerts',           icon: Bell,          badgeFn: c => c.alerts },
  { id: 'audit',      label: 'Audit Log',        icon: FileText },
];

export function PharmacyDashboard() {
  const [activeTab,   setActiveTab]   = useState<TabId>('queue');
  const [selectedRx,  setSelectedRx]  = useState<PharmacyPrescription | null>(null);
  const [dispensingRx, setDispensingRx] = useState<PharmacyPrescription | null>(null);

  const { data: prescriptions = [], isLoading, refetch } = usePrescriptionQueue();
  const alerts = usePharmacyAlerts(prescriptions);

  const counts: TabCounts = {
    pending:           prescriptions.filter(r => ['pending', 'under-review'].includes(r.pharmacyStatus)).length,
    statPending:       prescriptions.filter(r => r.priority === 'stat' && ['pending', 'under-review'].includes(r.pharmacyStatus)).length,
    alerts:            alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length,
    readyToDispense:   prescriptions.filter(r => ['verified', 'safety-cleared', 'dispensing'].includes(r.pharmacyStatus)).length,
    controlledPending: prescriptions.filter(r => r.isControlled && ['pending', 'under-review'].includes(r.pharmacyStatus)).length,
  };

  const showRight = selectedRx !== null || dispensingRx !== null;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-indigo-600" />
            <h1 className="text-base font-black text-gray-900">Pharmacy Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {counts.statPending > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-black bg-red-600 text-white px-2 py-1 rounded-full animate-pulse">
                ⚡ {counts.statPending} STAT
              </span>
            )}
            {counts.pending > 0 && (
              <span className="text-[11px] font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                {counts.pending} Pending
              </span>
            )}
            <button onClick={() => refetch()} disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(tab => {
            const Icon  = tab.icon;
            const badge = tab.badgeFn?.(counts) ?? 0;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap',
                  isActive ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}>
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {badge > 0 && (
                  <span className={cn(
                    'ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-white px-1',
                    tab.id === 'alerts' || tab.id === 'queue' ? 'bg-red-500' :
                    tab.id === 'controlled' ? 'bg-purple-600' : 'bg-indigo-500'
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left panel */}
        <div className={cn('flex flex-col overflow-hidden transition-all', showRight ? 'w-[420px] flex-shrink-0' : 'flex-1')}>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'queue' && (
              <WorkQueueTab
                prescriptions={prescriptions}
                selectedId={selectedRx?.id}
                onSelect={rx => { setSelectedRx(rx); setDispensingRx(null); }}
              />
            )}
            {activeTab === 'dispensing'  && <DispensingTab  prescriptions={prescriptions} />}
            {activeTab === 'inventory'   && <InventoryTab />}
            {activeTab === 'controlled'  && <ControlledDrugsTab prescriptions={prescriptions} />}
            {activeTab === 'alerts'      && <AlertsPanel alerts={alerts} />}
            {activeTab === 'audit'       && <AuditTab prescriptions={prescriptions} />}
          </div>
        </div>

        {/* Right panel */}
        {showRight && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {dispensingRx ? (
              <div className="h-full flex flex-col bg-white border-l border-gray-100">
                <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-black text-gray-900">Dispense — {dispensingRx.drugName}</h2>
                  <button onClick={() => setDispensingRx(null)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <DispensePanel rx={dispensingRx} onDone={() => { setDispensingRx(null); setSelectedRx(null); }} />
                </div>
              </div>
            ) : selectedRx ? (
              <PrescriptionDetailPanel
                rx={selectedRx}
                onClose={() => setSelectedRx(null)}
                onDispense={rx => { setDispensingRx(rx); setSelectedRx(null); }}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
