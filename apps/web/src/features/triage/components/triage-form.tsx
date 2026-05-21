'use client';

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useMedplum } from '@medplum/react';
import type { Observation, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import type { TriageFormData, TriageUrgency, TriageRouting } from '../types';
import { LOINC_VITALS, FHIR_SYSTEMS } from '@/shared/constants/loinc';

interface TriageFormProps {
  patientId: string;
  encounterId: string;
  onComplete: () => void;
}

interface VitalConfig {
  key: keyof import('../types').TriageVitals;
  label: string;
  loinc: string;
  unit: string;
}

const VITALS: VitalConfig[] = [
  { key: 'systolic',        label: 'Systolic BP',       loinc: LOINC_VITALS.SYSTOLIC,         unit: 'mmHg' },
  { key: 'diastolic',       label: 'Diastolic BP',      loinc: LOINC_VITALS.DIASTOLIC,        unit: 'mmHg' },
  { key: 'heartRate',       label: 'Heart Rate (/min)', loinc: LOINC_VITALS.HEART_RATE,       unit: '/min' },
  { key: 'temperature',     label: 'Temperature (°C)',  loinc: LOINC_VITALS.TEMPERATURE,      unit: 'Cel'  },
  { key: 'spo2',            label: 'SpO2 (%)',          loinc: LOINC_VITALS.SPO2,             unit: '%'    },
  { key: 'respiratoryRate', label: 'Resp. Rate (/min)', loinc: LOINC_VITALS.RESPIRATORY_RATE, unit: '/min' },
  { key: 'weight',          label: 'Weight (kg)',       loinc: LOINC_VITALS.BODY_WEIGHT,      unit: 'kg'   },
  { key: 'height',          label: 'Height (cm)',       loinc: LOINC_VITALS.BODY_HEIGHT,      unit: 'cm'   },
];

const URGENCY_OPTIONS: { value: TriageUrgency; label: string; emoji: string; description: string; border: string; bg: string }[] = [
  { value: 'critical',   label: 'Critical',   emoji: '🔴', description: 'Immediate life-threatening', border: 'border-red-500',    bg: 'bg-red-50'    },
  { value: 'urgent',     label: 'Urgent',     emoji: '🟠', description: 'Needs prompt attention',     border: 'border-orange-400', bg: 'bg-orange-50' },
  { value: 'non-urgent', label: 'Non-urgent', emoji: '🟢', description: 'Stable, can wait',           border: 'border-green-500',  bg: 'bg-green-50'  },
];

const ROUTING_OPTIONS: { value: TriageRouting; label: string }[] = [
  { value: 'emergency',  label: 'Emergency Care'   },
  { value: 'outpatient', label: 'Outpatient Clinic' },
  { value: 'anc',        label: 'ANC Pathway'      },
];

function urgencyToRouting(urgency: TriageUrgency): TriageRouting {
  return urgency === 'critical' ? 'emergency' : 'outpatient';
}

function urgencyToActPriority(urgency: TriageUrgency): string {
  if (urgency === 'critical') return 'EM';
  if (urgency === 'urgent')   return 'UR';
  return 'R';
}

export function TriageForm({ patientId, encounterId, onComplete }: TriageFormProps) {
  const medplum = useMedplum();
  const router = useRouter();

  const { register, handleSubmit, watch, setValue, control, formState: { isSubmitting } } = useForm<TriageFormData>({
    defaultValues: {
      chiefComplaint: '',
      vitals: {},
      urgency: 'urgent',
      routing: 'outpatient',
      notes: '',
    },
  });

  const urgency = watch('urgency');

  // Auto-select routing when urgency changes, unless ANC is manually set
  useEffect(() => {
    const currentRouting = watch('routing');
    if (currentRouting !== 'anc') {
      setValue('routing', urgencyToRouting(urgency));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urgency]);

  async function onSubmit(data: TriageFormData) {
    const now = new Date().toISOString();

    // Create Observations for non-empty vital signs
    const vitalPromises: Promise<unknown>[] = [];

    for (const vital of VITALS) {
      const value = data.vitals[vital.key];
      if (value === undefined || value === null || String(value) === '') continue;

      const obs: Observation = {
        resourceType: 'Observation',
        status: 'final',
        category: [
          {
            coding: [
              {
                system: FHIR_SYSTEMS.OBSERVATION_CAT,
                code: 'vital-signs',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: FHIR_SYSTEMS.LOINC,
              code: vital.loinc,
            },
          ],
        },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        effectiveDateTime: now,
        valueQuantity: {
          value: Number(value),
          unit: vital.unit,
        },
      };

      vitalPromises.push(medplum.createResource(obs));
    }

    await Promise.all(vitalPromises);

    // Update Encounter
    const existingEncounter = await medplum.readResource('Encounter', encounterId) as Encounter;

    await medplum.updateResource({
      ...existingEncounter,
      status: 'in-progress',
      priority: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
            code: urgencyToActPriority(data.urgency),
          },
        ],
      },
      reasonCode: [{ text: data.chiefComplaint }],
    } as Encounter);

    onComplete();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">

      {/* Chief Complaint */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chief Complaint</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register('chiefComplaint', { required: true })}
            rows={3}
            placeholder="Describe the patient's main presenting complaint..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>

      {/* Vital Signs */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {VITALS.map((vital) => (
              <div key={vital.key} className="space-y-1">
                <Label htmlFor={`vitals.${vital.key}`} className="text-xs">{vital.label}</Label>
                <input
                  id={`vitals.${vital.key}`}
                  type="number"
                  step="any"
                  {...register(`vitals.${vital.key}`, { valueAsNumber: true })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Urgency */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Urgency</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="urgency"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-3">
                {URGENCY_OPTIONS.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-colors ${
                        selected
                          ? `${opt.border} ${opt.bg}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{opt.emoji}</div>
                      <div className="font-semibold text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Routing */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Routing</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="routing"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {ROUTING_OPTIONS.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        selected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes <span className="text-xs font-normal text-muted-foreground">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Additional triage notes..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
      >
        {isSubmitting ? 'Saving...' : 'Complete Triage'}
      </Button>
    </form>
  );
}
