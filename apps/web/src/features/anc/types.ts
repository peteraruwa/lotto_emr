export type AncRiskLevel = 'low' | 'moderate' | 'high';
export type AncVisitStatus = 'upcoming' | 'due' | 'completed' | 'missed';
export type AncNoteType =
  | 'booking'
  | 'followup'
  | 'high-risk-review'
  | 'delivery-admission'
  | 'delivery'
  | 'postnatal';

export const ANC_NOTE_TYPE_LABELS: Record<AncNoteType, string> = {
  'booking':            'Booking / Initial ANC Note',
  'followup':           'Follow-Up ANC Visit',
  'high-risk-review':   'High-Risk ANC Review',
  'delivery-admission': 'Labour / Delivery Admission',
  'delivery':           'Delivery Note',
  'postnatal':          'Postnatal Note',
};

export const ANC_VISIT_TYPE_SYSTEM = 'https://lotto-hospital.local/fhir/anc-visit-type';

// ── Extension URLs ────────────────────────────────────────────────────────────
export const ANC_EXT = {
  EDD:          'https://lotto-hospital.local/fhir/StructureDefinition/anc-edd',
  GRAVIDA:      'https://lotto-hospital.local/fhir/StructureDefinition/anc-gravida',
  PARA:         'https://lotto-hospital.local/fhir/StructureDefinition/anc-para',
  ABORTUS:      'https://lotto-hospital.local/fhir/StructureDefinition/anc-abortus',
  RISK_LEVEL:   'https://lotto-hospital.local/fhir/StructureDefinition/anc-risk-level',
  RISK_FACTORS: 'https://lotto-hospital.local/fhir/StructureDefinition/anc-risk-factors',
  BLOOD_GROUP:  'https://lotto-hospital.local/fhir/StructureDefinition/anc-blood-group',
  GENOTYPE:     'https://lotto-hospital.local/fhir/StructureDefinition/anc-genotype',
  HIV_STATUS:   'https://lotto-hospital.local/fhir/StructureDefinition/anc-hiv-status',
  HBSAG_STATUS: 'https://lotto-hospital.local/fhir/StructureDefinition/anc-hbsag-status',
  VDRL_STATUS:  'https://lotto-hospital.local/fhir/StructureDefinition/anc-vdrl-status',
} as const;

// ── Derived pregnancy summary (parsed from Condition) ────────────────────────
export interface PregnancyRecord {
  conditionId: string;
  patientId: string;
  lmpDate: string;        // ISO date
  edd: string;            // ISO date
  gravida: number;
  para: number;
  abortus: number;
  riskLevel: AncRiskLevel;
  riskFactors: string[];
  bloodGroup?: string;
  genotype?: string;
  hivStatus?: string;
  hbsAgStatus?: string;
  vdrlStatus?: string;
  enrollmentDate: string; // ISO date
}

// ── Visit summary (parsed from Encounter) ────────────────────────────────────
export interface AncVisitSummary {
  encounterId: string;
  noteType: AncNoteType;
  visitDate: string;      // ISO date
  gestationalAge?: number; // weeks at visit
  bp?: string;
  weight?: number;
  fetalHeartRate?: number;
  fundalHeight?: number;
  assessment?: string;
  clinicianNote?: string;
}

// ── Scheduled visit slots (WHO 8-visit model) ─────────────────────────────────
export interface AncVisit {
  id: string;
  visitNumber: number;
  targetWeek: number;
  scheduledDate?: string;
  completedDate?: string;
  status: AncVisitStatus;
  encounterId?: string;   // set when visit is recorded
  weight?: number;
  bp?: string;
  fetalHeartRate?: number;
  fundusHeight?: number;
  presentation?: string;
  findings?: string;
}

// ── Full ANC record (legacy + new combined) ───────────────────────────────────
export interface AncRecord {
  patientId: string;
  enrollmentDate: string;
  lmpDate: string;
  edd: string;
  gestationalWeekAtBooking: number;
  gravida: number;
  para: number;
  abortus: number;
  riskLevel: AncRiskLevel;
  riskFactors: string[];
  bloodGroup?: string;
  genotype?: string;
  hivStatus?: string;
  visits: AncVisit[];
}

// ── Legacy enrollment data (kept for backward compatibility) ──────────────────
export interface AncEnrollmentData {
  lmpDate: string;
  edd: string;
  gestationalWeekAtBooking: number;
  gravida: number;
  para: number;
  abortus: number;
  riskFactors: string[];
  riskLevel: AncRiskLevel;
}

// ── Booking note form data ────────────────────────────────────────────────────
export interface BookingNoteFormData {
  // Pregnancy basics
  lmpDate: string;
  eddByLmp: string;
  eddByUltrasound?: string;
  gravida: number;
  para: number;
  abortus: number;

  // Symptoms
  bleeding: boolean;
  fetalMovement: 'present' | 'absent' | 'reduced' | 'na';
  nausea: boolean;
  vomiting: boolean;
  otherSymptoms: string;

  // Past obstetric
  prevCSections: number;
  prevStillbirths: number;
  prevMiscarriages: number;
  prevPreterm: boolean;
  prevPPH: boolean;
  prevEclampsia: boolean;
  obstetricNotes: string;

  // Medical history
  hypertension: boolean;
  diabetes: boolean;
  asthma: boolean;
  sickleCellDisease: boolean;
  hivStatus: 'positive' | 'negative' | 'unknown';
  hbsAgStatus: 'positive' | 'negative' | 'unknown';
  otherMedical: string;

  // Gynaecological history
  regularMenses: boolean;
  fibroids: boolean;
  stiHistory: boolean;
  contraceptionHistory: string;

  // Family / social
  twinHistory: boolean;
  smokingAlcohol: boolean;
  socialNotes: string;

  // Examination
  weight: number;
  height: number;
  bpSystolic: number;
  bpDiastolic: number;
  temperature?: number;
  fundalHeight?: number;
  fetalHeartRate?: number;
  presentation: 'cephalic' | 'breech' | 'transverse' | 'na';
  edema: 'none' | 'mild' | 'moderate' | 'severe';
  generalCondition: 'good' | 'fair' | 'poor';

  // Investigations
  bloodGroup: string;
  genotype: string;
  pcv?: number;
  hivResult: 'reactive' | 'non-reactive' | 'pending';
  vdrl: 'reactive' | 'non-reactive' | 'pending';
  hbsAg: 'positive' | 'negative' | 'pending';
  urinalysis: string;
  ultrasoundDone: boolean;
  ultrasoundFindings: string;

  // Risk
  riskFactors: string[];
  riskLevel: AncRiskLevel;

  // Plan
  ironFolate: boolean;
  tetanusToxoid: boolean;
  ipt: boolean;
  bedNetProvided: boolean;
  otherSupplements: string;
  counselingTopics: string;
  nextVisitWeeks: number;
  referral: string;
}

// ── Follow-up note form data ──────────────────────────────────────────────────
export interface FollowUpNoteFormData {
  visitNumber: number;

  // Symptoms
  bleeding: boolean;
  headache: boolean;
  fetalMovement: 'present' | 'reduced' | 'absent';
  contractions: boolean;
  swelling: boolean;
  blurredVision: boolean;
  epigastricPain: boolean;
  dysuria: boolean;
  otherSymptoms: string;

  // Vitals
  weight: number;
  bpSystolic: number;
  bpDiastolic: number;
  temperature?: number;

  // Obstetric exam
  fundalHeight?: number;
  fetalHeartRate?: number;
  fetalMovementFelt: boolean;
  presentation: 'cephalic' | 'breech' | 'transverse' | '';
  lie: 'longitudinal' | 'transverse' | 'oblique' | '';
  edema: 'none' | 'mild' | 'moderate' | 'severe';

  // Investigations
  urineProtein: 'negative' | 'trace' | '1+' | '2+' | '3+';
  urineGlucose: 'negative' | 'trace' | 'positive';
  pcv?: number;
  bloodGlucose?: number;

  // Risk monitoring
  preEclampsiaSign: boolean;
  gestDiabetesSign: boolean;

  // Assessment + Plan
  assessment: 'stable' | 'high-risk' | 'refer-urgently';
  assessmentNote: string;
  medications: string;
  counseling: string;
  nextVisitWeeks: number;
  referral: string;
}

// ── High-risk review form data ────────────────────────────────────────────────
export interface HighRiskReviewFormData {
  riskCondition: string;
  symptoms: string;
  bpSystolic: number;
  bpDiastolic: number;
  weight: number;
  fetalHeartRate?: number;
  fetalMovement: 'present' | 'reduced' | 'absent';
  urineProtein: 'negative' | 'trace' | '1+' | '2+' | '3+';
  pcv?: number;
  bloodGlucose?: number;
  specialistRecommendations: string;
  escalationPlan: string;
  assessment: string;
}

// ── Delivery admission form data ──────────────────────────────────────────────
export interface DeliveryAdmissionFormData {
  contractions: boolean;
  contractionFrequency: string;
  membraneStatus: 'intact' | 'ruptured-spontaneous' | 'ruptured-artificial';
  vaginalBleeding: boolean;
  bleedingAmount: 'none' | 'spotting' | 'moderate' | 'heavy';
  cervicalDilation: number;
  effacement: number;
  fetalHeartRate: number;
  presentation: 'cephalic' | 'breech' | 'transverse';
  station: string;
  pelvisAssessment: 'adequate' | 'borderline' | 'inadequate';
  deliveryPlan: 'svd' | 'assisted' | 'elective-cs' | 'emergency-cs';
  deliveryPlanNotes: string;
}

// ── Delivery note form data ───────────────────────────────────────────────────
export interface DeliveryNoteFormData {
  deliveryDate: string;
  deliveryTime: string;
  modeOfDelivery: 'svd' | 'forceps' | 'vacuum' | 'elective-cs' | 'emergency-cs';
  indicationForCS: string;
  babySex: 'male' | 'female';
  birthWeight: number;
  apgar1Min: number;
  apgar5Min: number;
  placentaDelivery: 'complete' | 'incomplete' | 'retained';
  bloodLoss: number;
  perinealTear: 'none' | '1st' | '2nd' | '3rd' | '4th';
  complications: string;
  maternalCondition: 'stable' | 'guarded' | 'critical';
  neonatalCondition: 'well' | 'requires-support' | 'admitted-nicu';
  notes: string;
}

// ── Postnatal note form data ──────────────────────────────────────────────────
export interface PostnatalNoteFormData {
  dayPostDelivery: number;
  bpSystolic: number;
  bpDiastolic: number;
  temperature: number;
  lochia: 'rubra' | 'serosa' | 'alba' | 'abnormal';
  uterusInvolution: 'satisfactory' | 'subinvolution';
  breastfeeding: 'exclusive' | 'mixed' | 'not-breastfeeding';
  woundHealing: 'good' | 'poor' | 'infected' | 'na';
  moodScreening: 'normal' | 'low-mood' | 'possible-pnd';
  babyWeight?: number;
  babyCondition: 'well' | 'jaundice' | 'unwell';
  familyPlanningCounseled: boolean;
  familyPlanningChoice: string;
  notes: string;
}
