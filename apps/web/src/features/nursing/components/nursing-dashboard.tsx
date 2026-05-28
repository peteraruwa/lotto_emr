'use client';
import React, { useState } from 'react';
import {
  Users, Pill, Activity, Droplets, ClipboardList, Bell,
  RefreshCw, User, Stethoscope,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { useNursingPatients } from '../hooks/use-nursing-patients';
import { useMedicationQueue } from '../hooks/use-medication-queue';
import { useNursingAlerts } from '../hooks/use-nursing-alerts';
import { PatientsTab } from './patients-tab';
import { MedicationsTab } from './medications-tab';
import { VitalsQuickEntry } from './vitals-quick-entry';
import { IOChart } from './io-chart';
import { TasksTab } from './tasks-tab';
import { AlertsTab } from './alerts-tab';
import type { NursingPatient } from '../types';

type TabId = 'patients' | 'medications' | 'vitals' | 'io' | 'tasks' | 'alerts';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badgeFn?: (counts: TabCounts) => number;
}

interface TabCounts {
  criticalPatients: number;
  dueMeds: number;
  alerts: number;
  tasks: number;
}

const TABS: Tab[] = [
  { id: 'patients',    label: 'Patients',    icon: Users },
  { id: 'medications', label: 'Medications', icon: Pill,
    badgeFn: c => c.dueMeds },
  { id: 'vitals',      label: 'Vitals',      icon: Activity },
  { id: 'io',          label: 'I/O',         icon: Droplets },
  { id: 'tasks',       label: 'Tasks',       icon: ClipboardList,
    badgeFn: c => c.tasks },
  { id: 'alerts',      label: 'Alerts',      icon: Bell,
    badgeFn: c => c.alerts },
];

const STATUS_DOT: Record<NursingPatient['status'], string> = {
  critical:        'bg-red-500',
  observation:     'bg-amber-400',
  'for-discharge': 'bg-blue-500',
  stable:          'bg-green-500',
};

export function NursingDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('patients');
  const [selectedPatient, setSelectedPatient] = useState<NursingPatient | null>(null);

  const { data: patients = [], isLoading: loadingPatients, refetch: refetchPatients } = useNursingPatients();
  const { data: medQueue = [], isLoading: loadingMeds, refetch: refetchMeds } = useMedicationQueue();
  const alerts = useNursingAlerts(medQueue);

  const dueMeds     = medQueue.filter(e => e.status === 'due' || e.isSTAT).length;
  const critPatients = patients.filter(p => p.status === 'critical').length;

  const counts: TabCounts = {
    criticalPatients: critPatients,
    dueMeds,
    alerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length,
    tasks: 0,
  };

  function handleRefresh() {
    refetchPatients();
    refetchMeds();
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-hospital-600" />
            <h1 className="text-base font-black text-gray-900">Nursing Dashboard</h1>
          </div>

          {/* Stats chips */}
          <div className="flex items-center gap-2">
            {critPatients > 0 && (
              <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {critPatients} Critical
              </span>
            )}
            {dueMeds > 0 && (
              <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full animate-pulse">
                {dueMeds} Med{dueMeds !== 1 ? 's' : ''} Due
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loadingPatients || loadingMeds}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-4 w-4', (loadingPatients || loadingMeds) && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Selected patient strip */}
        {selectedPatient && (
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-hospital-50 border border-hospital-100 px-3 py-2">
            <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[selectedPatient.status])} />
            <User className="h-3.5 w-3.5 text-hospital-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-hospital-900 truncate">{selectedPatient.patientName}</p>
              <p className="text-[10px] text-hospital-600">Bed {selectedPatient.bed} · {selectedPatient.ward}</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('vitals')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-hospital-200 text-hospital-700 hover:bg-hospital-100 transition-colors"
              >
                Vitals
              </button>
              <button
                onClick={() => setActiveTab('io')}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-hospital-200 text-hospital-700 hover:bg-hospital-100 transition-colors"
              >
                I/O
              </button>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tab Bar ────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.badgeFn?.(counts) ?? 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-hospital-500 text-hospital-700 bg-hospital-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {badge > 0 && (
                  <span className={cn(
                    'ml-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-white px-1',
                    tab.id === 'alerts' ? 'bg-red-600' : 'bg-amber-500'
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'patients' && (
          <PatientsTab
            patients={patients}
            selectedPatientId={selectedPatient?.patientId}
            onSelect={p => {
              setSelectedPatient(p);
            }}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsTab
            selectedPatientId={selectedPatient?.patientId}
            showAllPatients={!selectedPatient}
          />
        )}

        {activeTab === 'vitals' && (
          patients.length > 0 ? (
            <VitalsQuickEntry
              patients={patients}
              defaultPatientId={selectedPatient?.patientId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Activity className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No ward patients</p>
            </div>
          )
        )}

        {activeTab === 'io' && (
          patients.length > 0 ? (
            <IOChart
              patients={patients}
              defaultPatientId={selectedPatient?.patientId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Droplets className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No ward patients</p>
            </div>
          )
        )}

        {activeTab === 'tasks' && <TasksTab />}

        {activeTab === 'alerts' && <AlertsTab alerts={alerts} />}
      </div>
    </div>
  );
}
