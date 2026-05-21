'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Label } from '@lotto-emr/ui';
import { ClipboardList } from 'lucide-react';
import type { AncRecord, AncVisit, AncRiskLevel } from '../types';
import { calculateGestationalWeeks } from '../lib/anc-utils';

interface AncVisitTrackerProps {
  ancRecord: AncRecord;
  patientId: string;
}

const RISK_BADGE: Record<AncRiskLevel, string> = {
  low: 'bg-green-100 text-green-700',
  moderate: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
};

const STATUS_BADGE: Record<AncVisit['status'], { label: string; className: string }> = {
  completed: { label: 'Done', className: 'bg-green-100 text-green-700' },
  due: { label: 'Due', className: 'bg-orange-100 text-orange-700' },
  missed: { label: 'Missed', className: 'bg-red-100 text-red-700' },
  upcoming: { label: 'Upcoming', className: 'bg-gray-100 text-gray-600' },
};

interface VisitFormState {
  weight: string;
  bp: string;
  fetalHeartRate: string;
  fundusHeight: string;
  presentation: string;
  findings: string;
}

function VisitRecordForm({
  visit,
  patientId,
  onSaved,
  onCancel,
}: {
  visit: AncVisit;
  patientId: string;
  onSaved: (visitId: string, data: Partial<AncVisit>) => void;
  onCancel: () => void;
}) {
  const medplum = useMedplum();
  const [form, setForm] = useState<VisitFormState>({
    weight: '',
    bp: '',
    fetalHeartRate: '',
    fundusHeight: '',
    presentation: '',
    findings: '',
  });
  const [saving, setSaving] = useState(false);

  function set(key: keyof VisitFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const now = new Date().toISOString();

    const obsBase = {
      resourceType: 'Observation' as const,
      status: 'final' as const,
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'exam',
            },
          ],
        },
      ],
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: now,
    };

    const promises: Promise<unknown>[] = [];

    if (form.weight) {
      promises.push(
        medplum.createResource({
          ...obsBase,
          code: {
            coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }],
          },
          valueQuantity: { value: Number(form.weight), unit: 'kg' },
        }),
      );
    }

    if (form.bp) {
      promises.push(
        medplum.createResource({
          ...obsBase,
          code: {
            coding: [{ system: 'http://loinc.org', code: '55284-4', display: 'Blood pressure' }],
          },
          valueString: form.bp,
        }),
      );
    }

    if (form.fetalHeartRate) {
      promises.push(
        medplum.createResource({
          ...obsBase,
          code: {
            coding: [
              { system: 'http://loinc.org', code: '55283-6', display: 'Fetal heart rate' },
            ],
          },
          valueQuantity: { value: Number(form.fetalHeartRate), unit: '/min' },
        }),
      );
    }

    if (form.fundusHeight) {
      promises.push(
        medplum.createResource({
          ...obsBase,
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '11881-0',
                display: 'Uterus fundal height',
              },
            ],
          },
          valueQuantity: { value: Number(form.fundusHeight), unit: 'cm' },
        }),
      );
    }

    if (form.presentation) {
      promises.push(
        medplum.createResource({
          ...obsBase,
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '73761-6',
                display: 'Fetal presentation',
              },
            ],
          },
          valueString: form.presentation,
        }),
      );
    }

    if (form.findings) {
      promises.push(
        medplum.createResource({
          ...obsBase,
          code: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '404684003',
                display: 'Clinical finding',
              },
            ],
          },
          note: [{ text: `ANC Visit ${visit.visitNumber} findings: ${form.findings}` }],
        }),
      );
    }

    await Promise.all(promises);
    setSaving(false);

    onSaved(visit.id, {
      completedDate: now.split('T')[0],
      status: 'completed',
      weight: form.weight ? Number(form.weight) : undefined,
      bp: form.bp || undefined,
      fetalHeartRate: form.fetalHeartRate ? Number(form.fetalHeartRate) : undefined,
      fundusHeight: form.fundusHeight ? Number(form.fundusHeight) : undefined,
      presentation: form.presentation || undefined,
      findings: form.findings || undefined,
    });
  }

  return (
    <tr>
      <td colSpan={5} className="px-4 py-4 bg-pink-50 border-l-4 border-pink-400">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-pink-800">
            Record Visit {visit.visitNumber} — Week {visit.targetWeek}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Weight (kg)</Label>
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Blood Pressure</Label>
              <input
                type="text"
                placeholder="e.g. 120/80"
                value={form.bp}
                onChange={(e) => set('bp', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fetal Heart Rate (/min)</Label>
              <input
                type="number"
                value={form.fetalHeartRate}
                onChange={(e) => set('fetalHeartRate', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fundal Height (cm)</Label>
              <input
                type="number"
                value={form.fundusHeight}
                onChange={(e) => set('fundusHeight', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Presentation</Label>
              <select
                value={form.presentation}
                onChange={(e) => set('presentation', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select...</option>
                <option value="cephalic">Cephalic</option>
                <option value="breech">Breech</option>
                <option value="transverse">Transverse</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Findings</Label>
            <textarea
              rows={2}
              value={form.findings}
              onChange={(e) => set('findings', e.target.value)}
              placeholder="Clinical findings and notes..."
              className="flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Visit'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function AncVisitTracker({ ancRecord, patientId }: AncVisitTrackerProps) {
  const [visits, setVisits] = useState<AncVisit[]>(ancRecord.visits);
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null);

  const gestWeeks = calculateGestationalWeeks(ancRecord.lmpDate);

  function handleVisitSaved(visitId: string, data: Partial<AncVisit>) {
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, ...data } : v)),
    );
    setActiveVisitId(null);
  }

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card className="border-l-4 border-pink-400">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-pink-500" />
            ANC Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">EDD</p>
              <p className="font-semibold text-gray-900 mt-0.5">{ancRecord.edd}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gestational Age</p>
              <p className="font-semibold text-gray-900 mt-0.5">{gestWeeks} weeks</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Obstetric</p>
              <p className="font-semibold text-gray-900 mt-0.5">
                G{ancRecord.gravida} P{ancRecord.para} A{ancRecord.abortus}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Risk Level</p>
              <span
                className={`inline-flex items-center mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${RISK_BADGE[ancRecord.riskLevel]}`}
              >
                {ancRecord.riskLevel.charAt(0).toUpperCase() + ancRecord.riskLevel.slice(1)} Risk
              </span>
            </div>
          </div>
          {ancRecord.riskFactors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ancRecord.riskFactors.map((rf) => (
                <span
                  key={rf}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700"
                >
                  {rf}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit schedule */}
      <Card className="border-l-4 border-pink-400">
        <CardHeader>
          <CardTitle className="text-base">WHO 8-Visit Schedule</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Visit #', 'Target Week', 'Scheduled Date', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {visits.map((visit) => {
                  const badge = STATUS_BADGE[visit.status];
                  return (
                    <React.Fragment key={visit.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {visit.visitNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          Week {visit.targetWeek}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {visit.scheduledDate ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {visit.status === 'due' && activeVisitId !== visit.id && (
                            <Button
                              size="sm"
                              onClick={() => setActiveVisitId(visit.id)}
                              className="bg-teal-600 hover:bg-teal-700 text-white text-xs"
                            >
                              Record Visit
                            </Button>
                          )}
                          {visit.status === 'completed' && visit.completedDate && (
                            <span className="text-xs text-gray-500">
                              Completed {visit.completedDate}
                            </span>
                          )}
                        </td>
                      </tr>
                      {activeVisitId === visit.id && (
                        <VisitRecordForm
                          visit={visit}
                          patientId={patientId}
                          onSaved={handleVisitSaved}
                          onCancel={() => setActiveVisitId(null)}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
