'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import type { Condition, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import { Baby, AlertTriangle } from 'lucide-react';
import { ANC_VISIT_TYPE_SYSTEM } from '../types';
import { FHIR_SYSTEMS, LOINC_ANC } from '@/shared/constants/loinc';

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectCls = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaCls = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none";

interface DeliveryNoteFormProps {
  patientId: string;
  pregnancyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeliveryNoteForm({ patientId, pregnancyId, onSuccess, onCancel }: DeliveryNoteFormProps) {
  const medplum = useMedplum();
  const [saving, setSaving] = useState(false);

  // Delivery details
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState(
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  );
  const [modeOfDelivery, setModeOfDelivery] = useState<'svd' | 'forceps' | 'vacuum' | 'elective-cs' | 'emergency-cs'>('svd');
  const [indicationForCS, setIndicationForCS] = useState('');

  // Baby
  const [babySex, setBabySex] = useState<'male' | 'female'>('male');
  const [birthWeight, setBirthWeight] = useState('');
  const [apgar1Min, setApgar1Min] = useState('');
  const [apgar5Min, setApgar5Min] = useState('');

  // Third stage
  const [placentaDelivery, setPlacentaDelivery] = useState<'complete' | 'incomplete' | 'retained'>('complete');
  const [bloodLoss, setBloodLoss] = useState('');
  const [perinealTear, setPerinealTear] = useState<'none' | '1st' | '2nd' | '3rd' | '4th'>('none');

  // Condition + notes
  const [complications, setComplications] = useState('');
  const [maternalCondition, setMaternalCondition] = useState<'stable' | 'guarded' | 'critical'>('stable');
  const [neonatalCondition, setNeonatalCondition] = useState<'well' | 'requires-support' | 'admitted-nicu'>('well');
  const [notes, setNotes] = useState('');

  const isCS = modeOfDelivery === 'elective-cs' || modeOfDelivery === 'emergency-cs';

  const modeLabels: Record<typeof modeOfDelivery, string> = {
    'svd': 'Spontaneous Vaginal Delivery (SVD)',
    'forceps': 'Forceps Delivery',
    'vacuum': 'Vacuum/Ventouse Delivery',
    'elective-cs': 'Elective Caesarean Section',
    'emergency-cs': 'Emergency Caesarean Section',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!birthWeight || !apgar1Min || !apgar5Min) return;
    setSaving(true);

    try {
      const deliveryDateTime = `${deliveryDate}T${deliveryTime}:00`;
      const now = new Date().toISOString();

      const noteText = [
        `Mode of delivery: ${modeLabels[modeOfDelivery]}`,
        isCS && indicationForCS ? `Indication for CS: ${indicationForCS}` : '',
        `Baby sex: ${babySex}`,
        `Birth weight: ${birthWeight} kg`,
        `APGAR 1 min: ${apgar1Min}, APGAR 5 min: ${apgar5Min}`,
        `Placenta: ${placentaDelivery}`,
        `Estimated blood loss: ${bloodLoss || '—'} mL`,
        `Perineal tear: ${perinealTear}`,
        complications ? `Complications: ${complications}` : '',
        `Maternal condition: ${maternalCondition}`,
        `Neonatal condition: ${neonatalCondition}`,
        notes,
      ].filter(Boolean).join('. ');

      const encounter = await (medplum.createResource as (r: unknown) => Promise<Encounter>)({
        resourceType: 'Encounter',
        status: 'finished',
        class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'IMP' },
        type: [{
          coding: [{ system: ANC_VISIT_TYPE_SYSTEM, code: 'delivery', display: 'Delivery Note' }],
          text: 'Delivery Note',
        }],
        subject: { reference: `Patient/${patientId}` },
        period: { start: deliveryDateTime, end: now },
        reasonReference: [{ reference: `Condition/${pregnancyId}` }],
        note: [{ text: noteText }],
      });

      const obsBase = {
        resourceType: 'Observation' as const,
        status: 'final' as const,
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        effectiveDateTime: deliveryDateTime,
      };

      const promises: Promise<unknown>[] = [];

      // Birth weight observation
      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.BIRTH_WEIGHT }], text: 'Birth weight' },
        valueQuantity: { value: Number(birthWeight), unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
      }));

      // APGAR 1 minute
      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.APGAR_1MIN }], text: 'APGAR score 1 minute' },
        valueInteger: Number(apgar1Min),
      }));

      // APGAR 5 minutes
      promises.push(medplum.createResource({
        ...obsBase,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.APGAR_5MIN }], text: 'APGAR score 5 minutes' },
        valueInteger: Number(apgar5Min),
      }));

      // Update pregnancy Condition to resolved
      try {
        const conditionResource = await medplum.readResource('Condition', pregnancyId);
        await medplum.updateResource({
          ...conditionResource,
          clinicalStatus: {
            coding: [{ system: FHIR_SYSTEMS.CONDITION_CLINICAL, code: 'resolved' }],
          },
        });
      } catch {
        // Non-fatal — continue even if condition update fails
      }

      await Promise.all(promises);
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
        <Baby className="h-5 w-5 text-pink-600" />
        <span className="text-sm font-semibold text-pink-800">Delivery Note</span>
      </div>

      {/* Delivery details */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Delivery Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date of Delivery *</Label>
              <input type="date" required value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Time of Delivery *</Label>
              <input type="time" required value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mode of Delivery *</Label>
            <select required value={modeOfDelivery} onChange={(e) => setModeOfDelivery(e.target.value as typeof modeOfDelivery)} className={selectCls}>
              <option value="svd">Spontaneous Vaginal Delivery (SVD)</option>
              <option value="forceps">Forceps Delivery</option>
              <option value="vacuum">Vacuum / Ventouse Delivery</option>
              <option value="elective-cs">Elective Caesarean Section</option>
              <option value="emergency-cs">Emergency Caesarean Section</option>
            </select>
          </div>
          {isCS && (
            <div className="space-y-1">
              <Label className="text-xs">Indication for CS</Label>
              <input
                type="text"
                value={indicationForCS}
                onChange={(e) => setIndicationForCS(e.target.value)}
                placeholder="e.g. Failure to progress, Fetal distress..."
                className={inputCls}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Baby details */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Neonatal Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Baby Sex *</Label>
              <select required value={babySex} onChange={(e) => setBabySex(e.target.value as 'male' | 'female')} className={selectCls}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Birth Weight (kg) *</Label>
              <input type="number" step="0.01" min={0.3} max={7} required value={birthWeight} onChange={(e) => setBirthWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">APGAR 1 min (0-10) *</Label>
              <input type="number" min={0} max={10} required value={apgar1Min} onChange={(e) => setApgar1Min(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">APGAR 5 min (0-10) *</Label>
              <input type="number" min={0} max={10} required value={apgar5Min} onChange={(e) => setApgar5Min(e.target.value)} className={inputCls} />
            </div>
          </div>
          {apgar5Min && Number(apgar5Min) <= 6 && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-300 rounded-lg text-xs font-semibold text-orange-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              APGAR score at 5 min is low ({apgar5Min}) — ensure neonatal resuscitation is documented
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Neonatal Condition</Label>
            <div className="flex gap-2 mt-1">
              {(['well', 'requires-support', 'admitted-nicu'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setNeonatalCondition(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    neonatalCondition === opt
                      ? opt === 'well' ? 'bg-green-600 text-white border-green-600'
                        : opt === 'requires-support' ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {opt === 'well' ? 'Well' : opt === 'requires-support' ? 'Requires Support' : 'Admitted NICU'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Third stage & maternal */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Third Stage &amp; Maternal Condition</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Placenta Delivery</Label>
              <select value={placentaDelivery} onChange={(e) => setPlacentaDelivery(e.target.value as typeof placentaDelivery)} className={selectCls}>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
                <option value="retained">Retained</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estimated Blood Loss (mL)</Label>
              <input
                type="number"
                min={0}
                value={bloodLoss}
                onChange={(e) => setBloodLoss(e.target.value)}
                className={`${inputCls} ${bloodLoss && Number(bloodLoss) >= 500 ? 'border-red-400 bg-red-50' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Perineal Tear</Label>
              <select value={perinealTear} onChange={(e) => setPerinealTear(e.target.value as typeof perinealTear)} className={selectCls}>
                <option value="none">None</option>
                <option value="1st">1st Degree</option>
                <option value="2nd">2nd Degree</option>
                <option value="3rd">3rd Degree</option>
                <option value="4th">4th Degree</option>
              </select>
            </div>
          </div>
          {bloodLoss && Number(bloodLoss) >= 500 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-300 rounded-lg text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              PPH threshold reached (blood loss ≥500 mL) — document management
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Maternal Condition</Label>
            <div className="flex gap-2 mt-1">
              {(['stable', 'guarded', 'critical'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMaternalCondition(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    maternalCondition === opt
                      ? opt === 'stable' ? 'bg-green-600 text-white border-green-600'
                        : opt === 'guarded' ? 'bg-orange-500 text-white border-orange-500'
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
            <Label className="text-xs">Complications</Label>
            <textarea rows={2} value={complications} onChange={(e) => setComplications(e.target.value)} placeholder="Document any complications..." className={textareaCls} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Additional Notes</Label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional clinical notes..." className={textareaCls} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving || !birthWeight || !apgar1Min || !apgar5Min} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">
          {saving ? 'Saving…' : 'Save Delivery Note'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
}
