'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wand2, Search, Loader2, CheckCircle2, BedDouble, CalendarPlus, Eye,
  AlertCircle, Clock, BookOpen, Baby, Heart, Users, Pill, List,
  Stethoscope, Activity, ClipboardList, X, FileText, Save,
} from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Tooltip } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import type { Observation } from '@medplum/fhirtypes';
import { useAiAssist } from '../hooks/use-ai-assist';
import type { IcdCode } from '../hooks/use-ai-assist';
import type { DocumentReference } from '@medplum/fhirtypes';
import { ExamBuilder } from './exam-builder';
import type { ExamBuilderValue } from './exam-builder';
import type { VitalsSnapshot } from '../data/exam-data';
import { AdmitPatientModal } from '@/features/ward';
import { NotePreviewModal } from './note-preview-modal';
import { format } from 'date-fns';

// ── LOINC codes ────────────────────────────────────────────────────────────────
const VITAL_LOINC = {
  BP_PANEL: '55284-4', SYSTOLIC: '8480-6', DIASTOLIC: '8462-4',
  HR: '8867-4', TEMP: '8310-5', SPO2: '59408-5',
  WEIGHT: '29463-7', HEIGHT: '8302-2', RR: '9279-1',
} as const;

// ── Form data ──────────────────────────────────────────────────────────────────
interface StructuredNoteFormData {
  presentingComplaints: string;
  hpc: string;
  pastMedicalHistory: string;
  obstetricsHistory: string;
  gynaecologyHistory: string;
  familySocialHistory: string;
  drugHistory: string;
  otherHistory: string;       // ← NEW
  reviewOfSystems: string;
  diagnosis: string;
  plan: string;
}

interface StructuredNoteEditorProps {
  patientId: string;
  patientGender?: string;
  patientAge?: number;
  conditions?: string[];
  medications?: string[];
}

// ── Section card ───────────────────────────────────────────────────────────────
function SectionCard({ num, icon: Icon, title, accent, children }: {
  num: number; icon: React.ElementType; title: string; accent: string; children: React.ReactNode;
}) {
  return (
    <Card className={`border-l-4 ${accent} shadow-sm`}>
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 shrink-0">
            {num}
          </span>
          <Icon className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

// ── Section textarea ───────────────────────────────────────────────────────────
interface SectionTextareaProps {
  id: string; label: string; value: string; onChange: (v: string) => void;
  rows?: number; showAiAssist?: boolean; isAssisting?: boolean;
  onAiAssist?: () => void; placeholder?: string;
}
function SectionTextarea({
  id, label, value, onChange, rows = 4,
  showAiAssist = true, isAssisting = false, onAiAssist, placeholder,
}: SectionTextareaProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-gray-600 truncate">{label}</Label>
        {showAiAssist && onAiAssist && (
          <Tooltip label="Expand and structure this section using AI">
            <Button type="button" variant="outline" size="sm" onClick={onAiAssist} disabled={isAssisting} className="h-7 text-xs gap-1 shrink-0">
              {isAssisting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              <span className="hidden sm:inline">{isAssisting ? 'Expanding…' : 'AI Assist'}</span>
            </Button>
          </Tooltip>
        )}
      </div>
      <textarea
        id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 resize-y transition-shadow"
      />
    </div>
  );
}

// ── Parse vitals ───────────────────────────────────────────────────────────────
function parseVitalsFromObservations(observations: Observation[]): VitalsSnapshot {
  const snap: VitalsSnapshot = {};
  for (const obs of observations) {
    const code = obs.code?.coding?.find((c) => c.system === 'http://loinc.org')?.code;
    if (code === VITAL_LOINC.BP_PANEL) {
      const sys = obs.component?.find((c) => c.code?.coding?.some((x) => x.code === VITAL_LOINC.SYSTOLIC));
      const dia = obs.component?.find((c) => c.code?.coding?.some((x) => x.code === VITAL_LOINC.DIASTOLIC));
      if (sys?.valueQuantity?.value !== undefined && dia?.valueQuantity?.value !== undefined && !snap.bp)
        snap.bp = `${sys.valueQuantity.value}/${dia.valueQuantity.value} mmHg`;
    } else if (code === VITAL_LOINC.HR && !snap.hr) {
      const v = obs.valueQuantity?.value; if (v !== undefined) snap.hr = `${v} /min`;
    } else if (code === VITAL_LOINC.TEMP && !snap.temp) {
      const v = obs.valueQuantity?.value; if (v !== undefined) snap.temp = `${v} °C`;
    } else if (code === VITAL_LOINC.SPO2 && !snap.spo2) {
      const v = obs.valueQuantity?.value; if (v !== undefined) snap.spo2 = `${v} %`;
    } else if (code === VITAL_LOINC.WEIGHT && !snap.weight) {
      const v = obs.valueQuantity?.value; if (v !== undefined) snap.weight = `${v} kg`;
    } else if (code === VITAL_LOINC.HEIGHT && !snap.height) {
      const v = obs.valueQuantity?.value; if (v !== undefined) snap.height = `${v} cm`;
    } else if (code === VITAL_LOINC.RR && !snap.rr) {
      const v = obs.valueQuantity?.value; if (v !== undefined) snap.rr = `${v} /min`;
    }
  }
  return snap;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function StructuredNoteEditor({ patientId, patientGender, patientAge, conditions, medications }: StructuredNoteEditorProps) {
  const router = useRouter();
  const medplum = useMedplum();

  // Save / UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'draft' | 'final'>('idle');
  const [icdOpen, setIcdOpen] = useState(false);
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const diagnosisRef = useRef<HTMLDivElement>(null);

  // Exam state
  const [examFindings, setExamFindings] = useState<ExamBuilderValue>({});
  const [examinationNarrative, setExaminationNarrative] = useState('');
  const [latestVitals, setLatestVitals] = useState<VitalsSnapshot | undefined>(undefined);
  const [aiAlerts, setAiAlerts] = useState<string[]>([]);

  // Keep refs in sync for auto-save (avoid stale closures)
  const examFindingsRef = useRef<ExamBuilderValue>({});
  const examinationNarrativeRef = useRef('');
  useEffect(() => { examFindingsRef.current = examFindings; }, [examFindings]);
  useEffect(() => { examinationNarrativeRef.current = examinationNarrative; }, [examinationNarrative]);

  // Persisted document/encounter IDs (create once, update thereafter)
  const savedDocIdRef = useRef<string | undefined>();
  const savedEncIdRef = useRef<string | undefined>();

  // Auto-save indicator
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | undefined>();
  const autoSaveBusyRef = useRef(false);

  // Patient data (fetched from FHIR)
  const [resolvedGender, setResolvedGender] = useState(patientGender ?? 'unknown');
  const [resolvedAge, setResolvedAge] = useState<number | undefined>(patientAge);
  const [resolvedConditions, setResolvedConditions] = useState<string[]>(conditions ?? []);
  const [resolvedMedications, setResolvedMedications] = useState<string[]>(medications ?? []);

  const {
    expandSection, searchIcd, suggestPlan, convertExamToNarrative, getAiAlerts,
    loadingSection, icdResults, setIcdResults, isSearchingIcd,
    isGeneratingPlan, isConvertingExam, aiError, clearAiError,
  } = useAiAssist();

  // ── On mount: fetch patient data + vitals ─────────────────────────────────
  useEffect(() => {
    if (!patientId) return;

    medplum.readResource('Patient', patientId).then((pt: any) => {
      if (pt.gender) setResolvedGender(pt.gender);
      if (pt.birthDate) {
        const age = Math.floor((Date.now() - new Date(pt.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        setResolvedAge(age);
      }
    }).catch(() => undefined);

    medplum.searchResources('Condition', { patient: `Patient/${patientId}`, 'clinical-status': 'active' })
      .then((list: any[]) => setResolvedConditions(list.map((c) => c.code?.text ?? c.code?.coding?.[0]?.display ?? '').filter(Boolean)))
      .catch(() => undefined);

    medplum.searchResources('MedicationRequest', { patient: `Patient/${patientId}`, status: 'active' })
      .then((list: any[]) => setResolvedMedications(list.map((m) => m.medicationCodeableConcept?.text ?? m.medicationCodeableConcept?.coding?.[0]?.display ?? '').filter(Boolean)))
      .catch(() => undefined);

    medplum.searchResources('Observation', { patient: `Patient/${patientId}`, category: 'vital-signs', _sort: '-date', _count: '10' })
      .then((obs) => {
        const snap = parseVitalsFromObservations(obs as Observation[]);
        if (Object.values(snap).some(Boolean)) {
          setLatestVitals(snap);
          getAiAlerts(snap).then(setAiAlerts);
        }
      }).catch(() => undefined);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { control, handleSubmit, watch, setValue, getValues } = useForm<StructuredNoteFormData>({
    defaultValues: {
      presentingComplaints: '', hpc: '', pastMedicalHistory: '',
      obstetricsHistory: '', gynaecologyHistory: '',
      familySocialHistory: '', drugHistory: '', otherHistory: '',
      reviewOfSystems: '', diagnosis: '', plan: '',
    },
  });

  const isFemale = resolvedGender === 'female';

  // ── Core persist logic (used by both manual save and auto-save) ───────────
  const persistNote = useCallback(async (
    formData: StructuredNoteFormData,
    docStatus: 'draft' | 'final',
  ): Promise<void> => {
    const currentUser = medplum.getProfile();
    const now = new Date().toISOString();
    const noteContent = {
      ...formData,
      examFindings: examFindingsRef.current,
      examinationNarrative: examinationNarrativeRef.current,
    };
    const contentBase64 = Buffer.from(JSON.stringify(noteContent), 'utf-8').toString('base64');
    const authorRef = currentUser?.id
      ? [{ reference: `Practitioner/${currentUser.id}`, display: `${currentUser.name?.[0]?.given?.[0] ?? ''} ${currentUser.name?.[0]?.family ?? ''}`.trim() }]
      : [];

    // Create Encounter exactly once (on first persist)
    if (!savedEncIdRef.current) {
      try {
        const enc = await medplum.createResource({
          resourceType: 'Encounter',
          status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
          type: [{ coding: [{ system: 'http://snomed.info/sct', code: '11429006', display: 'Consultation' }], text: 'Outpatient Consultation' }],
          subject: { reference: `Patient/${patientId}` },
          period: { start: now, end: now },
          ...(formData.diagnosis.trim() ? { reasonCode: [{ text: formData.diagnosis.trim() }] } : {}),
        } as any);
        savedEncIdRef.current = (enc as any).id as string | undefined;
      } catch { /* non-critical */ }
    }

    const docPayload: DocumentReference = {
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: docStatus === 'final' ? 'final' : 'preliminary',
      type: { coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress Note' }], text: 'Structured Clinical Note' },
      category: [{ coding: [{ system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category', code: 'clinical-note', display: 'Clinical Note' }] }],
      subject: { reference: `Patient/${patientId}` },
      date: now,
      author: authorRef,
      description: formData.diagnosis.trim() || formData.presentingComplaints.trim() || 'Structured Clinical Note',
      content: [{ attachment: { contentType: 'application/json', data: contentBase64, title: 'Structured Clinical Note', creation: now } }],
      ...(savedEncIdRef.current ? { context: { encounter: [{ reference: `Encounter/${savedEncIdRef.current}` }] } } : {}),
    };

    if (savedDocIdRef.current) {
      // Update in place — no new DocumentReference created
      await medplum.updateResource({ ...docPayload, id: savedDocIdRef.current } as any);
    } else {
      const created = await medplum.createResource(docPayload);
      savedDocIdRef.current = (created as any).id as string | undefined;
    }
  }, [medplum, patientId]);

  // ── Keep persistNote ref current (so interval sees latest closure) ─────────
  const persistNoteRef = useRef(persistNote);
  useEffect(() => { persistNoteRef.current = persistNote; }, [persistNote]);

  // ── Auto-save interval (10 s) ─────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      // Skip if already saving, signed, or nothing typed
      if (autoSaveBusyRef.current || isSaving) return;
      const formData = getValues();
      const hasContent = Object.values(formData).some((v) => typeof v === 'string' && v.trim());
      if (!hasContent) return;

      autoSaveBusyRef.current = true;
      setAutoSaveStatus('saving');
      try {
        await persistNoteRef.current(formData, 'draft');
        setLastAutoSaved(new Date());
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 4000);
      } catch {
        setAutoSaveStatus('idle');
      } finally {
        autoSaveBusyRef.current = false;
      }
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSaving]);

  // ── Manual save ───────────────────────────────────────────────────────────
  async function saveNote(formData: StructuredNoteFormData, status: 'draft' | 'final') {
    setIsSaving(true);
    try {
      await persistNote(formData, status);
      setSaveStatus(status);
      setTimeout(() => router.push(`/patients/${patientId}`), 1000);
    } catch (err) {
      console.error('Save note failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  // ── AI handlers ───────────────────────────────────────────────────────────
  async function handleAiAssist(section: keyof StructuredNoteFormData, label: string) {
    const expanded = await expandSection(section, watch(section), { section: label });
    if (expanded) setValue(section, expanded);
  }

  async function handleIcdSearch() {
    const diagText = watch('diagnosis');
    if (!diagText.trim()) return;
    const codes = await searchIcd(diagText);
    if (codes.length > 0) setIcdOpen(true);
  }

  function handleIcdSelect(code: IcdCode) {
    const current = watch('diagnosis');
    setValue('diagnosis', current.trim() ? `${current.trim()} (ICD-10: ${code.code})` : `${code.description} (ICD-10: ${code.code})`);
    setIcdOpen(false);
    setIcdResults([]);
  }

  async function handleGeneratePlan() {
    const plan = await suggestPlan(watch('diagnosis'), { age: resolvedAge, gender: resolvedGender, conditions: resolvedConditions, medications: resolvedMedications });
    if (plan) setValue('plan', plan);
  }

  async function handleGenerateNarrative() {
    const narrative = await convertExamToNarrative(examFindingsRef.current);
    if (narrative) setExaminationNarrative(narrative);
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (saveStatus !== 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <CheckCircle2 className="h-12 w-12 text-teal-600" />
        <p className="text-lg font-medium text-gray-900">
          Note {saveStatus === 'final' ? 'signed and saved' : 'saved as draft'}
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to patient profile…</p>
      </div>
    );
  }

  let n = 0;
  const next = () => ++n;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">New Clinical Note</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review all AI-generated content before signing.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip label="Book a follow-up appointment for this patient">
            <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/schedule?patient=${patientId}`}>
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Book Appt</span>
              </Link>
            </Button>
          </Tooltip>
          <Tooltip label="Admit this patient to a ward bed">
            <Button type="button" size="sm" onClick={() => setAdmitModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
              <BedDouble className="h-4 w-4" />
              <span className="hidden sm:inline">Admit</span>
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── AI error banner ── */}
      {aiError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1 min-w-0"><span className="font-semibold">AI error: </span>{aiError}</div>
          <button type="button" onClick={clearAiError} className="shrink-0 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      <form className="space-y-4">

        {/* 1. Presenting Complaints */}
        <SectionCard num={next()} icon={AlertCircle} title="Presenting Complaints" accent="border-l-red-400">
          <Controller control={control} name="presentingComplaints" render={({ field }) => (
            <SectionTextarea id="presentingComplaints" label="Chief complaints" value={field.value} onChange={field.onChange}
              showAiAssist={false} placeholder="Describe the patient's chief complaints…" rows={3} />
          )} />
        </SectionCard>

        {/* 2. HPC */}
        <SectionCard num={next()} icon={Clock} title="History of Presenting Complaints" accent="border-l-orange-400">
          <Controller control={control} name="hpc" render={({ field }) => (
            <SectionTextarea id="hpc" label="HPC" value={field.value} onChange={field.onChange} showAiAssist
              isAssisting={loadingSection === 'hpc'} onAiAssist={() => handleAiAssist('hpc', 'History of Presenting Complaints')} rows={5} />
          )} />
        </SectionCard>

        {/* 3. Past Medical History */}
        <SectionCard num={next()} icon={BookOpen} title="Past Medical History" accent="border-l-amber-400">
          <Controller control={control} name="pastMedicalHistory" render={({ field }) => (
            <SectionTextarea id="pastMedicalHistory" label="Past medical history" value={field.value} onChange={field.onChange} showAiAssist
              isAssisting={loadingSection === 'pastMedicalHistory'} onAiAssist={() => handleAiAssist('pastMedicalHistory', 'Past Medical History')} rows={4} />
          )} />
        </SectionCard>

        {/* 4 & 5. Obstetrics + Gynaecology (female only) */}
        {isFemale && (
          <>
            <SectionCard num={next()} icon={Baby} title="Obstetrics History" accent="border-l-pink-400">
              <Controller control={control} name="obstetricsHistory" render={({ field }) => (
                <SectionTextarea id="obstetricsHistory" label="Obstetrics history" value={field.value} onChange={field.onChange} showAiAssist
                  isAssisting={loadingSection === 'obstetricsHistory'} onAiAssist={() => handleAiAssist('obstetricsHistory', 'Obstetrics History')}
                  placeholder="Gravida/Para, LMP, EDD, previous deliveries, complications…" rows={4} />
              )} />
            </SectionCard>
            <SectionCard num={next()} icon={Heart} title="Gynaecology History" accent="border-l-rose-400">
              <Controller control={control} name="gynaecologyHistory" render={({ field }) => (
                <SectionTextarea id="gynaecologyHistory" label="Gynaecology history" value={field.value} onChange={field.onChange} showAiAssist
                  isAssisting={loadingSection === 'gynaecologyHistory'} onAiAssist={() => handleAiAssist('gynaecologyHistory', 'Gynaecology History')}
                  placeholder="Menstrual cycle, dysmenorrhoea, vaginal discharge, contraception, cervical smear…" rows={4} />
              )} />
            </SectionCard>
          </>
        )}

        {/* Family & Social History */}
        <SectionCard num={next()} icon={Users} title="Family & Social History" accent="border-l-green-400">
          <Controller control={control} name="familySocialHistory" render={({ field }) => (
            <SectionTextarea id="familySocialHistory" label="Family & social history" value={field.value} onChange={field.onChange} showAiAssist
              isAssisting={loadingSection === 'familySocialHistory'} onAiAssist={() => handleAiAssist('familySocialHistory', 'Family & Social History')} rows={4} />
          )} />
        </SectionCard>

        {/* Drug History */}
        <SectionCard num={next()} icon={Pill} title="Drug History" accent="border-l-purple-400">
          <Controller control={control} name="drugHistory" render={({ field }) => (
            <SectionTextarea id="drugHistory" label="Drug history" value={field.value} onChange={field.onChange} showAiAssist
              isAssisting={loadingSection === 'drugHistory'} onAiAssist={() => handleAiAssist('drugHistory', 'Drug History')} rows={3} />
          )} />
        </SectionCard>

        {/* Other History */}
        <SectionCard num={next()} icon={FileText} title="Other History" accent="border-l-slate-400">
          <Controller control={control} name="otherHistory" render={({ field }) => (
            <SectionTextarea id="otherHistory" label="Other relevant history" value={field.value} onChange={field.onChange} showAiAssist
              isAssisting={loadingSection === 'otherHistory'} onAiAssist={() => handleAiAssist('otherHistory', 'Other History')}
              placeholder="Surgical history, travel history, occupational history, immunisation history, substance use…" rows={4} />
          )} />
        </SectionCard>

        {/* Review of Systems */}
        <SectionCard num={next()} icon={List} title="Review of Systems" accent="border-l-blue-400">
          <Controller control={control} name="reviewOfSystems" render={({ field }) => (
            <SectionTextarea id="reviewOfSystems" label="Review of systems" value={field.value} onChange={field.onChange} showAiAssist
              isAssisting={loadingSection === 'reviewOfSystems'} onAiAssist={() => handleAiAssist('reviewOfSystems', 'Review of Systems')} rows={5} />
          )} />
        </SectionCard>

        {/* Diagnosis */}
        <SectionCard num={next()} icon={Stethoscope} title="Diagnosis / Assessment" accent="border-l-teal-500">
          <div className="space-y-3">
            <div className="flex gap-2 min-w-0">
              <Controller control={control} name="diagnosis" render={({ field }) => (
                <Input id="diagnosis" value={field.value} onChange={field.onChange} placeholder="Enter diagnosis…" className="flex-1 min-w-0" />
              )} />
              <Tooltip label="Search ICD-10 codes for this diagnosis using AI">
                <Button type="button" variant="outline" size="sm" onClick={handleIcdSearch} disabled={isSearchingIcd} className="shrink-0 gap-1">
                  {isSearchingIcd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isSearchingIcd ? 'Searching…' : 'ICD-10'}</span>
                </Button>
              </Tooltip>
            </div>
            {icdOpen && icdResults.length > 0 && (
              <div ref={diagnosisRef} className="border border-gray-200 rounded-lg shadow-md bg-white max-h-48 overflow-y-auto z-10 relative">
                {icdResults.map((code) => (
                  <button key={code.code} type="button" onClick={() => handleIcdSelect(code)}
                    className="w-full text-left px-3 py-2.5 hover:bg-teal-50 text-sm flex items-start gap-2 border-b border-gray-100 last:border-0 transition-colors">
                    <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5">{code.code}</Badge>
                    <span className="text-gray-700">{code.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Examination */}
        <SectionCard num={next()} icon={Activity} title="Physical Examination" accent="border-l-cyan-500">
          <div className="space-y-5">
            <ExamBuilder value={examFindings} onChange={setExamFindings} vitals={latestVitals}
              onGenerateNarrative={handleGenerateNarrative} isGenerating={isConvertingExam} aiAlerts={aiAlerts} />
            {examinationNarrative && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-600">Generated Examination Narrative</Label>
                <textarea readOnly value={examinationNarrative} rows={6}
                  className="flex w-full rounded-md border border-teal-200 bg-teal-50/40 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 resize-y text-gray-800" />
                <p className="text-xs text-muted-foreground">AI-generated — review and edit as needed before signing.</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Plan */}
        <SectionCard num={next()} icon={ClipboardList} title="Management Plan" accent="border-l-indigo-400">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Tooltip label="Generate a structured management plan based on the diagnosis above">
                <Button type="button" variant="outline" size="sm" onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="gap-1.5">
                  {isGeneratingPlan ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  {isGeneratingPlan ? 'Generating…' : 'Generate Plan'}
                </Button>
              </Tooltip>
            </div>
            <Controller control={control} name="plan" render={({ field }) => (
              <SectionTextarea id="plan" label="Management plan" value={field.value} onChange={field.onChange}
                showAiAssist={false} rows={6} placeholder="Enter management plan…" />
            )} />
          </div>
        </SectionCard>

        {/* ── Footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-8 pt-2">
          {/* Auto-save indicator (left side) */}
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/patients/${patientId}`)} className="text-gray-500">
              Cancel
            </Button>
            {autoSaveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Auto-saving…
              </span>
            )}
            {autoSaveStatus === 'saved' && lastAutoSaved && (
              <span className="flex items-center gap-1.5 text-xs text-teal-600">
                <Save className="h-3 w-3" /> Auto-saved {format(lastAutoSaved, 'HH:mm:ss')}
              </span>
            )}
          </div>

          {/* Action buttons (right side) */}
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip label="Preview the note as a formatted essay before signing">
              <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)} className="gap-1.5">
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </Tooltip>
            <Tooltip label="Save an unsigned draft — you can continue editing later">
              <Button type="button" variant="outline" size="sm" onClick={handleSubmit((d) => saveNote(d, 'draft'))} disabled={isSaving} className="gap-1.5">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save Draft
              </Button>
            </Tooltip>
            <Tooltip label="Finalise and sign the note — this cannot be undone">
              <Button type="button" size="sm" onClick={handleSubmit((d) => saveNote(d, 'final'))} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Sign &amp; Save
              </Button>
            </Tooltip>
          </div>
        </div>
      </form>

      {/* Note Preview Modal */}
      <NotePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onEdit={() => setPreviewOpen(false)}
        data={{
          presentingComplaints: watch('presentingComplaints'),
          hpc: watch('hpc'),
          pastMedicalHistory: watch('pastMedicalHistory'),
          obstetricsHistory: watch('obstetricsHistory'),
          gynaecologyHistory: watch('gynaecologyHistory'),
          familySocialHistory: watch('familySocialHistory'),
          drugHistory: watch('drugHistory'),
          otherHistory: watch('otherHistory'),
          reviewOfSystems: watch('reviewOfSystems'),
          diagnosis: watch('diagnosis'),
          plan: watch('plan'),
          examinationNarrative,
          isFemale,
        }}
      />

      {/* Admit Patient Modal */}
      <AdmitPatientModal
        patientId={patientId}
        patientName=""
        isOpen={admitModalOpen}
        onClose={() => setAdmitModalOpen(false)}
        onAdmitted={() => { setAdmitModalOpen(false); router.push('/ward'); }}
      />
    </div>
  );
}
