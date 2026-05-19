'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Label } from '@lotto-emr/ui';
import { useCreateEncounter } from '../api/use-create-encounter';
import type { EncounterFormData } from '../types';

interface EncounterFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Form to open a new encounter / admit a patient.
 */
export function EncounterForm({ patientId, onSuccess, onCancel }: EncounterFormProps) {
  const { mutateAsync, isPending } = useCreateEncounter();
  const { register, handleSubmit, formState: { errors } } = useForm<EncounterFormData>({
    defaultValues: {
      patientId,
      class: 'AMB',
      priority: 'routine',
    },
  });

  async function onSubmit(data: EncounterFormData) {
    await mutateAsync(data);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('patientId')} value={patientId} />

      <div className="space-y-1">
        <Label htmlFor="class">Encounter Type *</Label>
        <select
          id="class"
          {...register('class', { required: true })}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="AMB">Ambulatory (Outpatient)</option>
          <option value="EMER">Emergency</option>
          <option value="IMP">Inpatient</option>
          <option value="OBSENC">Observation</option>
          <option value="SS">Short Stay</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="reason">Reason for Visit *</Label>
        <Input
          id="reason"
          {...register('reason', { required: 'Reason is required' })}
          placeholder="Chief complaint or reason for admission"
        />
        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          {...register('priority')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="asap">ASAP</option>
          <option value="stat">STAT</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional notes..."
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Opening encounter...' : 'Open Encounter'}
        </Button>
      </div>
    </form>
  );
}
