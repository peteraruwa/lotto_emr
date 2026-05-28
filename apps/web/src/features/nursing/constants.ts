// ── Medication timing code → scheduled hours ──────────────────────────────────
// Based on standard hospital drug round times
export const MED_TIMING_HOURS: Record<string, number[]> = {
  QD:   [8],
  OD:   [8],
  MANE: [8],
  NOCTE:[22],
  QHS:  [22],
  BD:   [8, 20],
  BID:  [8, 20],
  TID:  [8, 14, 20],
  QID:  [8, 12, 16, 20],
  q6h:  [6, 12, 18, 0],
  q8h:  [8, 16, 0],
  q12h: [8, 20],
  q4h:  [6, 10, 14, 18, 22, 2],
  STAT: [],   // immediate — shown in DUE NOW immediately
  PRN:  [],   // as needed — no scheduled time
};

// Window around scheduled time to show as "DUE NOW"
export const DUE_WINDOW_MINUTES = 45;

// Time ranges for "UPCOMING" section
export const UPCOMING_HOURS = 4;

// Overdue thresholds for alert escalation
export const OVERDUE_THRESHOLDS = {
  WARNING:  30,   // amber
  ESCALATE: 60,   // red — notify charge nurse
  CRITICAL: 120,  // critical — system alert
} as const;

// LOINC codes for Intake/Output observations
export const LOINC_IO = {
  ORAL_INTAKE:   '9189-2',
  IV_INTAKE:     '9190-0',
  NG_INTAKE:     '9184-3',
  URINE_OUTPUT:  '9187-6',
  DRAIN_OUTPUT:  '9185-0',
  EMESIS:        '9186-8',
  TOTAL_INTAKE:  '9192-6',
  TOTAL_OUTPUT:  '9188-4',
} as const;

export const IO_SUBTYPE_LABELS: Record<string, string> = {
  oral:      'Oral',
  iv_fluid:  'IV Fluid',
  ng_feed:   'NG Feed',
  urine:     'Urine',
  drain:     'Drain',
  emesis:    'Emesis/Vomit',
  other:     'Other',
};

export const IO_LOINC: Record<string, string> = {
  oral:     LOINC_IO.ORAL_INTAKE,
  iv_fluid: LOINC_IO.IV_INTAKE,
  ng_feed:  LOINC_IO.NG_INTAKE,
  urine:    LOINC_IO.URINE_OUTPUT,
  drain:    LOINC_IO.DRAIN_OUTPUT,
  emesis:   LOINC_IO.EMESIS,
};

// Medications that typically require vitals before administration
export const VITALS_REQUIRED_FOR: Record<string, string> = {
  metoprolol:    'Check BP and HR before administering',
  atenolol:      'Check BP and HR before administering',
  amlodipine:    'Check BP before administering',
  lisinopril:    'Check BP before administering',
  ramipril:      'Check BP before administering',
  digoxin:       'Check HR — hold if <60 bpm. Check BP.',
  warfarin:      'Check INR result before administering',
  heparin:       'Check aPTT/INR before administering',
  insulin:       'Check blood glucose before administering',
  glibenclamide: 'Check blood glucose before administering',
  metformin:     'Check renal function (creatinine)',
  gentamicin:    'Check renal function. Check drug levels if repeat dose.',
  vancomycin:    'Check vancomycin trough level before 4th dose',
  furosemide:    'Check electrolytes (K+). Monitor urine output.',
};

export const ROUTE_LABELS: Record<string, string> = {
  PO:  'Oral',
  IV:  'Intravenous',
  IM:  'Intramuscular',
  SC:  'Subcutaneous',
  SL:  'Sublingual',
  TOP: 'Topical',
  INH: 'Inhalation',
  PR:  'Rectal',
  NGT: 'Nasogastric',
};
