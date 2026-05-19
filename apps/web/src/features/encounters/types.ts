export interface EncounterFormData {
  patientId: string;
  class: 'AMB' | 'EMER' | 'IMP' | 'OBSENC' | 'SS';
  reason: string;
  practitionerId?: string;
  locationId?: string;
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  notes?: string;
}

export interface EncounterListItem {
  id: string;
  patientId: string;
  patientName: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'unknown';
  class: string;
  classDisplay: string;
  reasonText: string;
  periodStart: string;
  periodEnd?: string;
  practitionerName?: string;
  location?: string;
  durationMinutes?: number;
}
