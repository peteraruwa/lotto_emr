import type { PatientSummary } from '@lotto-emr/core';

export type { PatientSummary };

export interface PatientListItem extends PatientSummary {
  insuranceNumber?: string;
  ward?: string;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'unknown';
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  bloodGroup?: string;
  genotypeCode?: string;
}

export interface PatientChartData {
  patient: PatientListItem;
  activeEncounterId?: string;
  activeConditions: Array<{ id: string; text: string; onsetDate?: string }>;
  allergies: Array<{ id: string; substance: string; reaction?: string; severity?: string }>;
  recentObservations: Array<{
    id: string;
    name: string;
    value: string;
    date: string;
    isCritical: boolean;
  }>;
  activeMedications: Array<{ id: string; name: string; dose: string; frequency: string }>;
}
