// ── Prescription State Machine ─────────────────────────────────────────────
export type PharmacyStatus =
  | 'pending'
  | 'under-review'
  | 'verified'
  | 'safety-cleared'
  | 'dispensing'
  | 'dispensed'
  | 'rejected'
  | 'returned'
  | 'on-hold';

export type SafetyFlagType = 'allergy' | 'interaction' | 'dose' | 'duplicate' | 'contraindication';
export type SafetyFlagSeverity = 'critical' | 'high' | 'moderate' | 'low';

export interface SafetyFlag {
  type: SafetyFlagType;
  severity: SafetyFlagSeverity;
  message: string;
  drug?: string;
  recommendation?: string;
}

// Stored in MedicationRequest.note[0].text as JSON
export interface PharmacyNote {
  pharmacyStatus: PharmacyStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  rejectionReason?: string;
  holdReason?: string;
  clarificationRequest?: string;
  safetyFlags: SafetyFlag[];
  safetyOverridden?: boolean;
  safetyOverrideReason?: string;
  dispensed?: DispenseRecord;
  auditLog: PharmacyAuditEntry[];
}

export interface PharmacyPrescription {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  encounterId: string;
  ward?: string;
  bed?: string;
  mrn: string;
  drugName: string;
  dose: string;
  route: string;
  timingCode: string;
  quantity?: number;
  prescriberId: string;
  prescriberName: string;
  priority: 'routine' | 'urgent' | 'stat';
  isControlled: boolean;
  isHighAlert: boolean;
  isDischarge: boolean;
  pharmacyStatus: PharmacyStatus;
  authoredOn: string;
  safetyFlags: SafetyFlag[];
  rejectionReason?: string;
  holdReason?: string;
  clarificationRequest?: string;
  dispensed?: DispenseRecord;
  allergies: string[];
  auditLog: PharmacyAuditEntry[];
  notes?: string;
}

export interface DispenseRecord {
  id: string;
  pharmacistId: string;
  pharmacistName: string;
  dispensedAt: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  isPartial: boolean;
  witnessId?: string;
  witnessName?: string;
}

export interface InventoryItem {
  id: string;
  drugName: string;
  genericName?: string;
  form: string;
  strength: string;
  currentStock: number;
  unit: string;
  minThreshold: number;
  reorderLevel: number;
  expiryDate?: string;
  daysToExpiry?: number;
  storageCondition: 'room-temp' | 'refrigerated' | 'frozen' | 'controlled';
  isControlled: boolean;
  location?: string;
  lotNumber?: string;
}

export interface PharmacyAuditEntry {
  id: string;
  action: string;
  prescriptionId?: string;
  drugName?: string;
  patientName?: string;
  pharmacistId: string;
  pharmacistName: string;
  at: string;
  reason?: string;
  details?: string;
}

export interface PharmacyAlert {
  id: string;
  type: 'allergy' | 'interaction' | 'stat' | 'stock-shortage' | 'controlled-drug' | 'overdose' | 'duplicate';
  severity: 'critical' | 'high' | 'moderate';
  message: string;
  prescriptionId?: string;
  patientName?: string;
  at: string;
  actionRequired: boolean;
}
