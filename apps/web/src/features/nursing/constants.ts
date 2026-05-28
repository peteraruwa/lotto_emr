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

// ── Nigeria EPI Schedule ──────────────────────────────────────────────────────

export interface VaccineEntry {
  cvx: string;
  name: string;
  schedule: string;  // when due
  doses: number;
  route: string;
  site: string;
  doseVolume: string;
}

export const NIGERIA_EPI_VACCINES: VaccineEntry[] = [
  { cvx: '19',  name: 'BCG',           schedule: 'Birth',                      doses: 1, route: 'Intradermal', site: 'Right arm',  doseVolume: '0.05 mL' },
  { cvx: '02',  name: 'OPV (Oral Polio Vaccine)',   schedule: 'Birth, 6wk, 10wk, 14wk', doses: 4, route: 'Oral',        site: 'Oral',       doseVolume: '2 drops' },
  { cvx: '120', name: 'Pentavalent (DTP-HepB-Hib)', schedule: '6wk, 10wk, 14wk',         doses: 3, route: 'IM',          site: 'Left thigh', doseVolume: '0.5 mL' },
  { cvx: '133', name: 'PCV (Pneumococcal)',          schedule: '6wk, 10wk, 14wk',         doses: 3, route: 'IM',          site: 'Right thigh',doseVolume: '0.5 mL' },
  { cvx: '122', name: 'Rotavirus',                   schedule: '6wk, 10wk',               doses: 2, route: 'Oral',        site: 'Oral',       doseVolume: '1.5 mL' },
  { cvx: '05',  name: 'Measles-Rubella (MR)',        schedule: '9 months, 15 months',      doses: 2, route: 'SC',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '37',  name: 'Yellow Fever',                schedule: '9 months',                 doses: 1, route: 'SC',          site: 'Right arm',  doseVolume: '0.5 mL' },
  { cvx: '114', name: 'MenA (Meningococcal A)',      schedule: '9–18 months',              doses: 1, route: 'SC',          site: 'Right arm',  doseVolume: '0.5 mL' },
  { cvx: '62',  name: 'HPV',                         schedule: '9–14 yrs (girls)',         doses: 2, route: 'IM',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '112', name: 'Tetanus Toxoid (TT)',         schedule: 'Women of childbearing age',doses: 5, route: 'IM',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '208', name: 'COVID-19 mRNA',               schedule: 'Adults ≥18 yrs',           doses: 2, route: 'IM',          site: 'Left arm',   doseVolume: '0.3 mL' },
  { cvx: '210', name: 'COVID-19 Viral Vector',       schedule: 'Adults ≥18 yrs',           doses: 1, route: 'IM',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '83',  name: 'Hepatitis A',                 schedule: 'As indicated',             doses: 2, route: 'IM',          site: 'Left arm',   doseVolume: '1.0 mL' },
  { cvx: '08',  name: 'Hepatitis B',                 schedule: 'Adults (HBV-naïve)',       doses: 3, route: 'IM',          site: 'Left arm',   doseVolume: '1.0 mL' },
  { cvx: '03',  name: 'MMR',                         schedule: 'As indicated',             doses: 2, route: 'SC',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '135', name: 'Seasonal Influenza',          schedule: 'Annual',                   doses: 1, route: 'IM',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '25',  name: 'Typhoid (ViCPS)',             schedule: 'As indicated',             doses: 1, route: 'IM',          site: 'Left arm',   doseVolume: '0.5 mL' },
  { cvx: '47',  name: 'Cholera',                     schedule: 'As indicated',             doses: 2, route: 'Oral',        site: 'Oral',       doseVolume: '1 dose' },
  { cvx: '114', name: 'Rabies',                      schedule: 'Post-exposure',            doses: 4, route: 'IM',          site: 'Left arm',   doseVolume: '1.0 mL' },
  { cvx: '141', name: 'Tetanus-diphtheria (Td)',     schedule: 'Booster',                  doses: 1, route: 'IM',          site: 'Left arm',   doseVolume: '0.5 mL' },
];

export const INJECTION_SITES = [
  'Left arm (deltoid)',
  'Right arm (deltoid)',
  'Left thigh (vastus lateralis)',
  'Right thigh (vastus lateralis)',
  'Left buttock',
  'Right buttock',
  'Oral',
  'Right arm (intradermal)',
];

export const INJECTION_ROUTES = ['IM', 'SC', 'Intradermal', 'Oral'];

// ── Family Planning ───────────────────────────────────────────────────────────

export const FP_VISIT_TYPE_LABELS: Record<string, string> = {
  'new-acceptor':   'New Acceptor',
  'continuing':     'Continuing User',
  'counseling':     'Counseling Only',
  'discontinuation':'Discontinuation',
  'complication':   'Complication / Side-effect',
  'follow-up':      'Follow-up',
};

export const FP_METHODS: { value: string; label: string; category: string }[] = [
  { value: 'None',            label: 'None / Not using',          category: 'None' },
  // Hormonal - oral
  { value: 'OCP',             label: 'Combined Oral Pill (COC)',   category: 'Hormonal' },
  { value: 'POP',             label: 'Progestogen-only Pill (POP)',category: 'Hormonal' },
  { value: 'EC',              label: 'Emergency Contraception',    category: 'Hormonal' },
  // Hormonal - injectable
  { value: 'DMPA-IM',         label: 'DMPA Injection (IM) — Depo Provera', category: 'Injectable' },
  { value: 'DMPA-SC',         label: 'DMPA Injection (SC) — Sayana Press', category: 'Injectable' },
  { value: 'Noristerat',      label: 'Noristerat (NET-EN) Injection',       category: 'Injectable' },
  // IUD
  { value: 'Cu-T-IUD',        label: 'Copper IUD (Cu-T 380A)',    category: 'IUD' },
  { value: 'LNG-IUD',         label: 'Hormonal IUD (LNG — Mirena)',category: 'IUD' },
  // Implant
  { value: 'Implant-Jadelle', label: 'Jadelle Implant (2 rods)',  category: 'Implant' },
  { value: 'Implant-Implanon',label: 'Implanon/Nexplanon (1 rod)',category: 'Implant' },
  // Barrier
  { value: 'Male-Condom',     label: 'Male Condom',               category: 'Barrier' },
  { value: 'Female-Condom',   label: 'Female Condom',             category: 'Barrier' },
  // Permanent
  { value: 'Tubal-Ligation',  label: 'Tubal Ligation (BTL)',      category: 'Permanent' },
  { value: 'Vasectomy',       label: 'Vasectomy',                 category: 'Permanent' },
  // Natural
  { value: 'LAM',             label: 'LAM (Lactational Amenorrhea)',category: 'Natural' },
  { value: 'NFP',             label: 'Natural Family Planning',    category: 'Natural' },
  { value: 'Abstinence',      label: 'Abstinence',                category: 'Natural' },
];

export const FP_COUNSELING_TOPICS = [
  'Side effects and management',
  'Correct and consistent use',
  'Return to fertility',
  'STI/HIV prevention',
  'Dual protection',
  'Warning signs',
  'Method comparison',
  'Partner involvement',
  'Postpartum family planning',
  'Safe abortion information (where legal)',
];

export const FP_METHODS_CATEGORY_COLORS: Record<string, string> = {
  'None':      'bg-gray-100 text-gray-600',
  'Hormonal':  'bg-purple-100 text-purple-700',
  'Injectable':'bg-blue-100 text-blue-700',
  'IUD':       'bg-amber-100 text-amber-700',
  'Implant':   'bg-indigo-100 text-indigo-700',
  'Barrier':   'bg-green-100 text-green-700',
  'Permanent': 'bg-red-100 text-red-700',
  'Natural':   'bg-teal-100 text-teal-700',
};
