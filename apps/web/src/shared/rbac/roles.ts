export const ROLES = {
  DOCTOR:      'doctor',
  NURSE:       'nurse',
  PHARMACIST:  'pharmacist',
  LAB:         'lab',
  RADIOLOGIST: 'radiologist',
  ADMIN:       'admin',
  HR:          'hr',
  RECORDS:     'records',
  BILLING:     'billing',
  SUPERADMIN:  'superadmin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
