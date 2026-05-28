'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { ServiceRequest, Bundle, BundleEntry, Patient } from '@medplum/fhirtypes';
import type { InvOrder, InvDept, OrderStatus, LabBench, ImagingModality } from '../types';
import { BENCH_CATEGORIES } from '../constants';

const LAB_CATEGORY_CODE    = '108252007';  // SNOMED: Laboratory procedure
const IMAGING_CATEGORY_CODE = '363679005'; // SNOMED: Imaging

const INV_STATUS_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/inv-order-status';
const SPECIMEN_ID_EXT = 'https://lotto-hospital.local/fhir/StructureDefinition/specimen-id';

function guessModality(text: string): ImagingModality {
  const t = text.toLowerCase();
  if (t.includes('x-ray') || t.includes('xray') || t.includes('radiograph')) return 'x-ray';
  if (t.includes('ultrasound') || t.includes('us ') || t.includes(' us') || t.includes('echo')) return 'ultrasound';
  if (t.includes('ct') || t.includes('computed')) return 'ct';
  if (t.includes('mri') || t.includes('magnetic')) return 'mri';
  if (t.includes('mammogram') || t.includes('mammography')) return 'mammography';
  if (t.includes('fluoroscopy') || t.includes('barium')) return 'fluoroscopy';
  return 'x-ray';
}

function guessBench(text: string): LabBench {
  for (const [key, bench] of Object.entries(BENCH_CATEGORIES)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return bench;
  }
  return 'chemistry';
}

function parseOrder(sr: ServiceRequest, patientMap: Map<string, Patient>, dept: InvDept): InvOrder {
  const patientRef = sr.subject?.reference?.replace('Patient/', '') ?? '';
  const p = patientMap.get(patientRef);
  const rawName = `${p?.name?.[0]?.given?.join(' ') ?? ''} ${p?.name?.[0]?.family ?? ''}`.trim();
  const patientName = sr.subject?.display ?? p?.name?.[0]?.text ?? (rawName || 'Unknown');
  const mrn = p?.identifier?.find(i => i.system?.includes('mrn'))?.value ?? p?.identifier?.[0]?.value ?? '—';
  const testName = sr.code?.text ?? sr.code?.coding?.[0]?.display ?? 'Investigation';

  const statusExt = sr.extension?.find(e => e.url === INV_STATUS_EXT)?.valueString as OrderStatus | undefined;
  const specimenId = sr.extension?.find(e => e.url === SPECIMEN_ID_EXT)?.valueString;
  const ward = sr.locationReference?.[0]?.display ?? sr.locationCode?.[0]?.text;
  const encounterId = sr.encounter?.reference?.replace('Encounter/', '');

  const statusMap: Record<string, OrderStatus> = {
    'active': 'pending', 'on-hold': 'accepted', 'completed': 'released', 'revoked': 'rejected',
  };

  return {
    id: sr.id ?? '',
    serviceRequestId: sr.id ?? '',
    patientId: patientRef,
    patientName,
    mrn,
    encounterId,
    ward,
    requester: sr.requester?.display,
    testName,
    category: testName,
    priority: (['routine','urgent','stat'].includes(sr.priority ?? '') ? (sr.priority as 'routine' | 'urgent' | 'stat') : 'routine'),
    dept,
    status: statusExt ?? statusMap[sr.status ?? 'active'] ?? 'pending',
    orderedAt: sr.authoredOn ?? new Date().toISOString(),
    bench: dept === 'lab' ? guessBench(testName) : undefined,
    modality: dept === 'radiology' ? guessModality(testName) : undefined,
    clinicalIndication: sr.reasonCode?.[0]?.text,
    specimenId,
    notes: sr.note?.[0]?.text,
  };
}

export function useInvestigationOrders(dept: InvDept, statuses?: OrderStatus[]) {
  const medplum = useMedplum();

  return useQuery<InvOrder[]>({
    queryKey: ['inv-orders', dept, statuses?.join(',') ?? 'all'],
    staleTime: 30_000,
    queryFn: async () => {
      const category = dept === 'lab' ? LAB_CATEGORY_CODE : IMAGING_CATEGORY_CODE;
      const bundle = await medplum.search('ServiceRequest', {
        status: 'active,on-hold,draft',
        category,
        _sort: '-authored',
        _count: '100',
        _include: 'ServiceRequest:patient',
      }) as Bundle;

      const entries: BundleEntry[] = bundle.entry ?? [];
      const requests = entries.filter(e => e.resource?.resourceType === 'ServiceRequest').map(e => e.resource as ServiceRequest);
      const patientMap = new Map<string, Patient>();
      entries.filter(e => e.resource?.resourceType === 'Patient').forEach(e => {
        const p = e.resource as Patient; if (p.id) patientMap.set(p.id, p);
      });

      const orders = requests.map(sr => parseOrder(sr, patientMap, dept));
      if (statuses && statuses.length > 0) {
        return orders.filter(o => statuses.includes(o.status));
      }
      return orders;
    },
  });
}

export function useCompletedOrders(dept: InvDept) {
  const medplum = useMedplum();

  return useQuery<InvOrder[]>({
    queryKey: ['inv-orders-completed', dept],
    staleTime: 60_000,
    queryFn: async () => {
      const category = dept === 'lab' ? LAB_CATEGORY_CODE : IMAGING_CATEGORY_CODE;
      const bundle = await medplum.search('ServiceRequest', {
        status: 'completed',
        category,
        _sort: '-authored',
        _count: '50',
        _include: 'ServiceRequest:patient',
      }) as Bundle;

      const entries: BundleEntry[] = bundle.entry ?? [];
      const requests = entries.filter(e => e.resource?.resourceType === 'ServiceRequest').map(e => e.resource as ServiceRequest);
      const patientMap = new Map<string, Patient>();
      entries.filter(e => e.resource?.resourceType === 'Patient').forEach(e => {
        const p = e.resource as Patient; if (p.id) patientMap.set(p.id, p);
      });

      return requests.map(sr => parseOrder(sr, patientMap, dept));
    },
  });
}

export function useUpdateOrderStatus() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, rejectionReason, specimenId, notes }: {
      orderId: string;
      status: OrderStatus;
      rejectionReason?: string;
      specimenId?: string;
      notes?: string;
    }) => {
      const existing = await medplum.readResource('ServiceRequest', orderId);
      const fhirStatus = status === 'released' ? 'completed' : status === 'rejected' ? 'revoked' : 'active';

      const extensions = ((existing.extension ?? []) as Array<{ url: string; valueString?: string }>).filter((e) =>
        e.url !== INV_STATUS_EXT && e.url !== SPECIMEN_ID_EXT
      );
      extensions.push({ url: INV_STATUS_EXT, valueString: status });
      if (specimenId) extensions.push({ url: SPECIMEN_ID_EXT, valueString: specimenId });

      return medplum.updateResource({
        ...existing,
        status: fhirStatus,
        extension: extensions,
        note: notes ? [{ text: notes }] : existing.note,
      } as ServiceRequest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-orders'] });
      qc.invalidateQueries({ queryKey: ['inv-orders-completed'] });
    },
  });
}
