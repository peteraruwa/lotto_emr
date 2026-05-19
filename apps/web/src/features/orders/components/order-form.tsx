'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, Label } from '@lotto-emr/ui';
import { useCreateOrder } from '../api/use-create-order';
import type { OrderFormData, OrderType } from '../types';

interface OrderFormProps {
  patientId: string;
  encounterId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrderForm({ patientId, encounterId, onSuccess, onCancel }: OrderFormProps) {
  const { mutateAsync, isPending } = useCreateOrder();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<OrderFormData>({
    defaultValues: {
      patientId,
      encounterId,
      type: 'LAB',
      priority: 'routine',
    },
  });

  const orderType = watch('type') as OrderType;

  async function onSubmit(data: OrderFormData) {
    await mutateAsync(data);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('patientId')} />

      <div className="space-y-1">
        <Label htmlFor="type">Order Type *</Label>
        <select
          id="type"
          {...register('type', { required: true })}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="LAB">Lab Test</option>
          <option value="IMAGING">Imaging</option>
          <option value="MEDICATION">Medication</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="orderText">
          {orderType === 'MEDICATION' ? 'Medication Name *' : 'Test / Procedure *'}
        </Label>
        <Input
          id="orderText"
          {...register('orderText', { required: 'This field is required' })}
          placeholder={
            orderType === 'LAB'
              ? 'e.g. Full Blood Count'
              : orderType === 'IMAGING'
              ? 'e.g. Chest X-Ray PA view'
              : 'e.g. Metformin 500mg'
          }
        />
        {errors.orderText && <p className="text-xs text-destructive">{errors.orderText.message}</p>}
      </div>

      {orderType === 'MEDICATION' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="dose">Dose</Label>
              <Input id="dose" {...register('dose')} placeholder="e.g. 500mg" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="frequency">Frequency</Label>
              <select
                id="frequency"
                {...register('frequency')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select...</option>
                <option value="Once daily (OD)">Once daily (OD)</option>
                <option value="Twice daily (BD)">Twice daily (BD)</option>
                <option value="Three times daily (TDS)">Three times daily (TDS)</option>
                <option value="Four times daily (QDS)">Four times daily (QDS)</option>
                <option value="As needed (PRN)">As needed (PRN)</option>
                <option value="Stat (single dose)">Stat (single dose)</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="durationDays">Duration (days)</Label>
            <Input id="durationDays" type="number" min={1} {...register('durationDays', { valueAsNumber: true })} placeholder="e.g. 7" />
          </div>
        </>
      )}

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
          <option value="stat">STAT (Critical)</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Clinical Notes</Label>
        <textarea
          id="notes"
          {...register('notes')}
          placeholder="Clinical indication, special instructions..."
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Placing order...' : 'Place Order'}
        </Button>
      </div>
    </form>
  );
}
