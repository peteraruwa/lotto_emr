/**
 * Shared TypeScript types for Lotto Central Hospital EMR.
 * These types are used across the web app, bots, and any future services.
 */

// ── Role enum ──────────────────────────────────────────────────────────────────

export enum HospitalRole {
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PHARMACIST = 'pharmacist',
  LAB = 'lab',
  RADIOLOGIST = 'radiologist',
  ADMIN = 'admin',
}

export const ALL_ROLES = Object.values(HospitalRole) as HospitalRole[];

// ── Patient ────────────────────────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  mrn: string;
  fullName: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string; // ISO 8601 date string (YYYY-MM-DD)
  age: number;
  gender: 'male' | 'female' | 'other' | 'unknown';
  phone?: string;
  activeConditionsCount: number;
  allergiesCount: number;
  lastEncounterDate?: string;
}

// ── Encounter ──────────────────────────────────────────────────────────────────

export type EncounterStatus =
  | 'planned'
  | 'arrived'
  | 'triaged'
  | 'in-progress'
  | 'onleave'
  | 'finished'
  | 'cancelled'
  | 'unknown';

export type EncounterClass = 'AMB' | 'EMER' | 'IMP' | 'OBSENC' | 'SS';

export interface EncounterSummary {
  id: string;
  patientId: string;
  patientName: string;
  status: EncounterStatus;
  class: EncounterClass;
  classDisplay: string;
  reasonText?: string;
  periodStart: string; // ISO 8601 datetime
  periodEnd?: string;
  practitionerName?: string;
  location?: string;
}

// ── Order ──────────────────────────────────────────────────────────────────────

export type OrderType = 'LAB' | 'IMAGING' | 'MEDICATION' | 'PROCEDURE';

export type OrderStatus =
  | 'draft'
  | 'active'
  | 'on-hold'
  | 'revoked'
  | 'completed'
  | 'entered-in-error'
  | 'unknown';

export interface OrderSummary {
  id: string;
  resourceType: 'ServiceRequest' | 'MedicationRequest';
  type: OrderType;
  patientId: string;
  patientName: string;
  status: OrderStatus;
  orderText: string; // Human-readable description of what was ordered
  orderedBy?: string;
  orderedAt: string; // ISO 8601 datetime
  priority: 'routine' | 'urgent' | 'asap' | 'stat';
  notes?: string;
}

// ── Observation / Result ───────────────────────────────────────────────────────

export type ObservationStatus =
  | 'registered'
  | 'preliminary'
  | 'final'
  | 'amended'
  | 'corrected'
  | 'cancelled'
  | 'entered-in-error'
  | 'unknown';

export type CriticalityLevel = 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';

export interface ObservationSummary {
  id: string;
  patientId: string;
  status: ObservationStatus;
  codeDisplay: string; // e.g. "Hemoglobin"
  codeSystem?: string;
  code?: string;
  valueString?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  referenceRange?: {
    low?: number;
    high?: number;
    unit: string;
    text?: string;
  };
  criticality: CriticalityLevel;
  effectiveDateTime?: string;
  issuedAt?: string;
  performerName?: string;
}

// ── API response wrappers ──────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
