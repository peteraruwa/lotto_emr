'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { format, addHours } from 'date-fns';
import { Button, Input, Label } from '@lotto-emr/ui';
import { useCreateAppointment } from '../api/use-create-appointment';
import type { AppointmentFormData } from '../types';

interface AppointmentFormProps {
  patientId?: string;
  defaultDate?: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AppointmentForm({ patientId, defaultDate = new Date(), onSuccess, onCancel }: AppointmentFormProps) {
  const { mutateAsync, isPending } = useCreateAppointment();

  const defaultStart = format(defaultDate, "yyyy-MM-dd'T'HH:mm");
  const defaultEnd = format(addHours(defaultDate, 1), "yyyy-MM-dd'T'HH:mm");

  const { register, handleSubmit, formState: { errors } } = useForm<AppointmentFormData>({
    defaultValues: {
      patientId: patientId ?? '',
      start: defaultStart,
      end: defaultEnd,
      serviceType: 'General Consultation',
    },
  });

  async function onSubmit(data: AppointmentFormData) {
    await mutateAsync({
      ...data,
      start: new Date(data.start).toISOString(),
      end: new Date(data.end).toISOString(),
    });
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!patientId && (
        <div className="space-y-1">
          <Label htmlFor="patientId">Patient ID *</Label>
          <Input
            id="patientId"
            {...register('patientId', { required: 'Patient is required' })}
            placeholder="Patient ID or search"
          />
          {errors.patientId && <p className="text-xs text-destructive">{errors.patientId.message}</p>}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="practitionerId">Practitioner ID *</Label>
        <Input
          id="practitionerId"
          {...register('practitionerId', { required: 'Practitioner is required' })}
          placeholder="Practitioner ID"
        />
        {errors.practitionerId && <p className="text-xs text-destructive">{errors.practitionerId.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="serviceType">Service Type</Label>
        <select
          id="serviceType"
          {...register('serviceType')}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option>General Consultation</option>
          <option>Surgery</option>
          <option>Obs/Gynecology</option>
          <option>Internal Medicine</option>
          <option>Physiotherapy</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="start">Start Time *</Label>
          <Input id="start" type="datetime-local" {...register('start', { required: true })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end">End Time *</Label>
          <Input id="end" type="datetime-local" {...register('end', { required: true })} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" {...register('reason')} placeholder="Reason for appointment" />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Booking...' : 'Book Appointment'}
        </Button>
      </div>
    </form>
  );
}
