/**
 * LOINC (Logical Observation Identifiers Names and Codes)
 * ─────────────────────────────────────────────────────────
 * LOINC codes are universal medical identifiers.
 * Using constants here instead of inline strings means:
 *   1. If a code ever changes, fix it in one place
 *   2. New developers can see all codes and their meaning together
 *   3. TypeScript will catch typos at compile time
 *
 * Reference: https://loinc.org
 */

// ── Vital Signs ───────────────────────────────────────────────────────────────
// These codes are used whenever we record or display patient vital signs.
export const LOINC_VITALS = {
  BP_PANEL:          '55284-4',  // Blood pressure systolic + diastolic (panel)
  SYSTOLIC:          '8480-6',   // Systolic blood pressure
  DIASTOLIC:         '8462-4',   // Diastolic blood pressure
  HEART_RATE:        '8867-4',   // Heart rate (beats per minute)
  TEMPERATURE:       '8310-5',   // Body temperature (°C)
  SPO2:              '59408-5',  // Oxygen saturation by pulse oximetry (%)
  RESPIRATORY_RATE:  '9279-1',   // Respiratory rate (breaths per minute)
  BODY_WEIGHT:       '29463-7',  // Body weight (kg)
  BODY_HEIGHT:       '8302-2',   // Body height (cm)
} as const;

// ── Clinical Note Document Types ─────────────────────────────────────────────
// Used when creating or identifying DocumentReference resources (clinical notes).
// Each note type has a different LOINC code so they can be filtered/searched.
export const LOINC_NOTE_TYPES = {
  CONSULTATION:       '11488-4',  // Consultation note (outpatient)
  PROGRESS_NOTE:      '11506-3',  // Progress note / SOAP follow-up
  DISCHARGE_SUMMARY:  '18842-5',  // Discharge summary
  PROCEDURE_NOTE:     '28570-0',  // Procedure note
  ADMISSION_HP:       '34117-2',  // History and physical (admission)
  SOAP_NOTE:          '34137-0',  // SOAP note
  ED_NOTE:            '34878-9',  // Emergency medicine note
  REFERRAL_NOTE:      '57133-1',  // Referral note
} as const;

// ── Lab & Diagnostic Result Categories ───────────────────────────────────────
// Used to filter Observation resources by result type.
export const LOINC_CATEGORIES = {
  // These are LOINC panels commonly searched in the results module
  HEMOGLOBIN:        '718-7',    // Hemoglobin (g/dL)
  WBC:               '6690-2',   // White blood cell count
  PLATELETS:         '777-3',    // Platelet count
  CREATININE:        '2160-0',   // Creatinine (renal function)
  GLUCOSE:           '2345-7',   // Glucose
  ALT:               '1742-6',   // Alanine aminotransferase (liver)
  MALARIA_RDT:       '32700-7',  // Malaria rapid diagnostic test
} as const;

// ── SNOMED CT Codes ───────────────────────────────────────────────────────────
// SNOMED CT (Systematized Nomenclature of Medicine) codes for clinical concepts.
// Used alongside LOINC — LOINC identifies measurements, SNOMED identifies concepts.
export const SNOMED = {
  PREGNANCY:    '77386006',  // Pregnancy (finding)
  CONSULTATION: '11429006',  // Consultation
} as const;

// ── FHIR Category System URLs ─────────────────────────────────────────────────
// These URL strings identify which coding system a code comes from.
// Centralising them prevents typos (a missing character breaks FHIR queries).
export const FHIR_SYSTEMS = {
  LOINC:              'http://loinc.org',
  SNOMED:             'http://snomed.info/sct',
  OBSERVATION_CAT:    'http://terminology.hl7.org/CodeSystem/observation-category',
  ACT_CODE:           'http://terminology.hl7.org/CodeSystem/v3-ActCode',
  ACT_PRIORITY:       'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
  CONDITION_CLINICAL: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
  DOC_CAT:            'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
} as const;

// ── ANC-Specific LOINC Codes ─────────────────────────────────────────────────
// Codes used specifically within the Antenatal Care (ANC) module.
export const LOINC_ANC = {
  FETAL_HEART_RATE:      '55283-6',   // Fetal heart rate (/min)
  FUNDAL_HEIGHT:         '11881-0',   // Uterus fundal height (cm)
  FETAL_PRESENTATION:    '73761-6',   // Fetal presentation
  URINE_PROTEIN:         '5804-0',    // Protein in urine
  URINE_GLUCOSE:         '25428-4',   // Glucose in urine
  PCV_HEMATOCRIT:        '20570-8',   // Hematocrit (PCV) %
  BLOOD_GLUCOSE_FASTING: '1558-6',    // Fasting glucose mg/dL
  APGAR_1MIN:            '9274-2',    // APGAR score 1 minute
  APGAR_5MIN:            '9271-8',    // APGAR score 5 minutes
  BIRTH_WEIGHT:          '8339-4',    // Birth weight (kg)
  GESTATIONAL_AGE_OBS:   '18185-9',   // Gestational age in weeks
} as const;
