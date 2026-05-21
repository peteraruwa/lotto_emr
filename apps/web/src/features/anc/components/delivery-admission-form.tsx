'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import type { Condition, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import { AlertTriangle, Activity } from 'lucide-react';
import { ANC_VISIT_TYPE_SYSTEM } from '../types';
import { calculateGestationalAge, detectVisitRiskFlags } from '../lib/anc-utils';
import { FHIR_SYSTEMS, LOINC_ANC } from '@/shared/constants/loinc';

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectCls = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaCls = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none";

interface DeliveryAdmissionFormProps {
  patientId: string;
  pregnancyId: string;
  lmpDate: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeliveryAdmissionForm({ patientId, pregnancyId, lmpDate, onSuccess, onCancel }: DeliveryAdmissionFormProps) {
  const medplum = useMedplum();
  const [saving, setSaving] = useState(false);
  const ga = calculateGestationalAge(lmpDate);

  // Contractions & membranes
  const [contractions, setContractions] = useState(false);
  const [contractionFrequency, setContractionFrequency] = useState('');
  const [membraneStatus, setMembraneStatus] = useState<'intact' | 'ruptured-spontaneous' | 'ruptured-artificial'>('intact');

  // Bleeding
  const [vaginalBleeding, setVaginalBleeding] = useState(false);
  const [bleedingAmount, setBleedingAmount] = useState<'none' | 'spotting' | 'moderate' | 'heavy'>('none');

  // Cervical assessment
  const [cervicalDilation, setCervicalDilation] = useState('');
  const [effacement, setEffacement] = useState('');

  // Fetal
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [presentation, setPresentation] = useState<'cephalic' | 'breech' | 'transverse'>('cephalic');
  const [station, setStation] = useState('');

  // Pelvic & plan
  const [pelvisAssessment, setPelvisAssessment] = useState<'adequate' | 'borderline' | 'inadequate'>('adequate');
  const [deliveryPlan, setDeliveryPlan] = useState<'svd' | 'assisted' | 'elective-cs' | 'emergency-cs'>('svd');
  const [deliveryPlanNotes, setDeliveryPlanNotes] = useState('');

  // Risk flags
  const riskFlags = detectVisitRiskFlags({
    fetalMovement: fetalHeartRate && Number(fetalHeartRate) < 110 ? 'absent' : undefined,
  });

  const fhrAbnormal = fetalHeartRate && (Number(fetalHeartRate) < 110 || Number(fetalHeartRate) > 160);
  const heavyBleeding = vaginalBleeding && (bleedingAmount === 'heavy' || bleedingAmount === 'moderate');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fetalHeartRate) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();

      const noteText = [
        `Labour/Delivery Admission | GA: ${ga.weeks}w${ga.days}d`,
        contractions ? `Contractions: yes, frequency: ${contractionFrequency || '—'}` : 'No contractions',
        `Membranes: ${membraneStatus}`,
        vaginalBleeding ? `Vaginal bleeding: ${bleedingAmount}` : 'No vaginal bleeding',
        cervicalDilation ? `Cervical dilation: ${cervicalDilation} cm` : '',
        effacement ? `Effacement: ${effacement}%` : '',
        `FHR: ${fetalHeartRate}/min`,
        `Presentation: ${presentation}`,
        station ? `Station: ${station}` : '',
        `Pelvis: ${pelvisAssessment}`,
        `Delivery plan: ${deliveryPlan}`,
        deliveryPlanNotes,
      ].filter(Boolean).join('. ');

      const encounter = await (medplum.createResource as (r: unknown) => Promise<Encounter>)({
        resourceType: 'Encounter',
        status: 'in-progress',
        class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'IMP' },
        type: [{
          coding: [{ system: ANC_VISIT_TYPE_SYSTEM, code: 'delivery-admission', display: 'Labour / Delivery Admission' }],
          text: 'Labour / Delivery Admission',
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

      // Fetal heart rate
      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.FETAL_HEART_RATE }], text: 'Fetal heart rate on admission' },
        valueQuantity: { value: Number(fetalHeartRate), unit: '/min' },
      }));

      // Cervical dilation
      if (cervicalDilation) {
        promises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
          code: {
            coding: [{ system: FHIR_SYSTEMS.LOINC, code: '11960-2', display: 'Cervical dilation' }],
            text: 'Cervical dilation',
          },
          valueQuantity: { value: Number(cervicalDilation), unit: 'cm' },
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
      <div className="bg-purple-50 border border-purple-300 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <Activity className="h-5 w-5 text-purple-600" />
        <span className="text-sm font-semibold text-purple-800">Labour / Delivery Admission</span>
        <span className="ml-auto text-xs text-purple-600">GA {ga.weeks}w {ga.days}d</span>
      </div>

      {/* Alert banners */}
      {fhrAbnormal && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 border border-red-300 text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Abnormal FHR on admission ({fetalHeartRate}/min) — normal 110-160/min. Consider urgent CTG / fetal assessment.
        </div>
      )}
      {heavyBleeding && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 border border-red-300 text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {bleedingAmount === 'heavy' ? 'Heavy' : 'Moderate'} vaginal bleeding — rule out placenta praevia / abruption
        </div>
      )}

      {/* Contractions & membranes */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Labour Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer col-span-2 sm:col-span-1">
              <input type="checkbox" checked={contractions} onChange={(e) => setContractions(e.target.checked)} className="rounded" />
              Uterine contractions present
            </label>
            {contractions && (
              <div className="space-y-1">
                <Label className="text-xs">Contraction Frequency</Label>
                <input
                  type="text"
                  value={contractionFrequency}
                  onChange={(e) => setContractionFrequency(e.target.value)}
                  placeholder="e.g. 3 in 10 min, lasting 45s"
                  className={inputCls}
                />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Membrane Status</Label>
            <select
              value={membraneStatus}
              onChange={(e) => setMembraneStatus(e.target.value as typeof membraneStatus)}
              className={`${selectCls} ${membraneStatus !== 'intact' ? 'border-orange-400 bg-orange-50' : ''}`}
            >
              <option value="intact">Intact</option>
              <option value="ruptured-spontaneous">Spontaneous Rupture of Membranes (SROM)</option>
              <option value="ruptured-artificial">Artificial Rupture of Membranes (ARM)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={vaginalBleeding} onChange={(e) => setVaginalBleeding(e.target.checked)} className="rounded" />
              Vaginal bleeding
            </label>
            {vaginalBleeding && (
              <div className="space-y-1">
                <Label className="text-xs">Bleeding Amount</Label>
                <select
                  value={bleedingAmount}
                  onChange={(e) => setBleedingAmount(e.target.value as typeof bleedingAmount)}
                  className={`${selectCls} ${bleedingAmount === 'heavy' ? 'border-red-400 bg-red-50' : bleedingAmount === 'moderate' ? 'border-orange-400 bg-orange-50' : ''}`}
                >
                  <option value="spotting">Spotting</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cervical assessment */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Vaginal / Cervical Assessment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Cervical Dilation (cm)</Label>
              <input type="number" min={0} max={10} step={0.5} value={cervicalDilation} onChange={(e) => setCervicalDilation(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Effacement (%)</Label>
              <input type="number" min={0} max={100} value={effacement} onChange={(e) => setEffacement(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Station</Label>
              <input
                type="text"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                placeholder="e.g. -2, 0, +1"
                className={inputCls}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fetal assessment */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Fetal Assessment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fetal Heart Rate (/min) *</Label>
              <input
                type="number"
                required
                value={fetalHeartRate}
                onChange={(e) => setFetalHeartRate(e.target.value)}
                className={`${inputCls} ${fhrAbnormal ? 'border-red-400 bg-red-50 ring-1 ring-red-400' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fetal Presentation</Label>
              <select value={presentation} onChange={(e) => setPresentation(e.target.value as typeof presentation)} className={`${selectCls} ${presentation !== 'cephalic' ? 'border-orange-400 bg-orange-50' : ''}`}>
                <option value="cephalic">Cephalic</option>
                <option value="breech">Breech</option>
                <option value="transverse">Transverse</option>
              </select>
            </div>
            {presentation !== 'cephalic' && (
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-300 rounded-lg text-xs font-semibold text-orange-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {presentation === 'breech' ? 'Breech presentation' : 'Transverse lie'} — consider obstetric review
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pelvic assessment & delivery plan */}
      <Card className="border-l-4 border-purple-400">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pelvic Assessment &amp; Delivery Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Clinical Pelvic Assessment</Label>
            <div className="flex gap-2 mt-1">
              {(['adequate', 'borderline', 'inadequate'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPelvisAssessment(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    pelvisAssessment === opt
                      ? opt === 'adequate' ? 'bg-green-600 text-white border-green-600'
                        : opt === 'borderline' ? 'bg-orange-500 text-white border-orange-500'
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
            <Label className="text-xs">Delivery Plan</Label>
            <select value={deliveryPlan} onChange={(e) => setDeliveryPlan(e.target.value as typeof deliveryPlan)} className={selectCls}>
              <option value="svd">Await SVD (Spontaneous Vaginal Delivery)</option>
              <option value="assisted">Assisted Vaginal Delivery (Forceps/Ventouse)</option>
              <option value="elective-cs">Elective Caesarean Section</option>
              <option value="emergency-cs">Emergency Caesarean Section</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Delivery Plan Notes</Label>
            <textarea
              rows={2}
              value={deliveryPlanNotes}
              onChange={(e) => setDeliveryPlanNotes(e.target.value)}
              placeholder="Document indications, consent, preparation orders..."
              className={textareaCls}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !fetalHeartRate} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
          {saving ? 'Saving…' : 'Save Admission Note'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}
