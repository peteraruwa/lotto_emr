'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import type { Condition, Encounter } from '@medplum/fhirtypes';
import { Button, Card, CardContent, CardHeader, CardTitle, Label } from '@lotto-emr/ui';
import { Baby, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { BookingNoteFormData, AncRiskLevel, PregnancyRecord } from '../types';
import { ANC_EXT, ANC_VISIT_TYPE_SYSTEM } from '../types';
import { calculateEDD, calculateGestationalAge, deriveRiskLevel } from '../lib/anc-utils';
import { FHIR_SYSTEMS, LOINC_VITALS, LOINC_ANC } from '@/shared/constants/loinc';

// Inline styled input for reuse within this file
function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inputCls = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const selectCls = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaCls = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none";
const checkboxRowCls = "flex items-center gap-2 text-sm";

const RISK_FACTOR_OPTIONS = [
  'Advanced maternal age (>35)',
  'Teenage pregnancy (<18)',
  'Grand multiparity (≥5 deliveries)',
  'Hypertension',
  'Diabetes mellitus',
  'Sickle cell disease (SS)',
  'Previous C-section',
  'Multiple pregnancy',
  'Anaemia (PCV <30%)',
  'HIV positive',
  'Hepatitis B positive',
  'Previous stillbirth',
  'Previous PPH',
  'Previous eclampsia/pre-eclampsia',
  'Booking after 20 weeks',
  'Previous preterm birth',
  'Obesity (BMI >30)',
  'Fibroids',
];

const RISK_BADGE: Record<AncRiskLevel, string> = {
  low: 'bg-green-100 text-green-700 border-green-300',
  moderate: 'bg-orange-100 text-orange-700 border-orange-300',
  high: 'bg-red-100 text-red-700 border-red-300',
};

interface BookingNoteFormProps {
  patientId: string;
  onSuccess: (pregnancy: PregnancyRecord) => void;
}

type SectionKey = 'symptoms' | 'obstetric' | 'gynaecology' | 'medical' | 'social' | 'exam' | 'investigations' | 'risk' | 'plan';

export function BookingNoteForm({ patientId, onSuccess }: BookingNoteFormProps) {
  const medplum = useMedplum();
  const [submitting, setSubmitting] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['symptoms', 'exam', 'risk']));

  // ── Pregnancy basics ─────────────────────────────────────────────────────────
  const [lmpDate, setLmpDate] = useState('');
  const [eddOverride, setEddOverride] = useState('');
  const [gravida, setGravida] = useState(1);
  const [para, setPara] = useState(0);
  const [abortus, setAbortus] = useState(0);

  // ── Symptoms ─────────────────────────────────────────────────────────────────
  const [bleeding, setBleeding] = useState(false);
  const [fetalMovement, setFetalMovement] = useState<BookingNoteFormData['fetalMovement']>('na');
  const [nausea, setNausea] = useState(false);
  const [vomiting, setVomiting] = useState(false);
  const [otherSymptoms, setOtherSymptoms] = useState('');

  // ── Past obstetric ───────────────────────────────────────────────────────────
  const [prevCSections, setPrevCSections] = useState(0);
  const [prevStillbirths, setPrevStillbirths] = useState(0);
  const [prevMiscarriages, setPrevMiscarriages] = useState(0);
  const [prevPreterm, setPrevPreterm] = useState(false);
  const [prevPPH, setPrevPPH] = useState(false);
  const [prevEclampsia, setPrevEclampsia] = useState(false);
  const [obstetricNotes, setObstetricNotes] = useState('');

  // ── Gynaecology ──────────────────────────────────────────────────────────────
  const [regularMenses, setRegularMenses] = useState(true);
  const [fibroids, setFibroids] = useState(false);
  const [stiHistory, setStiHistory] = useState(false);
  const [contraceptionHistory, setContraceptionHistory] = useState('');

  // ── Medical history ──────────────────────────────────────────────────────────
  const [hypertension, setHypertension] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [asthma, setAsthma] = useState(false);
  const [sickleCellDisease, setSickleCellDisease] = useState(false);
  const [hivStatus, setHivStatus] = useState<BookingNoteFormData['hivStatus']>('unknown');
  const [hbsAgStatus, setHbsAgStatus] = useState<BookingNoteFormData['hbsAgStatus']>('unknown');
  const [otherMedical, setOtherMedical] = useState('');

  // ── Social ───────────────────────────────────────────────────────────────────
  const [twinHistory, setTwinHistory] = useState(false);
  const [smokingAlcohol, setSmokingAlcohol] = useState(false);
  const [socialNotes, setSocialNotes] = useState('');

  // ── Examination ──────────────────────────────────────────────────────────────
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [temperature, setTemperature] = useState('');
  const [fundalHeight, setFundalHeight] = useState('');
  const [fetalHeartRate, setFetalHeartRate] = useState('');
  const [presentation, setPresentation] = useState<BookingNoteFormData['presentation']>('na');
  const [edema, setEdema] = useState<BookingNoteFormData['edema']>('none');
  const [generalCondition, setGeneralCondition] = useState<BookingNoteFormData['generalCondition']>('good');

  // ── Investigations ───────────────────────────────────────────────────────────
  const [bloodGroup, setBloodGroup] = useState('');
  const [genotype, setGenotype] = useState('');
  const [pcv, setPcv] = useState('');
  const [hivResult, setHivResult] = useState<BookingNoteFormData['hivResult']>('pending');
  const [vdrl, setVdrl] = useState<BookingNoteFormData['vdrl']>('pending');
  const [hbsAg, setHbsAg] = useState<BookingNoteFormData['hbsAg']>('pending');
  const [urinalysis, setUrinalysis] = useState('');
  const [ultrasoundDone, setUltrasoundDone] = useState(false);
  const [ultrasoundFindings, setUltrasoundFindings] = useState('');

  // ── Risk ─────────────────────────────────────────────────────────────────────
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [manualRisk, setManualRisk] = useState<AncRiskLevel | null>(null);

  // ── Plan ─────────────────────────────────────────────────────────────────────
  const [ironFolate, setIronFolate] = useState(true);
  const [tetanusToxoid, setTetanusToxoid] = useState(true);
  const [ipt, setIpt] = useState(true);
  const [bedNetProvided, setBedNetProvided] = useState(true);
  const [otherSupplements, setOtherSupplements] = useState('');
  const [counselingTopics, setCounselingTopics] = useState('');
  const [nextVisitWeeks, setNextVisitWeeks] = useState(4);
  const [referral, setReferral] = useState('');

  // ── Derived values ───────────────────────────────────────────────────────────
  const eddByLmp = lmpDate ? calculateEDD(lmpDate) : '';
  const edd = eddOverride || eddByLmp;
  const ga = lmpDate ? calculateGestationalAge(lmpDate) : null;
  const autoRisk = deriveRiskLevel(riskFactors.length);
  const riskLevel: AncRiskLevel = manualRisk ?? autoRisk;

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleRiskFactor(factor: string) {
    setRiskFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor],
    );
    setManualRisk(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lmpDate || !weight || !bpSystolic || !bpDiastolic) return;
    setSubmitting(true);

    try {
      const now = new Date().toISOString();

      // 1. Create Pregnancy Condition
      const condition = await medplum.createResource<Condition>({
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [{ system: FHIR_SYSTEMS.CONDITION_CLINICAL, code: 'active' }],
        },
        code: {
          coding: [{ system: FHIR_SYSTEMS.SNOMED, code: '77386006', display: 'Pregnancy' }],
          text: 'Pregnancy',
        },
        subject: { reference: `Patient/${patientId}` },
        onsetDateTime: lmpDate,
        recordedDate: now,
        extension: [
          { url: ANC_EXT.EDD, valueDate: edd },
          { url: ANC_EXT.GRAVIDA, valueInteger: gravida },
          { url: ANC_EXT.PARA, valueInteger: para },
          { url: ANC_EXT.ABORTUS, valueInteger: abortus },
          { url: ANC_EXT.RISK_LEVEL, valueString: riskLevel },
          { url: ANC_EXT.RISK_FACTORS, valueString: riskFactors.join('|') },
          { url: ANC_EXT.BLOOD_GROUP, valueString: bloodGroup },
          { url: ANC_EXT.GENOTYPE, valueString: genotype },
          { url: ANC_EXT.HIV_STATUS, valueString: hivResult },
          { url: ANC_EXT.HBSAG_STATUS, valueString: hbsAg },
          { url: ANC_EXT.VDRL_STATUS, valueString: vdrl },
        ],
        note: [{ text: `G${gravida}P${para}+${abortus} | LMP: ${lmpDate} | EDD: ${edd} | Risk: ${riskLevel}` }],
      });

      // 2. Create Booking Encounter
      const planText = [
        ironFolate ? 'Iron + Folic acid' : '',
        tetanusToxoid ? 'Tetanus toxoid' : '',
        ipt ? 'IPT' : '',
        bedNetProvided ? 'Insecticide-treated net' : '',
        otherSupplements,
        counselingTopics ? `Counselling: ${counselingTopics}` : '',
        referral ? `Referral: ${referral}` : '',
        `Next visit in ${nextVisitWeeks} weeks`,
      ].filter(Boolean).join('. ');

      const examNote = [
        `Weight: ${weight} kg, Height: ${height || '—'} cm`,
        `BP: ${bpSystolic}/${bpDiastolic} mmHg`,
        fundalHeight ? `Fundal height: ${fundalHeight} cm` : '',
        fetalHeartRate ? `FHR: ${fetalHeartRate}/min` : '',
        `Presentation: ${presentation}`,
        `Oedema: ${edema}`,
        `General condition: ${generalCondition}`,
      ].filter(Boolean).join('. ');

      const encounter = await (medplum.createResource as (r: unknown) => Promise<Encounter>)({
        resourceType: 'Encounter',
        status: 'finished',
        class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'AMB' },
        type: [{
          coding: [{ system: ANC_VISIT_TYPE_SYSTEM, code: 'booking', display: 'ANC Booking Visit' }],
          text: 'ANC Booking Visit',
        }],
        subject: { reference: `Patient/${patientId}` },
        period: { start: now },
        reasonReference: [{ reference: `Condition/${condition.id}` }],
        note: [{ text: `${examNote}. Plan: ${planText}` }],
      });

      // 3. Create Observations
      const obsBase = {
        resourceType: 'Observation' as const,
        status: 'final' as const,
        category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'vital-signs' }] }],
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounter.id}` },
        effectiveDateTime: now,
      };

      const obsPromises: Promise<unknown>[] = [];

      obsPromises.push(medplum.createResource({
        ...obsBase,
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BODY_WEIGHT }], text: 'Body weight' },
        valueQuantity: { value: Number(weight), unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' },
      }));

      obsPromises.push(medplum.createResource({
        ...obsBase,
        code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.BP_PANEL }], text: 'Blood pressure' },
        component: [
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.SYSTOLIC }] }, valueQuantity: { value: Number(bpSystolic), unit: 'mmHg' } },
          { code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_VITALS.DIASTOLIC }] }, valueQuantity: { value: Number(bpDiastolic), unit: 'mmHg' } },
        ],
      }));

      if (fundalHeight) {
        obsPromises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.FUNDAL_HEIGHT }], text: 'Fundal height' },
          valueQuantity: { value: Number(fundalHeight), unit: 'cm' },
        }));
      }

      if (fetalHeartRate) {
        obsPromises.push(medplum.createResource({
          ...obsBase,
          category: [{ coding: [{ system: FHIR_SYSTEMS.OBSERVATION_CAT, code: 'exam' }] }],
          code: { coding: [{ system: FHIR_SYSTEMS.LOINC, code: LOINC_ANC.FETAL_HEART_RATE }], text: 'Fetal heart rate' },
          valueQuantity: { value: Number(fetalHeartRate), unit: '/min' },
        }));
      }

      await Promise.all(obsPromises);

      const pregnancyRecord: PregnancyRecord = {
        conditionId: condition.id ?? '',
        patientId,
        lmpDate,
        edd,
        gravida,
        para,
        abortus,
        riskLevel,
        riskFactors,
        bloodGroup: bloodGroup || undefined,
        genotype: genotype || undefined,
        hivStatus: hivResult,
        hbsAgStatus: hbsAg,
        vdrlStatus: vdrl,
        enrollmentDate: now.split('T')[0],
      };

      onSuccess(pregnancyRecord);
    } finally {
      setSubmitting(false);
    }
  }

  function SectionHeader({ id, title, icon }: { id: SectionKey; title: string; icon?: React.ReactNode }) {
    const open = openSections.has(id);
    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          {icon}
          {title}
        </span>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── Pregnancy basics (always visible) ────────────────────────────── */}
      <Card className="border-l-4 border-teal-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Baby className="h-5 w-5 text-teal-600" />
            ANC Booking Note — Initial Visit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Field label="Last Menstrual Period (LMP)" required>
                <input type="date" required value={lmpDate} onChange={(e) => setLmpDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
            {lmpDate && (
              <>
                <div>
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">EDD (by LMP)</p>
                  <p className="text-sm font-bold text-gray-900">{eddByLmp}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">Gestational Age</p>
                  <p className="text-sm font-bold text-gray-900">{ga ? `${ga.weeks}w ${ga.days}d` : '—'}</p>
                </div>
              </>
            )}
            <Field label="EDD by Ultrasound (if done)">
              <input type="date" value={eddOverride} onChange={(e) => setEddOverride(e.target.value)} className={inputCls} />
            </Field>
          </div>

          {/* GPOA */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Gravida" required>
              <input type="number" min={1} value={gravida} onChange={(e) => setGravida(Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Para">
              <input type="number" min={0} value={para} onChange={(e) => setPara(Number(e.target.value))} className={inputCls} />
            </Field>
            <Field label="Abortus">
              <input type="number" min={0} value={abortus} onChange={(e) => setAbortus(Number(e.target.value))} className={inputCls} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Collapsible sections ─────────────────────────────────────────────── */}

      {/* Present Pregnancy History */}
      <Card>
        <SectionHeader id="symptoms" title="Present Pregnancy History" />
        {openSections.has('symptoms') && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Vaginal bleeding', bleeding, setBleeding] as const,
                ['Nausea', nausea, setNausea] as const,
                ['Vomiting', vomiting, setVomiting] as const,
              ].map(([label, val, setter]) => (
                <label key={label} className={checkboxRowCls}>
                  <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <Field label="Fetal Movement">
              <select value={fetalMovement} onChange={(e) => setFetalMovement(e.target.value as BookingNoteFormData['fetalMovement'])} className={selectCls}>
                <option value="na">Not applicable (early)</option>
                <option value="present">Present</option>
                <option value="reduced">Reduced</option>
                <option value="absent">Absent</option>
              </select>
            </Field>
            <Field label="Other symptoms / history of present pregnancy">
              <textarea rows={2} value={otherSymptoms} onChange={(e) => setOtherSymptoms(e.target.value)} className={textareaCls} />
            </Field>
          </CardContent>
        )}
      </Card>

      {/* Past Obstetric History */}
      <Card>
        <SectionHeader id="obstetric" title="Past Obstetric History" />
        {openSections.has('obstetric') && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Previous C-sections">
                <input type="number" min={0} value={prevCSections} onChange={(e) => setPrevCSections(Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Stillbirths">
                <input type="number" min={0} value={prevStillbirths} onChange={(e) => setPrevStillbirths(Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Miscarriages">
                <input type="number" min={0} value={prevMiscarriages} onChange={(e) => setPrevMiscarriages(Number(e.target.value))} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Previous preterm birth', prevPreterm, setPrevPreterm] as const,
                ['Previous PPH', prevPPH, setPrevPPH] as const,
                ['Previous eclampsia/pre-eclampsia', prevEclampsia, setPrevEclampsia] as const,
              ].map(([label, val, setter]) => (
                <label key={label} className={checkboxRowCls}>
                  <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <Field label="Additional obstetric notes">
              <textarea rows={2} value={obstetricNotes} onChange={(e) => setObstetricNotes(e.target.value)} className={textareaCls} />
            </Field>
          </CardContent>
        )}
      </Card>

      {/* Gynaecological History */}
      <Card>
        <SectionHeader id="gynaecology" title="Gynaecological History" />
        {openSections.has('gynaecology') && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Regular menstrual cycle', regularMenses, setRegularMenses] as const,
                ['Fibroids', fibroids, setFibroids] as const,
                ['STI history', stiHistory, setStiHistory] as const,
              ].map(([label, val, setter]) => (
                <label key={label} className={checkboxRowCls}>
                  <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <Field label="Previous contraception use">
              <input type="text" value={contraceptionHistory} onChange={(e) => setContraceptionHistory(e.target.value)} placeholder="e.g. Pills for 2 years, IUCD" className={inputCls} />
            </Field>
          </CardContent>
        )}
      </Card>

      {/* Medical History */}
      <Card>
        <SectionHeader id="medical" title="Medical / Surgical History" />
        {openSections.has('medical') && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Hypertension', hypertension, setHypertension] as const,
                ['Diabetes mellitus', diabetes, setDiabetes] as const,
                ['Asthma', asthma, setAsthma] as const,
                ['Sickle cell disease (SS)', sickleCellDisease, setSickleCellDisease] as const,
              ].map(([label, val, setter]) => (
                <label key={label} className={checkboxRowCls}>
                  <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="HIV status">
                <select value={hivStatus} onChange={(e) => setHivStatus(e.target.value as BookingNoteFormData['hivStatus'])} className={selectCls}>
                  <option value="unknown">Unknown</option>
                  <option value="negative">Negative</option>
                  <option value="positive">Positive</option>
                </select>
              </Field>
              <Field label="HBsAg status">
                <select value={hbsAgStatus} onChange={(e) => setHbsAgStatus(e.target.value as BookingNoteFormData['hbsAgStatus'])} className={selectCls}>
                  <option value="unknown">Unknown</option>
                  <option value="negative">Negative</option>
                  <option value="positive">Positive</option>
                </select>
              </Field>
            </div>
            <Field label="Other medical/surgical history">
              <textarea rows={2} value={otherMedical} onChange={(e) => setOtherMedical(e.target.value)} className={textareaCls} />
            </Field>
          </CardContent>
        )}
      </Card>

      {/* Family / Social */}
      <Card>
        <SectionHeader id="social" title="Family / Social History" />
        {openSections.has('social') && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Family history of multiple gestation', twinHistory, setTwinHistory] as const,
                ['Smoking or alcohol use', smokingAlcohol, setSmokingAlcohol] as const,
              ].map(([label, val, setter]) => (
                <label key={label} className={checkboxRowCls}>
                  <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <Field label="Social notes">
              <textarea rows={2} value={socialNotes} onChange={(e) => setSocialNotes(e.target.value)} placeholder="Occupation, support system, etc." className={textareaCls} />
            </Field>
          </CardContent>
        )}
      </Card>

      {/* Examination */}
      <Card>
        <SectionHeader id="exam" title="Examination" />
        {openSections.has('exam') && (
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Maternal Vitals</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Weight (kg)" required>
                <input type="number" step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Height (cm)">
                <input type="number" step="0.5" value={height} onChange={(e) => setHeight(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Temperature (°C)">
                <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputCls} />
              </Field>
              <Field label="BP Systolic (mmHg)" required>
                <input type="number" required value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className={inputCls} />
              </Field>
              <Field label="BP Diastolic (mmHg)" required>
                <input type="number" required value={bpDiastolic} onChange={(e) => setBpDiastolic(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">Obstetric Examination</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Fundal Height (cm)">
                <input type="number" step="0.5" value={fundalHeight} onChange={(e) => setFundalHeight(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Fetal Heart Rate (/min)">
                <input type="number" value={fetalHeartRate} onChange={(e) => setFetalHeartRate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Presentation">
                <select value={presentation} onChange={(e) => setPresentation(e.target.value as BookingNoteFormData['presentation'])} className={selectCls}>
                  <option value="na">N/A (too early)</option>
                  <option value="cephalic">Cephalic</option>
                  <option value="breech">Breech</option>
                  <option value="transverse">Transverse</option>
                </select>
              </Field>
              <Field label="Oedema">
                <select value={edema} onChange={(e) => setEdema(e.target.value as BookingNoteFormData['edema'])} className={selectCls}>
                  <option value="none">None</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </Field>
              <Field label="General Condition">
                <select value={generalCondition} onChange={(e) => setGeneralCondition(e.target.value as BookingNoteFormData['generalCondition'])} className={selectCls}>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </Field>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Investigations */}
      <Card>
        <SectionHeader id="investigations" title="Investigations" />
        {openSections.has('investigations') && (
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Blood Group">
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className={selectCls}>
                  <option value="">Select...</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => <option key={bg}>{bg}</option>)}
                </select>
              </Field>
              <Field label="Genotype">
                <select value={genotype} onChange={(e) => setGenotype(e.target.value)} className={selectCls}>
                  <option value="">Select...</option>
                  {['AA','AS','SS','SC','AC'].map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="PCV / Haematocrit (%)">
                <input type="number" min={0} max={60} value={pcv} onChange={(e) => setPcv(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="HIV (booking test)">
                <select value={hivResult} onChange={(e) => setHivResult(e.target.value as BookingNoteFormData['hivResult'])} className={selectCls}>
                  <option value="pending">Pending</option>
                  <option value="non-reactive">Non-reactive</option>
                  <option value="reactive">Reactive</option>
                </select>
              </Field>
              <Field label="VDRL/RPR (syphilis)">
                <select value={vdrl} onChange={(e) => setVdrl(e.target.value as BookingNoteFormData['vdrl'])} className={selectCls}>
                  <option value="pending">Pending</option>
                  <option value="non-reactive">Non-reactive</option>
                  <option value="reactive">Reactive</option>
                </select>
              </Field>
              <Field label="HBsAg">
                <select value={hbsAg} onChange={(e) => setHbsAg(e.target.value as BookingNoteFormData['hbsAg'])} className={selectCls}>
                  <option value="pending">Pending</option>
                  <option value="negative">Negative</option>
                  <option value="positive">Positive</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Urinalysis (protein/glucose/ketones)" hint="e.g. Protein −, Glucose −">
                <input type="text" value={urinalysis} onChange={(e) => setUrinalysis(e.target.value)} placeholder="Protein −, Glucose −" className={inputCls} />
              </Field>
              <div className="space-y-1">
                <label className={checkboxRowCls}>
                  <input type="checkbox" checked={ultrasoundDone} onChange={(e) => setUltrasoundDone(e.target.checked)} className="rounded" />
                  <span className="text-sm">Ultrasound done</span>
                </label>
                {ultrasoundDone && (
                  <textarea rows={2} value={ultrasoundFindings} onChange={(e) => setUltrasoundFindings(e.target.value)} placeholder="USS findings..." className={textareaCls} />
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Risk Assessment */}
      <Card>
        <SectionHeader id="risk" title="Risk Assessment" icon={<AlertTriangle className="h-4 w-4 text-orange-500" />} />
        {openSections.has('risk') && (
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {RISK_FACTOR_OPTIONS.map((factor) => {
                const selected = riskFactors.includes(factor);
                return (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => toggleRiskFactor(factor)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                    }`}
                  >
                    {factor}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Derived Risk Level</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${RISK_BADGE[riskLevel]}`}>
                  {riskLevel === 'high' && <AlertTriangle className="h-3.5 w-3.5 mr-1" />}
                  {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                </span>
              </div>
              <div className="flex gap-2 ml-auto">
                {(['low', 'moderate', 'high'] as AncRiskLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setManualRisk(level === riskLevel && manualRisk !== null ? null : level)}
                    className={`px-2.5 py-1 rounded text-xs border transition-colors ${riskLevel === level ? RISK_BADGE[level] : 'border-gray-300 text-gray-500'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Plan */}
      <Card>
        <SectionHeader id="plan" title="Plan" />
        {openSections.has('plan') && (
          <CardContent className="pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Routine interventions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Iron + Folic Acid', ironFolate, setIronFolate] as const,
                ['Tetanus Toxoid', tetanusToxoid, setTetanusToxoid] as const,
                ['IPT (anti-malaria)', ipt, setIpt] as const,
                ['Insecticide-treated net', bedNetProvided, setBedNetProvided] as const,
              ].map(([label, val, setter]) => (
                <label key={label} className={checkboxRowCls}>
                  <input type="checkbox" checked={val} onChange={(e) => setter(e.target.checked)} className="rounded" />
                  {label}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Other medications / supplements">
                <input type="text" value={otherSupplements} onChange={(e) => setOtherSupplements(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Next visit (weeks from now)">
                <input type="number" min={1} max={8} value={nextVisitWeeks} onChange={(e) => setNextVisitWeeks(Number(e.target.value))} className={inputCls} />
              </Field>
            </div>
            <Field label="Counselling topics covered">
              <textarea rows={2} value={counselingTopics} onChange={(e) => setCounselingTopics(e.target.value)} placeholder="Nutrition, malaria prevention, birth preparedness..." className={textareaCls} />
            </Field>
            <Field label="Referral (if needed)">
              <input type="text" value={referral} onChange={(e) => setReferral(e.target.value)} placeholder="Refer to..." className={inputCls} />
            </Field>
          </CardContent>
        )}
      </Card>

      <Button
        type="submit"
        disabled={submitting || !lmpDate || !weight || !bpSystolic || !bpDiastolic}
        className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white"
      >
        {submitting ? 'Saving ANC Booking Note…' : 'Save Booking Note & Enrol in ANC'}
      </Button>
    </form>
  );
}
