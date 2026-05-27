import { z } from 'zod';
import { NIGERIAN_STATES, BLOOD_GROUPS, GENOTYPES } from '../types';

// ── Sub-schemas ─────────────────────────────────────────────────────────────
const allergyItem = z.object({
  substance: z.string().min(1, 'Substance is required'),
  reaction:  z.string(),
  severity:  z.enum(['mild', 'moderate', 'severe', '']),
});

const conditionItem = z.object({
  name:  z.string().min(1, 'Condition name is required'),
  since: z.string(),
});

const riskFlags = z.object({
  diabetic:          z.boolean(),
  hypertensive:      z.boolean(),
  asthmatic:         z.boolean(),
  sickleCellDisease: z.boolean(),
  pregnant:          z.boolean(),
  immunocompromised: z.boolean(),
  epileptic:         z.boolean(),
  hivPositive:       z.boolean(),
});

// ── Master registration schema ──────────────────────────────────────────────
export const registrationSchema = z.object({
  // Step 1 — Identity
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).default(''),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .refine((d) => {
      const p = new Date(d);
      return p <= new Date() && p > new Date('1900-01-01');
    }, 'Date of birth must be in the past'),
  gender: z.enum(['male', 'female', 'other', 'unknown'], {
    required_error: 'Sex is required',
  }),
  bloodGroup: z.enum([...BLOOD_GROUPS, '']).default(''),
  genotype:   z.enum([...GENOTYPES,   '']).default(''),
  nin: z
    .string()
    .max(11)
    .regex(/^(\d{11})?$/, 'NIN must be exactly 11 digits')
    .default(''),
  tribe:    z.string().max(100).default(''),
  religion: z.string().max(100).default(''),

  // Step 2 — Contact
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .max(20)
    .regex(/^[+0-9\s\-()]{7,20}$/, 'Enter a valid phone number'),
  altPhone: z.string().max(20).default(''),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal(''))
    .default(''),
  addressLine1: z.string().max(200).default(''),
  addressLine2: z.string().max(200).default(''),
  city:  z.string().max(100).default(''),
  state: z.enum([...NIGERIAN_STATES, '']).default(''),

  // Step 3 — Next of Kin
  nokFirstName: z.string().max(100).default(''),
  nokLastName:  z.string().max(100).default(''),
  nokRelationship: z
    .enum(['spouse', 'parent', 'child', 'sibling', 'guardian', 'friend', 'other', ''])
    .default(''),
  nokPhone:   z.string().max(20).default(''),
  nokEmail:   z.string().email('Invalid NOK email').or(z.literal('')).default(''),
  nokAddress: z.string().max(300).default(''),

  // Step 4 — Insurance
  paymentMode: z.enum(['cash', 'hmo', 'nhis', 'private']).default('cash'),
  hmoProvider:     z.string().max(100).default(''),
  hmoPolicyNumber: z.string().max(60).default(''),
  hmoGroup:        z.string().max(60).default(''),
  nhisNumber:      z.string().max(60).default(''),

  // Step 5 — Clinical Safety Flags
  allergies:         z.array(allergyItem).default([]),
  chronicConditions: z.array(conditionItem).default([]),
  riskFlags: riskFlags.default({
    diabetic: false, hypertensive: false, asthmatic: false,
    sickleCellDisease: false, pregnant: false, immunocompromised: false,
    epileptic: false, hivPositive: false,
  }),

  // Step 6 — Treatment Preferences
  bloodTransfusionConsent: z.enum(['consents', 'refuses', 'conditional', 'deferred'], {
    required_error: 'Blood transfusion preference is required',
  }),
  bloodTransfusionConditions: z.string().max(500).default(''),
  resuscitationPreference: z.enum(['full', 'dnr', 'limited'], {
    required_error: 'Resuscitation preference is required',
  }),
  organDonorConsent:    z.boolean().default(false),
  ndprDataConsent:      z.boolean().refine((v) => v === true, {
    message: 'You must accept the data processing consent to register (NDPR requirement)',
  }),
  ndprMarketingConsent: z.boolean().default(false),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// ── Per-step required fields ─────────────────────────────────────────────────
export const STEP_REQUIRED_FIELDS: Record<number, (keyof RegistrationFormData)[]> = {
  0: ['firstName', 'lastName', 'dateOfBirth', 'gender'],
  1: ['phone'],
  2: [],
  3: ['paymentMode'],
  4: [],
  5: ['bloodTransfusionConsent', 'resuscitationPreference', 'ndprDataConsent'],
  6: [],
};
