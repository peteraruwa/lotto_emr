'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { FlaskConical, AlertTriangle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Label } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { ServiceRequest, Observation, DiagnosticReport } from '@medplum/fhirtypes';
import { useLabDashboardData, usePendingLabOrders } from '../hooks/use-dashboard-data';

type Interpretation = 'Normal' | 'Low' | 'High' | 'Critical';

interface ResultModalState {
  open: boolean;
  serviceRequest: ServiceRequest | null;
}

function interpretationToCode(interp: Interpretation): string {
  if (interp === 'Normal') return 'N';
  if (interp === 'Low') return 'L';
  if (interp === 'High') return 'H';
  return 'AA';
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'stat') {
    return <Badge variant="critical" className="text-xs uppercase">{priority}</Badge>;
  }
  if (priority === 'urgent') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 uppercase">
        {priority}
      </span>
    );
  }
  return <Badge variant="default" className="text-xs uppercase">{priority}</Badge>;
}

interface ResultEntryModalProps {
  serviceRequest: ServiceRequest;
  onClose: () => void;
  onSaved: () => void;
}

function ResultEntryModal({ serviceRequest, onClose, onSaved }: ResultEntryModalProps) {
  const medplum = useMedplum();
  const [resultValue, setResultValue] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [interpretation, setInterpretation] = useState<Interpretation>('Normal');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderText = (serviceRequest as any).code?.text ?? 'Lab Test';

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();

      const observation = await medplum.createResource({
        resourceType: 'Observation',
        status: 'final',
        code: (serviceRequest as any).code ?? { text: orderText },
        subject: (serviceRequest as any).subject,
        encounter: (serviceRequest as any).encounter,
        effectiveDateTime: now,
        valueString: `${resultValue} ${unit}`.trim(),
        referenceRange: referenceRange ? [{ text: referenceRange }] : undefined,
        interpretation: [
          {
            coding: [{ code: interpretationToCode(interpretation) }],
          },
        ],
        note: notes ? [{ text: notes }] : undefined,
      } as Observation);

      await medplum.createResource({
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: (serviceRequest as any).code ?? { text: orderText },
        subject: (serviceRequest as any).subject,
        encounter: (serviceRequest as any).encounter,
        issued: now,
        result: [{ reference: `Observation/${observation.id}` }],
      } as DiagnosticReport);

      const existing = await medplum.readResource('ServiceRequest', serviceRequest.id!);
      await medplum.updateResource({ ...(existing as any), status: 'completed' } as ServiceRequest);

      setSuccess(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save result');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Enter Result — {orderText}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Result Value</Label>
            <input
              type="text"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="e.g. 7.2"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit</Label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. g/dL"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Reference Range</Label>
          <input
            type="text"
            value={referenceRange}
            onChange={(e) => setReferenceRange(e.target.value)}
            placeholder="e.g. 12–16 g/dL"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Interpretation</Label>
          <select
            value={interpretation}
            onChange={(e) => setInterpretation(e.target.value as Interpretation)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Notes <span className="text-muted-foreground">(optional)</span></Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Additional notes..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">Result saved successfully.</p>
        )}

        <Button
          type="button"
          disabled={saving || success || !resultValue}
          onClick={handleSave}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {saving ? 'Saving...' : 'Save Result'}
        </Button>
      </div>
    </div>
  );
}

export function LabDashboard() {
  const { data, isLoading } = useLabDashboardData();
  const { data: pendingOrders, isLoading: pendingLoading, refetch } = usePendingLabOrders();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ResultModalState>({ open: false, serviceRequest: null });

  function handleSaved() {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['dashboard-lab'] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600"><FlaskConical className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xl font-bold">{data?.pendingOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending Lab Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-600"><AlertTriangle className="h-5 w-5 text-white" /></div>
            <div>
              <p className="text-xl font-bold">{data?.criticalValues ?? 0}</p>
              <p className="text-xs text-muted-foreground">Critical Values to Report</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {(data?.criticalObservations?.length ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Values — Report Immediately
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.criticalObservations.map((obs) => (
              <div key={obs.id} className="flex items-center justify-between py-2 border-b border-red-200 last:border-0">
                <div>
                  <p className="text-sm font-medium">{obs.patientName}</p>
                  <p className="text-xs text-gray-600">{obs.test}</p>
                </div>
                <span className="critical-value">{obs.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending Lab Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (data?.labOrders?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pending lab orders</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr><th>Patient</th><th>Test</th><th>Priority</th><th>Ordered</th></tr>
              </thead>
              <tbody>
                {data?.labOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.patientName}</td>
                    <td>{order.test}</td>
                    <td>
                      <Badge variant={order.priority === 'stat' ? 'critical' : order.priority === 'urgent' ? 'destructive' : 'default'} className="text-xs uppercase">
                        {order.priority}
                      </Badge>
                    </td>
                    <td>{formatDateTime(order.orderedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending Lab Orders — Result Entry</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (pendingOrders?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pending orders</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Priority</th>
                  <th>Ordered At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders?.map((sr) => (
                  <tr key={sr.id}>
                    <td className="font-medium">{(sr as any).subject?.display ?? 'Patient'}</td>
                    <td>{(sr as any).code?.text ?? 'Lab Test'}</td>
                    <td>
                      <PriorityBadge priority={(sr as any).priority ?? 'routine'} />
                    </td>
                    <td>{formatDateTime((sr as any).authoredOn)}</td>
                    <td>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs border-teal-600 text-teal-700 hover:bg-teal-50"
                        onClick={() => setModal({ open: true, serviceRequest: sr })}
                      >
                        Enter Result
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {modal.open && modal.serviceRequest && (
        <ResultEntryModal
          serviceRequest={modal.serviceRequest}
          onClose={() => setModal({ open: false, serviceRequest: null })}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
