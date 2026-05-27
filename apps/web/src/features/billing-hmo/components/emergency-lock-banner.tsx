'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface EmergencyLockBannerProps {
  deferredReason?: string;
  billingStatus: string;
  onDefer?: () => void;
  canDefer?: boolean;
}

export function EmergencyLockBanner({ deferredReason, billingStatus, onDefer, canDefer }: EmergencyLockBannerProps) {
  if (billingStatus === 'emergency_deferred') {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">Emergency — Billing Deferred</p>
          <p className="text-xs text-red-700 mt-0.5">
            {deferredReason ?? 'Billing has been deferred pending emergency care completion. Reconcile within 72 hours.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Emergency Encounter</p>
          <p className="text-xs text-amber-700 mt-0.5">
            This is an emergency encounter. Billing may be deferred until the patient is stabilised.
          </p>
        </div>
      </div>
      {canDefer && onDefer && (
        <button
          onClick={onDefer}
          className="flex-shrink-0 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors"
        >
          Defer Billing
        </button>
      )}
    </div>
  );
}
