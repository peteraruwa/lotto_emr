'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Activity, Pill, ClipboardList, FileText } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { CDSBanner } from '@/features/cdss';
import { usePatientChart } from '../hooks/use-patient-chart';

type Tab = 'summary' | 'encounters' | 'orders' | 'results' | 'notes';

interface PatientChartProps {
  patientId: string;
}

/**
 * Full patient chart view with tabbed navigation.
 * Tabs: Summary | Encounters | Orders | Results | Notes
 */
export function PatientChart({ patientId }: PatientChartProps) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const { chartData, isLoading, error } = usePatientChart(patientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading patient chart...</div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Failed to load patient chart.</div>
      </div>
    );
  }

  const { patient, activeConditions, allergies, recentObservations, activeMedications } = chartData;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'summary', label: 'Summary', icon: Activity },
    { id: 'encounters', label: 'Encounters', icon: ClipboardList },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'results', label: 'Results', icon: Activity },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
        <Link href="/patients">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patients
        </Link>
      </Button>

      {/* Patient header */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{patient.fullName}</h1>
            <p className="text-sm text-gray-500 font-mono">{patient.mrn}</p>
            <p className="text-sm text-gray-600 mt-1">
              {patient.age} years • <span className="capitalize">{patient.gender}</span> •{' '}
              DOB: {patient.dateOfBirth}
            </p>
          </div>
          <div className="text-right space-y-1">
            {chartData.activeEncounterId && (
              <Badge variant="active">Active Encounter</Badge>
            )}
            {allergies.length > 0 && (
              <div className="flex items-center justify-end gap-1 text-red-600 text-xs font-semibold">
                <AlertTriangle className="h-3 w-3" />
                {allergies.length} Allerg{allergies.length !== 1 ? 'ies' : 'y'}
              </div>
            )}
          </div>
        </div>

        {/* Allergies bar */}
        {allergies.length > 0 && (
          <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs font-semibold text-red-700 mb-1">Allergies:</p>
            <div className="flex flex-wrap gap-1">
              {allergies.map((a) => (
                <Badge key={a.id} variant="destructive" className="text-xs">
                  {a.substance}
                  {a.reaction ? ` (${a.reaction})` : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CDS Banner */}
      <CDSBanner patientId={patientId} />

      {/* Tabs */}
      <div className="border-b bg-white rounded-t-lg">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-hospital-600 text-hospital-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active Conditions ({activeConditions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeConditions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active conditions recorded</p>
                ) : (
                  <ul className="space-y-2">
                    {activeConditions.map((c) => (
                      <li key={c.id} className="text-sm">
                        <span className="font-medium">{c.text}</span>
                        {c.onsetDate && (
                          <span className="text-muted-foreground"> since {c.onsetDate}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Active Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Active Medications ({activeMedications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeMedications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active medications</p>
                ) : (
                  <ul className="space-y-2">
                    {activeMedications.map((m) => (
                      <li key={m.id} className="text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground"> {m.dose} {m.frequency}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                {recentObservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent results</p>
                ) : (
                  <div className="divide-y">
                    {recentObservations.slice(0, 10).map((obs) => (
                      <div key={obs.id} className="flex items-center justify-between py-2 text-sm">
                        <span>{obs.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={obs.isCritical ? 'critical-value' : ''}>
                            {obs.value}
                          </span>
                          <span className="text-xs text-muted-foreground">{obs.date}</span>
                          {obs.isCritical && (
                            <Badge variant="critical">CRITICAL</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'summary' && (
          <div className="bg-white rounded-lg border p-6 text-center text-muted-foreground text-sm">
            Use the dedicated page links for full {activeTab} management.
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/patients/${patientId}/${activeTab}`}>
                  Open {activeTab} page
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
