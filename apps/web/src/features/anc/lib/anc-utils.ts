import type { Condition } from '@medplum/fhirtypes';
import type { AncRecord, AncVisit, AncRiskLevel, PregnancyRecord } from '../types';
import { ANC_EXT } from '../types';

export function calculateEDD(lmpDate: string): string {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280);
  return lmp.toISOString().split('T')[0];
}

export function calculateGestationalAge(lmpDate: string): { weeks: number; days: number; total: number } {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffMs = today.getTime() - lmp.getTime();
  const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, total: totalDays };
}

export function calculateGestationalWeeks(lmpDate: string): number {
  return calculateGestationalAge(lmpDate).weeks;
}

export function formatGA(lmpDate: string): string {
  const { weeks, days } = calculateGestationalAge(lmpDate);
  if (days === 0) return `${weeks}w`;
  return `${weeks}w ${days}d`;
}

export function formatGALong(lmpDate: string): string {
  const { weeks, days } = calculateGestationalAge(lmpDate);
  if (days === 0) return `${weeks} weeks`;
  return `${weeks} weeks ${days} days`;
}

// Derive risk level from number of risk factors
export function deriveRiskLevel(factorCount: number): AncRiskLevel {
  if (factorCount === 0) return 'low';
  if (factorCount <= 2) return 'moderate';
  return 'high';
}

// Auto-detect risk flags from visit data
export interface RiskFlag {
  code: string;
  label: string;
  severity: 'warning' | 'danger';
}

export function detectVisitRiskFlags(data: {
  bpSystolic?: number;
  bpDiastolic?: number;
  urineProtein?: string;
  fetalMovement?: string;
  pcv?: number;
  bloodGlucose?: number;
}): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (data.bpSystolic !== undefined && data.bpDiastolic !== undefined) {
    if (data.bpSystolic >= 160 || data.bpDiastolic >= 110) {
      flags.push({ code: 'severe-htn', label: 'Severe Hypertension', severity: 'danger' });
    } else if (data.bpSystolic >= 140 || data.bpDiastolic >= 90) {
      flags.push({ code: 'htn', label: 'Elevated Blood Pressure', severity: 'warning' });
    }
  }

  if (data.urineProtein && ['1+', '2+', '3+'].includes(data.urineProtein)) {
    flags.push({ code: 'proteinuria', label: 'Proteinuria', severity: data.urineProtein === '3+' ? 'danger' : 'warning' });
  }

  if (data.fetalMovement === 'absent') {
    flags.push({ code: 'fetal-movement-absent', label: 'No Fetal Movement', severity: 'danger' });
  } else if (data.fetalMovement === 'reduced') {
    flags.push({ code: 'fetal-movement-reduced', label: 'Reduced Fetal Movement', severity: 'warning' });
  }

  if (data.pcv !== undefined) {
    if (data.pcv < 21) {
      flags.push({ code: 'severe-anaemia', label: 'Severe Anaemia (PCV <21%)', severity: 'danger' });
    } else if (data.pcv < 30) {
      flags.push({ code: 'anaemia', label: 'Anaemia (PCV <30%)', severity: 'warning' });
    }
  }

  if (data.bloodGlucose !== undefined && data.bloodGlucose > 7.8) {
    flags.push({ code: 'hyperglycaemia', label: 'Elevated Blood Glucose', severity: 'warning' });
  }

  return flags;
}

const WHO_VISIT_WEEKS = [8, 12, 16, 20, 26, 30, 36, 40];

export function generateVisitSchedule(lmpDate: string): Array<{
  visitNumber: number;
  targetWeek: number;
  scheduledDate: string;
  status: AncVisit['status'];
}> {
  const lmp = new Date(lmpDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return WHO_VISIT_WEEKS.map((targetWeek, idx) => {
    const scheduled = new Date(lmp);
    scheduled.setDate(scheduled.getDate() + targetWeek * 7);
    const scheduledDate = scheduled.toISOString().split('T')[0];

    const diffDays = Math.floor((scheduled.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

    let status: AncVisit['status'];
    if (diffDays < 0) {
      status = 'missed';
    } else if (diffDays <= 7) {
      status = 'due';
    } else {
      status = 'upcoming';
    }

    return { visitNumber: idx + 1, targetWeek, scheduledDate, status };
  });
}

// Helper: read a Condition extension value by URL
function getExtensionValue(condition: Condition, url: string): string | number | undefined {
  const ext = condition.extension?.find((e) => e.url === url);
  if (!ext) return undefined;
  if (ext.valueString !== undefined) return ext.valueString;
  if (ext.valueInteger !== undefined) return ext.valueInteger;
  if (ext.valueDate !== undefined) return ext.valueDate;
  return undefined;
}

// Parse a Condition resource into a PregnancyRecord
export function parsePregnancyRecord(condition: Condition, patientId: string): PregnancyRecord {
  const lmpDate = (condition.onsetDateTime ?? '').split('T')[0];
  const edd = (getExtensionValue(condition, ANC_EXT.EDD) as string | undefined) ?? calculateEDD(lmpDate);
  const gravida = Number(getExtensionValue(condition, ANC_EXT.GRAVIDA) ?? 1);
  const para = Number(getExtensionValue(condition, ANC_EXT.PARA) ?? 0);
  const abortus = Number(getExtensionValue(condition, ANC_EXT.ABORTUS) ?? 0);
  const riskLevel = (getExtensionValue(condition, ANC_EXT.RISK_LEVEL) as AncRiskLevel | undefined) ?? 'low';
  const riskFactorsStr = (getExtensionValue(condition, ANC_EXT.RISK_FACTORS) as string | undefined) ?? '';
  const riskFactors = riskFactorsStr ? riskFactorsStr.split('|').map((f) => f.trim()).filter(Boolean) : [];

  return {
    conditionId: condition.id ?? '',
    patientId,
    lmpDate,
    edd,
    gravida,
    para,
    abortus,
    riskLevel,
    riskFactors,
    bloodGroup: getExtensionValue(condition, ANC_EXT.BLOOD_GROUP) as string | undefined,
    genotype: getExtensionValue(condition, ANC_EXT.GENOTYPE) as string | undefined,
    hivStatus: getExtensionValue(condition, ANC_EXT.HIV_STATUS) as string | undefined,
    hbsAgStatus: getExtensionValue(condition, ANC_EXT.HBSAG_STATUS) as string | undefined,
    vdrlStatus: getExtensionValue(condition, ANC_EXT.VDRL_STATUS) as string | undefined,
    enrollmentDate: (condition.recordedDate ?? condition.onsetDateTime ?? '').split('T')[0],
  };
}

// Build a legacy AncRecord (for backward compatibility with AncVisitTracker)
export function buildLegacyAncRecord(pregnancy: PregnancyRecord): AncRecord {
  const scheduleItems = generateVisitSchedule(pregnancy.lmpDate);
  const visits: AncVisit[] = scheduleItems.map((item) => ({
    id: `visit-${item.visitNumber}`,
    ...item,
  }));
  return {
    patientId: pregnancy.patientId,
    enrollmentDate: pregnancy.enrollmentDate,
    lmpDate: pregnancy.lmpDate,
    edd: pregnancy.edd,
    gestationalWeekAtBooking: 0,
    gravida: pregnancy.gravida,
    para: pregnancy.para,
    abortus: pregnancy.abortus,
    riskLevel: pregnancy.riskLevel,
    riskFactors: pregnancy.riskFactors,
    bloodGroup: pregnancy.bloodGroup,
    hivStatus: pregnancy.hivStatus,
    visits,
  };
}
