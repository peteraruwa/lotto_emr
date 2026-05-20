import { z } from 'zod';

export const DEPARTMENTS = [
  'Clinical',
  'Nursing',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Administration',
  'Human Resources',
  'Information Technology',
  'Finance',
  'Maintenance',
  'Security',
  'Catering',
] as const;

export const HOSPITAL_ROLES_FOR_STAFF = [
  { value: 'doctor',      label: 'Doctor' },
  { value: 'nurse',       label: 'Nurse' },
  { value: 'pharmacist',  label: 'Pharmacist' },
  { value: 'lab',         label: 'Lab Technician' },
  { value: 'radiologist', label: 'Radiologist' },
  { value: 'admin',       label: 'Administrative Staff' },
  { value: 'superadmin',  label: 'Super Administrator (HR/IT)' },
] as const;

export const employeeSchema = z.object({
  // Personal biodata
  firstName:        z.string().min(1, 'First name is required').max(100),
  lastName:         z.string().min(1, 'Last name is required').max(100),
  otherNames:       z.string().max(100).optional(),
  dateOfBirth:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required — YYYY-MM-DD'),
  gender:           z.enum(['male', 'female', 'other']),
  phone:            z.string().min(7, 'Phone is required').max(20),
  personalEmail:    z.string().email('Invalid email').optional().or(z.literal('')),
  address:          z.string().max(200).optional(),
  state:            z.string().max(50).optional(),
  nextOfKinName:    z.string().max(100).optional(),
  nextOfKinPhone:   z.string().max(20).optional(),
  nextOfKinRelationship: z.string().max(50).optional(),

  // Employment details
  department:       z.enum(DEPARTMENTS, { required_error: 'Department is required' }),
  jobTitle:         z.string().min(1, 'Job title is required').max(100),
  qualification:    z.string().max(200).optional(),
  dateOfEmployment: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Required — YYYY-MM-DD'),
  employeeId:       z.string().max(20).optional(),

  // System account
  loginEmail:       z.string().email('Must be a valid email — this is the login username'),
  password:         z.string().min(8, 'Minimum 8 characters').max(64),
  confirmPassword:  z.string().min(1, 'Please confirm the password'),
  systemRole:       z.enum(
    ['doctor','nurse','pharmacist','lab','radiologist','admin','superadmin'],
    { required_error: 'System role is required' }
  ),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
