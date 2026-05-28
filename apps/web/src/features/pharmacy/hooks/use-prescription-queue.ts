'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { MedicationRequest, Patient, AllergyIntolerance, Encounter } from '@medplum/fhirtypes';
import { differenceInYears, parseISO } from 'date-fns';
import type { PharmacyPrescription, PharmacyNote } from '../types';
import { CONTROLLED_DRUGS, HIGH_ALERT_MEDICATIONS } from '../constants';
import { runSafetyChecks } from '../utils/safety-engine';

const DEFAULT_NOTE: PharmacyNote = {
  pharmacyStatus: 'pending',
  safetyFlags: [],
  auditLog: [],
};

export function parsePharmacyNote(raw?: string): PharmacyNote {
  if (!raw) return { ...DEFAULT_NOTE };
  try {
    const parsed = JSON.parse(raw);
    if (parsed.pharmacyStatus) return parsed as PharmacyNote;
  } catch { /* ignore */ }
  return { ...DEFAULT_NOTE };
}

function getDrugName(req: MedicationRequest): string {
  return (req as any).medicationCodeableConcept?.text ??
    (req as any).medicationCodeableConcept?.coding?.[0]?.display ??
    (req as any).medicationReference?.display ??
    'Medication';
}

function getDose(req: MedicationRequest): string {
  const di = req.dosageInstruction?.[0];
  if (!di) return '—';
  const qty = di.doseAndRate?.[0]?.doseQuantity;
  if (qty) return `${qty.value ?? ''} ${qty.unit ?? qty.code ?? ''}`.trim();
  return di.text ?? '—';
}

function getTimingCode(req: MedicationRequest): string {
  const timing = req.dosageInstruction?.[0]?.timing;
  return timing?.code?.coding?.[0]?.code ?? timing?.code?.text ?? 'QD';
}

export function usePrescriptionQueue() {
  const medplum = useMedplum();
  const qc = useQueryClient();

  return useQuery<PharmacyPrescription[]>({
    queryKey: ['pharmacy-queue'],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      // Fetch active + on-hold MedicationRequests
      const requests = await medplum.searchResources('MedicationRequest', {
        status: 'active,on-hold,draft',
        _count: '100',
        _sort: '-authored',
        _include: 'MedicationRequest:patient',
      }) as MedicationRequest[];

      const patientIds = [...new Set(
        requests.map(r => r.subject?.reference?.replace('Patient/', '')).filter(Boolean) as string[]
      )];

      // Batch: patients, allergies, encounters
      const [patients, allergies, encounters] = await Promise.all([
        patientIds.length
          ? Promise.all(patientIds.slice(0, 20).map(pid =>
              medplum.readResource('Patient', pid).catch(() => null)
            ))
          : Promise.resolve([]),
        patientIds.length
          ? Promise.all(patientIds.slice(0, 20).map(pid =>
              medplum.searchResources('AllergyIntolerance', { patient: `Patient/${pid}` }).catch(() => [])
            ))
          : Promise.resolve([]),
        medplum.searchResources('Encounter', {
          status: 'in-progress',
          _count: '50',
        }).catch(() => []) as Promise<Encounter[]>,
      ]);

      const patientMap = new Map<string, Patient>();
      (patients as (Patient | null)[]).forEach(p => { if (p?.id) patientMap.set(p.id, p); });

      const allergyMap = new Map<string, string[]>();
      patientIds.forEach((pid, i) => {
        const list = ((allergies[i] ?? []) as AllergyIntolerance[])
          .map(a => a.code?.text ?? a.code?.coding?.[0]?.display ?? '')
          .filter(Boolean);
        allergyMap.set(pid, list);
      });

      const encounterMap = new Map<string, Encounter>();
      (encounters as Encounter[]).forEach(enc => {
        const pid = enc.subject?.reference?.replace('Patient/', '');
        if (pid) encounterMap.set(pid, enc);
      });

      // Build active drug list per patient (for interaction checks)
      const activeDrugsByPatient = new Map<string, string[]>();
      for (const req of requests) {
        const pid = req.subject?.reference?.replace('Patient/', '') ?? '';
        if (!activeDrugsByPatient.has(pid)) activeDrugsByPatient.set(pid, []);
        activeDrugsByPatient.get(pid)!.push(getDrugName(req));
      }

      return requests.map((req): PharmacyPrescription => {
        const patientId = req.subject?.reference?.replace('Patient/', '') ?? '';
        const patient = patientMap.get(patientId);
        const enc = encounterMap.get(patientId);

        let patientName = req.subject?.display ?? 'Unknown Patient';
        let patientAge = 0;
        let mrn = '—';

        if (patient) {
          const nameObj = patient.name?.[0];
          if (nameObj) patientName = `${nameObj.given?.join(' ') ?? ''} ${nameObj.family ?? ''}`.trim() || patientName;
          if (patient.birthDate) {
            try { patientAge = differenceInYears(new Date(), parseISO(patient.birthDate)); } catch {}
          }
          mrn = patient.identifier?.find(i => i.system?.includes('mrn'))?.value ?? patient.identifier?.[0]?.value ?? '—';
        }

        const locationDisplay = enc?.location?.[0]?.location?.display ?? '';
        const parts = locationDisplay.split(' - ');
        const ward = parts[0] || enc?.serviceProvider?.display || undefined;
        const bed  = parts[1] || undefined;

        const drugName = getDrugName(req);
        const drugLower = drugName.toLowerCase();
        const allergies = allergyMap.get(patientId) ?? [];
        const activeDrugs = activeDrugsByPatient.get(patientId) ?? [];
        // Exclude the current drug from the "active" list for interaction check
        const otherDrugs = activeDrugs.filter(d => d !== drugName);

        const noteText = req.note?.[0]?.text;
        const note = parsePharmacyNote(noteText);

        // Run safety engine if not already done
        const safetyFlags = note.safetyFlags.length > 0
          ? note.safetyFlags
          : runSafetyChecks(drugName, otherDrugs, allergies, patientAge);

        const isControlled = [...CONTROLLED_DRUGS].some(c => drugLower.includes(c));
        const isHighAlert  = [...HIGH_ALERT_MEDICATIONS].some(h => drugLower.includes(h));

        // Determine priority
        const priorityExt = req.extension?.find(e => e.url?.includes('priority'))?.valueCode;
        const priority: PharmacyPrescription['priority'] =
          priorityExt === 'stat' ? 'stat' :
          priorityExt === 'urgent' ? 'urgent' :
          req.priority === 'stat' ? 'stat' :
          req.priority === 'urgent' ? 'urgent' : 'routine';

        return {
          id:               req.id ?? '',
          patientId,
          patientName,
          patientAge,
          encounterId:      enc?.id ?? '',
          ward,
          bed,
          mrn,
          drugName,
          dose:             getDose(req),
          route:            req.dosageInstruction?.[0]?.route?.coding?.[0]?.code ?? req.dosageInstruction?.[0]?.route?.text ?? 'PO',
          timingCode:       getTimingCode(req),
          quantity:         undefined,
          prescriberId:     req.requester?.reference ?? '',
          prescriberName:   req.requester?.display ?? 'Unknown Prescriber',
          priority,
          isControlled,
          isHighAlert,
          isDischarge:      req.dispenseRequest?.numberOfRepeatsAllowed === 0 && req.intent === 'plan',
          pharmacyStatus:   note.pharmacyStatus,
          authoredOn:       req.authoredOn ?? '',
          safetyFlags,
          rejectionReason:  note.rejectionReason,
          holdReason:       note.holdReason,
          clarificationRequest: note.clarificationRequest,
          dispensed:        note.dispensed,
          allergies,
          auditLog:         note.auditLog,
          notes:            req.note?.[1]?.text,
        };
      });
    },
  });
}
