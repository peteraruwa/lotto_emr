// ── Discharge Status ──────────────────────────────────────────────────────────

export type DischargeStatus =
  | 'not-started'
  | 'ready'
  | 'summary-pending'
  | 'pharmacy-pending'
  | 'doctor-approval'
  | 'completed'
  | 'dama'
  | 'death'
  | 'transfer';

// ── Ward Patient ──────────────────────────────────────────────────────────────

export interface WardPatient {
  encounterId: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  mrn: string;
  ward: string;
  bedNumber: string;
  admissionDate: string;
  admittingDiagnosis: string;
  status: 'stable' | 'critical' | 'observation' | 'for-discharge';
  daysAdmitted: number;
  // Extended fields
  nurseAssigned?: string;
  onOxygen?: boolean;
  hasIVLine?: boolean;
  hasCatheter?: boolean;
  isFallRisk?: boolean;
  isIsolation?: boolean;
  isNPO?: boolean;
  acuityScore?: number; // 1-4
  alertCount?: number;
  pendingTasks?: number;
  dischargeStatus?: DischargeStatus;
  lastVitalsAt?: string;
  news2Score?: number;
}

// ── Beds ──────────────────────────────────────────────────────────────────────

export type BedStatus =
  | 'occupied'
  | 'available'
  | 'cleaning'
  | 'reserved'
  | 'isolation'
  | 'high-dependency'
  | 'blocked';

export interface WardBed {
  id: string;
  bedNumber: string;
  ward: string;
  status: BedStatus;
  patient?: WardPatient;
  cleaningSince?: string;
  reservedFor?: string;
  notes?: string;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskType =
  | 'medication'
  | 'vitals'
  | 'wound-dressing'
  | 'iv-fluid-review'
  | 'catheter-care'
  | 'lab-sample'
  | 'discharge-paperwork'
  | 'blood-transfusion'
  | 'doctor-review'
  | 'other';

export type TaskPriority = 'routine' | 'urgent' | 'stat';
export type TaskStatus = 'overdue' | 'due' | 'upcoming' | 'completed' | 'in-progress';

export interface WardTask {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  type: TaskType;
  description: string;
  priority: TaskPriority;
  dueAt: string;
  status: TaskStatus;
  assignedTo?: string;
  completedAt?: string;
  completedBy?: string;
  minutesUntilDue: number;
}

// ── Discharge ─────────────────────────────────────────────────────────────────

export interface DischargeRecord {
  encounterId: string;
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  mrn: string;
  admittingDiagnosis: string;
  daysAdmitted: number;
  status: DischargeStatus;
  initiatedAt?: string;
  completedAt?: string;
  dischargeType?: 'routine' | 'dama' | 'death' | 'referral' | 'absconded' | 'transfer';
  dischargeSummary?: string;
  followUpPlan?: string;
  pendingMeds?: boolean;
  doctorApproved?: boolean;
}

// ── Transfers ─────────────────────────────────────────────────────────────────

export interface TransferRecord {
  id: string;
  encounterId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  fromWard: string;
  fromBed: string;
  toWard: string;
  toBed?: string;
  reason: string;
  condition: string;
  escort?: string;
  requestedAt: string;
  completedAt?: string;
  status: 'requested' | 'approved' | 'in-transit' | 'completed' | 'cancelled';
  type: 'ward-to-ward' | 'ward-to-icu' | 'icu-to-ward' | 'external';
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export type WardAlertType =
  | 'spo2-low'
  | 'hypotension'
  | 'sepsis'
  | 'missed-med'
  | 'critical-lab'
  | 'fall-risk'
  | 'fever'
  | 'tachycardia'
  | 'bradycardia'
  | 'deterioration';

export type WardAlertSeverity = 'critical' | 'high' | 'warning';

export interface WardAlert {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  mrn: string;
  type: WardAlertType;
  severity: WardAlertSeverity;
  message: string;
  detectedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  assignedTo?: string;
  escalated?: boolean;
}

// ── Handover ──────────────────────────────────────────────────────────────────

export type HandoverCategory =
  | 'stable'
  | 'at-risk'
  | 'critical'
  | 'pending-task'
  | 'watchlist';

export interface HandoverEntry {
  id: string;
  patientId: string;
  patientName: string;
  ward: string;
  bedNumber: string;
  category: HandoverCategory;
  note: string;
  addedBy: string;
  addedAt: string;
  shiftDate: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface WardAnalytics {
  avgLengthOfStay: number;
  bedTurnoverRate: number;
  admissionsToday: number;
  dischargesToday: number;
  plannedDischarges: number;
  avgDischargeDelay: number;
  medicationDelays: number;
  criticalIncidents: number;
  occupancyRate: number;
  nursePatientRatio: number;
}
