// ── Medication Scheduling ─────────────────────────────────────────────────────

export type MedStatus = 'due' | 'upcoming' | 'completed' | 'missed' | 'held' | 'skipped' | 'prn';

export interface MedAdminRecord {
  id: string;
  adminTime: string;
  action: 'completed' | 'on-hold' | 'not-done';
  reason?: string;
}

export interface MedScheduleEntry {
  scheduleId: string;          // `${requestId}-${HHMM}`
  requestId: string;
  patientId: string;
  patientName: string;
  ward: string;
  bed: string;
  drugName: string;
  dose: string;
  route: string;
  timingCode: string;          // BID, TID, etc.
  scheduledTime: Date;
  scheduledTimeLabel: string;  // "08:00"
  minutesUntilDue: number;     // negative = overdue
  status: MedStatus;
  adminRecord?: MedAdminRecord;
  allergies: string[];
  requiresVitalsBefore?: string;
  isPRN: boolean;
  isSTAT: boolean;
}

// ── Ward Patients ─────────────────────────────────────────────────────────────

export interface NursingPatient {
  patientId: string;
  encounterId: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  ward: string;
  bed: string;
  status: 'stable' | 'critical' | 'observation' | 'for-discharge';
  daysAdmitted: number;
  admittingDiagnosis: string;
  allergies: string[];
  lastVitalsAt?: string;
  bloodGroup?: string;
  bloodTransfusionConsent?: string;
}

// ── Vitals ────────────────────────────────────────────────────────────────────

export interface VitalEntryForm {
  patientId: string;
  encounterId: string;
  systolic?: number;
  diastolic?: number;
  hr?: number;
  temp?: number;
  spo2?: number;
  rr?: number;
  weight?: number;
}

// ── Intake / Output ───────────────────────────────────────────────────────────

export type IOSubtype =
  | 'oral'
  | 'iv_fluid'
  | 'ng_feed'
  | 'urine'
  | 'drain'
  | 'emesis'
  | 'other';

export interface IOEntry {
  id: string;
  patientId: string;
  type: 'intake' | 'output';
  subtype: IOSubtype;
  amount: number; // mL
  note?: string;
  recordedAt: string;
}

export interface IOSummary {
  totalIntake: number;
  totalOutput: number;
  balance: number;
  entries: IOEntry[];
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface NursingTask {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  description: string;
  priority: 'routine' | 'urgent' | 'stat';
  dueAt?: string;
  status: 'requested' | 'in-progress' | 'completed';
  category: string;
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export type AlertType = 'overdue-med' | 'critical-vital' | 'allergy' | 'flag' | 'task-overdue';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface NursingAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  at: string;
  minutesOverdue?: number;
}
