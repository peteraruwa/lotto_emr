'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Plus, Eye } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { capitalize, formatDate, formatDateTime } from '@/shared/lib/utils';
import { usePatientProfile } from '../hooks/use-patient-profile';
import type { VitalRow } from '../hooks/use-patient-profile';

interface PatientProfileProps {
  patientId: string;
}

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending' | 'default'> = {
  'in-progress': 'active',
  arrived: 'active',
  triaged: 'pending',
  finished: 'completed',
  cancelled: 'cancelled',
  planned: 'pending',
  unknown: 'default',
};

// ── Biodata field row ──────────────────────────────────────────────────────────
function BiodataField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}

// ── Vitals header row (latest) ─────────────────────────────────────────────────
function LatestVitalsRow({ vitals }: { vitals: VitalRow }) {
  const items = [
    { label: 'BP', value: vitals.bp },
    { label: 'HR', value: vitals.hr },
    { label: 'Temp', value: vitals.temp },
    { label: 'SpO2', value: vitals.spo2 },
    { label: 'Weight', value: vitals.weight },
    { label: 'Height', value: vitals.height },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-teal-50 border border-teal-200 rounded-lg p-4">
      {items.map(({ label, value }) => (
        <div key={label} className="text-center">
          <p className="text-xs font-medium text-teal-700 uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">{value ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}

// ── Vitals table row ───────────────────────────────────────────────────────────
function VitalTableRow({ row }: { row: VitalRow }) {
  const isHighlighted = row.isToday;
  return (
    <tr
      className={
        isHighlighted
          ? 'bg-teal-50 border-l-4 border-teal-500'
          : 'hover:bg-gray-50'
      }
    >
      <td className="px-4 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
        {row.dateLabel}
        {isHighlighted && (
          <span className="ml-2 text-xs text-teal-600 font-semibold">Today</span>
        )}
      </td>
      <td className="px-4 py-2 text-sm text-gray-700">{row.bp ?? '—'}</td>
      <td className="px-4 py-2 text-sm text-gray-700">{row.hr ?? '—'}</td>
      <td className="px-4 py-2 text-sm text-gray-700">{row.temp ?? '—'}</td>
      <td className="px-4 py-2 text-sm text-gray-700">{row.spo2 ?? '—'}</td>
      <td className="px-4 py-2 text-sm text-gray-700">{row.weight ?? '—'}</td>
      <td className="px-4 py-2 text-sm text-gray-700">{row.height ?? '—'}</td>
    </tr>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function PatientProfile({ patientId }: PatientProfileProps) {
  const { profileData, isLoading, error } = usePatientProfile(patientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading patient profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="text-destructive font-semibold">Failed to load patient profile.</div>
          <div className="text-xs text-muted-foreground max-w-sm">{(error as any)?.message ?? String(error)}</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading patient profile...</div>
      </div>
    );
  }

  const { biodata, hasActiveEncounter, allergies, conditions, vitalRows, latestVitals, encounters } = profileData;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
        <Link href="/patients">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patients
        </Link>
      </Button>

      {/* ── Section 1: Biodata Card ── */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Header row */}
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="outline" className="font-mono text-xs">
                  {biodata.mrn}
                </Badge>
                {hasActiveEncounter && (
                  <Badge className="bg-teal-600 text-white border-transparent text-xs">
                    Active Encounter
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                {biodata.fullName}
              </h1>
            </div>
          </div>

          {/* Biodata grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <BiodataField label="Age" value={`${biodata.age} years`} />
            <BiodataField label="Sex" value={capitalize(biodata.sex)} />
            <BiodataField
              label="Date of Birth"
              value={biodata.dateOfBirth ? formatDate(biodata.dateOfBirth) : undefined}
            />
            <BiodataField label="Blood Group" value={biodata.bloodGroup} />
            <BiodataField label="Genotype" value={biodata.genotype} />
            <BiodataField label="Phone" value={biodata.phone} />
            <BiodataField label="Address" value={biodata.address} />
            <BiodataField label="HMO / Insurance" value={biodata.hmo} />
            <BiodataField label="Tribe" value={biodata.tribe} />
            <BiodataField label="Religion" value={biodata.religion} />
          </dl>

          {/* Allergies banner */}
          {allergies.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-700">
                  Allergies ({allergies.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a) => (
                  <Badge key={a.id} variant="destructive" className="text-xs">
                    {a.substance}
                    {a.reaction ? ` — ${a.reaction}` : ''}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Chronic conditions chips */}
          {conditions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Chronic Conditions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {c.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: Vital Signs ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vital Signs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Latest vitals summary */}
          {latestVitals ? (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Latest Vitals — {latestVitals.dateLabel}
                </p>
                <LatestVitalsRow vitals={latestVitals} />
              </div>

              {/* Full table */}
              {vitalRows.length > 0 && (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Date', 'BP', 'HR', 'Temp', 'SpO2', 'Weight', 'Height'].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {vitalRows.map((row) => (
                        <VitalTableRow key={row.date} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No vital signs recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Encounters ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Previous Encounters</CardTitle>
            <Button asChild size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Link href={`/patients/${patientId}/clinical-note/new`}>
                <Plus className="h-4 w-4 mr-1" />
                New Clinical Note
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {encounters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No encounters recorded.
            </p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Date', 'Visit Type', 'Diagnosis', 'Status', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {encounters.map((enc) => (
                    <tr key={enc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {enc.date ? formatDateTime(enc.date) : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{enc.visitType}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{enc.diagnosis}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={STATUS_VARIANT[enc.status] ?? 'default'}
                          className="capitalize text-xs"
                        >
                          {enc.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link href={`/patients/${patientId}/encounters`}>
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
