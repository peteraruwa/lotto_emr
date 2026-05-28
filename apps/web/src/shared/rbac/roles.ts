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

export const CLINICAL_ROLES: Role[] = ['doctor', 'nurse', 'pharmacist', 'lab', 'radiologist', 'superadmin'];
export const NON_CLINICAL_ROLES: Role[] = ['admin', 'hr', 'records', 'billing'];
export function isClinicalRole(role: Role): boolean {
  return CLINICAL_ROLES.includes(role);
}
