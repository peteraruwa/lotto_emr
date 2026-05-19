export type OrderType = 'LAB' | 'IMAGING' | 'MEDICATION';

export type OrderStatus = 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';

export interface OrderListItem {
  id: string;
  resourceType: 'ServiceRequest' | 'MedicationRequest';
  type: OrderType;
  patientId: string;
  patientName: string;
  status: OrderStatus;
  orderText: string;
  orderedBy?: string;
  orderedAt: string;
  priority: 'routine' | 'urgent' | 'asap' | 'stat';
  notes?: string;
}

export interface OrderFormData {
  type: OrderType;
  patientId: string;
  encounterId?: string;
  orderText: string;
  priority: 'routine' | 'urgent' | 'asap' | 'stat';
  notes?: string;
  // For medication orders
  medicationCode?: string;
  dose?: string;
  frequency?: string;
  durationDays?: number;
  // For lab/imaging
  loincCode?: string;
  snomedCode?: string;
  laterality?: string;
}
