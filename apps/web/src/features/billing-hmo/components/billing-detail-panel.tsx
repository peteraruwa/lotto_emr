'use client';

import React, { useState } from 'react';
import {
  X, FileText, CreditCard, CheckCircle2, XCircle,
  AlertTriangle, Building2, RefreshCw,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import type { FullBillingItem, PaymentMethod } from '../types';
import { BillingStatusChip } from './billing-status-chip';
import { InvoiceBuilder } from './invoice-builder';
import { HmoVerifyPanel } from './hmo-verify-panel';
import { EmergencyLockBanner } from './emergency-lock-banner';
import { useUpdateBilling } from '../hooks/use-update-billing';

interface BillingDetailPanelProps {
  billing: FullBillingItem;
  onClose: () => void;
}

export function BillingDetailPanel({ billing, onClose }: BillingDetailPanelProps) {
  const { billingNote, patientName, submittedAt } = billing;
  const update = useUpdateBilling();

  const [view, setView] = useState<'summary' | 'invoice' | 'hmo' | 'payment' | 'audit'>('summary');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(billingNote.totalEstimate);
  const [paymentRef, setPaymentRef] = useState('');
  const [denialReason, setDenialReason] = useState('');
  const [deferReason, setDeferReason] = useState('');
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [showDeferForm, setShowDeferForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  const status = billingNote.billingStatus;
  const isEmergency = billingNote.isEmergency ?? false;
  const isLocked = status === 'closed' || status === 'denied';

  async function handleRecordPayment() {
    setProcessing(true);
    try {
      const payments = [...(billingNote.payments ?? []), {
        id: crypto.randomUUID(),
        method: paymentMethod,
        amount: paymentAmount,
        reference: paymentRef || undefined,
        paidAt: new Date().toISOString(),
      }];
      const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
      const newStatus = totalPaid >= billingNote.totalEstimate ? 'paid' : 'invoiced';

      await update.mutateAsync({
        basketId: billing.basketId,
        patch: { billingStatus: newStatus as any, payments },
        fhirStatus: totalPaid >= billingNote.totalEstimate ? 'completed' : undefined,
        auditAction: 'payment_recorded',
        auditDetail: `₦${paymentAmount.toLocaleString()} via ${paymentMethod}. Ref: ${paymentRef || 'N/A'}`,
      });
      setView('summary');
      setPaymentRef('');
    } finally {
      setProcessing(false);
    }
  }

  async function handleApproveHmo() {
    setProcessing(true);
    try {
      await update.mutateAsync({
        basketId: billing.basketId,
        patch: { billingStatus: 'hmo_approved' },
        fhirStatus: 'completed',
        auditAction: 'hmo_approved',
        auditDetail: 'HMO pre-authorization approved',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleClose() {
    setProcessing(true);
    try {
      await update.mutateAsync({
        basketId: billing.basketId,
        patch: { billingStatus: 'closed' },
        fhirStatus: 'completed',
        auditAction: 'billing_closed',
        auditDetail: 'Billing closed',
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeny() {
    if (!denialReason.trim()) return;
    setProcessing(true);
    try {
      await update.mutateAsync({
        basketId: billing.basketId,
        patch: { billingStatus: 'denied', denialReason },
        fhirStatus: 'revoked',
        auditAction: 'billing_denied',
        auditDetail: `Denied: ${denialReason}`,
      });
      setShowDenyForm(false);
    } finally {
      setProcessing(false);
    }
  }

  async function handleDefer() {
    setProcessing(true);
    try {
      await update.mutateAsync({
        basketId: billing.basketId,
        patch: { billingStatus: 'emergency_deferred', deferredReason: deferReason || 'Emergency — billing deferred' },
        auditAction: 'billing_deferred',
        auditDetail: `Emergency billing deferred: ${deferReason || 'No reason given'}`,
      });
      setShowDeferForm(false);
    } finally {
      setProcessing(false);
    }
  }

  async function handleStartReconciliation() {
    setProcessing(true);
    try {
      await update.mutateAsync({
        basketId: billing.basketId,
        patch: { billingStatus: 'reconciled' },
        auditAction: 'reconciliation_started',
        auditDetail: 'Started post-emergency reconciliation',
      });
    } finally {
      setProcessing(false);
    }
  }

  function fmtDate(iso: string) {
    try { return isValid(parseISO(iso)) ? format(parseISO(iso), 'd MMM yyyy, HH:mm') : iso; } catch { return iso; }
  }

  const totalPaid = (billingNote.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, billingNote.totalEstimate - totalPaid);

  type TabType = 'summary' | 'invoice' | 'hmo' | 'payment' | 'audit';
  const tabs: TabType[] = ['summary', 'invoice', ...(billingNote.paymentMode !== 'cash' ? ['hmo' as TabType] : []), 'payment', 'audit'];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b bg-white">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{patientName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <BillingStatusChip status={status} />
            {isEmergency && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                <AlertTriangle className="h-3 w-3" /> EMERGENCY
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{fmtDate(submittedAt)}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Emergency Banner */}
      {isEmergency && (
        <div className="px-4 pt-3">
          <EmergencyLockBanner
            billingStatus={status}
            deferredReason={billingNote.deferredReason}
            canDefer={!isLocked && status !== 'emergency_deferred'}
            onDefer={() => setShowDeferForm(true)}
          />
        </div>
      )}

      {/* Deferred reason form */}
      {showDeferForm && (
        <div className="mx-4 mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">Defer Emergency Billing</p>
          <textarea
            value={deferReason}
            onChange={e => setDeferReason(e.target.value)}
            rows={2}
            placeholder="Reason for deferral (optional)..."
            className="w-full rounded border border-amber-200 bg-white px-2 py-1.5 text-xs focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleDefer} disabled={processing}
              className="px-3 py-1.5 rounded bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-50">
              {processing ? 'Deferring...' : 'Confirm Defer'}
            </button>
            <button onClick={() => setShowDeferForm(false)} className="px-3 py-1.5 rounded border text-xs text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sub-nav tabs */}
      <div className="flex border-b bg-white px-4 gap-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              view === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'summary' ? 'Summary' : tab === 'invoice' ? 'Invoice' : tab === 'hmo' ? 'HMO' : tab === 'payment' ? 'Payment' : 'Audit Log'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* SUMMARY */}
        {view === 'summary' && (
          <>
            {/* Financial summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-indigo-50 p-3 text-center">
                <p className="text-xs text-indigo-500 font-medium">Estimate</p>
                <p className="text-sm font-bold text-indigo-800 mt-0.5">₦{billingNote.totalEstimate.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs text-green-500 font-medium">Paid</p>
                <p className="text-sm font-bold text-green-800 mt-0.5">₦{totalPaid.toLocaleString()}</p>
              </div>
              <div className={`rounded-lg p-3 text-center ${outstanding > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className={`text-xs font-medium ${outstanding > 0 ? 'text-red-500' : 'text-gray-500'}`}>Outstanding</p>
                <p className={`text-sm font-bold mt-0.5 ${outstanding > 0 ? 'text-red-800' : 'text-gray-600'}`}>
                  ₦{outstanding.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Billing info */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between py-1.5 border-b border-dashed border-gray-100">
                <span className="text-xs text-gray-500">Payment Mode</span>
                <span className="text-xs font-semibold uppercase text-gray-800">{billingNote.paymentMode}</span>
              </div>
              {billingNote.invoiceNumber && (
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-100">
                  <span className="text-xs text-gray-500">Invoice No.</span>
                  <span className="text-xs font-mono text-gray-800">{billingNote.invoiceNumber}</span>
                </div>
              )}
              {billingNote.hmoVerification?.providerName && (
                <div className="flex justify-between py-1.5 border-b border-dashed border-gray-100">
                  <span className="text-xs text-gray-500">HMO Provider</span>
                  <span className="text-xs text-gray-800">{billingNote.hmoVerification.providerName}</span>
                </div>
              )}
              {billingNote.denialReason && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 mt-2">
                  <p className="text-xs font-semibold text-red-700">Denial Reason</p>
                  <p className="text-xs text-red-600 mt-0.5">{billingNote.denialReason}</p>
                </div>
              )}
            </div>

            {/* Items summary */}
            {billingNote.items.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-3 py-2">
                  <p className="text-xs font-semibold text-gray-600">Line Items ({billingNote.items.length})</p>
                </div>
                <div className="divide-y">
                  {billingNote.items.map(item => (
                    <div key={item.id} className="px-3 py-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{item.description}</p>
                        <p className="text-xs text-gray-400">{item.type} × {item.quantity}</p>
                      </div>
                      <p className="text-xs font-mono font-semibold text-gray-700">₦{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action area */}
            {!isLocked && status !== 'emergency_deferred' && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-semibold text-gray-500 uppercase">Quick Actions</p>

                {status === 'init' && (
                  <button onClick={() => setView('invoice')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <FileText className="h-4 w-4" /> Generate Invoice
                  </button>
                )}

                {status === 'invoiced' && billingNote.paymentMode === 'cash' && (
                  <button onClick={() => setView('payment')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
                    <CreditCard className="h-4 w-4" /> Record Payment
                  </button>
                )}

                {status === 'invoiced' && (billingNote.paymentMode === 'hmo' || billingNote.paymentMode === 'nhis') && !billingNote.hmoVerification?.approved && (
                  <button onClick={() => setView('hmo')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Building2 className="h-4 w-4" /> Verify HMO Coverage
                  </button>
                )}

                {status === 'verified' && (billingNote.paymentMode === 'hmo' || billingNote.paymentMode === 'nhis') && billingNote.hmoVerification?.approved && (
                  <button onClick={handleApproveHmo} disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    <CheckCircle2 className="h-4 w-4" /> {processing ? 'Processing...' : 'Mark HMO Approved'}
                  </button>
                )}

                {(status === 'paid' || status === 'hmo_approved') && (
                  <button onClick={handleClose} disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {processing ? 'Closing...' : 'Close Billing'}
                  </button>
                )}

                {status === 'reconciled' && (
                  <button onClick={handleClose} disabled={processing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {processing ? 'Closing...' : 'Close Reconciliation'}
                  </button>
                )}

                {(status === 'invoiced' || status === 'verified') && (
                  <button onClick={() => setView('invoice')}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-50 transition-colors">
                    <FileText className="h-4 w-4" /> Edit Invoice
                  </button>
                )}

                {!showDenyForm && (
                  <button onClick={() => setShowDenyForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
                    <XCircle className="h-4 w-4" /> Deny Billing
                  </button>
                )}

                {showDenyForm && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                    <p className="text-xs font-semibold text-red-800">Denial Reason *</p>
                    <textarea
                      value={denialReason}
                      onChange={e => setDenialReason(e.target.value)}
                      rows={2}
                      placeholder="Enter reason for denial..."
                      className="w-full rounded border border-red-200 bg-white px-2 py-1.5 text-xs focus:outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleDeny} disabled={!denialReason.trim() || processing}
                        className="px-3 py-1.5 rounded bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50">
                        {processing ? 'Denying...' : 'Confirm Deny'}
                      </button>
                      <button onClick={() => setShowDenyForm(false)} className="px-3 py-1.5 rounded border text-xs text-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reconciliation CTA for deferred */}
            {status === 'emergency_deferred' && (
              <div className="pt-2 border-t">
                <button onClick={handleStartReconciliation} disabled={processing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  {processing ? 'Starting...' : 'Start Reconciliation'}
                </button>
              </div>
            )}
          </>
        )}

        {/* INVOICE */}
        {view === 'invoice' && !isLocked && (
          <InvoiceBuilder billing={billing} onClose={() => setView('summary')} />
        )}
        {view === 'invoice' && isLocked && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">Invoice Details</p>
            {billingNote.invoiceNumber && (
              <p className="text-xs text-gray-600">Invoice: <span className="font-mono font-semibold">{billingNote.invoiceNumber}</span></p>
            )}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr>
                  <th className="px-3 py-2 text-left text-gray-500">Item</th>
                  <th className="px-3 py-2 text-right text-gray-500">Qty</th>
                  <th className="px-3 py-2 text-right text-gray-500">Total</th>
                </tr></thead>
                <tbody className="divide-y">
                  {billingNote.items.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-gray-400">{item.type}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">₦{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-gray-50"><tr>
                  <td colSpan={2} className="px-3 py-2 text-right font-semibold">TOTAL</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">₦{billingNote.totalEstimate.toLocaleString()}</td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        )}

        {/* HMO */}
        {view === 'hmo' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase">HMO Verification</p>
            <HmoVerifyPanel billing={billing} />
          </div>
        )}

        {/* PAYMENT */}
        {view === 'payment' && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Record Payment</p>

            {(billingNote.payments ?? []).length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-3 py-1.5">
                  <p className="text-xs font-semibold text-gray-600">Payments Received</p>
                </div>
                {billingNote.payments!.map(p => (
                  <div key={p.id} className="px-3 py-2 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-800 capitalize">{p.method}</p>
                      <p className="text-xs text-gray-400">{fmtDate(p.paidAt)}{p.reference ? ` · Ref: ${p.reference}` : ''}</p>
                    </div>
                    <p className="text-xs font-mono font-semibold text-green-700">₦{p.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {!isLocked && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-xs font-semibold text-gray-600">Add Payment</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none">
                      <option value="cash">Cash</option>
                      <option value="pos">POS / Card</option>
                      <option value="transfer">Bank Transfer</option>
                      <option value="mobile">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Amount (₦)</label>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))}
                      className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Reference / Receipt No.</label>
                    <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                      placeholder="e.g. TXN-12345"
                      className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none" />
                  </div>
                </div>
                <button onClick={handleRecordPayment} disabled={processing || paymentAmount <= 0}
                  className="w-full py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                  {processing ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* AUDIT LOG */}
        {view === 'audit' && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Audit Log</p>
            {(billingNote.auditLog ?? []).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No audit entries yet</p>
            ) : (
              <div className="space-y-2">
                {[...(billingNote.auditLog ?? [])].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3 py-2 border-b border-dashed border-gray-100 last:border-0">
                    <div className="w-1 bg-indigo-200 rounded-full flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-700 capitalize">{entry.action.replace(/_/g, ' ')}</p>
                      {entry.detail && <p className="text-xs text-gray-500 mt-0.5">{entry.detail}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(entry.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
