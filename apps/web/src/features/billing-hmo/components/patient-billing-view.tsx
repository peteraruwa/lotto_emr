'use client';

import React from 'react';
import Link from 'next/link';
import { format, parseISO, isValid } from 'date-fns';
import { DollarSign, Clock, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { usePatientBilling } from '../hooks/use-patient-billing';
import { BillingStatusChip } from './billing-status-chip';
import { RequireRole } from '@/shared/rbac';
import type { FullBillingItem } from '../types';

function fmtDate(iso: string) {
  try {
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'd MMM yyyy') : iso;
  } catch { return iso; }
}

interface PatientBillingViewProps {
  patientId: string;
}

/**
 * Read-only billing status view for non-billing staff on the patient profile.
 * Billing staff see the same view plus a link to the billing control tower.
 * No mutations are available — this is purely informational.
 */
export function PatientBillingView({ patientId }: PatientBillingViewProps) {
  const { data: billings = [], isLoading, error } = usePatientBilling(patientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Clock className="h-6 w-6 text-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-xs text-red-500">
        Failed to load billing records.
      </div>
    );
  }

  const activeBillings   = billings.filter(b => ['init', 'verified', 'invoiced', 'reconciled'].includes(b.billingNote.billingStatus));
  const settledBillings  = billings.filter(b => ['paid', 'hmo_approved', 'closed'].includes(b.billingNote.billingStatus));
  const deferredBillings = billings.filter(b => b.billingNote.billingStatus === 'emergency_deferred');
  const deniedBillings   = billings.filter(b => b.billingNote.billingStatus === 'denied');

  const totalOutstanding = activeBillings.reduce((s, b) => {
    const paid = (b.billingNote.payments ?? []).reduce((ps, p) => ps + p.amount, 0);
    return s + Math.max(0, b.billingNote.totalEstimate - paid);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
          <p className="text-lg font-bold text-amber-800">{activeBillings.length}</p>
          <p className="text-[11px] text-amber-600 font-medium">Active</p>
        </div>
        <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
          <p className="text-lg font-bold text-green-800">{settledBillings.length}</p>
          <p className="text-[11px] text-green-600 font-medium">Settled</p>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
          <p className="text-lg font-bold text-red-800">{deferredBillings.length}</p>
          <p className="text-[11px] text-red-600 font-medium">Deferred</p>
        </div>
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 text-center">
          <p className="text-lg font-bold text-indigo-800">₦{(totalOutstanding / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-indigo-600 font-medium">Outstanding</p>
        </div>
      </div>

      {/* Billing role: link to control tower */}
      <RequireRole roles={['billing']}>
        <Link
          href="/billing"
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-semibold">Open in Billing Control Tower</span>
          </div>
          <ExternalLink className="h-4 w-4 opacity-70" />
        </Link>
      </RequireRole>

      {/* Bills list */}
      {billings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <DollarSign className="h-8 w-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No billing records for this patient.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Billing Records ({billings.length})
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {billings.map(bill => {
              const { billingNote, submittedAt } = bill;
              const paid = (billingNote.payments ?? []).reduce((s, p) => s + p.amount, 0);
              const outstanding = Math.max(0, billingNote.totalEstimate - paid);
              return (
                <div key={bill.basketId} className="px-4 py-3 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <BillingStatusChip status={billingNote.billingStatus} />
                        {billingNote.isEmergency && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                            <AlertTriangle className="h-2.5 w-2.5" /> EMRG
                          </span>
                        )}
                        <span className="text-[10px] uppercase text-gray-400 font-medium">{billingNote.paymentMode}</span>
                        {billingNote.invoiceNumber && (
                          <span className="text-[10px] font-mono text-gray-400">{billingNote.invoiceNumber}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-500">
                          Total: <span className="font-mono font-semibold text-gray-700">₦{billingNote.totalEstimate.toLocaleString()}</span>
                        </span>
                        {paid > 0 && (
                          <span className="text-xs text-gray-500">
                            Paid: <span className="font-mono font-semibold text-green-700">₦{paid.toLocaleString()}</span>
                          </span>
                        )}
                        {outstanding > 0 && (
                          <span className="text-xs text-gray-500">
                            Due: <span className="font-mono font-semibold text-red-600">₦{outstanding.toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                      {billingNote.hmoVerification?.providerName && (
                        <p className="text-[11px] text-blue-600 mt-0.5">
                          HMO: {billingNote.hmoVerification.providerName}
                          {billingNote.hmoVerification.approvalCode && ` · Auth: ${billingNote.hmoVerification.approvalCode}`}
                        </p>
                      )}
                      {billingNote.denialReason && (
                        <p className="text-[11px] text-red-500 mt-0.5">Denied: {billingNote.denialReason}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] text-gray-400">{fmtDate(submittedAt)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{billingNote.items.length} item{billingNote.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read-only disclaimer for non-billing staff */}
      <RequireRole
        roles={['doctor', 'nurse', 'pharmacist', 'lab', 'radiologist', 'admin', 'records', 'hr', 'superadmin']}
      >
        <p className="text-[11px] text-gray-400 text-center">
          Billing details are read-only. Contact the Billing Department for changes.
        </p>
      </RequireRole>
    </div>
  );
}
