'use client';

import React, { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Wand2, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';
import { useAiAssist } from '../hooks/use-ai-assist';
import type { IcdCode } from '../hooks/use-ai-assist';
import type { DocumentReference } from '@medplum/fhirtypes';

// ── Form data shape ────────────────────────────────────────────────────────────
interface StructuredNoteFormData {
  presentingComplaints: string;
  hpc: string;
  pastMedicalHistory: string;
  obGynHistory: string;
  familySocialHistory: string;
  drugHistory: string;
  reviewOfSystems: string;
  diagnosis: string;
  // Examination sub-sections
  generalExamination: string;
  cvsExamination: string;
  respiratoryExamination: string;
  cnsExamination: string;
  entExamination: string;
  ophthalmologyExamination: string;
  // Plan
  plan: string;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface StructuredNoteEditorProps {
  patientId: string;
  patientGender?: string;
  patientAge?: number;
  conditions?: string[];
  medications?: string[];
}

// ── Textarea section helper ────────────────────────────────────────────────────
interface SectionTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  showAiAssist?: boolean;
  isAssisting?: boolean;
  onAiAssist?: () => void;
  placeholder?: string;
}

function SectionTextarea({
  id,
  label,
  value,
  onChange,
  rows = 4,
  showAiAssist = true,
  isAssisting = false,
  onAiAssist,
  placeholder,
}: SectionTextareaProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {showAiAssist && onAiAssist && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAiAssist}
            disabled={isAssisting}
            className="h-7 text-xs gap-1"
          >
            {isAssisting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            {isAssisting ? 'Expanding...' : 'AI Assist'}
          </Button>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`}
        className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
      />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function StructuredNoteEditor({
  patientId,
  patientGender = 'unknown',
  patientAge,
  conditions = [],
  medications = [],
}: StructuredNoteEditorProps) {
  const router = useRouter();
  const medplum = useMedplum();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'draft' | 'final'>('idle');
  const [icdOpen, setIcdOpen] = useState(false);
  const diagnosisRef = useRef<HTMLDivElement>(null);

  const {
    expandSection,
    searchIcd,
    suggestPlan,
    loadingSection,
    icdResults,
    setIcdResults,
    isSearchingIcd,
    isGeneratingPlan,
  } = useAiAssist();

  const { control, handleSubmit, watch, setValue } = useForm<StructuredNoteFormData>({
    defaultValues: {
      presentingComplaints: '',
      hpc: '',
      pastMedicalHistory: '',
      obGynHistory: '',
      familySocialHistory: '',
      drugHistory: '',
      reviewOfSystems: '',
      diagnosis: '',
      generalExamination: '',
      cvsExamination: '',
      respiratoryExamination: '',
      cnsExamination: '',
      entExamination: '',
      ophthalmologyExamination: '',
      plan: '',
    },
  });

  const isFemale = patientGender === 'female';

  // ── AI Assist handlers ─────────────────────────────────────────────────────
  async function handleAiAssist(section: keyof StructuredNoteFormData, label: string) {
    const currentVal = watch(section);
    const expanded = await expandSection(section, currentVal, { section: label });
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
    const appended = current.trim()
      ? `${current.trim()} (ICD-10: ${code.code})`
      : `${code.description} (ICD-10: ${code.code})`;
    setValue('diagnosis', appended);
    setIcdOpen(false);
    setIcdResults([]);
  }

  async function handleGeneratePlan() {
    const diagText = watch('diagnosis');
    const planText = await suggestPlan(diagText, {
      age: patientAge,
      gender: patientGender,
      conditions,
      medications,
    });
    if (planText) setValue('plan', planText);
  }

  // ── Save note ──────────────────────────────────────────────────────────────
  async function saveNote(formData: StructuredNoteFormData, status: 'draft' | 'final') {
    setIsSaving(true);
    try {
      const currentUser = medplum.getProfile();
      const contentBase64 = Buffer.from(JSON.stringify(formData), 'utf-8').toString('base64');

      const doc: DocumentReference = {
        resourceType: 'DocumentReference',
        status: 'current',
        docStatus: status === 'final' ? 'final' : 'preliminary',
        type: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11506-3',
              display: 'Progress Note',
            },
          ],
          text: 'Structured Clinical Note',
        },
        category: [
          {
            coding: [
              {
                system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
                code: 'clinical-note',
                display: 'Clinical Note',
              },
            ],
          },
        ],
        subject: { reference: `Patient/${patientId}` },
        date: new Date().toISOString(),
        author: currentUser?.id
          ? [
              {
                reference: `Practitioner/${currentUser.id}`,
                display: `${currentUser.name?.[0]?.given?.[0] ?? ''} ${currentUser.name?.[0]?.family ?? ''}`.trim(),
              },
            ]
          : [],
        description: 'Structured Clinical Note',
        content: [
          {
            attachment: {
              contentType: 'application/json',
              data: contentBase64,
              title: 'Structured Clinical Note',
              creation: new Date().toISOString(),
            },
          },
        ],
      };

      await medplum.createResource(doc);
      setSaveStatus(status);
      setTimeout(() => router.push(`/patients/${patientId}`), 1000);
    } catch (err) {
      console.error('Save note failed:', err);
    } finally {
      setIsSaving(false);
    }
  }

  function onDraftSubmit(formData: StructuredNoteFormData) {
    saveNote(formData, 'draft');
  }

  function onFinalSubmit(formData: StructuredNoteFormData) {
    saveNote(formData, 'final');
  }

  if (saveStatus !== 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <CheckCircle2 className="h-12 w-12 text-teal-600" />
        <p className="text-lg font-medium text-gray-900">
          Note {saveStatus === 'final' ? 'signed and saved' : 'saved as draft'}
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to patient profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Clinical Note</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured progress note — review all AI-generated content before signing.
          </p>
        </div>
      </div>

      <form className="space-y-5">
        {/* 1. Presenting Complaints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              1. Presenting Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="presentingComplaints"
              render={({ field }) => (
                <SectionTextarea
                  id="presentingComplaints"
                  label="Presenting Complaints"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist={false}
                  placeholder="Describe the patient's chief complaints..."
                  rows={3}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 2. HPC */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              2. History of Presenting Complaints (HPC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="hpc"
              render={({ field }) => (
                <SectionTextarea
                  id="hpc"
                  label="HPC"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist
                  isAssisting={loadingSection === 'hpc'}
                  onAiAssist={() => handleAiAssist('hpc', 'History of Presenting Complaints')}
                  rows={5}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 3. Past Medical History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              3. Past Medical History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="pastMedicalHistory"
              render={({ field }) => (
                <SectionTextarea
                  id="pastMedicalHistory"
                  label="Past Medical History"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist
                  isAssisting={loadingSection === 'pastMedicalHistory'}
                  onAiAssist={() => handleAiAssist('pastMedicalHistory', 'Past Medical History')}
                  rows={4}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 4. Ob/Gyn History (female only) */}
        {isFemale && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                4. Ob/Gyn History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="obGynHistory"
                render={({ field }) => (
                  <SectionTextarea
                    id="obGynHistory"
                    label="Ob/Gyn History"
                    value={field.value}
                    onChange={field.onChange}
                    showAiAssist
                    isAssisting={loadingSection === 'obGynHistory'}
                    onAiAssist={() => handleAiAssist('obGynHistory', 'Ob/Gyn History')}
                    rows={4}
                  />
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* 5. Family & Social History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {isFemale ? '5' : '4'}. Family &amp; Social History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="familySocialHistory"
              render={({ field }) => (
                <SectionTextarea
                  id="familySocialHistory"
                  label="Family & Social History"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist
                  isAssisting={loadingSection === 'familySocialHistory'}
                  onAiAssist={() => handleAiAssist('familySocialHistory', 'Family & Social History')}
                  rows={4}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 6. Drug History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {isFemale ? '6' : '5'}. Drug History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="drugHistory"
              render={({ field }) => (
                <SectionTextarea
                  id="drugHistory"
                  label="Drug History"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist
                  isAssisting={loadingSection === 'drugHistory'}
                  onAiAssist={() => handleAiAssist('drugHistory', 'Drug History')}
                  rows={3}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 7. Review of Systems */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {isFemale ? '7' : '6'}. Review of Systems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="reviewOfSystems"
              render={({ field }) => (
                <SectionTextarea
                  id="reviewOfSystems"
                  label="Review of Systems"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist
                  isAssisting={loadingSection === 'reviewOfSystems'}
                  onAiAssist={() => handleAiAssist('reviewOfSystems', 'Review of Systems')}
                  rows={5}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* 8. Diagnosis / Assessment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {isFemale ? '8' : '7'}. Diagnosis / Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis" className="text-sm font-medium text-gray-700">
                Diagnosis
              </Label>
              <div className="flex gap-2">
                <Controller
                  control={control}
                  name="diagnosis"
                  render={({ field }) => (
                    <Input
                      id="diagnosis"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter diagnosis..."
                      className="flex-1"
                    />
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleIcdSearch}
                  disabled={isSearchingIcd}
                  className="shrink-0 gap-1"
                >
                  {isSearchingIcd ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isSearchingIcd ? 'Searching...' : 'Search ICD-10'}
                </Button>
              </div>

              {/* ICD dropdown */}
              {icdOpen && icdResults.length > 0 && (
                <div
                  ref={diagnosisRef}
                  className="border border-gray-200 rounded-md shadow-md bg-white mt-1 max-h-48 overflow-y-auto z-10 relative"
                >
                  {icdResults.map((code) => (
                    <button
                      key={code.code}
                      type="button"
                      onClick={() => handleIcdSelect(code)}
                      className="w-full text-left px-3 py-2 hover:bg-teal-50 text-sm flex items-start gap-2 border-b border-gray-100 last:border-0"
                    >
                      <Badge variant="outline" className="font-mono text-xs shrink-0 mt-0.5">
                        {code.code}
                      </Badge>
                      <span className="text-gray-700">{code.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 9. Examination */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {isFemale ? '9' : '8'}. Examination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { field: 'generalExamination' as const, label: 'General Examination' },
              { field: 'cvsExamination' as const, label: 'CVS Examination' },
              { field: 'respiratoryExamination' as const, label: 'Respiratory Examination' },
              { field: 'cnsExamination' as const, label: 'CNS Examination' },
              { field: 'entExamination' as const, label: 'ENT Examination' },
              { field: 'ophthalmologyExamination' as const, label: 'Ophthalmology Examination' },
            ].map(({ field, label }) => (
              <Controller
                key={field}
                control={control}
                name={field}
                render={({ fieldState: _fs, ...rest }) => (
                  <SectionTextarea
                    id={field}
                    label={label}
                    value={rest.field.value}
                    onChange={rest.field.onChange}
                    showAiAssist
                    isAssisting={loadingSection === field}
                    onAiAssist={() => handleAiAssist(field, label)}
                    rows={3}
                  />
                )}
              />
            ))}
          </CardContent>
        </Card>

        {/* 10. Plan */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              {isFemale ? '10' : '9'}. Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan}
                className="gap-1"
              >
                {isGeneratingPlan ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wand2 className="h-3.5 w-3.5" />
                )}
                {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
              </Button>
            </div>
            <Controller
              control={control}
              name="plan"
              render={({ field }) => (
                <SectionTextarea
                  id="plan"
                  label="Management Plan"
                  value={field.value}
                  onChange={field.onChange}
                  showAiAssist={false}
                  rows={6}
                  placeholder="Enter management plan..."
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/patients/${patientId}`)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit(onDraftSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onFinalSubmit)}
            disabled={isSaving}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Sign Note
          </Button>
        </div>
      </form>
    </div>
  );
}
