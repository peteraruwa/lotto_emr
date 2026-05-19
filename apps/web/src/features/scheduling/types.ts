export interface AppointmentFormData {
  patientId: string;
  practitionerId: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
  serviceType: string; // e.g. "General Consultation"
  reason?: string;
  notes?: string;
}

export interface SlotData {
  id: string;
  scheduleId: string;
  status: 'free' | 'busy' | 'busy-unavailable' | 'busy-tentative';
  start: string;
  end: string;
}

export interface AppointmentListItem {
  id: string;
  patientId: string;
  patientName: string;
  practitionerName: string;
  start: string;
  end: string;
  serviceType: string;
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow';
  reason?: string;
}
