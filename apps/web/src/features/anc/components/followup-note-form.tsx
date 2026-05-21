'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import type { Condition, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import { AlertTriangle, Stethoscope } from 'lucide-react';
import { ANC_VISIT_TYPE_SYSTEM } from '../types';
import { calculateGestationalAge, detectVisitRiskFlags } from '../lib/anc-utils';
import { FHIR_SYSTEMS, LOINC_VITALS, LOINC_ANC } from '@/shared/constants/loinc';

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectCls = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaCls = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none";

interface FollowUpNoteFormProps {
  patientId: string;
  pregnancyId: string;
  visitNumber: number;
  lmpDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FollowUpNoteForm({ patientId, pregnancyId, visitNumber, lmpDate, onSuccess, onCancel }: FollowUpNoteFormProps) {
  const medplum = useMedplum();
  const [saving, setSaving] = useState(false);
  const ga = calculateGestationalAge(lmpDate);

  // Symptoms
  const [bleeding, setBleeding] = useState(false);
  const [headache, setHeadache] = useState(false);
  const [fetalMovement, setFetalMovement] = useState<'present' | 'reduced' | 'absent'>('present');
  const [contractions, setContractions] = useState(false);
  const [swelling, setSwelling] = useState(false);
  const [blurredVision, setBlurredVision] = useState(false);
  const [epigastricPain, setEpigastricPain] = useState(false);
  const [dysuria, setDysuria] = useState(false);
  const [otherSymptoms, setOtherSymptoms] = useState('');

  // Vitals
  const [weight, setWeight] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');

  // Obstetric exam
  const [fundalHeight, setFundalHeight] = useState('');
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [fetalMovementFelt, setFetalMovementFelt] = useState(true);
  const [presentation, setPresentation] = useState<'cephalic' | 'breech' | 'transverse' | ''>('');
  const [lie, setLie] = useState<'longitudinal' | 'transverse' | 'oblique' | ''>('');
  const [edema, setEdema] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');

  // Investigations
  const [urineProtein, setUrineProtein] = useState<'negative' | 'trace' | '1+' | '2+' | '3+'>('negative');
  const [urineGlucose, setUrineGlucose] = useState<'negative' | 'trace' | 'positive'>('negative');
  const [pcv, setPcv] = useState('');
  const [bloodGlucose, setBloodGlucose] = useState('');

  // Assessment + Plan
  const [assessment, setAssessment] = useState<'stable' | 'high-risk' | 'refer-urgently'>('stable');
  const [assessmentNote, setAssessmentNote] = useState('');
  const [medications, setMedications] = useState('');
  const [counseling, setCounseling] = useState('');
  const [nextVisitWeeks, setNextVisitWeeks] = useState(4);
  const [referral, setReferral] = useState('');

  // Auto-detect risk flags from current data
  const riskFlags = detectVisitRiskFlags({
    bpSystolic: bpSystolic ? Number(bpSystolic) : undefined,
    bpDiastolic: bpDiastolic ? Number(bpDiastolic) : undefined,
    urineProtein,
    fetalMovement,
    pcv: pcv ? Number(pcv) : undefined,
    bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
  });

  const preEclampsiaSign = (!!bpSystolic && Number(bpSystolic) >= 140) || (!!bpDiastolic && Number(bpDiastolic) >= 90) || ['1+','2+','3+'].includes(urineProtein);
  const gestDiabetesSign = bloodGlucose ? Number(bloodGlucose) > 7.8 : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight || !bpSystolic || !bpDiastolic) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();
      const noteText = [
        `Visit ${visitNumber} | GA: ${ga.weeks}w${ga.days}d`,
        `BP: ${bpSystolic}/${bpDiastolic} mmHg | Weight: ${weight} kg`,
        fundalHeight ? `Fundal height: ${fundalHeight} cm` : '',
        fetalHeartRate ? `FHR: ${fetalHeartRate}/min` : '',
        `Oedema: ${edema}`,
        `Urine protein: ${urineProtein}, glucose: ${urineGlucose}`,
        assessmentNote,
        medications ? `Medications: ${medications}` : '',
        counseling ? `Counselling: ${counseling}` : '',
        `Next visit: ${nextVisitWeeks} weeks`,
        referral ? `Referral: ${referral}` : '',
      ].filter(Boolean).join('. ');

      const encounter = await (medplum.createResource as (r: unknown) => Promise<Encounter>)({
        resourceType: 'Encounter',
        status: 'finished',
        class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'AMB' },
        type: [{
          coding: [{ system: ANC_VISIT_TYPE_SYSTEM, code: 'followup', display: 'ANC Follow-Up Visit' }],
          text: 'ANC Follow-Up Visit',
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
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BODY_WEIGHT }], text: 'Body weight' },
        valueQuantity: { value: Number(weight), unit: 'kg' },
      }));

      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BP_PANEL }], text: 'Blood pressure' },
        component: [
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.SYSTOLIC }] }, valueQuantity: { value: Number(bpSystolic), unit: 'mmHg' } },
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.DIASTOLIC }] }, valueQuantity: { value: Number(bpDiastolic), unit: 'mmHg' } },
        ],
      }));

      if (fundalHeight) {
        promises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.FUNDAL_HEIGHT }], text: 'Fundal height' },
          valueQuantity: { value: Number(fundalHeight), unit: 'cm' },
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

      await Promise.all(promises);
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Visit info strip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex flex-wrap gap-5 text-sm">
        <span><span className="text-blue-600 font-semibold">Visit</span> {visitNumber}</span>
        <span><span className="text-blue-600 font-semibold">GA</span> {ga.weeks}w {ga.days}d</span>
        <span className="text-xs text-blue-500">LMP: {lmpDate}</span>
      </div>

      {/* Risk flag alerts */}
      {riskFlags.length > 0 && (
        <div className="space-y-2">
          {riskFlags.map((flag) => (
            <div key={flag.code} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${flag.severity === 'danger' ? 'bg-red-50 border border-red-300 text-red-700' : 'bg-orange-50 border border-orange-300 text-orange-700'}`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {flag.label}
            </div>
          ))}
        </div>
      )}

      {/* Symptoms */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Symptoms Review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              ['Vaginal bleeding', bleeding, setBleeding],
              ['Headache', headache, setHeadache],
              ['Contractions', contractions, setContractions],
              ['Leg swelling', swelling, setSwelling],
              ['Blurred vision', blurredVision, setBlurredVision],
              ['Epigastric pain', epigastricPain, setEpigastricPain],
              ['Dysuria/UTI symptoms', dysuria, setDysuria],
            ] as [string, boolean, React.Dispatch<React.SetStateAction<boolean>>][]).map(([label, val, setter]) => (
              <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                {label}
              </label>
            ))}
          </div>
          <div>
            <Label className="text-xs">Fetal movement (reported by patient)</Label>
            <select value={fetalMovement} onChange={(e) => setFetalMovement(e.target.value as 'present' | 'reduced' | 'absent')} className={selectCls + ' mt-1'}>
              <option value="present">Present / Good</option>
              <option value="reduced">Reduced</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Other symptoms</Label>
            <input type="text" value={otherSymptoms} onChange={(e) => setOtherSymptoms(e.target.value)} className={inputCls + ' mt-1'} />
          </div>
        </CardContent>
      </Card>

      {/* Vitals */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Maternal Vitals</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Weight (kg) *</Label>
              <input type="number" step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
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
              <Label className="text-xs">Temperature (°C)</Label>
              <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputCls} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obstetric exam */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Obstetric Examination
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fundal Height (cm)</Label>
              <input type="number" step="0.5" value={fundalHeight} onChange={(e) => setFundalHeight(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fetal Heart Rate (/min)</Label>
              <input type="number" value={fetalHeartRate} onChange={(e) => setFetalHeartRate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Presentation</Label>
              <select value={presentation} onChange={(e) => setPresentation(e.target.value as 'cephalic' | 'breech' | 'transverse' | '')} className={selectCls}>
                <option value="">Not assessed</option>
                <option value="cephalic">Cephalic</option>
                <option value="breech">Breech</option>
                <option value="transverse">Transverse</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lie</Label>
              <select value={lie} onChange={(e) => setLie(e.target.value as 'longitudinal' | 'transverse' | 'oblique' | '')} className={selectCls}>
                <option value="">Not assessed</option>
                <option value="longitudinal">Longitudinal</option>
                <option value="transverse">Transverse</option>
                <option value="oblique">Oblique</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Oedema</Label>
              <select value={edema} onChange={(e) => setEdema(e.target.value as 'none' | 'mild' | 'moderate' | 'severe')} className={selectCls}>
                <option value="none">None</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm mt-5">
                <input type="checkbox" checked={fetalMovementFelt} onChange={(e) => setFetalMovementFelt(e.target.checked)} className="rounded" />
                FMs felt on exam
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investigations */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Investigations Review</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Urine Protein</Label>
              <select
                value={urineProtein}
                onChange={(e) => setUrineProtein(e.target.value as 'negative' | 'trace' | '1+' | '2+' | '3+')}
                className={`${selectCls} ${['1+','2+','3+'].includes(urineProtein) ? 'border-red-400 bg-red-50' : ''}`}
              >
                {['negative','trace','1+','2+','3+'].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Urine Glucose</Label>
              <select value={urineGlucose} onChange={(e) => setUrineGlucose(e.target.value as 'negative' | 'trace' | 'positive')} className={selectCls}>
                {['negative','trace','positive'].map((v) => <option key={v}>{v}</option>)}
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
                className={`${inputCls} ${pcv && Number(pcv) < 30 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Blood Glucose (mmol/L)</Label>
              <input
                type="number"
                step="0.1"
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className={`${inputCls} ${bloodGlucose && Number(bloodGlucose) > 7.8 ? 'border-orange-400 bg-orange-50' : ''}`}
              />
            </div>
          </div>
          {(preEclampsiaSign || gestDiabetesSign) && (
            <div className="mt-3 space-y-1.5">
              {preEclampsiaSign && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-300 rounded-lg text-xs font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Pre-eclampsia signs present — elevated BP and/or proteinuria
                </div>
              )}
              {gestDiabetesSign && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-300 rounded-lg text-xs font-semibold text-orange-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Hyperglycaemia detected — consider GDM screening
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assessment + Plan */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Assessment &amp; Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Overall Assessment</Label>
            <div className="flex gap-2 mt-1">
              {(['stable','high-risk','refer-urgently'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAssessment(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    assessment === opt
                      ? opt === 'stable' ? 'bg-green-600 text-white border-green-600'
                        : opt === 'high-risk' ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {opt === 'stable' ? 'Stable' : opt === 'high-risk' ? 'High Risk' : '⚠ Refer Urgently'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Assessment note</Label>
            <textarea rows={2} value={assessmentNote} onChange={(e) => setAssessmentNote(e.target.value)} className={textareaCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Medications / Changes</Label>
              <textarea rows={2} value={medications} onChange={(e) => setMedications(e.target.value)} className={textareaCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Counselling</Label>
              <textarea rows={2} value={counseling} onChange={(e) => setCounseling(e.target.value)} className={textareaCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Next visit (weeks)</Label>
              <input type="number" min={1} max={8} value={nextVisitWeeks} onChange={(e) => setNextVisitWeeks(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Referral</Label>
              <input type="text" value={referral} onChange={(e) => setReferral(e.target.value)} placeholder="Refer to..." className={inputCls} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !weight || !bpSystolic || !bpDiastolic} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white">
          {saving ? 'Saving…' : 'Save Follow-Up Note'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}
