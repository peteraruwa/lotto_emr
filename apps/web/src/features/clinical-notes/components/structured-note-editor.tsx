'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wand2, Search, Loader2, CheckCircle2, BedDouble, CalendarPlus, Eye,
  AlertCircle, X, Save,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Tooltip, cn } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import type { Observation, DocumentReference } from '@medplum/fhirtypes';
import { useAiAssist } from '../hooks/use-ai-assist';
import type { IcdCode } from '../hooks/use-ai-assist';
import { ExamBuilder } from './exam-builder';
import type { ExamBuilderValue } from './exam-builder';
import type { VitalsSnapshot } from '../data/exam-data';
import { AdmitPatientModal } from '@/features/ward';
import { NotePreviewModal } from './note-preview-modal';
import { format } from 'date-fns';
import { getNoteTypeDef } from '../data/note-type-definitions';
import type { NoteField, ConsultTab } from '../data/note-type-definitions';
import { LOINC_VITALS, FHIR_SYSTEMS } from '@/shared/constants/loinc';


// Fields to check for diagnosis / complaint content
const DIAGNOSIS_KEYS = ['diagnosis', 'assessment', 'finalDiagnosis', 'admissionDiagnosis', 'currentDiagnosis'];
const COMPLAINT_KEYS = ['chiefComplaint', 'presentingComplaint', 'reasonForReferral', 'hpi', 'subjective'];

// ── Parse vitals from FHIR observations ──────────────────────────────────────
function parseVitalsFromObservations(observations: Observation[]): VitalsSnapshot {
  const snap: VitalsSnapshot = {};
  for (const obs of observations) {
    const code = obs.code?.coding?.find((c) => c.system === FHIR_SYSTEMS.LOINC)?.code;
    if (code === LOINC_VITALS.BP_PANEL) {
      const sys = obs.component?.find((c) => c.code?.coding?.some((x) => x.code === LOINC_VITALS.SYSTOLIC));
      const dia = obs.component?.find((c) => c.code?.coding?.some((x) => x.code === LOINC_VITALS.DIASTOLIC));
      if (sys?.valueQuantity?.value != null && dia?.valueQuantity?.value != null)
        snap.bp = `${sys.valueQuantity.value}/${dia.valueQuantity.value} mmHg`;
    } else if (code === LOINC_VITALS.HEART_RATE && !snap.hr) snap.hr = `${obs.valueQuantity?.value} /min`;
    else if (code === LOINC_VITALS.TEMPERATURE && !snap.temp) snap.temp = `${obs.valueQuantity?.value} °C`;
    else if (code === LOINC_VITALS.SPO2 && !snap.spo2) snap.spo2 = `${obs.valueQuantity?.value} %`;
    else if (code === LOINC_VITALS.BODY_WEIGHT && !snap.weight) snap.weight = `${obs.valueQuantity?.value} kg`;
    else if (code === LOINC_VITALS.BODY_HEIGHT && !snap.height) snap.height = `${obs.valueQuantity?.value} cm`;
    else if (code === LOINC_VITALS.RESPIRATORY_RATE && !snap.rr) snap.rr = `${obs.valueQuantity?.value} /min`;
  }
  return snap;
}

// ── ChipsField ────────────────────────────────────────────────────────────────
function ChipsField({ field, value, onChange }: {
  field: NoteField; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-sm font-medium text-gray-600">{field.label}</Label>
      <div className="flex flex-wrap gap-2">
        {field.options?.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? '' : opt.value)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-150 ${
              value === opt.value
                ? 'bg-hospital-600 text-white border-hospital-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({ num, icon: Icon, title, children }: {
  num: number; icon: React.ElementType; title: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-600 shrink-0 select-none">
            {num}
          </span>
          <Icon className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

// ── SectionTextarea ───────────────────────────────────────────────────────────
interface SectionTextareaProps {
  id: string; label: string; value: string; onChange: (v: string) => void;
  rows?: number; showAiAssist?: boolean; isAssisting?: boolean;
  onAiAssist?: () => void; placeholder?: string;
}
function SectionTextarea({
  id, label, value, onChange, rows = 4,
  showAiAssist = false, isAssisting = false, onAiAssist, placeholder,
}: SectionTextareaProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium text-gray-600 truncate">{label}</Label>
        {showAiAssist && onAiAssist && (
          <Tooltip label="Expand and structure this section using AI">
            <Button type="button" variant="outline" size="sm" onClick={onAiAssist} disabled={isAssisting} className="h-7 text-xs gap-1.5 shrink-0">
              {isAssisting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              <span className="hidden sm:inline">{isAssisting ? 'Expanding…' : 'AI Assist'}</span>
            </Button>
          </Tooltip>
        )}
      </div>
      <textarea
        id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        className="flex w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-400/30 focus-visible:border-hospital-400 resize-y transition-all duration-150 leading-relaxed"
      />
    </div>
  );
}

// ── Context badge config ──────────────────────────────────────────────────────
const CONTEXT_BADGE = {
  outpatient: { label: 'Outpatient', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  inpatient:  { label: 'Inpatient',  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  emergency:  { label: 'Emergency',  cls: 'bg-red-50 text-red-700 border-red-200' },
};

// ── Consultation-note tab config ──────────────────────────────────────────────
const CONSULT_TABS: { id: ConsultTab; label: string }[] = [
  { id: 'subjective',  label: 'Subjective' },
  { id: 'objective',   label: 'Objective' },
  { id: 'assessment',  label: 'Assessment' },
  { id: 'plan',        label: 'Plan' },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface StructuredNoteEditorProps {
  patientId: string;
  patientGender?: string;
  patientAge?: number;
  conditions?: string[];
  medications?: string[];
  noteType?: string;
  existingNoteId?: string;
}

// ── Main component ────────────────────────────────────────────────────────────
export function StructuredNoteEditor({
  patientId, patientGender, patientAge, conditions, medications, noteType, existingNoteId,
}: StructuredNoteEditorProps) {
  const medplum = useMedplum();
  const router = useRouter();

  const noteTypeDef = getNoteTypeDef(noteType);
  const contextBadge = CONTEXT_BADGE[noteTypeDef.context];

  // Build default form values from all non-exam-builder fields
  const defaultValues = React.useMemo(
    () =>
      noteTypeDef.sections
        .flatMap((s) => s.fields)
        .filter((f) => f.type !== 'exam-builder')
        .reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: '' }), {}),
    // noteTypeDef is stable (derived from URL param that doesn't change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { control, watch, setValue, getValues } = useForm<Record<string, string>>({ defaultValues });

  // ── Exam builder (separate state — not in form) ────────────────────────────
  const [examFindings, setExamFindings] = useState<ExamBuilderValue>({});
  const [examinationNarrative, setExaminationNarrative] = useState('');
  const examFindingsRef = useRef<ExamBuilderValue>({});
  const examinationNarrativeRef = useRef('');
  useEffect(() => { examFindingsRef.current = examFindings; }, [examFindings]);
  useEffect(() => { examinationNarrativeRef.current = examinationNarrative; }, [examinationNarrative]);

  // ── Persist refs (create once, update thereafter) ─────────────────────────
  const savedDocIdRef = useRef<string | undefined>();
  const savedEncIdRef = useRef<string | undefined>();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSaved, setLastAutoSaved] = useState<Date | undefined>();
  const autoSaveBusyRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'draft' | 'final'>('idle');
  const [showPreview, setShowPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [admitModalOpen, setAdmitModalOpen] = useState(false);
  const [consultTab, setConsultTab] = useState<ConsultTab>('subjective');

  // ── ICD search state ──────────────────────────────────────────────────────
  const [activeIcdFieldKey, setActiveIcdFieldKey] = useState<string | null>(null);
  const [showIcdResults, setShowIcdResults] = useState(false);

  // ── Patient data resolved from FHIR ──────────────────────────────────────
  const [resolvedGender, setResolvedGender] = useState(patientGender ?? 'unknown');
  const [resolvedAge, setResolvedAge] = useState<number | undefined>(patientAge);
  const [resolvedConditions, setResolvedConditions] = useState<string[]>(conditions ?? []);
  const [resolvedMedications, setResolvedMedications] = useState<string[]>(medications ?? []);
  const [latestVitals, setLatestVitals] = useState<VitalsSnapshot | undefined>();
  const [aiAlerts, setAiAlerts] = useState<string[]>([]);

  const {
    expandSection, searchIcd, suggestPlan, convertExamToNarrative, getAiAlerts,
    loadingSection, icdResults, setIcdResults, isSearchingIcd,
    isGeneratingPlan, isConvertingExam, aiError, clearAiError,
  } = useAiAssist();

  // ── On mount: fetch patient + vitals ─────────────────────────────────────
  useEffect(() => {
    if (!patientId) return;

    medplum.readResource('Patient', patientId).then((pt: any) => {
      if (pt.gender) setResolvedGender(pt.gender);
      if (pt.birthDate) {
        const age = Math.floor((Date.now() - new Date(pt.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
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

  const isFemale = resolvedGender === 'female';

  // ── Load existing note for edit mode ─────────────────────────────────────
  useEffect(() => {
    if (!existingNoteId) return;
    savedDocIdRef.current = existingNoteId;
    medplum.readResource('DocumentReference', existingNoteId).then((doc: any) => {
      const attachment = doc.content?.[0]?.attachment;
      if (!attachment?.data) return;
      try {
        const raw = Buffer.from(attachment.data, 'base64').toString('binary');
        let text: string;
        try { text = decodeURIComponent(escape(raw)); } catch { text = raw; }
        const parsed = JSON.parse(text);
        Object.entries(parsed).forEach(([key, val]) => {
          if (typeof val === 'string') setValue(key as any, val);
        });
        if (parsed.examFindings) {
          setExamFindings(parsed.examFindings);
          examFindingsRef.current = parsed.examFindings;
        }
        if (parsed.examinationNarrative) {
          setExaminationNarrative(parsed.examinationNarrative);
          examinationNarrativeRef.current = parsed.examinationNarrative;
        }
      } catch { /* ignore parse errors for legacy plain-text notes */ }
      const encRef = doc.context?.encounter?.[0]?.reference?.split('/')?.[1];
      if (encRef) savedEncIdRef.current = encRef;
    }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingNoteId]);

  // ── Core persist ──────────────────────────────────────────────────────────
  const persistNote = useCallback(async (
    formData: Record<string, string>,
    docStatus: 'draft' | 'final',
    options: { createEncounter?: boolean } = {},
  ): Promise<void> => {
    const { createEncounter = true } = options;
    const currentUser = medplum.getProfile();
    const now = new Date().toISOString();

    const diagnosisValue = DIAGNOSIS_KEYS.map((k) => formData[k]).find((v) => v?.trim()) ?? '';
    const complaintValue = COMPLAINT_KEYS.map((k) => formData[k]).find((v) => v?.trim()) ?? '';
    const description = (diagnosisValue || complaintValue || noteTypeDef.label).slice(0, 500);

    const noteContent = {
      ...formData,
      noteType: noteType ?? 'consultation_note',
      examFindings: examFindingsRef.current,
      examinationNarrative: examinationNarrativeRef.current,
    };
    const contentBase64 = Buffer.from(JSON.stringify(noteContent), 'utf-8').toString('base64');

    const authorRef = currentUser?.id
      ? [{ reference: `Practitioner/${currentUser.id}`, display: `${currentUser.name?.[0]?.given?.[0] ?? ''} ${currentUser.name?.[0]?.family ?? ''}`.trim() }]
      : [];

    // Create Encounter once on explicit save only (not auto-save)
    if (createEncounter && !savedEncIdRef.current) {
      try {
        const enc = await medplum.createResource({
          resourceType: 'Encounter',
          status: 'finished',
          class: { system: FHIR_SYSTEMS.ACT_CODE, code: 'AMB', display: 'ambulatory' },
          type: [{ coding: [{ system: FHIR_SYSTEMS.SNOMED, code: '11429006', display: 'Consultation' }], text: noteTypeDef.label }],
          subject: { reference: `Patient/${patientId}` },
          period: { start: now, end: now },
          ...(diagnosisValue ? { reasonCode: [{ text: diagnosisValue }] } : {}),
        } as any);
        savedEncIdRef.current = (enc as any).id as string | undefined;
      } catch { /* non-critical — encounter creation failure shouldn't block the note */ }
    }

    const docPayload: DocumentReference = {
      resourceType: 'DocumentReference',
      status: 'current',
      docStatus: docStatus === 'final' ? 'final' : 'preliminary',
      type: {
        coding: [{ system: FHIR_SYSTEMS.LOINC, code: noteTypeDef.loinc, display: noteTypeDef.loincDisplay }],
        text: noteTypeDef.loincText,
      },
      category: [{
        coding: [{
          system: FHIR_SYSTEMS.DOC_CAT,
          code: 'clinical-note',
          display: 'Clinical Note',
        }],
      }],
      subject: { reference: `Patient/${patientId}` },
      date: now,
      author: authorRef,
      description,
      content: [{
        attachment: {
          contentType: 'application/json',
          data: contentBase64,
          title: noteTypeDef.label,
          creation: now,
        },
      }],
      ...(savedEncIdRef.current ? { context: { encounter: [{ reference: `Encounter/${savedEncIdRef.current}` }] } } : {}),
    };

    if (savedDocIdRef.current) {
      await medplum.updateResource({ ...docPayload, id: savedDocIdRef.current } as any);
    } else {
      const created = await medplum.createResource(docPayload);
      savedDocIdRef.current = (created as any).id as string | undefined;
    }
  }, [medplum, patientId, noteType, noteTypeDef]);

  // Keep persistNote ref fresh (stale-closure-safe interval)
  const persistNoteRef = useRef(persistNote);
  useEffect(() => { persistNoteRef.current = persistNote; }, [persistNote]);

  // ── Auto-save every 10 s ──────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      if (autoSaveBusyRef.current || isSaving) return;
      const formData = getValues();
      const hasContent =
        Object.values(formData).some((v) => typeof v === 'string' && v.trim()) ||
        !!examinationNarrativeRef.current.trim();
      if (!hasContent) return;

      autoSaveBusyRef.current = true;
      setAutoSaveStatus('saving');
      try {
        await persistNoteRef.current(formData, 'draft', { createEncounter: false });
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
  async function saveNote(status: 'draft' | 'final') {
    setIsSaving(true);
    try {
      await persistNote(getValues(), status);
      setSaveStatus(status);
      setTimeout(() => router.push(`/patients/${patientId}`), 1000);
    } catch (err) {
      console.error('Save note failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  // ── AI handlers ───────────────────────────────────────────────────────────
  async function handleAiAssist(fieldKey: string, sectionTitle: string) {
    const current = watch(fieldKey) ?? '';
    const expanded = await expandSection(fieldKey, current, { section: sectionTitle });
    if (expanded) setValue(fieldKey as any, expanded);
  }

  async function handleIcdSearch(fieldKey: string) {
    const text = watch(fieldKey) ?? '';
    if (!text.trim()) return;
    setActiveIcdFieldKey(fieldKey);
    const codes = await searchIcd(text);
    if (codes.length > 0) setShowIcdResults(true);
  }

  function handleIcdSelect(code: IcdCode) {
    if (!activeIcdFieldKey) return;
    const current = watch(activeIcdFieldKey) ?? '';
    setValue(
      activeIcdFieldKey as any,
      current.trim()
        ? `${current.trim()} (ICD-10: ${code.code})`
        : `${code.description} (ICD-10: ${code.code})`
    );
    setShowIcdResults(false);
    setIcdResults([]);
    setActiveIcdFieldKey(null);
  }

  async function handleSuggestPlan(fieldKey: string) {
    const formData = getValues();
    const diagnosisValue = DIAGNOSIS_KEYS.map((k) => formData[k]).find((v) => v?.trim()) ?? '';
    const plan = await suggestPlan(diagnosisValue, {
      age: resolvedAge,
      gender: resolvedGender,
      conditions: resolvedConditions,
      medications: resolvedMedications,
    });
    if (plan) setValue(fieldKey as any, plan);
  }

  async function handleGenerateNarrative() {
    const narrative = await convertExamToNarrative(examFindingsRef.current);
    if (narrative) setExaminationNarrative(narrative);
  }

  // ── Compute visible sections (filter gender-conditional) ──────────────────
  const visibleSections = noteTypeDef.sections.filter(
    (s) => !s.conditionalGender || (s.conditionalGender === 'female' && isFemale)
  );

  const isConsultation = noteType === 'consultation_note';

  // Pre-compute tab-relative section numbers so numbers reset per-tab
  const tabSectionNums = React.useMemo(() => {
    if (!isConsultation) return {} as Record<string, number>;
    const counts: Partial<Record<ConsultTab, number>> = {};
    const result: Record<string, number> = {};
    visibleSections.forEach((sec) => {
      const t = sec.tab;
      if (t) {
        counts[t] = (counts[t] ?? 0) + 1;
        result[sec.id] = counts[t]!;
      }
    });
    return result;
  }, [isConsultation, visibleSections]);

  // ── Render field ──────────────────────────────────────────────────────────
  function renderField(field: NoteField, sectionTitle: string) {
    // Exam builder
    if (field.type === 'exam-builder') {
      return (
        <div key={field.key}>
          <ExamBuilder
            value={examFindings}
            onChange={(val) => { setExamFindings(val); examFindingsRef.current = val; }}
            onGenerateNarrative={handleGenerateNarrative}
            isGenerating={isConvertingExam}
            vitals={latestVitals}
          />
          {examinationNarrative && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {examinationNarrative}
            </div>
          )}
        </div>
      );
    }

    // Chips
    if (field.type === 'chips') {
      return (
        <Controller key={field.key} control={control} name={field.key as any} render={({ field: f }) => (
          <ChipsField field={field} value={f.value ?? ''} onChange={f.onChange} />
        )} />
      );
    }

    // Default: textarea + optional ICD search / suggest plan
    return (
      <div key={field.key} className="space-y-2">
        <Controller control={control} name={field.key as any} render={({ field: f }) => (
          <SectionTextarea
            id={field.key}
            label={field.label}
            value={f.value ?? ''}
            onChange={f.onChange}
            rows={field.rows}
            placeholder={field.placeholder}
            showAiAssist={field.showAiAssist}
            isAssisting={loadingSection === field.key}
            onAiAssist={field.showAiAssist ? () => handleAiAssist(field.key, sectionTitle) : undefined}
          />
        )} />

        {/* ICD-10 search */}
        {field.showIcdSearch && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tooltip label="Search ICD-10 diagnostic codes">
              <Button type="button" variant="outline" size="sm"
                onClick={() => handleIcdSearch(field.key)}
                disabled={isSearchingIcd && activeIcdFieldKey === field.key}
                className="h-7 text-xs gap-1.5"
              >
                {isSearchingIcd && activeIcdFieldKey === field.key
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Search className="h-3 w-3" />}
                ICD-10 Search
              </Button>
            </Tooltip>
            {showIcdResults && activeIcdFieldKey === field.key && (
              <button type="button" onClick={() => { setShowIcdResults(false); setIcdResults([]); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Clear results
              </button>
            )}
          </div>
        )}

        {/* ICD results */}
        {showIcdResults && activeIcdFieldKey === field.key && icdResults.length > 0 && (
          <div className="border border-blue-200 rounded-xl divide-y divide-gray-100 max-h-52 overflow-y-auto shadow-md">
            {icdResults.map((code) => (
              <button key={code.code} type="button" onClick={() => handleIcdSelect(code)}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl">
                <span className="font-mono text-xs font-bold text-blue-700 shrink-0 w-16">{code.code}</span>
                <span className="text-sm text-gray-700 truncate">{code.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* Suggest plan */}
        {field.showSuggestPlan && (
          <Tooltip label="Generate a management plan based on the diagnosis using AI">
            <Button type="button" variant="outline" size="sm" onClick={() => handleSuggestPlan(field.key)} disabled={isGeneratingPlan} className="h-7 text-xs gap-1.5">
              {isGeneratingPlan ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              {isGeneratingPlan ? 'Generating plan…' : 'Suggest Plan'}
            </Button>
          </Tooltip>
        )}
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (saveStatus !== 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <CheckCircle2 className="h-12 w-12 text-hospital-600" />
        <p className="text-lg font-medium text-gray-900">
          Note {saveStatus === 'final' ? 'signed and saved' : 'saved as draft'}
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to patient profile…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${contextBadge.cls}`}>
              {contextBadge.label}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{noteTypeDef.label}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review all AI-generated content before signing.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip label="Book a follow-up appointment for this patient">
            <Button type="button" variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/schedule?patient=${patientId}`}>
                <CalendarPlus className="h-4 w-4" />
                Book Appt
              </Link>
            </Button>
          </Tooltip>
          <Tooltip label="Admit this patient to a ward bed">
            <Button type="button" size="sm" onClick={() => setAdmitModalOpen(true)} className="bg-hospital-600 hover:bg-hospital-700 text-white gap-1.5">
              <BedDouble className="h-4 w-4" />
              Admit Patient
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Clinical alerts ── */}
      {aiAlerts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 mb-1.5">Clinical Alerts</p>
          <ul className="space-y-1">
            {aiAlerts.map((alert, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span className="text-amber-500 mt-px shrink-0">•</span>{alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── AI error ── */}
      {aiError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <div className="flex-1 min-w-0"><span className="font-semibold">AI error: </span>{aiError}</div>
          <button type="button" onClick={clearAiError} className="shrink-0 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Consultation note tab bar ── */}
      {isConsultation && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
          {CONSULT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setConsultTab(tab.id)}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-150',
                consultTab === tab.id
                  ? 'bg-white text-hospital-700 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Dynamic note sections ── */}
      <div className="space-y-4">
        {visibleSections.map((section, idx) => {
          const num = isConsultation ? (tabSectionNums[section.id] ?? idx + 1) : idx + 1;
          const hidden = isConsultation && section.tab !== undefined && section.tab !== consultTab;
          return (
            <div key={section.id} className={hidden ? 'hidden' : undefined}>
              <SectionCard num={num} icon={section.icon} title={section.title} accent={section.accent}>
                <div className="space-y-5">
                  {section.fields.map((field) => renderField(field, section.title))}
                </div>
              </SectionCard>
            </div>
          );
        })}
      </div>

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          {autoSaveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Auto-saving…
            </span>
          )}
          {autoSaveStatus === 'saved' && lastAutoSaved && (
            <span className="flex items-center gap-1.5 text-xs text-hospital-600">
              <CheckCircle2 className="h-3 w-3" /> Auto-saved {format(lastAutoSaved, 'HH:mm:ss')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip label="Preview essay form before signing">
            <Button type="button" variant="outline" size="sm" onClick={() => { setPreviewValues(getValues()); setShowPreview(true); }} className="gap-1.5 h-8">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          </Tooltip>
          <Tooltip label="Save this note as a draft (unsigned)">
            <Button type="button" variant="outline" size="sm" onClick={() => saveNote('draft')} disabled={isSaving} className="gap-1.5 h-8">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Draft
            </Button>
          </Tooltip>
          <Tooltip label="Sign and finalise this clinical note">
            <Button type="button" size="sm" onClick={() => saveNote('final')} disabled={isSaving} className="bg-hospital-600 hover:bg-hospital-700 text-white gap-1.5 h-8">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Sign & Save
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ── Modals ── */}
      <AdmitPatientModal
        isOpen={admitModalOpen}
        onClose={() => setAdmitModalOpen(false)}
        onAdmitted={() => setAdmitModalOpen(false)}
        patientId={patientId}
        patientName="Patient"
      />
      <NotePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onEdit={() => setShowPreview(false)}
        sections={noteTypeDef.sections}
        formValues={previewValues}
        examinationNarrative={examinationNarrative}
        isFemale={isFemale}
      />
    </div>
  );
}
