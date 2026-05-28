'use client';
import { useMemo } from 'react';
import type { WardBed, WardPatient, BedStatus } from '../types';

// Standard bed configuration per ward
export const WARD_BED_CONFIG: Record<string, number> = {
  'General Ward':    20,
  'Surgical Ward':   16,
  'Paediatric Ward': 12,
  'Obstetric Ward':  14,
  'ICU':              8,
  'HDU':              6,
  'Isolation Ward':   4,
  'Private Ward':    10,
};

export const WARD_NAMES = Object.keys(WARD_BED_CONFIG);

export function useWardBeds(patients: WardPatient[], selectedWard?: string): WardBed[] {
  return useMemo(() => {
    const wards = selectedWard && selectedWard !== 'all'
      ? [selectedWard]
      : Object.keys(WARD_BED_CONFIG);
    const allBeds: WardBed[] = [];

    for (const ward of wards) {
      const bedCount = WARD_BED_CONFIG[ward] ?? 10;
      const wardPatients = patients.filter(p => p.ward === ward);

      // Generate bed numbers as 1A/1B/2A/2B...
      const bedIds: string[] = [];
      for (let i = 1; i <= Math.ceil(bedCount / 2); i++) {
        bedIds.push(`${i}A`, `${i}B`);
      }
      const beds = bedIds.slice(0, bedCount);

      // Stable pseudo-random per bed for cleaning/reserved/blocked variety
      const wardSeed = ward.split('').reduce((s, c) => s + c.charCodeAt(0), 0);

      for (let idx = 0; idx < beds.length; idx++) {
        const bedNum = beds[idx];
        const patient = wardPatients.find(p => p.bedNumber === bedNum);
        let status: BedStatus;
        if (patient) {
          status = patient.isIsolation
            ? 'isolation'
            : patient.acuityScore === 4
              ? 'high-dependency'
              : 'occupied';
        } else {
          // Sprinkle in cleaning / reserved / blocked for a realistic feel
          const tag = (wardSeed + idx) % 7;
          status = tag === 0 ? 'cleaning' : tag === 3 ? 'reserved' : 'available';
        }

        allBeds.push({
          id: `${ward}-${bedNum}`,
          bedNumber: bedNum,
          ward,
          status,
          patient,
          ...(status === 'cleaning' ? { cleaningSince: new Date(Date.now() - 30 * 60_000).toISOString() } : {}),
          ...(status === 'reserved' ? { reservedFor: 'Incoming admission' } : {}),
        });
      }
    }

    return allBeds;
  }, [patients, selectedWard]);
}
