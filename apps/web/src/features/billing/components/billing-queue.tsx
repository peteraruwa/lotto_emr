'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { useBillingData } from '../hooks/use-billing-data';
import type { BillingStatus, BillingQueueItem } from '../types';

type FilterTab = 'all' | BillingStatus;

const STATUS_LABEL: Record<BillingStatus, string> = {
  pending:  'Awaiting Auth',
  approved: 'Approved',
  denied:   'Denied',
  partial:  'Partial',
};

const STATUS_STYLES: Record<BillingStatus, string> = {
  pending:  'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  denied:   'bg-red-100 text-red-800',
  partial:  'bg-blue-100 text-blue-800',
};

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all',      label: 'All'      },
  { value: 'pending',  label: 'Pending'  },
  { value: 'approved', label: 'Approved' },
  { value: 'denied',   label: 'Denied'   },
];

interface DenialFormState {
  basketId: string;
  reason: string;
}

export function BillingQueue() {
  const medplum = useMedplum();
  const queryClient = useQueryClient();
  const { data: queueItems = [], isLoading, error } = useBillingData();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [denialForm, setDenialForm] = useState<DenialFormState | null>(null);

  const filteredItems =
    activeFilter === 'all'
      ? queueItems
      : queueItems.filter((item) => item.status === activeFilter);

  async function handleApprove(item: BillingQueueItem) {
    setProcessingId(item.basketId);
    try {
      const rg = await medplum.readResource('RequestGroup', item.basketId);
      await medplum.updateResource({ ...rg, status: 'completed' } as any);
      queryClient.invalidateQueries({ queryKey: ['billing-queue'] });
    } catch (err) {
      console.error('Failed to approve basket:', err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeny(basketId: string, reason: string) {
    setProcessingId(basketId);
    try {
      const rg = await medplum.readResource('RequestGroup', basketId);
      await medplum.updateResource({
        ...rg,
        status: 'revoked',
        note: [
          ...(Array.isArray((rg as any).note) ? (rg as any).note : []),
          { text: `Denial reason: ${reason}` },
        ],
      } as any);
      queryClient.invalidateQueries({ queryKey: ['billing-queue'] });
      setDenialForm(null);
    } catch (err) {
      console.error('Failed to deny basket:', err);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            Billing Authorization Queue
          </CardTitle>

          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {FILTER_TABS.map(({ value, label }) => {
              const count =
                value === 'all'
                  ? queueItems.length
                  : queueItems.filter((i) => i.status === value).length;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveFilter(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeFilter === value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className="ml-1 opacity-70">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Loading billing queue...
          </div>
        )}
        {error && (
          <div className="px-6 py-10 text-center text-sm text-destructive">
            Failed to load billing queue.
          </div>
        )}
        {!isLoading && filteredItems.length === 0 && (
          <div className="px-6 py-10 text-center">
            <Clock className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No items in queue.</p>
          </div>
        )}

        {!isLoading && filteredItems.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Patient</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Submitted</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Items</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Est. Cost</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Payment</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <React.Fragment key={item.basketId}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{item.patientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.patientId.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                        {formatDateTime(item.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                          {item.itemCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">
                        ₦{item.totalEstimate.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase">
                          {item.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status]}`}
                        >
                          {item.status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
                          {item.status === 'denied'   && <XCircle className="h-3 w-3" />}
                          {item.status === 'pending'  && <Clock className="h-3 w-3" />}
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'pending' && (
                          <div className="flex gap-2 items-center">
                            <Button
                              size="sm"
                              disabled={processingId === item.basketId}
                              onClick={() => handleApprove(item)}
                              className="bg-green-600 hover:bg-green-700 text-white h-7 px-2.5 text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingId === item.basketId}
                              onClick={() =>
                                setDenialForm({ basketId: item.basketId, reason: '' })
                              }
                              className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-2.5 text-xs"
                            >
                              Deny
                            </Button>
                          </div>
                        )}
                        {item.status !== 'pending' && (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Inline denial form */}
                    {denialForm?.basketId === item.basketId && (
                      <tr className="bg-red-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-red-700 flex-shrink-0">
                              Denial reason:
                            </span>
                            <input
                              type="text"
                              value={denialForm.reason}
                              onChange={(e) =>
                                setDenialForm((prev) =>
                                  prev ? { ...prev, reason: e.target.value } : null
                                )
                              }
                              placeholder="Enter reason for denial..."
                              className="flex-1 h-8 rounded border border-red-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              disabled={!denialForm.reason.trim() || processingId === item.basketId}
                              onClick={() => handleDeny(item.basketId, denialForm.reason)}
                              className="bg-red-600 hover:bg-red-700 text-white h-7 px-2.5 text-xs"
                            >
                              {processingId === item.basketId ? 'Denying...' : 'Confirm Deny'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDenialForm(null)}
                              className="h-7 px-2.5 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
