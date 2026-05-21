export enum NoteType {
  SOAP = 'SOAP',
  PROGRESS = 'PROGRESS',
  DISCHARGE = 'DISCHARGE',
  REFERRAL = 'REFERRAL',
}

export interface NoteFormData {
  patientId: string;
  encounterId?: string;
  type: NoteType;
  title: string;
  content: string;
  status: 'draft' | 'final';
}

export interface NoteListItem {
  id: string;
  patientId: string;
  type: NoteType;
  title: string;
  contentPreview: string;
  diagnosis: string;
  presentingComplaints: string;
  docStatus: 'preliminary' | 'final' | string;
  status: 'current' | 'superseded' | 'entered-in-error';
  authorName: string;
  date: string;
  encounterId?: string;
}
