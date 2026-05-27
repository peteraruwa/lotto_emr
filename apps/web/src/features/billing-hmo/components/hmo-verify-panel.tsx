'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Wrench, Building2 } from 'lucide-react';
import type { FullBillingItem, HmoVerification } from '../types';
import { HMO_PROVIDERS } from '../constants';
import { useUpdateBilling } from '../hooks/use-update-billing';

interface HmoVerifyPanelProps {
  billing: FullBillingItem;
}

export function HmoVerifyPanel({ billing }: HmoVerifyPanelProps) {
  const { billingNote } = billing;
  const hmo = billingNote.hmoVerification;
  const update = useUpdateBilling();

  const [mode, setMode] = useState<'idle' | 'api' | 'manual'>('idle');
  const [manualApproved, setManualApproved] = useState<boolean>(true);
  const [manualApprovalCode, setManualApprovalCode] = useState('');
  const [manualCoveredAmount, setManualCoveredAmount] = useState<number>(billingNote.totalEstimate);
  const [manualNotes, setManualNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [apiResult, setApiResult] = useState<HmoVerification | null>(null);

  async function verifyViaApi() {
    if (!hmo?.policyNumber) return;
    setVerifying(true);
    setMode('api');
    try {
      const res = await fetch('/api/verify-hmo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyNumber: hmo.policyNumber,
          providerId: hmo.providerId,
          enrolleeId: hmo.enrolleeId,
          patientId: billing.patientId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setApiResult({
          ...hmo,
          approved: true,
          approvalCode: data.approvalCode ?? 'API-VERIFIED',
          coveredAmount: data.coveredAmount ?? billingNote.totalEstimate,
          verifiedBy: 'api',
          verifiedAt: new Date().toISOString(),
          notes: data.notes,
        });
      } else {
        setApiResult({ ...hmo, approved: false, verifiedBy: 'api', notes: data.error ?? 'Verification failed' });
      }
    } catch {
      setApiResult({ ...hmo!, approved: false, verifiedBy: 'api', notes: 'API unavailable' });
    } finally {
      setVerifying(false);
    }
  }

  async function saveVerification(verification: HmoVerification) {
    await update.mutateAsync({
      basketId: billing.basketId,
      patch: {
        billingStatus: 'verified',
        hmoVerification: verification,
      },
      auditAction: 'hmo_verified',
      auditDetail: `HMO ${verification.approved ? 'approved' : 'rejected'} via ${verification.verifiedBy}. Code: ${verification.approvalCode ?? 'N/A'}`,
    });
    setMode('idle');
    setApiResult(null);
  }

  async function saveManualVerification() {
    setVerifying(true);
    try {
      await saveVerification({
        ...(hmo ?? { providerId: '', providerName: '', policyNumber: '' }),
        approved: manualApproved,
        approvalCode: manualApprovalCode || undefined,
        coveredAmount: manualCoveredAmount,
        verifiedBy: 'manual',
        verifiedAt: new Date().toISOString(),
        notes: manualNotes || undefined,
      });
    } finally {
      setVerifying(false);
    }
  }

  if (!hmo?.providerId) {
    return (
      <div className="rounded-lg bg-gray-50 border border-dashed border-gray-200 p-4 text-center">
        <Building2 className="h-7 w-7 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No HMO details on this billing</p>
        <p className="text-xs text-gray-400">Generate invoice first with HMO/NHIS mode to enable verification</p>
      </div>
    );
  }

  const provider = HMO_PROVIDERS.find(p => p.id === hmo.providerId);

  return (
    <div className="space-y-3">
      {/* HMO Summary */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-blue-800">{provider?.name ?? hmo.providerName}</p>
            <p className="text-xs text-blue-600 mt-0.5">Policy: {hmo.policyNumber}</p>
            {hmo.enrolleeId && <p className="text-xs text-blue-600">Enrollee: {hmo.enrolleeId}</p>}
          </div>
          {hmo.approved ? (
            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </span>
          ) : billingNote.billingStatus === 'verified' ? (
            <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium">
              <XCircle className="h-3 w-3" /> Rejected
            </span>
          ) : (
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">Pending Verification</span>
          )}
        </div>
        {hmo.approvalCode && (
          <p className="text-xs text-blue-700 mt-1.5 font-mono bg-white border border-blue-200 px-2 py-0.5 rounded">
            Auth Code: {hmo.approvalCode}
          </p>
        )}
        {hmo.coveredAmount !== undefined && (
          <p className="text-xs text-blue-600 mt-1">
            Covered: ₦{hmo.coveredAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {/* API Result */}
      {apiResult && mode === 'api' && (
        <div className={`rounded-lg border p-3 ${apiResult.approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-semibold ${apiResult.approved ? 'text-green-800' : 'text-red-800'}`}>
            {apiResult.approved ? '✓ API Verification Successful' : '✗ API Verification Failed'}
          </p>
          {apiResult.approvalCode && <p className="text-xs mt-1 font-mono">Code: {apiResult.approvalCode}</p>}
          {apiResult.notes && <p className="text-xs mt-1 text-gray-600">{apiResult.notes}</p>}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => saveVerification(apiResult)}
              disabled={update.isPending}
              className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Save &amp; Confirm
            </button>
            <button onClick={() => { setApiResult(null); setMode('idle'); }} className="px-3 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Manual Override */}
      {mode === 'manual' && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-orange-800">Manual Verification Override</p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              <input type="radio" checked={manualApproved} onChange={() => setManualApproved(true)} className="accent-green-600" />
              <span className="text-green-700">Approved</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              <input type="radio" checked={!manualApproved} onChange={() => setManualApproved(false)} className="accent-red-600" />
              <span className="text-red-700">Rejected</span>
            </label>
          </div>
          {manualApproved && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Approval Code</label>
                <input type="text" value={manualApprovalCode} onChange={e => setManualApprovalCode(e.target.value)}
                  placeholder="e.g. AUTH-12345" className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Covered Amount (₦)</label>
                <input type="number" value={manualCoveredAmount} onChange={e => setManualCoveredAmount(Number(e.target.value))}
                  className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none" />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs text-gray-600">Notes / Remarks</label>
            <textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)}
              rows={2} placeholder="Verification notes, call reference, staff name..."
              className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={saveManualVerification} disabled={verifying}
              className="px-3 py-1.5 rounded bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 disabled:opacity-50">
              {verifying ? 'Saving...' : 'Save Manual Override'}
            </button>
            <button onClick={() => setMode('idle')} className="px-3 py-1.5 rounded border text-xs text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {mode === 'idle' && billingNote.billingStatus !== 'verified' && (
        <div className="flex gap-2">
          <button onClick={verifyViaApi} disabled={verifying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`h-3.5 w-3.5 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying...' : 'Verify via API'}
          </button>
          <button onClick={() => setMode('manual')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 text-xs font-medium hover:bg-orange-50 transition-colors">
            <Wrench className="h-3.5 w-3.5" />
            Manual Override
          </button>
        </div>
      )}
      {mode === 'idle' && billingNote.billingStatus === 'verified' && (
        <button onClick={() => setMode('manual')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
          <Wrench className="h-3.5 w-3.5" />
          Re-verify / Override
        </button>
      )}
    </div>
  );
}
