'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import type { Condition, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { ANC_VISIT_TYPE_SYSTEM } from '../types';
import { calculateGestationalAge, detectVisitRiskFlags } from '../lib/anc-utils';
import { FHIR_SYSTEMS, LOINC_VITALS, LOINC_ANC } from '@/shared/constants/loinc';

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectCls = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaCls = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none";

interface HighRiskReviewFormProps {
  patientId: string;
  pregnancyId: string;
  lmpDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HighRiskReviewForm({ patientId, pregnancyId, lmpDate, onSuccess, onCancel }: HighRiskReviewFormProps) {
  const medplum = useMedplum();
  const [saving, setSaving] = useState(false);
  const ga = calculateGestationalAge(lmpDate);

  // Risk condition
  const [riskCondition, setRiskCondition] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Maternal vitals
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [weight, setWeight] = useState('');
  const [temperature, setTemperature] = useState('');

  // Fetal wellbeing
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [fetalMovement, setFetalMovement] = useState<'present' | 'reduced' | 'absent'>('present');

  // Investigations
  const [urineProtein, setUrineProtein] = useState<'negative' | 'trace' | '1+' | '2+' | '3+'>('negative');
  const [pcv, setPcv] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');

  // Escalation
  const [specialistRecommendations, setSpecialistRecommendations] = useState('');
  const [escalationPlan, setEscalationPlan] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'routine' | 'urgent' | 'emergency'>('urgent');

  // Assessment
  const [assessment, setAssessment] = useState('');

  // Auto-detect risk flags
  const riskFlags = detectVisitRiskFlags({
    bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
    bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
    urineProtein,
    fetalMovement,
    pcv: pcv ? Number(pcv) : undefined,
    bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riskCondition || !bpSystolic || !bpDiastolic) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();

      const noteText = [
        `High-Risk Review | GA: ${ga.weeks}w${ga.days}d`,
        `Risk condition: ${riskCondition}`,
        symptoms ? `Symptoms: ${symptoms}` : '',
        `BP: ${bpSystolic}/${bpDiastolic} mmHg`,
        weight ? `Weight: ${weight} kg` : '',
        temperature ? `Temp: ${temperature}°C` : '',
        fetalHeartRate ? `FHR: ${fetalHeartRate}/min` : '',
        `Fetal movement: ${fetalMovement}`,
        `Urine protein: ${urineProtein}`,
        pcv ? `PCV: ${pcv}%` : '',
        bloodGlucose ? `Blood glucose: ${bloodGlucose} mmol/L` : '',
        specialistRecommendations ? `Specialist recommendations: ${specialistRecommendations}` : '',
        escalationPlan ? `Escalation plan: ${escalationPlan}` : '',
        `Urgency: ${urgencyLevel}`,
        assessment ? `Assessment: ${assessment}` : '',
      ].filter(Boolean).join('. ');

      const encounter = await (medplum.createResource as (r: unknown) => Promise<Encounter>)({
        resourceType: 'Encounter',
        status: 'finished',
        class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'AMB' },
        type: [{
          coding: [{ system: ANC_VISIT_TYPE_SYSTEM, code: 'high-risk-review', display: 'High-Risk ANC Review' }],
          text: 'High-Risk ANC Review',
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

      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BP_PANEL }], text: 'Blood pressure' },
        component: [
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.SYSTOLIC }] }, valueQuantity: { value: Number(bpSystolic), unit: 'mmHg' } },
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.DIASTOLIC }] }, valueQuantity: { value: Number(bpDiastolic), unit: 'mmHg' } },
        ],
      }));

      if (weight) {
        promises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BODY_WEIGHT }], text: 'Body weight' },
          valueQuantity: { value: Number(weight), unit: 'kg' },
        }));
      }

      if (fetalHeartRate) {
        promises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.FETAL_HEART_RATE }], text: 'Fetal heart rate' },
          valueQuantity: { value: Number(fetalHeartRate), unit: '/min' },
        }));
      }

      if (pcv) {
        promises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'laboratory' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.PCV_HEMATOCRIT }], text: 'PCV / Haematocrit' },
          valueQuantity: { value: Number(pcv), unit: '%' },
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
      <div className="bg-orange-50 border border-orange-300 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-orange-600" />
        <span className="text-sm font-semibold text-orange-800">High-Risk ANC Review</span>
        <span className="ml-auto text-xs text-orange-600">GA {ga.weeks}w {ga.days}d</span>
      </div>

      {/* Risk flags */}
      {riskFlags.length > 0 && (
        <div className="space-y-2">
          {riskFlags.map((flag) => (
            <div
              key={flag.code}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                flag.severity === 'danger'
                  ? 'bg-red-50 border border-red-300 text-red-700'
                  : 'bg-orange-50 border border-orange-300 text-orange-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {flag.label}
            </div>
          ))}
        </div>
      )}

      {/* Risk condition & symptoms */}
      <Card className="border-l-4 border-orange-400">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Condition</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Risk Condition Being Reviewed *</Label>
            <input
              type="text"
              required
              value={riskCondition}
              onChange={(e) => setRiskCondition(e.target.value)}
              placeholder="e.g. Hypertension, Gestational Diabetes, Pre-eclampsia, Anaemia..."
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Current Symptoms</Label>
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe current symptoms and complaints..."
              className={textareaCls}
            />
          </div>
        </CardContent>
      </Card>

      {/* Maternal status */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Maternal Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">BP Systolic *</Label>
              <input
                type="number"
                required
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                className={`${inputCls} ${bpSystolic && Number(bpSystolic) >= 160 ? 'border-red-500 bg-red-50 ring-1 ring-red-400' : bpSystolic && Number(bpSystolic) >= 140 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">BP Diastolic *</Label>
              <input
                type="number"
                required
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                className={`${inputCls} ${bpDiastolic && Number(bpDiastolic) >= 110 ? 'border-red-500 bg-red-50 ring-1 ring-red-400' : bpDiastolic && Number(bpDiastolic) >= 90 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Weight (kg)</Label>
              <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Temperature (°C)</Label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                className={`${inputCls} ${temperature && Number(temperature) >= 38 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fetal wellbeing */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Fetal Wellbeing</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fetal Heart Rate (/min)</Label>
              <input
                type="number"
                value={fetalHeartRate}
                onChange={(e) => setFetalHeartRate(e.target.value)}
                className={`${inputCls} ${fetalHeartRate && (Number(fetalHeartRate) < 110 || Number(fetalHeartRate) > 160) ? 'border-red-400 bg-red-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fetal Movement</Label>
              <select value={fetalMovement} onChange={(e) => setFetalMovement(e.target.value as 'present' | 'reduced' | 'absent')} className={`${selectCls} ${fetalMovement === 'absent' ? 'border-red-400 bg-red-50' : fetalMovement === 'reduced' ? 'border-orange-400 bg-orange-50' : ''}`}>
                <option value="present">Present / Normal</option>
                <option value="reduced">Reduced</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          {fetalHeartRate && (Number(fetalHeartRate) < 110 || Number(fetalHeartRate) > 160) && (
            <div className="mt-2 flex items-center gap-2 p-2 bg-red-50 border border-red-300 rounded-lg text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Abnormal fetal heart rate ({fetalHeartRate}/min) — normal range 110-160/min
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investigations */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Investigations</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Urine Protein</Label>
              <select
                value={urineProtein}
                onChange={(e) => setUrineProtein(e.target.value as typeof urineProtein)}
                className={`${selectCls} ${['2+', '3+'].includes(urineProtein) ? 'border-red-400 bg-red-50' : ['1+', 'trace'].includes(urineProtein) ? 'border-orange-400 bg-orange-50' : ''}`}
              >
                {['negative', 'trace', '1+', '2+', '3+'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">PCV / Haematocrit (%)</Label>
              <input
                type="number"
                min={0}
                max={60}
                value={pcv}
                onChange={(e) => setPcv(e.target.value)}
                className={`${inputCls} ${pcv && Number(pcv) < 21 ? 'border-red-400 bg-red-50' : pcv && Number(pcv) < 30 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Blood Glucose (mmol/L)</Label>
              <input
                type="number"
                step="0.1"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className={`${inputCls} ${bloodGlucose && Number(bloodGlucose) > 11 ? 'border-red-400 bg-red-50' : bloodGlucose && Number(bloodGlucose) > 7.8 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialist & escalation */}
      <Card className="border-l-4 border-red-400">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Specialist Input &amp; Escalation Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Specialist Recommendations</Label>
            <textarea
              rows={2}
              value={specialistRecommendations}
              onChange={(e) => setSpecialistRecommendations(e.target.value)}
              placeholder="Document specialist/consultant recommendations..."
              className={textareaCls}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Urgency Level</Label>
            <div className="flex gap-2 mt-1">
              {(['routine', 'urgent', 'emergency'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setUrgencyLevel(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    urgencyLevel === opt
                      ? opt === 'routine' ? 'bg-blue-600 text-white border-blue-600'
                        : opt === 'urgent' ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Escalation Plan</Label>
            <textarea
              rows={2}
              value={escalationPlan}
              onChange={(e) => setEscalationPlan(e.target.value)}
              placeholder="Describe the escalation and management plan..."
              className={textareaCls}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assessment */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Clinical Assessment</CardTitle></CardHeader>
        <CardContent>
          <textarea
            rows={3}
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            placeholder="Overall clinical assessment and impression..."
            className={textareaCls}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !riskCondition || !bpSystolic || !bpDiastolic} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
          {saving ? 'Saving…' : 'Save High-Risk Review'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}
