import type { AncVisit } from '../types';

export function calculateEDD(lmpDate: string): string {
  const lmp = new Date(lmpDate);
  lmp.setDate(lmp.getDate() + 280);
  return lmp.toISOString().split('T')[0];
}

export function calculateGestationalWeeks(lmpDate: string): number {
  const lmp = new Date(lmpDate);
  const today = new Date();
  const diffMs = today.getTime() - lmp.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

const WHO_VISIT_WEEKS = [8, 12, 16, 20, 26, 30, 36, 40];

export function generateVisitSchedule(
  lmpDate: string,
): Array<{
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

    const diffDays = Math.floor(
      (scheduled.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
    );

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
