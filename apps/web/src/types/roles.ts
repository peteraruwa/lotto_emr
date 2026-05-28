/**
 * Role-Based Access Control Types
 * Strict role definitions for hospital EMR system
 */

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  PHARMACIST = 'pharmacist',
  RECORDS_STAFF = 'records_staff',
  BILLING_STAFF = 'billing_staff',
  LABORATORY = 'laboratory',
  IMAGING = 'imaging',
  RECEPTIONIST = 'receptionist',
}

export enum PermissionAction {
  VERIFY_NIN = 'verify_nin',
  EDIT_NIN = 'edit_nin',
  VIEW_NIN = 'view_nin',
  REGISTER_PATIENT = 'register_patient',
  EDIT_PATIENT = 'edit_patient',
  VIEW_PATIENT = 'view_patient',
  VIEW_BILLING = 'view_billing',
  PROCESS_PAYMENT = 'process_payment',
  GENERATE_RECEIPT = 'generate_receipt',
  REPRINT_RECEIPT = 'reprint_receipt',
  VIEW_CLINICAL_ALERTS = 'view_clinical_alerts',
  PRESCRIBE = 'prescribe',
  VIEW_ALLERGIES = 'view_allergies',
  MANAGE_QUEUE = 'manage_queue',
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  [UserRole.ADMIN]: Object.values(PermissionAction),

  [UserRole.RECORDS_STAFF]: [
    PermissionAction.VERIFY_NIN,
    PermissionAction.EDIT_NIN,
    PermissionAction.VIEW_NIN,
    PermissionAction.REGISTER_PATIENT,
    PermissionAction.VIEW_PATIENT,
  ],

  [UserRole.BILLING_STAFF]: [
    PermissionAction.VIEW_PATIENT,
    PermissionAction.VIEW_BILLING,
    PermissionAction.PROCESS_PAYMENT,
    PermissionAction.GENERATE_RECEIPT,
    PermissionAction.REPRINT_RECEIPT,
  ],

  [UserRole.DOCTOR]: [
    PermissionAction.VIEW_PATIENT,
    PermissionAction.PRESCRIBE,
    PermissionAction.VIEW_ALLERGIES,
    PermissionAction.VIEW_CLINICAL_ALERTS,
    PermissionAction.VIEW_NIN,
  ],

  [UserRole.NURSE]: [
    PermissionAction.VIEW_PATIENT,
    PermissionAction.VIEW_ALLERGIES,
    PermissionAction.VIEW_CLINICAL_ALERTS,
    PermissionAction.VIEW_NIN,
  ],

  [UserRole.PHARMACIST]: [
    PermissionAction.VIEW_PATIENT,
    PermissionAction.VIEW_ALLERGIES,
    PermissionAction.VIEW_CLINICAL_ALERTS,
    PermissionAction.VIEW_NIN,
  ],

  [UserRole.LABORATORY]: [
    PermissionAction.VIEW_PATIENT,
    PermissionAction.VIEW_NIN,
  ],

  [UserRole.IMAGING]: [
    PermissionAction.VIEW_PATIENT,
    PermissionAction.VIEW_NIN,
  ],

  [UserRole.RECEPTIONIST]: [
    PermissionAction.REGISTER_PATIENT,
    PermissionAction.VIEW_PATIENT,
    PermissionAction.MANAGE_QUEUE,
  ],
};

export function hasPermission(userRole: UserRole, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(action) ?? false;
}

export function canVerifyNIN(userRole: UserRole): boolean {
  return hasPermission(userRole, PermissionAction.VERIFY_NIN);
}

export function canProcessPayment(userRole: UserRole): boolean {
  return hasPermission(userRole, PermissionAction.PROCESS_PAYMENT);
}

export function canGenerateReceipt(userRole: UserRole): boolean {
  return hasPermission(userRole, PermissionAction.GENERATE_RECEIPT);
}

export function canReprintReceipt(userRole: UserRole): boolean {
  return hasPermission(userRole, PermissionAction.REPRINT_RECEIPT);
}

export function canViewClinicalAlerts(userRole: UserRole): boolean {
  return hasPermission(userRole, PermissionAction.VIEW_CLINICAL_ALERTS);
}
