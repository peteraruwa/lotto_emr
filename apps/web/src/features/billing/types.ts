export type BillingStatus = 'pending' | 'approved' | 'denied' | 'partial';

export interface BasketItem {
  id: string;            // temp client-side ID
  type: 'LAB' | 'IMAGING' | 'MEDICATION' | 'PROCEDURE' | 'FOLLOWUP';
  description: string;
  priority: 'routine' | 'urgent' | 'stat';
  estimatedCost?: number;
  notes?: string;
  // For medication
  dose?: string;
  frequency?: string;
  durationDays?: number;
}

export interface OrderBasketState {
  patientId: string;
  encounterId?: string;
  items: BasketItem[];
  totalEstimate: number;
  paymentMode: 'hmo' | 'cash' | 'waiver';
  hmoProvider?: string;
  submittedAt?: string;
  status: 'building' | 'submitted' | 'approved' | 'denied';
}

export interface BillingQueueItem {
  basketId: string;   // FHIR RequestGroup id
  patientId: string;
  patientName: string;
  submittedAt: string;
  itemCount: number;
  totalEstimate: number;
  paymentMode: string;
  status: BillingStatus;
}
