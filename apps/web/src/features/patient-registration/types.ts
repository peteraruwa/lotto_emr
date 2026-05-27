// ── Nigerian geo constants ──────────────────────────────────────────────────
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

// ── Clinical constants ──────────────────────────────────────────────────────
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const GENOTYPES    = ['AA', 'AS', 'SS', 'AC', 'SC'] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type Genotype   = (typeof GENOTYPES)[number];

// ── Tribal / demographic constants ─────────────────────────────────────────
export const NIGERIAN_TRIBES = [
  'Yoruba', 'Igbo', 'Hausa', 'Fulani', 'Ijaw', 'Kanuri', 'Ibibio', 'Tiv',
  'Efik', 'Itsekiri', 'Urhobo', 'Igala', 'Idoma', 'Nupe', 'Gwari', 'Jukun',
  'Other',
] as const;

export const RELIGIONS = [
  'Christianity', 'Islam', 'Traditional', 'Atheism', 'Other',
] as const;

// ── Form sub-types ──────────────────────────────────────────────────────────
export interface AllergyItem {
  substance: string;
  reaction:  string;
  severity:  'mild' | 'moderate' | 'severe' | '';
}

export interface ConditionItem {
  name:  string;
  since: string;
}

export interface RiskFlags {
  diabetic:          boolean;
  hypertensive:      boolean;
  asthmatic:         boolean;
  sickleCellDisease: boolean;
  pregnant:          boolean;
  immunocompromised: boolean;
  epileptic:         boolean;
  hivPositive:       boolean;
}

export type PaymentMode            = 'cash' | 'hmo' | 'nhis' | 'private';
export type BloodTransfusionConsent = 'consents' | 'refuses' | 'conditional' | 'deferred';
export type ResuscitationPreference = 'full' | 'dnr' | 'limited';
export type NokRelationship         = 'spouse' | 'parent' | 'child' | 'sibling' | 'guardian' | 'friend' | 'other';

// ── Master form data type ───────────────────────────────────────────────────
export interface RegistrationFormData {
  // ── Step 1: Identity ──────────────────────────────────────────────────
  firstName:  string;
  middleName: string;
  lastName:   string;
  dateOfBirth: string;
  gender:     'male' | 'female' | 'other' | 'unknown';
  bloodGroup: BloodGroup | '';
  genotype:   Genotype | '';
  nin:        string;
  tribe:      string;
  religion:   string;

  // ── Step 2: Contact ───────────────────────────────────────────────────
  phone:       string;
  altPhone:    string;
  email:       string;
  addressLine1: string;
  addressLine2: string;
  city:        string;
  state:       NigerianState | '';

  // ── Step 3: Next of Kin ───────────────────────────────────────────────
  nokFirstName:    string;
  nokLastName:     string;
  nokRelationship: NokRelationship | '';
  nokPhone:        string;
  nokEmail:        string;
  nokAddress:      string;

  // ── Step 4: Insurance / Payment ───────────────────────────────────────
  paymentMode:    PaymentMode;
  hmoProvider:    string;
  hmoPolicyNumber: string;
  hmoGroup:       string;
  nhisNumber:     string;

  // ── Step 5: Clinical Safety Flags ─────────────────────────────────────
  allergies:         AllergyItem[];
  chronicConditions: ConditionItem[];
  riskFlags:         RiskFlags;

  // ── Step 6: Treatment Preferences ────────────────────────────────────
  bloodTransfusionConsent:     BloodTransfusionConsent;
  bloodTransfusionConditions:  string;
  resuscitationPreference:     ResuscitationPreference;
  organDonorConsent:           boolean;
  ndprDataConsent:             boolean;    // REQUIRED — NDPR compliance
  ndprMarketingConsent:        boolean;
}

// ── Step configuration for the wizard ──────────────────────────────────────
export interface StepColorConfig {
  bg:        string;   // e.g. 'bg-blue-600'
  bgLight:   string;   // e.g. 'bg-blue-50'
  bgMid:     string;   // e.g. 'bg-blue-100'
  text:      string;   // e.g. 'text-blue-700'
  textLight: string;   // e.g. 'text-blue-500'
  border:    string;   // e.g. 'border-blue-200'
  ring:      string;   // e.g. 'focus:ring-blue-400'
  inputFocus: string;  // full focus classes
}

export interface StepConfig {
  id:          string;
  label:       string;
  description: string;
  emoji:       string;
  color:       StepColorConfig;
  /** Field keys that must pass validation before advancing */
  requiredFields: (keyof RegistrationFormData)[];
}
