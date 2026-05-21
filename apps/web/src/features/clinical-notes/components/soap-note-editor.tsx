'use client';

import React, { useState } from 'react';
import { CheckCircle, Loader2, Save } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useQueryClient } from '@tanstack/react-query';
import type { VitalSign } from '@/features/dashboard-doctor/hooks/use-patient-snapshot';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SoapData {
  subjective: {
    chiefComplaint: string;
    hpi: string;
    pmh: string;
    familyHistory: string;
    socialHistory: string;
    ros: string;
  };
  objective: {
    generalAppearance: string;
    vitals: string;
    heent: string;
    respiratory: string;
    cardiovascular: string;
    abdomen: string;
    extremities: string;
    neurological: string;
    other: string;
  };
  assessment: {
    primaryDiagnosis: string;
    differentials: string;
    impression: string;
  };
  plan: {
    investigations: string;
    treatment: string;
    referrals: string;
    followUp: string;
    education: string;
  };
}

interface SoapNoteEditorProps {
  patientId: string;
  encounterId?: string;
  vitals?: VitalSign[];
  onSaved?: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VITAL_LABELS: Record<string, string> = {
  '8480-6': 'Systolic BP', '8462-4': 'Diastolic BP',
  '55284-4': 'BP', '8867-4': 'HR', '8310-5': 'Temp',
  '59408-5': 'SpO₂', '29463-7': 'Weight', '8302-2': 'Height',
};

function vitalsToText(vitals: VitalSign[]): string {
  if (!vitals.length) return '';
  return vitals
    .map((v) => `${VITAL_LABELS[v.code] ?? v.label}: ${v.value}${v.unit ? ' ' + v.unit : ''}`)
    .join(' | ');
}

function buildNoteText(data: SoapData): string {
  const lines: string[] = [];

  lines.push('## SUBJECTIVE');
  if (data.subjective.chiefComplaint)  lines.push(`**Chief Complaint:** ${data.subjective.chiefComplaint}`);
  if (data.subjective.hpi)             lines.push(`**History of Presenting Illness:** ${data.subjective.hpi}`);
  if (data.subjective.pmh)             lines.push(`**Past Medical/Surgical History:** ${data.subjective.pmh}`);
  if (data.subjective.familyHistory)   lines.push(`**Family History:** ${data.subjective.familyHistory}`);
  if (data.subjective.socialHistory)   lines.push(`**Social History:** ${data.subjective.socialHistory}`);
  if (data.subjective.ros)             lines.push(`**Review of Systems:** ${data.subjective.ros}`);

  lines.push('');
  lines.push('## OBJECTIVE');
  if (data.objective.vitals)           lines.push(`**Vital Signs:** ${data.objective.vitals}`);
  if (data.objective.generalAppearance) lines.push(`**General Appearance:** ${data.objective.generalAppearance}`);
  if (data.objective.heent)            lines.push(`**HEENT:** ${data.objective.heent}`);
  if (data.objective.respiratory)      lines.push(`**Respiratory:** ${data.objective.respiratory}`);
  if (data.objective.cardiovascular)   lines.push(`**Cardiovascular:** ${data.objective.cardiovascular}`);
  if (data.objective.abdomen)          lines.push(`**Abdomen:** ${data.objective.abdomen}`);
  if (data.objective.extremities)      lines.push(`**Extremities:** ${data.objective.extremities}`);
  if (data.objective.neurological)     lines.push(`**Neurological:** ${data.objective.neurological}`);
  if (data.objective.other)            lines.push(`**Other Findings:** ${data.objective.other}`);

  lines.push('');
  lines.push('## ASSESSMENT');
  if (data.assessment.primaryDiagnosis) lines.push(`**Primary Diagnosis:** ${data.assessment.primaryDiagnosis}`);
  if (data.assessment.differentials)    lines.push(`**Differential Diagnoses:** ${data.assessment.differentials}`);
  if (data.assessment.impression)       lines.push(`**Clinical Impression:** ${data.assessment.impression}`);

  lines.push('');
  lines.push('## PLAN');
  if (data.plan.investigations) lines.push(`**Investigations:** ${data.plan.investigations}`);
  if (data.plan.treatment)      lines.push(`**Treatment/Medications:** ${data.plan.treatment}`);
  if (data.plan.referrals)      lines.push(`**Referrals:** ${data.plan.referrals}`);
  if (data.plan.followUp)       lines.push(`**Follow-up:** ${data.plan.followUp}`);
  if (data.plan.education)      lines.push(`**Patient Education:** ${data.plan.education}`);

  return lines.join('\n');
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-gray-50 hover:bg-white focus:bg-white resize-y focus:outline-none focus:ring-2 focus:ring-hospital-400/40 focus:border-hospital-300 transition-all placeholder:text-gray-400"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type SoapTab = 'S' | 'O' | 'A' | 'P';

const TABS: { id: SoapTab; label: string; full: string; accent: string; ring: string }[] = [
  { id: 'S', label: 'S', full: 'Subjective',  accent: 'border-blue-500 text-blue-700 bg-blue-50',    ring: 'ring-blue-400/40' },
  { id: 'O', label: 'O', full: 'Objective',   accent: 'border-emerald-500 text-emerald-700 bg-emerald-50', ring: 'ring-emerald-400/40' },
  { id: 'A', label: 'A', full: 'Assessment',  accent: 'border-orange-500 text-orange-700 bg-orange-50', ring: 'ring-orange-400/40' },
  { id: 'P', label: 'P', full: 'Plan',        accent: 'border-violet-500 text-violet-700 bg-violet-50', ring: 'ring-violet-400/40' },
];

function isFilled(section: Record<string, string>) {
  return Object.values(section).some((v) => v.trim().length > 0);
}

export function SoapNoteEditor({ patientId, encounterId, vitals = [], onSaved }: SoapNoteEditorProps) {
  const medplum     = useMedplum();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<SoapTab>('S');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const [soap, setSoap] = useState<SoapData>({
    subjective: { chiefComplaint: '', hpi: '', pmh: '', familyHistory: '', socialHistory: '', ros: '' },
    objective:  { generalAppearance: '', vitals: vitalsToText(vitals), heent: '', respiratory: '', cardiovascular: '', abdomen: '', extremities: '', neurological: '', other: '' },
    assessment: { primaryDiagnosis: '', differentials: '', impression: '' },
    plan:       { investigations: '', treatment: '', referrals: '', followUp: '', education: '' },
  });

  function patchS(key: keyof SoapData['subjective'],  val: string) { setSoap((p) => ({ ...p, subjective:  { ...p.subjective,  [key]: val } })); }
  function patchO(key: keyof SoapData['objective'],   val: string) { setSoap((p) => ({ ...p, objective:   { ...p.objective,   [key]: val } })); }
  function patchA(key: keyof SoapData['assessment'],  val: string) { setSoap((p) => ({ ...p, assessment:  { ...p.assessment,  [key]: val } })); }
  function patchP(key: keyof SoapData['plan'],        val: string) { setSoap((p) => ({ ...p, plan:        { ...p.plan,        [key]: val } })); }

  async function handleSave() {
    setSaving(true);
    try {
      const noteText    = buildNoteText(soap);
      const contentB64  = btoa(unescape(encodeURIComponent(noteText)));
      const currentUser = medplum.getProfile();

      await medplum.createResource({
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: 'final',
        type: {
          coding: [{ system: 'http://loinc.org', code: '34137-0', display: 'Outpatient Note' }],
          text: 'SOAP',
        },
        category: [{
          coding: [{ system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category', code: 'clinical-note', display: 'Clinical Note' }],
        }],
        subject: { reference: `Patient/${patientId}` },
        date: new Date().toISOString(),
        description: 'SOAP Note',
        author: currentUser?.id
          ? [{ reference: `Practitioner/${currentUser.id}`, display: (currentUser.name?.[0]?.text ?? '') }]
          : [],
        content: [{ attachment: { contentType: 'text/plain', data: contentB64, title: 'SOAP Note' } }],
        context: {
          encounter: encounterId ? [{ reference: `Encounter/${encounterId}` }] : undefined,
        },
      } as any);

      queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.();
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  const filled = {
    S: isFilled(soap.subjective),
    O: isFilled(soap.objective),
    A: isFilled(soap.assessment),
    P: isFilled(soap.plan),
  };

  const activeConfig = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-3">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all',
              activeTab === tab.id
                ? `bg-white shadow-sm ${tab.accent} border`
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0',
              activeTab === tab.id ? '' : filled[tab.id] ? 'bg-hospital-100 text-hospital-700' : 'bg-gray-200 text-gray-500',
            )}>
              {filled[tab.id] && activeTab !== tab.id ? '✓' : tab.label}
            </span>
            <span className="hidden sm:inline truncate">{tab.full}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={cn('rounded-2xl border p-4 space-y-4', activeConfig.accent.split(' ').find((c) => c.startsWith('bg-'))?.replace('bg-', 'bg-') ?? 'bg-gray-50')}>

        {activeTab === 'S' && (
          <>
            <Field label="Chief Complaint" value={soap.subjective.chiefComplaint} onChange={(v) => patchS('chiefComplaint', v)} placeholder="Patient's presenting complaint in their own words…" rows={2} />
            <Field label="History of Presenting Illness" value={soap.subjective.hpi} onChange={(v) => patchS('hpi', v)} placeholder="Onset, duration, character, associated symptoms, aggravating/relieving factors…" rows={4} />
            <Field label="Past Medical / Surgical History" value={soap.subjective.pmh} onChange={(v) => patchS('pmh', v)} placeholder="Chronic conditions, previous surgeries, hospitalizations…" rows={3} />
            <Field label="Family History" value={soap.subjective.familyHistory} onChange={(v) => patchS('familyHistory', v)} placeholder="Relevant heritable conditions…" rows={2} />
            <Field label="Social History" value={soap.subjective.socialHistory} onChange={(v) => patchS('socialHistory', v)} placeholder="Occupation, smoking, alcohol, IVDU, sexual history, housing…" rows={2} />
            <Field label="Review of Systems" value={soap.subjective.ros} onChange={(v) => patchS('ros', v)} placeholder="Pertinent positives and negatives by system…" rows={3} />
          </>
        )}

        {activeTab === 'O' && (
          <>
            <Field label="Vital Signs" value={soap.objective.vitals} onChange={(v) => patchO('vitals', v)} placeholder="T: , BP: /, HR: , RR: , SpO₂: %" rows={2} />
            <Field label="General Appearance" value={soap.objective.generalAppearance} onChange={(v) => patchO('generalAppearance', v)} placeholder="Alert, oriented, in/not in distress, well/ill appearing…" rows={2} />
            <Field label="HEENT" value={soap.objective.heent} onChange={(v) => patchO('heent', v)} placeholder="Head, eyes, ears, nose, throat findings…" rows={2} />
            <Field label="Respiratory / Chest" value={soap.objective.respiratory} onChange={(v) => patchO('respiratory', v)} placeholder="Air entry, breath sounds, percussion, added sounds…" rows={2} />
            <Field label="Cardiovascular" value={soap.objective.cardiovascular} onChange={(v) => patchO('cardiovascular', v)} placeholder="Heart sounds, murmurs, JVP, peripheral pulses, oedema…" rows={2} />
            <Field label="Abdomen" value={soap.objective.abdomen} onChange={(v) => patchO('abdomen', v)} placeholder="Soft/tender, organomegaly, bowel sounds, masses…" rows={2} />
            <Field label="Extremities / MSK" value={soap.objective.extremities} onChange={(v) => patchO('extremities', v)} placeholder="Tone, power, deformity, joints, oedema…" rows={2} />
            <Field label="Neurological" value={soap.objective.neurological} onChange={(v) => patchO('neurological', v)} placeholder="GCS, cranial nerves, power, reflexes, sensation, gait…" rows={2} />
            <Field label="Other Findings" value={soap.objective.other} onChange={(v) => patchO('other', v)} placeholder="Skin, lymph nodes, genitourinary, rectal, other…" rows={2} />
          </>
        )}

        {activeTab === 'A' && (
          <>
            <Field label="Primary Diagnosis" value={soap.assessment.primaryDiagnosis} onChange={(v) => patchA('primaryDiagnosis', v)} placeholder="Working/confirmed primary diagnosis…" rows={2} />
            <Field label="Differential Diagnoses" value={soap.assessment.differentials} onChange={(v) => patchA('differentials', v)} placeholder="List differentials in order of likelihood…" rows={4} />
            <Field label="Clinical Impression" value={soap.assessment.impression} onChange={(v) => patchA('impression', v)} placeholder="Overall clinical impression and reasoning…" rows={3} />
          </>
        )}

        {activeTab === 'P' && (
          <>
            <Field label="Investigations" value={soap.plan.investigations} onChange={(v) => patchP('investigations', v)} placeholder="Blood tests, imaging, cultures ordered…" rows={3} />
            <Field label="Treatment / Medications" value={soap.plan.treatment} onChange={(v) => patchP('treatment', v)} placeholder="Drug name, dose, frequency, route, duration…" rows={4} />
            <Field label="Referrals / Consultations" value={soap.plan.referrals} onChange={(v) => patchP('referrals', v)} placeholder="Specialty, urgency, reason for referral…" rows={2} />
            <Field label="Follow-up Plan" value={soap.plan.followUp} onChange={(v) => patchP('followUp', v)} placeholder="Review date, target parameters, return precautions…" rows={2} />
            <Field label="Patient Education" value={soap.plan.education} onChange={(v) => patchP('education', v)} placeholder="What was explained to the patient/family…" rows={2} />
          </>
        )}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                filled[tab.id] ? (activeTab === tab.id ? 'bg-hospital-600' : 'bg-hospital-400') : 'bg-gray-200',
              )}
            />
          ))}
          <span className="text-xs text-gray-400 ml-1">
            {Object.values(filled).filter(Boolean).length}/4 sections filled
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium animate-fade-in">
              <CheckCircle className="h-3.5 w-3.5" /> Note saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !Object.values(filled).some(Boolean)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
              Object.values(filled).some(Boolean) && !saving
                ? 'bg-hospital-600 hover:bg-hospital-700 text-white shadow-sm shadow-hospital-600/20'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Sign & Save Note
          </button>
        </div>
      </div>
    </div>
  );
}
