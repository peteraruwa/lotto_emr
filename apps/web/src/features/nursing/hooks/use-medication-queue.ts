'use client';
import { useQuery } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type { MedicationRequest, MedicationAdministration } from '@medplum/fhirtypes';
import { format, differenceInMinutes, setHours, setMinutes, setSeconds, startOfDay, endOfDay, parseISO } from 'date-fns';
import type { MedScheduleEntry, MedAdminRecord, MedStatus } from '../types';
import { MED_TIMING_HOURS, DUE_WINDOW_MINUTES, UPCOMING_HOURS, VITALS_REQUIRED_FOR } from '../constants';

// Derive scheduled times for today from a timing code
function getScheduledTimesToday(timingCode: string): Date[] {
  const hours = MED_TIMING_HOURS[timingCode.toUpperCase()] ?? MED_TIMING_HOURS[timingCode] ?? [];
  return hours.map(h => {
    const t = setSeconds(setMinutes(setHours(new Date(), h), 0), 0);
    return t;
  });
}

// Determine med status based on scheduled time and admin records
function getMedStatus(
  scheduledTime: Date,
  adminRecordsForReq: MedAdminRecord[],
  _timingCode: string
): { status: MedStatus; adminRecord?: MedAdminRecord } {
  const now = new Date();

  // Check if there's an admin record for this specific scheduled time slot
  const record = adminRecordsForReq.find(r => {
    const adminTime = parseISO(r.adminTime);
    const diffMins = Math.abs(differenceInMinutes(adminTime, scheduledTime));
    return diffMins <= 90; // within 90 min window
  });

  if (record) {
    if (record.action === 'completed') return { status: 'completed', adminRecord: record };
    if (record.action === 'on-hold') return { status: 'held', adminRecord: record };
    if (record.action === 'not-done') return { status: 'skipped', adminRecord: record };
  }

  const minutesUntil = differenceInMinutes(scheduledTime, now);
  if (Math.abs(minutesUntil) <= DUE_WINDOW_MINUTES) return { status: 'due' };
  if (minutesUntil < -DUE_WINDOW_MINUTES) return { status: 'missed' };
  if (minutesUntil > 0 && minutesUntil <= UPCOMING_HOURS * 60) return { status: 'upcoming' };
  return { status: 'upcoming' };
}

// Check if drug name requires vitals before admin
function getRequiredVitals(drugName: string): string | undefined {
  const lower = drugName.toLowerCase();
  for (const [key, msg] of Object.entries(VITALS_REQUIRED_FOR)) {
    if (lower.includes(key)) return msg;
  }
  return undefined;
}

// Parse drug name from MedicationRequest
function getDrugName(req: MedicationRequest): string {
  return (req as any).medicationCodeableConcept?.text ??
    (req as any).medicationCodeableConcept?.coding?.[0]?.display ??
    (req as any).medicationReference?.display ??
    'Medication';
}

// Parse timing code from MedicationRequest
function getTimingCode(req: MedicationRequest): string {
  const timing = req.dosageInstruction?.[0]?.timing;
  return timing?.code?.coding?.[0]?.code ??
    timing?.code?.text ??
    (timing?.repeat?.frequency === 1 && timing?.repeat?.period === 1 ? 'QD' : 'QD');
}

// Parse dose string
function getDose(req: MedicationRequest): string {
  const di = req.dosageInstruction?.[0];
  if (!di) return '—';
  const dose = di.doseAndRate?.[0];
  const qty = dose?.doseQuantity;
  if (qty) return `${qty.value ?? ''} ${qty.unit ?? qty.code ?? ''}`.trim();
  return di.text ?? '—';
}

export function useMedicationQueue() {
  const medplum = useMedplum();

  return useQuery<MedScheduleEntry[]>({
    queryKey: ['nursing-med-queue'],
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
    queryFn: async () => {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();

      // Fetch all active med requests for ward patients
      const [requests, administrations] = await Promise.all([
        medplum.searchResources('MedicationRequest', {
          status: 'active',
          _count: '100',
          _sort: '-authored',
        }) as Promise<MedicationRequest[]>,
        medplum.searchResources('MedicationAdministration', {
          status: 'completed,not-done,on-hold',
          'effective-time': `ge${todayStart}`,
          _count: '200',
          _sort: '-effective-time',
        }) as Promise<MedicationAdministration[]>,
      ]);

      // Group admin records by medication request ID
      const adminByReq = new Map<string, MedAdminRecord[]>();
      for (const admin of administrations) {
        const reqRef = admin.request?.reference ?? '';
        const reqId = reqRef.replace('MedicationRequest/', '');
        if (!reqId) continue;
        if (!adminByReq.has(reqId)) adminByReq.set(reqId, []);
        adminByReq.get(reqId)!.push({
          id: admin.id ?? '',
          adminTime: (admin.effectiveDateTime ?? admin.effectivePeriod?.start ?? new Date().toISOString()),
          action: admin.status === 'completed' ? 'completed' : admin.status === 'on-hold' ? 'on-hold' : 'not-done',
          reason: (admin.statusReason?.[0]?.text ?? admin.note?.[0]?.text) as string | undefined,
        });
      }

      const entries: MedScheduleEntry[] = [];

      for (const req of requests) {
        const timingCode = getTimingCode(req);
        const isPRN = timingCode.toUpperCase() === 'PRN';
        const isSTAT = timingCode.toUpperCase() === 'STAT';
        const drugName = getDrugName(req);
        const dose = getDose(req);
        const route = req.dosageInstruction?.[0]?.route?.coding?.[0]?.code ?? req.dosageInstruction?.[0]?.route?.text ?? '';
        const patientId = req.subject?.reference?.replace('Patient/', '') ?? '';
        const patientName = req.subject?.display ?? 'Unknown Patient';
        const reqId = req.id ?? '';
        const adminRecords = adminByReq.get(reqId) ?? [];
        const requiresVitalsBefore = getRequiredVitals(drugName);

        // PRN: show as a single PRN entry
        if (isPRN) {
          entries.push({
            scheduleId: `${reqId}-PRN`,
            requestId: reqId,
            patientId,
            patientName,
            ward: '',
            bed: '',
            drugName,
            dose,
            route,
            timingCode,
            scheduledTime: today,
            scheduledTimeLabel: 'PRN',
            minutesUntilDue: 0,
            status: 'prn',
            allergies: [],
            requiresVitalsBefore,
            isPRN: true,
            isSTAT: false,
          });
          continue;
        }

        // STAT: show as due immediately
        if (isSTAT) {
          const adminRecord = adminRecords[0];
          entries.push({
            scheduleId: `${reqId}-STAT`,
            requestId: reqId,
            patientId,
            patientName,
            ward: '',
            bed: '',
            drugName,
            dose,
            route,
            timingCode: 'STAT',
            scheduledTime: parseISO(req.authoredOn ?? today.toISOString()),
            scheduledTimeLabel: 'STAT',
            minutesUntilDue: 0,
            status: adminRecord ? 'completed' : 'due',
            adminRecord,
            allergies: [],
            requiresVitalsBefore,
            isPRN: false,
            isSTAT: true,
          });
          continue;
        }

        // Scheduled timing: expand to today's scheduled times
        const scheduledTimes = getScheduledTimesToday(timingCode);
        for (const st of scheduledTimes) {
          const { status, adminRecord } = getMedStatus(st, adminRecords, timingCode);
          const minutesUntilDue = differenceInMinutes(st, today);
          entries.push({
            scheduleId: `${reqId}-${format(st, 'HHmm')}`,
            requestId: reqId,
            patientId,
            patientName,
            ward: '',
            bed: '',
            drugName,
            dose,
            route,
            timingCode,
            scheduledTime: st,
            scheduledTimeLabel: format(st, 'HH:mm'),
            minutesUntilDue,
            status,
            adminRecord,
            allergies: [],
            requiresVitalsBefore,
            isPRN: false,
            isSTAT: false,
          });
        }
      }

      // Sort: due first (most overdue first), then upcoming by time, then completed/missed
      return entries.sort((a, b) => {
        const order: Record<string, number> = { due: 0, prn: 1, upcoming: 2, missed: 3, held: 4, skipped: 5, completed: 6 };
        const oa = order[a.status] ?? 9;
        const ob = order[b.status] ?? 9;
        if (oa !== ob) return oa - ob;
        return a.scheduledTime.getTime() - b.scheduledTime.getTime();
      });
    },
  });
}
