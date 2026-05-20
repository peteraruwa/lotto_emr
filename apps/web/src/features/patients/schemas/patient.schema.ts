import { z } from 'zod';

/**
 * Zod schema for the new patient registration form.
 * Enforces Nigerian-specific validation where applicable.
 */
export const newPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      return parsed <= now && parsed > new Date('1900-01-01');
    }, 'Date of birth must be in the past'),

  gender: z.enum(['male', 'female', 'other', 'unknown'], {
    required_error: 'Gender is required',
  }),

  phone: z
    .string()
    .min(7, 'Phone number is required')
    .max(20, 'Phone number too long'),

  email: z.string().email('Invalid email address').optional().or(z.literal('')),

  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z
    .enum([
      'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
      'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
      'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
      'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
      'Yobe', 'Zamfara',
    ])
    .optional(),

  nextOfKinName: z.string().max(100).optional(),
  nextOfKinRelationship: z
    .enum(['spouse', 'parent', 'child', 'sibling', 'friend', 'other'])
    .optional(),
  nextOfKinPhone: z.string().max(20).optional().or(z.literal('')),

  insuranceNumber: z.string().max(50).optional(),
  insuranceProvider: z.string().max(100).optional(),

  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  genotypeCode: z.enum(['AA', 'AS', 'SS', 'AC', 'SC']).optional(),
});

export type NewPatientFormData = z.infer<typeof newPatientSchema>;
