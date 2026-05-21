'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Pill, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@lotto-emr/ui';
import { formatDateTime } from '@/shared/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { MedicationRequest, MedicationDispense } from '@medplum/fhirtypes';
import { usePharmacistDashboardData } from '../hooks/use-dashboard-data';

const PRIORITY_VARIANT: Record<string, 'critical' | 'destructive' | 'pending' | 'default'> = {
  stat: 'critical',
  urgent: 'destructive',
  asap: 'pending',
  routine: 'default',
};

function useDispensingQueue() {
  const medplum = useMedplum();
  return useQuery<MedicationRequest[]>({
    queryKey: ['pharma-dashboard', 'dispensing-queue'],
    queryFn: () =>
      medplum.searchResources('MedicationRequest', {
        status: 'active',
        _sort: '-authored',
        _count: '30',
      }) as Promise<MedicationRequest[]>,
  });
}

interface DispenseRowProps {
  req: MedicationRequest;
  onDispensed: () => void;
}

function DispenseRow({ req, onDispensed }: DispenseRowProps) {
  const medplum = useMedplum();
  const [confirming, setConfirming] = useState(false);
  const [dispensing, setDispensing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const medication = (req as any).medicationCodeableConcept?.text ?? 'Medication';
  const dosageInstruction = (req as any).dosageInstruction?.[0];
  const doseText = dosageInstruction
    ? [
        dosageInstruction.text,
        dosageInstruction.doseAndRate?.[0]?.doseQuantity
          ? `${dosageInstruction.doseAndRate[0].doseQuantity.value} ${dosageInstruction.doseAndRate[0].doseQuantity.unit}`
          : null,
        dosageInstruction.timing?.code?.text,
      ]
        .filter(Boolean)
        .join(' — ')
    : '—';

  async function handleDispense() {
    setDispensing(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await medplum.createResource({
        resourceType: 'MedicationDispense',
        status: 'completed',
        medicationCodeableConcept: (req as any).medicationCodeableConcept ?? { text: 'Medication' },
        subject: (req as any).subject,
        authorizingPrescription: [{ reference: `MedicationRequest/${req.id}` }],
        whenHandedOver: now,
        dosageInstruction: (req as any).dosageInstruction,
      } as MedicationDispense);

      const existing = await medplum.readResource('MedicationRequest', req.id!);
      await medplum.updateResource({ ...(existing as any), status: 'completed' } as MedicationRequest);

      setDone(true);
      setTimeout(onDispensed, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Dispense failed');
      setConfirming(false);
    } finally {
      setDispensing(false);
    }
  }

  return (
    <tr>
      <td className="font-medium">{(req as any).subject?.display ?? 'Patient'}</td>
      <td>{medication}</td>
      <td className="text-xs text-muted-foreground max-w-[160px] truncate">{doseText}</td>
      <td>
        <Badge variant={PRIORITY_VARIANT[(req as any).priority ?? 'routine'] ?? 'default'} className="text-xs capitalize">
          {(req as any).priority ?? 'routine'}
        </Badge>
      </td>
      <td>
        {done ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Dispensed
          </span>
        ) : confirming ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              disabled={dispensing}
              onClick={handleDispense}
              className="text-xs bg-teal-600 hover:bg-teal-700 text-white h-7 px-2"
            >
              {dispensing ? 'Processing…' : 'Confirm'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={dispensing}
              onClick={() => setConfirming(false)}
              className="text-xs h-7 px-2"
            >
              Cancel
            </Button>
            {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs border-teal-600 text-teal-700 hover:bg-teal-50 h-7 px-2"
            onClick={() => setConfirming(true)}
          >
            Dispense
          </Button>
        )}
      </td>
    </tr>
  );
}

export function PharmacistDashboard() {
  const { data, isLoading } = usePharmacistDashboardData();
  const { data: queue, isLoading: queueLoading, refetch } = useDispensingQueue();
  const queryClient = useQueryClient();

  function handleDispensed() {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['pharmacy'] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{data?.pendingPrescriptions ?? 0}</p>
              <p className="text-xs text-muted-foreground">Pending Prescriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-600">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold">{data?.dispensedToday ?? 0}</p>
              <p className="text-xs text-muted-foreground">Dispensed Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pending Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (data?.prescriptions?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No pending prescriptions</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medication</th>
                  <th>Priority</th>
                  <th>Ordered</th>
                </tr>
              </thead>
              <tbody>
                {data?.prescriptions.map((rx) => (
                  <tr key={rx.id}>
                    <td className="font-medium">{rx.patientName}</td>
                    <td>{rx.medication}</td>
                    <td>
                      <Badge variant={PRIORITY_VARIANT[rx.priority] ?? 'default'} className="text-xs capitalize">
                        {rx.priority}
                      </Badge>
                    </td>
                    <td>{formatDateTime(rx.orderedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dispensing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {queueLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (queue?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No items in dispensing queue</p>
          ) : (
            <table className="clinical-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Medication</th>
                  <th>Dose / Freq</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue?.map((req) => (
                  <DispenseRow key={req.id} req={req} onDispensed={handleDispensed} />
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
