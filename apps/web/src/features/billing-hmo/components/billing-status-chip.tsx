'use client';

import React from 'react';
import { BILLING_STATUS_LABELS, BILLING_STATUS_COLORS } from '../constants';
import type { FullBillingStatus } from '../types';

interface BillingStatusChipProps {
  status: FullBillingStatus | string;
  className?: string;
}

export function BillingStatusChip({ status, className = '' }: BillingStatusChipProps) {
  const label  = BILLING_STATUS_LABELS[status] ?? status;
  const colors = BILLING_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors} ${className}`}>
      {label}
    </span>
  );
}
