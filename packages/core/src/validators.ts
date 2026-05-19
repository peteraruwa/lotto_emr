import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

const FhirDateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format');

const FhirDateTimeString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,
    'Must be a valid ISO 8601 date-time string'
  );

const FhirReference = z.object({
  reference: z.string().min(1),
  display: z.string().optional(),
});

const FhirCoding = z.object({
  system: z.string().url().optional(),
  code: z.string().optional(),
  display: z.string().optional(),
});

const FhirCodeableConcept = z.object({
  coding: z.array(FhirCoding).optional(),
  text: z.string().optional(),
});

const FhirHumanName = z.object({
  use: z.enum(['usual', 'official', 'temp', 'nickname', 'anonymous', 'old', 'maiden']).optional(),
  text: z.string().optional(),
  family: z.string().optional(),
  given: z.array(z.string()).optional(),
});

const FhirContactPoint = z.object({
  system: z.enum(['phone', 'fax', 'email', 'pager', 'url', 'sms', 'other']).optional(),
  value: z.string().optional(),
  use: z.enum(['home', 'work', 'temp', 'old', 'mobile']).optional(),
});

const FhirAddress = z.object({
  use: z.enum(['home', 'work', 'temp', 'old', 'billing']).optional(),
  type: z.enum(['postal', 'physical', 'both']).optional(),
  text: z.string().optional(),
  line: z.array(z.string()).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

// ── Patient schema ────────────────────────────────────────────────────────────

export const PatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string().optional(),
  identifier: z
    .array(
      z.object({
        system: z.string().optional(),
        value: z.string().min(1),
        type: FhirCodeableConcept.optional(),
      })
    )
    .optional(),
  active: z.boolean().optional(),
  name: z.array(FhirHumanName).min(1, 'At least one name is required'),
  telecom: z.array(FhirContactPoint).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  birthDate: FhirDateString,
  address: z.array(FhirAddress).optional(),
  contact: z
    .array(
      z.object({
        relationship: z.array(FhirCodeableConcept).optional(),
        name: FhirHumanName.optional(),
        telecom: z.array(FhirContactPoint).optional(),
      })
    )
    .optional(),
});

export type ValidatedPatient = z.infer<typeof PatientSchema>;

// ── Encounter schema ──────────────────────────────────────────────────────────

export const EncounterSchema = z.object({
  resourceType: z.literal('Encounter'),
  id: z.string().optional(),
  status: z.enum([
    'planned',
    'arrived',
    'triaged',
    'in-progress',
    'onleave',
    'finished',
    'cancelled',
    'unknown',
  ]),
  class: z.object({
    system: z.string(),
    code: z.string(),
    display: z.string().optional(),
  }),
  type: z.array(FhirCodeableConcept).optional(),
  subject: FhirReference,
  participant: z
    .array(
      z.object({
        type: z.array(FhirCodeableConcept).optional(),
        individual: FhirReference.optional(),
      })
    )
    .optional(),
  period: z
    .object({
      start: FhirDateTimeString,
      end: FhirDateTimeString.optional(),
    })
    .optional(),
  reasonCode: z.array(FhirCodeableConcept).optional(),
  reasonReference: z.array(FhirReference).optional(),
});

export type ValidatedEncounter = z.infer<typeof EncounterSchema>;

// ── Observation schema ────────────────────────────────────────────────────────

export const ObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string().optional(),
  status: z.enum([
    'registered',
    'preliminary',
    'final',
    'amended',
    'corrected',
    'cancelled',
    'entered-in-error',
    'unknown',
  ]),
  category: z
    .array(
      z.object({
        coding: z.array(FhirCoding).optional(),
      })
    )
    .optional(),
  code: FhirCodeableConcept,
  subject: FhirReference,
  encounter: FhirReference.optional(),
  effectiveDateTime: FhirDateTimeString.optional(),
  issued: z.string().optional(),
  valueQuantity: z
    .object({
      value: z.number(),
      unit: z.string(),
      system: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
  valueString: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  valueCodeableConcept: FhirCodeableConcept.optional(),
  interpretation: z.array(FhirCodeableConcept).optional(),
  referenceRange: z
    .array(
      z.object({
        low: z
          .object({ value: z.number(), unit: z.string() })
          .optional(),
        high: z
          .object({ value: z.number(), unit: z.string() })
          .optional(),
        text: z.string().optional(),
      })
    )
    .optional(),
});

export type ValidatedObservation = z.infer<typeof ObservationSchema>;
