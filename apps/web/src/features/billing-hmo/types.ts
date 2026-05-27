export type FullBillingStatus =
  | 'init'           // created, not yet verified
  | 'verified'       // insurance/cash eligibility confirmed
  | 'invoiced'       // invoice generated
  | 'paid'           // cash payment received
  | 'hmo_approved'   // HMO pre-auth approved
  | 'closed'         // fully closed
  | 'emergency_deferred'  // emergency - billing deferred
  | 'reconciled'     // deferred being reconciled
  | 'denied';        // rejected

export type PaymentMode = 'cash' | 'hmo' | 'nhis' | 'waiver';
export type PaymentMethod = 'cash' | 'pos' | 'transfer' | 'mobile';

export interface BillingItem {
  id: string;
  type: 'LAB' | 'IMAGING' | 'MEDICATION' | 'PROCEDURE' | 'CONSULTATION' | 'FOLLOWUP' | 'OTHER';
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
  notes?: string;
}

export interface HmoVerification {
  providerId: string;
  providerName: string;
  policyNumber: string;
  enrolleeId?: string;
  verifiedAt?: string;
  verifiedBy?: 'api' | 'manual' | 'local_db';
  approved: boolean;
  approvalCode?: string;
  coveredAmount?: number;
  notes?: string;
}

export interface BillingPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  paidAt: string;
  receivedBy?: string;
}

export interface BillingAuditEntry {
  action: string;
  at: string;
  by?: string;
  detail?: string;
}

export interface BillingNote {
  billingStatus: FullBillingStatus;
  paymentMode: PaymentMode;
  items: BillingItem[];
  totalEstimate: number;
  isEmergency?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  hmoVerification?: HmoVerification;
  payments?: BillingPayment[];
  denialReason?: string;
  deferredReason?: string;
  auditLog?: BillingAuditEntry[];
}

export interface FullBillingItem {
  basketId: string;
  patientId: string;
  patientName: string;
  encounterId?: string;
  submittedAt: string;
  billingNote: BillingNote;
  fhirStatus: string;
}

export interface HmoProvider {
  id: string;
  name: string;
  shortCode: string;
  phone?: string;
  email?: string;
}
