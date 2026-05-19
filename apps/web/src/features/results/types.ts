import type { CriticalityLevel } from '@lotto-emr/core';

export interface ResultListItem {
  id: string;
  resourceType: 'Observation' | 'DiagnosticReport';
  patientId: string;
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  criticality: CriticalityLevel;
  status: string;
  effectiveDate: string;
  performerName?: string;
  loincCode?: string;
}

export interface ObservationDisplay {
  id: string;
  name: string;
  value: string;
  unit?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  referenceRangeUnit?: string;
  referenceRangeText?: string;
  criticality: CriticalityLevel;
  status: string;
  effectiveDate: string;
  method?: string;
  performer?: string;
  interpretation?: string;
  note?: string;
}
