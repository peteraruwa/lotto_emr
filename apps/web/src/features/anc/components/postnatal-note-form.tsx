'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import type { Condition, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import { AlertTriangle, Heart } from 'lucide-react';
import { ANC_VISIT_TYPE_SYSTEM } from '../types';
import { FHIR_SYSTEMS, LOINC_VITALS, LOINC_ANC } from '@/shared/constants/loinc';

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectCls = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaCls = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none";

interface PostnatalNoteFormProps {
  patientId: string;
  pregnancyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PostnatalNoteForm({ patientId, pregnancyId, onSuccess, onCancel }: PostnatalNoteFormProps) {
  const medplum = useMedplum();
  const [saving, setSaving] = useState(false);

  // Timing
  const [dayPostDelivery, setDayPostDelivery] = useState(1);

  // Maternal vitals
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');

  // Uterus & lochia
  const [lochia, setLochia] = useState<'rubra' | 'serosa' | 'alba' | 'abnormal'>('rubra');
  const [uterusInvolution, setUterusInvolution] = useState<'satisfactory' | 'subinvolution'>('satisfactory');

  // Breastfeeding & wound
  const [breastfeeding, setBreastfeeding] = useState<'exclusive' | 'mixed' | 'not-breastfeeding'>('exclusive');
  const [woundHealing, setWoundHealing] = useState<'good' | 'poor' | 'infected' | 'na'>('good');

  // Mood screening
  const [moodScreening, setMoodScreening] = useState<'normal' | 'low-mood' | 'possible-pnd'>('normal');

  // Baby
  const [babyWeight, setBabyWeight] = useState('');
  const [babyCondition, setBabyCondition] = useState<'well' | 'jaundice' | 'unwell'>('well');

  // Family planning
  const [familyPlanningCounseled, setFamilyPlanningCounseled] = useState(false);
  const [familyPlanningChoice, setFamilyPlanningChoice] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  const preEclampsiaRisk = (!!bpSystolic && Number(bpSystolic) >= 140) || (!!bpDiastolic && Number(bpDiastolic) >= 90);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bpSystolic || !bpDiastolic || !temperature) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();

      const noteText = [
        `Postnatal day ${dayPostDelivery}`,
        `BP: ${bpSystolic}/${bpDiastolic} mmHg, Temp: ${temperature}°C`,
        `Lochia: ${lochia}, Uterus: ${uterusInvolution}`,
        `Breastfeeding: ${breastfeeding}`,
        `Wound healing: ${woundHealing}`,
        `Mood screening: ${moodScreening}`,
        babyWeight ? `Baby weight: ${babyWeight} kg` : '',
        `Baby condition: ${babyCondition}`,
        familyPlanningCounseled ? `FP counselled: ${familyPlanningChoice || 'yes'}` : '',
        notes,
      ].filter(Boolean).join('. ');

      const encounter = await (medplum.createResource as (r: unknown) => Promise<Encounter>)({
        resourceType: 'Encounter',
        status: 'finished',
        class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'AMB' },
        type: [{
          coding: [{ system: ANC_VISIT_TYPE_SYSTEM, code: 'postnatal', display: 'Postnatal Note' }],
          text: 'Postnatal Note',
        }],
        subject: { reference: `Patient/${patientId}` },
        period: { start: now },
        reasonReference: [{ reference: `Condition/${pregnancyId}` }],
        note: [{ text: noteText }],
      });

      const obsBase = {
        resourceType: 'Observation' as const,
        status: 'final' as const,
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        effectiveDateTime: now,
      };

      const promises: Promise<unknown>[] = [];

      // BP observation
      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BP_PANEL }], text: 'Blood pressure' },
        component: [
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.SYSTOLIC }] }, valueQuantity: { value: Number(bpSystolic), unit: 'mmHg' } },
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.DIASTOLIC }] }, valueQuantity: { value: Number(bpDiastolic), unit: 'mmHg' } },
        ],
      }));

      // Temperature observation
      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.TEMPERATURE }], text: 'Body temperature' },
        valueQuantity: { value: Number(temperature), unit: '°C' },
      }));

      // Baby weight (if provided)
      if (babyWeight) {
        promises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.BIRTH_WEIGHT }], text: 'Baby weight (postnatal)' },
          valueQuantity: { value: Number(babyWeight), unit: 'kg' },
        }));
      }

      await Promise.all(promises);
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header strip */}
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <Heart className="h-5 w-5 text-green-600" />
        <span className="text-sm font-semibold text-green-800">Postnatal Note</span>
        <span className="ml-auto text-xs text-green-600">Day {dayPostDelivery} post-delivery</span>
      </div>

      {/* Day & maternal vitals */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Maternal Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Day Post-Delivery *</Label>
              <input type="number" min={0} max={42} required value={dayPostDelivery} onChange={(e) => setDayPostDelivery(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BP Systolic *</Label>
              <input
                type="number"
                required
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                className={`${inputCls} ${bpSystolic && Number(bpSystolic) >= 140 ? 'border-red-400 bg-red-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BP Diastolic *</Label>
              <input
                type="number"
                required
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                className={`${inputCls} ${bpDiastolic && Number(bpDiastolic) >= 90 ? 'border-red-400 bg-red-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Temperature (°C) *</Label>
              <input
                type="number"
                step="0.1"
                required
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className={`${inputCls} ${temperature && Number(temperature) >= 38 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
          </div>
          {preEclampsiaRisk && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-300 rounded-lg text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Elevated BP postnatal — consider postnatal pre-eclampsia / eclampsia
            </div>
          )}
          {temperature && Number(temperature) >= 38 && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-300 rounded-lg text-xs font-semibold text-orange-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Fever present — consider puerperal sepsis, wound infection, or mastitis
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uterus & lochia */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Uterus &amp; Lochia</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Lochia</Label>
              <select value={lochia} onChange={(e) => setLochia(e.target.value as typeof lochia)} className={`${selectCls} ${lochia === 'abnormal' ? 'border-red-400 bg-red-50' : ''}`}>
                <option value="rubra">Rubra (red, days 1-4)</option>
                <option value="serosa">Serosa (pink/brown, days 4-10)</option>
                <option value="alba">Alba (white/yellow, days 10+)</option>
                <option value="abnormal">Abnormal (offensive/heavy)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Uterine Involution</Label>
              <select value={uterusInvolution} onChange={(e) => setUterusInvolution(e.target.value as typeof uterusInvolution)} className={`${selectCls} ${uterusInvolution === 'subinvolution' ? 'border-orange-400 bg-orange-50' : ''}`}>
                <option value="satisfactory">Satisfactory</option>
                <option value="subinvolution">Subinvolution</option>
              </select>
            </div>
          </div>
          {lochia === 'abnormal' && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-300 rounded-lg text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Abnormal lochia — consider endometritis or retained products
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breastfeeding & wound */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Breastfeeding &amp; Wound Healing</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Breastfeeding Status</Label>
              <select value={breastfeeding} onChange={(e) => setBreastfeeding(e.target.value as typeof breastfeeding)} className={selectCls}>
                <option value="exclusive">Exclusive breastfeeding</option>
                <option value="mixed">Mixed feeding</option>
                <option value="not-breastfeeding">Not breastfeeding</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Wound / Perineal Healing</Label>
              <select value={woundHealing} onChange={(e) => setWoundHealing(e.target.value as typeof woundHealing)} className={`${selectCls} ${woundHealing === 'infected' ? 'border-red-400 bg-red-50' : ''}`}>
                <option value="good">Good</option>
                <option value="poor">Poor</option>
                <option value="infected">Infected</option>
                <option value="na">N/A (no wound)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mood screening */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Mood Screening (Edinburgh PND Screen)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            <Label className="text-xs">Mood Assessment</Label>
            <div className="flex gap-2 mt-1">
              {(['normal', 'low-mood', 'possible-pnd'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMoodScreening(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    moodScreening === opt
                      ? opt === 'normal' ? 'bg-green-600 text-white border-green-600'
                        : opt === 'low-mood' ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {opt === 'normal' ? 'Normal' : opt === 'low-mood' ? 'Low Mood' : 'Possible PND'}
                </button>
              ))}
            </div>
          </div>
          {moodScreening !== 'normal' && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-orange-50 border border-orange-300 rounded-lg text-xs font-semibold text-orange-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {moodScreening === 'possible-pnd'
                ? 'Possible postnatal depression — refer for formal EPDS assessment and mental health support'
                : 'Low mood reported — monitor closely and provide support'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Baby assessment */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Baby Assessment</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Baby Weight (kg)</Label>
              <input type="number" step="0.01" min={0.3} max={10} value={babyWeight} onChange={(e) => setBabyWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Baby Condition</Label>
              <select value={babyCondition} onChange={(e) => setBabyCondition(e.target.value as typeof babyCondition)} className={`${selectCls} ${babyCondition === 'unwell' ? 'border-red-400 bg-red-50' : babyCondition === 'jaundice' ? 'border-orange-400 bg-orange-50' : ''}`}>
                <option value="well">Well</option>
                <option value="jaundice">Jaundice / Hyperbilirubinaemia</option>
                <option value="unwell">Unwell — refer</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family planning */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Family Planning</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={familyPlanningCounseled}
              onChange={(e) => setFamilyPlanningCounseled(e.target.checked)}
              className="rounded"
            />
            Family planning counselling provided
          </label>
          {familyPlanningCounseled && (
            <div className="space-y-1">
              <Label className="text-xs">Method chosen / plan</Label>
              <input
                type="text"
                value={familyPlanningChoice}
                onChange={(e) => setFamilyPlanningChoice(e.target.value)}
                placeholder="e.g. Progesterone-only pill, IUCD, Implant..."
                className={inputCls}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Additional Notes</CardTitle></CardHeader>
        <CardContent>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional clinical notes..." className={textareaCls} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !bpSystolic || !bpDiastolic || !temperature} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
          {saving ? 'Saving…' : 'Save Postnatal Note'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}
