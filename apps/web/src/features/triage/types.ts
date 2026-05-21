export type TriageUrgency = 'critical' | 'urgent' | 'non-urgent';
export type TriageRouting = 'emergency' | 'outpatient' | 'anc';

export interface TriageVitals {
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  weight?: number;
  height?: number;
}

export interface TriageFormData {
  chiefComplaint: string;
  vitals: TriageVitals;
  urgency: TriageUrgency;
  routing: TriageRouting;
  notes?: string;
}
