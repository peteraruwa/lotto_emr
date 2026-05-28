'use client';
import { useMemo } from 'react';
import type { WardPatient, WardAlert } from '../types';

export function useWardAlerts(patients: WardPatient[]): WardAlert[] {
  return useMemo(() => {
    const alerts: WardAlert[] = [];
    const now = new Date().toISOString();

    for (const p of patients) {
      if (p.status === 'critical') {
        alerts.push({
          id: `critical-${p.patientId}`,
          patientId: p.patientId,
          patientName: p.patientName,
          ward: p.ward,
          bedNumber: p.bedNumber,
          mrn: p.mrn,
          type: 'deterioration',
          severity: 'critical',
          message: 'Critical status — immediate review required',
          detectedAt: now,
        });
      }
      if (p.news2Score !== undefined && p.news2Score >= 7) {
        alerts.push({
          id: `news2-${p.patientId}`,
          patientId: p.patientId,
          patientName: p.patientName,
          ward: p.ward,
          bedNumber: p.bedNumber,
          mrn: p.mrn,
          type: 'deterioration',
          severity: p.news2Score >= 9 ? 'critical' : 'high',
          message: `NEWS2 score ${p.news2Score} — high risk of deterioration`,
          detectedAt: now,
        });
      }
      if (p.isFallRisk) {
        alerts.push({
          id: `fall-${p.patientId}`,
          patientId: p.patientId,
          patientName: p.patientName,
          ward: p.ward,
          bedNumber: p.bedNumber,
          mrn: p.mrn,
          type: 'fall-risk',
          severity: 'warning',
          message: 'Fall risk flagged — ensure bed rails up and call bell accessible',
          detectedAt: now,
        });
      }
      if (p.alertCount && p.alertCount > 0 && p.status !== 'critical') {
        alerts.push({
          id: `alert-${p.patientId}`,
          patientId: p.patientId,
          patientName: p.patientName,
          ward: p.ward,
          bedNumber: p.bedNumber,
          mrn: p.mrn,
          type: 'missed-med',
          severity: 'warning',
          message: `${p.alertCount} active alert${p.alertCount > 1 ? 's' : ''} pending`,
          detectedAt: now,
        });
      }
    }

    const order = { critical: 0, high: 1, warning: 2 };
    return alerts.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3));
  }, [patients]);
}
