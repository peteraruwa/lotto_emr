'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMedplum } from '@medplum/react';
import type { Encounter, DocumentReference } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import type { DispositionType, DispositionData } from '../types';
import { LOINC_NOTE_TYPES, FHIR_SYSTEMS } from '@/shared/constants/loinc';

interface DispositionFormProps {
  patientId: string;
  encounterId: string;
  onComplete: () => void;
}

type ReferralUrgency = 'Routine' | 'Urgent' | 'Emergency';

const DISPOSITION_OPTIONS: {
  value: DispositionType;
  icon: string;
  label: string;
  description: string;
  border: string;
  bg: string;
  accent: string;
}[] = [
  {
    value: 'discharge',
    icon: '🏠',
    label: 'Discharge Home',
    description: 'Patient is stable for discharge',
    border: 'border-green-500',
    bg: 'bg-green-50',
    accent: 'text-green-700',
  },
  {
    value: 'admit',
    icon: '🛏',
    label: 'Admit to Ward',
    description: 'Patient requires inpatient care',
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    accent: 'text-blue-700',
  },
  {
    value: 'followup',
    icon: '📅',
    label: 'Schedule Follow-up',
    description: 'Patient needs outpatient follow-up',
    border: 'border-teal-500',
    bg: 'bg-teal-50',
    accent: 'text-teal-700',
  },
  {
    value: 'refer',
    icon: '➡',
    label: 'Refer',
    description: 'Refer to specialist or facility',
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    accent: 'text-purple-700',
  },
];

function summaryLabel(type: DispositionType): string {
  if (type === 'discharge') return 'Discharge Summary';
  if (type === 'admit') return 'Admission Reason';
  if (type === 'followup') return 'Follow-up Instructions';
  return 'Referral Letter';
}

export function DispositionForm({ patientId, encounterId, onComplete }: DispositionFormProps) {
  const medplum = useMedplum();
  const router = useRouter();

  const [dispositionType, setDispositionType] = useState<DispositionType>('discharge');
  const [summary, setSummary] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicationsNote, setMedicationsNote] = useState('');
  const [ward, setWard] = useState('');
  const [admittingDiagnosis, setAdmittingDiagnosis] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupSpecialty, setFollowupSpecialty] = useState('');
  const [referringTo, setReferringTo] = useState('');
  const [referralUrgency, setReferralUrgency] = useState<ReferralUrgency>('Routine');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();

      const dispositionData: DispositionData = {
        type: dispositionType,
        summary,
        instructions,
        followupDate: followupDate || undefined,
        referralDestination: referringTo || undefined,
        admitReason: admittingDiagnosis || undefined,
      };

      const base64Data = btoa(unescape(encodeURIComponent(JSON.stringify(dispositionData))));

      await medplum.createResource({
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [
            {
              system: FHIR_SYSTEMS.LOINC,
              code: LOINC_NOTE_TYPES.DISCHARGE_SUMMARY,
              display: 'Discharge summary',
            },
          ],
          text: 'Discharge Summary',
        },
        category: [
          {
            coding: [
              {
                system: FHIR_SYSTEMS.DOC_CAT,
                code: 'clinical-note',
              },
            ],
          },
        ],
        subject: { reference: `Patient/${patientId}` },
        date: now,
        content: [
          {
            attachment: {
              contentType: 'application/json',
              data: base64Data,
              title: 'Discharge Summary',
            },
          },
        ],
        context: {
          encounter: [{ reference: `Encounter/${encounterId}` }],
        },
      } as DocumentReference);

      const existingEncounter = await medplum.readResource('Encounter', encounterId) as Encounter;

      if (dispositionType === 'discharge' || dispositionType === 'followup') {
        await medplum.updateResource({
          ...existingEncounter,
          status: 'finished',
        } as Encounter);
      } else if (dispositionType === 'admit') {
        await medplum.updateResource({
          ...existingEncounter,
          status: 'in-progress',
        } as Encounter);
      }

      onComplete();

      if (dispositionType === 'admit') {
        router.push(`/patients/${patientId}/admit`);
      } else {
        router.push(`/patients/${patientId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save disposition');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Disposition Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {DISPOSITION_OPTIONS.map((opt) => {
              const selected = dispositionType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDispositionType(opt.value)}
                  className={`rounded-xl border-2 p-4 text-left transition-colors ${
                    selected ? `${opt.border} ${opt.bg}` : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.icon}</div>
                  <div className={`font-semibold text-sm ${selected ? opt.accent : ''}`}>{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{summaryLabel(dispositionType)}</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={6}
            required
            placeholder={`Enter ${summaryLabel(dispositionType).toLowerCase()}...`}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>

      {dispositionType === 'discharge' && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Discharge Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Patient Instructions</Label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                placeholder="Instructions for the patient on discharge..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medications on Discharge</Label>
              <textarea
                value={medicationsNote}
                onChange={(e) => setMedicationsNote(e.target.value)}
                rows={3}
                placeholder="List medications prescribed on discharge..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {dispositionType === 'admit' && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Admission Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Ward / Unit</Label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g. Medical Ward, ICU"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Admitting Diagnosis</Label>
              <input
                type="text"
                value={admittingDiagnosis}
                onChange={(e) => setAdmittingDiagnosis(e.target.value)}
                placeholder="Primary diagnosis for admission"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {dispositionType === 'followup' && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Follow-up Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Follow-up Date</Label>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Follow-up Specialty</Label>
              <input
                type="text"
                value={followupSpecialty}
                onChange={(e) => setFollowupSpecialty(e.target.value)}
                placeholder="e.g. Cardiology, General Practice"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {dispositionType === 'refer' && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Referring To</Label>
              <input
                type="text"
                value={referringTo}
                onChange={(e) => setReferringTo(e.target.value)}
                placeholder="e.g. Cardiologist, Regional Hospital"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Urgency</Label>
              <div className="flex gap-2">
                {(['Routine', 'Urgent', 'Emergency'] as ReferralUrgency[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setReferralUrgency(u)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      referralUrgency === u
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-600'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
      )}

      {dispositionType === 'admit' && (
        <p className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          Saving will keep the encounter active and proceed to ward admission.
        </p>
      )}

      <Button
        type="submit"
        disabled={submitting || !summary}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
      >
        {submitting ? 'Saving…' : 'Finalise Disposition'}
      </Button>
    </form>
  );
}
