export type AncRiskLevel = 'low' | 'moderate' | 'high';

export interface AncEnrollmentData {
  lmpDate: string;
  edd: string;
  gestationalWeekAtBooking: number;
  gravida: number;
  para: number;
  abortus: number;
  riskFactors: string[];
  riskLevel: AncRiskLevel;
}

export interface AncVisit {
  id: string;
  visitNumber: number;
  targetWeek: number;
  scheduledDate?: string;
  completedDate?: string;
  status: 'upcoming' | 'due' | 'completed' | 'missed';
  weight?: number;
  bp?: string;
  fetalHeartRate?: number;
  fundusHeight?: number;
  presentation?: string;
  findings?: string;
}

export interface AncRecord {
  patientId: string;
  enrollmentDate: string;
  lmpDate: string;
  edd: string;
  gestationalWeekAtBooking: number;
  gravida: number;
  para: number;
  abortus: number;
  riskLevel: AncRiskLevel;
  riskFactors: string[];
  visits: AncVisit[];
}
