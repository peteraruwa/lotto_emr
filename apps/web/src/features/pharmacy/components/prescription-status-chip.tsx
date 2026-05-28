'use client';
import React from 'react';
import { cn } from '@lotto-emr/ui';
import { PHARMACY_STATUS_LABELS, PHARMACY_STATUS_COLORS } from '../constants';
import type { PharmacyStatus } from '../types';

export function PrescriptionStatusChip({ status }: { status: PharmacyStatus }) {
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', PHARMACY_STATUS_COLORS[status])}>
      {PHARMACY_STATUS_LABELS[status] ?? status}
    </span>
  );
}
