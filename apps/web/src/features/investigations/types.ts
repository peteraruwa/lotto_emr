export type InvDept = 'lab' | 'radiology';

export type OrderStatus =
  | 'pending'        // received, not yet accepted
  | 'accepted'       // accepted by lab/radiology
  | 'collecting'     // specimen collection in progress
  | 'collected'      // specimen collected, in transit
  | 'received'       // specimen received at lab
  | 'processing'     // being processed / centrifuged / analyzed
  | 'imaging'        // scan in progress (radiology)
  | 'verifying'      // result entered, awaiting verification
  | 'verified'       // verified, ready to release
  | 'released'       // result/report released to clinician
  | 'rejected';      // specimen or request rejected

export type OrderPriority = 'routine' | 'urgent' | 'stat';

export type RejectionReason =
  | 'hemolyzed'
  | 'unlabeled'
  | 'insufficient-volume'
  | 'clotted'
  | 'wrong-container'
  | 'delayed-transport'
  | 'mislabeled'
  | 'duplicate-request'
  | 'other';

export type LabBench = 'hematology' | 'chemistry' | 'microbiology' | 'immunology' | 'histopathology' | 'serology';

export type ImagingModality = 'x-ray' | 'ultrasound' | 'ct' | 'mri' | 'mammography' | 'fluoroscopy' | 'echo';

export interface InvOrder {
  id: string;
  serviceRequestId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  encounterId?: string;
  ward?: string;
  requester?: string;
  testName: string;
  category: string;            // e.g. "Full Blood Count", "X-Ray Chest PA"
  priority: OrderPriority;
  dept: InvDept;
  status: OrderStatus;
  orderedAt: string;
  collectedAt?: string;
  receivedAt?: string;
  completedAt?: string;
  bench?: LabBench;
  modality?: ImagingModality;
  clinicalIndication?: string;
  contrastRequired?: boolean;
  specimenType?: string;
  specimenId?: string;         // barcode / accession
  accessionNumber?: string;
  isCritical?: boolean;
  rejectionReason?: RejectionReason;
  rejectionNotes?: string;
  notes?: string;
}

export interface LabResultEntry {
  analyte: string;
  value: string;
  unit: string;
  referenceRange: string;
  interpretation: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
}

export interface RecordedLabResult {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  testName: string;
  entries: LabResultEntry[];
  status: 'draft' | 'verified' | 'released' | 'amended';
  verifiedBy?: string;
  releasedAt?: string;
  notes?: string;
  isCritical: boolean;
  criticalAcknowledgedAt?: string;
  criticalAcknowledgedBy?: string;
}

export interface RadiologyReport {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  studyType: string;
  modality: ImagingModality;
  findings: string;
  impression: string;
  status: 'draft' | 'verified' | 'released' | 'amended';
  template?: string;
  radiologistId?: string;
  radiologistName?: string;
  releasedAt?: string;
  isCritical: boolean;
  criticalAcknowledgedAt?: string;
}

export interface CriticalAlert {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  ward?: string;
  type: 'lab' | 'radiology';
  finding: string;             // e.g. "K+ 2.1 mEq/L" or "Intracranial bleed"
  severity: 'critical' | 'high';
  detectedAt: string;
  notifiedAt?: string;
  notifiedBy?: string;
  notifiedTo?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface SpecimenRecord {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  specimenType: string;
  collectedAt?: string;
  collectedBy?: string;
  receivedAt?: string;
  receivedBy?: string;
  status: 'ordered' | 'collected' | 'in-transit' | 'received' | 'processing' | 'rejected' | 'consumed';
  rejectionReason?: RejectionReason;
  container?: string;
  volume?: string;
  notes?: string;
}

export interface ShiftHandoverEntry {
  id: string;
  category: 'pending-urgent' | 'machine-downtime' | 'delayed-report' | 'critical-pending' | 'reagent-shortage' | 'equipment-issue' | 'other';
  description: string;
  priority: 'info' | 'warning' | 'critical';
  at: string;
  by: string;
}

export interface InvAnalytics {
  processedToday: number;
  pendingBacklog: number;
  avgTurnaroundMinutes: number;
  urgentTurnaroundMinutes: number;
  rejectedSpecimens: number;
  criticalValueResponseMinutes: number;
  reportingBacklog: number;
  machineDowntime: number;
}
