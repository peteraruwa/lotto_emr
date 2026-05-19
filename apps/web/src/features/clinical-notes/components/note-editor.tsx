'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Wand2 } from 'lucide-react';
import { Button, Input, Label } from '@lotto-emr/ui';
import { useCreateNote } from '../api/use-create-note';
import { NoteType } from '../types';
import type { NoteFormData } from '../types';

interface NoteEditorProps {
  patientId: string;
  encounterId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SOAP_TEMPLATE = `SUBJECTIVE:
Chief Complaint:
History of Present Illness:
Review of Systems:

OBJECTIVE:
Vital Signs: T: , BP: /, HR: , RR: , SpO2: %
Examination Findings:

ASSESSMENT:
1.

PLAN:
1.
`;

const NOTE_TEMPLATES: Record<NoteType, string> = {
  [NoteType.SOAP]: SOAP_TEMPLATE,
  [NoteType.PROGRESS]: `Progress Note\n\nInterval History:\n\nCurrent Status:\n\nPlan:\n`,
  [NoteType.DISCHARGE]: `Discharge Summary\n\nAdmission Date:\nDischarge Date:\nPrimary Diagnosis:\n\nHospital Course:\n\nDischarge Medications:\n\nFollow-up Instructions:\n`,
  [NoteType.REFERRAL]: `Referral Note\n\nDear Colleague,\n\nI am referring [Patient Name] for specialist evaluation.\n\nReason for Referral:\n\nRelevant History:\n\nCurrent Medications:\n\nThank you for your assistance.\n`,
};

/**
 * Clinical note editor with AI-assist draft functionality.
 * The AI button calls the note-draft Medplum bot (Gemini) to generate a draft.
 * The draft is NEVER automatically saved — the clinician must review and sign.
 */
export function NoteEditor({ patientId, encounterId, onSuccess, onCancel }: NoteEditorProps) {
  const { mutateAsync: createNote, isPending } = useCreateNote();
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<NoteFormData>({
    defaultValues: {
      patientId,
      encounterId,
      type: NoteType.SOAP,
      title: 'Clinical Note',
      content: SOAP_TEMPLATE,
      status: 'draft',
    },
  });

  const noteType = watch('type') as NoteType;

  function handleTypeChange(type: NoteType) {
    setValue('type', type);
    setValue('content', NOTE_TEMPLATES[type]);
    setValue('title', type === NoteType.SOAP ? 'SOAP Note' : type === NoteType.PROGRESS ? 'Progress Note' : type === NoteType.DISCHARGE ? 'Discharge Summary' : 'Referral Note');
  }

  /**
   * Calls the Gemini note-draft bot via the Medplum bot proxy.
   * The draft is inserted into the editor for clinician review — never auto-saved.
   */
  async function handleAIDraft() {
    setIsGeneratingDraft(true);
    try {
      const response = await fetch('/api/cds-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: 'note-draft',
          context: {
            patientId,
            encounterId,
            noteType,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.draft) {
          setValue('content', data.draft);
        }
      }
    } catch (err) {
      console.error('AI draft failed:', err);
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  async function onSubmit(data: NoteFormData) {
    await createNote(data);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('patientId')} />

      {/* Note type tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.values(NoteType).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              noteType === type
                ? 'bg-hospital-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">Note Title</Label>
        <Input id="title" {...register('title', { required: true })} placeholder="Note title" />
      </div>

      {/* Content editor */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Content</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAIDraft}
            disabled={isGeneratingDraft}
            className="text-xs"
          >
            <Wand2 className="h-3.5 w-3.5 mr-1" />
            {isGeneratingDraft ? 'Generating...' : 'AI Draft'}
          </Button>
        </div>

        {isGeneratingDraft && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
            AI is generating a draft based on de-identified patient context. Review carefully before saving.
          </p>
        )}

        <textarea
          id="content"
          {...register('content', { required: 'Note content is required' })}
          rows={18}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono"
          placeholder="Begin typing clinical note..."
        />
        {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="final" className="rounded" onChange={(e) => setValue('status', e.target.checked ? 'final' : 'draft')} />
        <label htmlFor="final" className="text-sm text-gray-700">
          Sign and finalize (cannot be edited after signing)
        </label>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit" variant="outline" disabled={isPending}>
          Save Draft
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            setValue('status', 'final');
            handleSubmit(onSubmit)();
          }}
        >
          Sign Note
        </Button>
      </div>
    </form>
  );
}
