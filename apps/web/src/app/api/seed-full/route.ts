import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';

// ── FHIR system constants ──────────────────────────────────────────────────────
const MRN_SYSTEM     = 'https://lotto-hospital.local/fhir/identifier/mrn';
const NIN_SYSTEM     = 'https://lotto-hospital.local/fhir/identifier/nin';
const LOINC          = 'http://loinc.org';
const SNOMED         = 'http://snomed.info/sct';
const UCUM           = 'http://unitsofmeasure.org';
const COND_CLINICAL  = 'http://terminology.hl7.org/CodeSystem/condition-clinical';
const OBS_CATEGORY   = 'http://terminology.hl7.org/CodeSystem/observation-category';
const EXT_BLOOD      = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group';
const EXT_GENO       = 'https://lotto-hospital.local/fhir/StructureDefinition/genotype';
const EXT_TRIBE      = 'https://lotto-hospital.local/fhir/StructureDefinition/tribe';
const EXT_RELIGION   = 'https://lotto-hospital.local/fhir/StructureDefinition/religion';

// ── Helper utilities ──────────────────────────────────────────────────────────
function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function rand(min: number, max: number, dp = 1): number {
  return parseFloat((min + Math.random() * (max - min)).toFixed(dp));
}

function b64(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64');
}

// ── Patient definitions ────────────────────────────────────────────────────────

interface PatientDef {
  given: string[];
  family: string;
  gender: 'male' | 'female';
  dob: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  nin: string;
  bloodGroup: string;
  genotype: string;
  tribe: string;
  religion: string;
  street: string;
  // clinical
  diagnosis: string;
  allergy1: string; allergyReaction1: string;
  allergy2?: string; allergyReaction2?: string;
  condition1: string; conditionOnset1: string;
  condition2?: string; conditionOnset2?: string;
  nokGiven: string; nokFamily: string; nokPhone: string;
  hmo: string;
  group: 'admitted' | 'referred' | 'anc' | 'outpatient';
  // ANC only
  ancWeeks?: number;
  ancGravida?: string;
  // medications
  med1: string; med1Dose: string; med1Sig: string;
  med2: string; med2Dose: string; med2Sig: string;
  // lab
  labTest: string; labLoincCode: string;
  labObsName: string; labObsCode: string; labObsValue: number; labObsUnit: string;
  labRefRange: string;
  // imaging/second order
  imagingTest: string;
  // billing items JSON
  billingItems: object[];
}

const PATIENTS: PatientDef[] = [
  // ── GROUP A: ADMITTED (0-7) ────────────────────────────────────────────────
  {
    given: ['Chukwuemeka'], family: 'Nwobi', gender: 'male', dob: '1978-03-15',
    city: 'Onitsha', state: 'Anambra', phone: '08020001001', email: 'c.nwobi@mail.ng',
    nin: '10001000001', bloodGroup: 'O+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '14 Oguta Road',
    diagnosis: 'Hypertensive crisis with acute left ventricular failure',
    allergy1: 'NSAIDs', allergyReaction1: 'Bronchospasm',
    allergy2: 'Contrast media', allergyReaction2: 'Urticaria',
    condition1: 'Hypertensive Heart Disease', conditionOnset1: '2019-06-10T00:00:00Z',
    condition2: 'Acute Left Ventricular Failure', conditionOnset2: '2026-05-20T00:00:00Z',
    nokGiven: 'Ngozi', nokFamily: 'Nwobi', nokPhone: '08030001001',
    hmo: 'Hygeia HMO',
    group: 'admitted',
    med1: 'Amlodipine 10mg', med1Dose: '10mg', med1Sig: '10mg once daily orally',
    med2: 'Furosemide 40mg', med2Dose: '40mg', med2Sig: '40mg twice daily orally',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 13.2, labObsUnit: 'g/dL',
    labRefRange: '13.0-17.5 g/dL',
    imagingTest: 'Chest X-ray (PA view)',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'FBC', description: 'Full Blood Count', cost: 2500, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'CXR', description: 'Chest X-ray PA', cost: 5000, priority: 'urgent' },
      { id: '3', category: 'MEDICATION', itemCode: 'AMLODIPINE', description: 'Amlodipine 10mg x30', cost: 1800, priority: 'routine' },
      { id: '4', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Cardiology Consultation', cost: 10000, priority: 'urgent' },
    ],
  },
  {
    given: ['Ngozi'], family: 'Eze', gender: 'female', dob: '1990-07-22',
    city: 'Owerri', state: 'Imo', phone: '08020001002', email: 'n.eze@mail.ng',
    nin: '10001000002', bloodGroup: 'A+', genotype: 'AS', tribe: 'Igbo', religion: 'Christian',
    street: '7 Wetheral Road',
    diagnosis: 'Severe malaria with cerebral features',
    allergy1: 'Penicillin', allergyReaction1: 'Anaphylaxis',
    condition1: 'Severe Plasmodium falciparum Malaria', conditionOnset1: '2026-05-22T00:00:00Z',
    condition2: 'Anaemia secondary to malaria', conditionOnset2: '2026-05-22T00:00:00Z',
    nokGiven: 'Chinedu', nokFamily: 'Eze', nokPhone: '08030001002',
    hmo: 'NHIS',
    group: 'admitted',
    med1: 'Artesunate IV 120mg', med1Dose: '120mg', med1Sig: 'IV every 12 hours for 3 doses then 24 hourly',
    med2: 'Paracetamol 1g IV', med2Dose: '1g', med2Sig: '1g IV every 8 hours',
    labTest: 'Malaria Parasite Film', labLoincCode: '51587-4',
    labObsName: 'Malaria Parasite Count', labObsCode: '51587-4', labObsValue: 4.8, labObsUnit: '%',
    labRefRange: '0%',
    imagingTest: 'CT Brain plain',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'MP', description: 'Malaria Parasite Film', cost: 1500, priority: 'urgent' },
      { id: '2', category: 'LAB', itemCode: 'FBC', description: 'Full Blood Count', cost: 2500, priority: 'urgent' },
      { id: '3', category: 'MEDICATION', itemCode: 'ARTESUNATE', description: 'Artesunate IV 120mg x6', cost: 8000, priority: 'urgent' },
    ],
  },
  {
    given: ['Babatunde'], family: 'Oladipo', gender: 'male', dob: '1962-11-08',
    city: 'Ibadan', state: 'Oyo', phone: '08020001003', email: 'b.oladipo@mail.ng',
    nin: '10001000003', bloodGroup: 'B+', genotype: 'AA', tribe: 'Yoruba', religion: 'Muslim',
    street: '23 Ring Road',
    diagnosis: 'Type 2 Diabetes Mellitus with diabetic foot ulcer (Wagner Grade 3)',
    allergy1: 'Sulpha drugs', allergyReaction1: 'Steven-Johnson syndrome',
    condition1: 'Type 2 Diabetes Mellitus', conditionOnset1: '2010-04-18T00:00:00Z',
    condition2: 'Diabetic foot ulcer right foot', conditionOnset2: '2026-04-10T00:00:00Z',
    nokGiven: 'Kemi', nokFamily: 'Oladipo', nokPhone: '08030001003',
    hmo: 'Lagos State Health Scheme',
    group: 'admitted',
    med1: 'Insulin Glargine 20 units SC', med1Dose: '20 units', med1Sig: '20 units subcutaneously at bedtime',
    med2: 'Metronidazole 500mg IV', med2Dose: '500mg', med2Sig: '500mg IV every 8 hours',
    labTest: 'HbA1c', labLoincCode: '4548-4',
    labObsName: 'HbA1c', labObsCode: '4548-4', labObsValue: 9.8, labObsUnit: '%',
    labRefRange: '<6.5%',
    imagingTest: 'X-ray right foot AP and lateral',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'HBA1C', description: 'HbA1c', cost: 3000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'UE', description: 'Urea and Electrolytes', cost: 3500, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'INSULIN', description: 'Insulin Glargine 100u/ml x1 vial', cost: 4500, priority: 'routine' },
      { id: '4', category: 'PROCEDURE', itemCode: 'WOUNDDRESS', description: 'Wound dressing x5', cost: 7500, priority: 'routine' },
    ],
  },
  {
    given: ['Fatima'], family: 'Umar', gender: 'female', dob: '1994-04-18',
    city: 'Kano', state: 'Kano', phone: '08020001004', email: 'f.umar@mail.ng',
    nin: '10001000004', bloodGroup: 'O+', genotype: 'AA', tribe: 'Hausa', religion: 'Muslim',
    street: '5 Bompai Road',
    diagnosis: 'Severe pre-eclampsia at 34 weeks gestation',
    allergy1: 'Aspirin', allergyReaction1: 'Urticaria',
    condition1: 'Severe Pre-eclampsia', conditionOnset1: '2026-05-18T00:00:00Z',
    condition2: 'Intrauterine pregnancy 34 weeks', conditionOnset2: '2025-10-01T00:00:00Z',
    nokGiven: 'Aliyu', nokFamily: 'Umar', nokPhone: '08030001004',
    hmo: 'NHIS',
    group: 'admitted',
    med1: 'Magnesium Sulphate 4g IV loading', med1Dose: '4g', med1Sig: '4g IV over 20 minutes then 1g/hour maintenance',
    med2: 'Labetalol 200mg PO', med2Dose: '200mg', med2Sig: '200mg orally every 12 hours',
    labTest: 'Liver Function Tests', labLoincCode: '24325-3',
    labObsName: 'Alanine Aminotransferase (ALT)', labObsCode: '1742-6', labObsValue: 78, labObsUnit: 'U/L',
    labRefRange: '7-56 U/L',
    imagingTest: 'Obstetric ultrasound',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'LFT', description: 'Liver Function Tests', cost: 4000, priority: 'urgent' },
      { id: '2', category: 'LAB', itemCode: 'COAG', description: 'Coagulation screen', cost: 3500, priority: 'urgent' },
      { id: '3', category: 'MEDICATION', itemCode: 'MGSO4', description: 'Magnesium Sulphate 50% 10ml x4', cost: 2000, priority: 'urgent' },
    ],
  },
  {
    given: ['Emmanuel'], family: 'Okoro', gender: 'male', dob: '1970-09-30',
    city: 'Enugu', state: 'Enugu', phone: '08020001005', email: 'e.okoro@mail.ng',
    nin: '10001000005', bloodGroup: 'A+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '3 Independence Layout',
    diagnosis: 'Post-appendicectomy recovery Day 2',
    allergy1: 'Codeine', allergyReaction1: 'Nausea and vomiting',
    condition1: 'Acute appendicitis', conditionOnset1: '2026-05-23T00:00:00Z',
    nokGiven: 'Chioma', nokFamily: 'Okoro', nokPhone: '08030001005',
    hmo: 'AXA Mansard',
    group: 'admitted',
    med1: 'Ceftriaxone 1g IV', med1Dose: '1g', med1Sig: '1g IV once daily for 5 days',
    med2: 'Tramadol 100mg IV', med2Dose: '100mg', med2Sig: '100mg IV every 8 hours PRN pain',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'White Cell Count', labObsCode: '6690-2', labObsValue: 11.4, labObsUnit: '10^9/L',
    labRefRange: '4.0-11.0 10^9/L',
    imagingTest: 'Abdominal ultrasound',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'APPENDICECTOMY', description: 'Appendicectomy (open)', cost: 80000, priority: 'urgent' },
      { id: '2', category: 'LAB', itemCode: 'FBC', description: 'Full Blood Count', cost: 2500, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'CEFTRIAXONE', description: 'Ceftriaxone 1g x5 vials', cost: 5000, priority: 'routine' },
    ],
  },
  {
    given: ['Grace'], family: 'Achebe', gender: 'female', dob: '1982-02-14',
    city: 'Awka', state: 'Anambra', phone: '08020001006', email: 'g.achebe@mail.ng',
    nin: '10001000006', bloodGroup: 'AB+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '9 Zik Avenue',
    diagnosis: 'Severe community-acquired pneumonia (CURB-65 score 3)',
    allergy1: 'Penicillin', allergyReaction1: 'Rash',
    allergy2: 'Erythromycin', allergyReaction2: 'Gastrointestinal upset',
    condition1: 'Community-acquired pneumonia', conditionOnset1: '2026-05-20T00:00:00Z',
    nokGiven: 'Ifeanyi', nokFamily: 'Achebe', nokPhone: '08030001006',
    hmo: 'RetaiCare',
    group: 'admitted',
    med1: 'Ceftriaxone 2g IV', med1Dose: '2g', med1Sig: '2g IV once daily',
    med2: 'Azithromycin 500mg PO', med2Dose: '500mg', med2Sig: '500mg orally once daily for 5 days',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'C-Reactive Protein', labObsCode: '1988-5', labObsValue: 142, labObsUnit: 'mg/L',
    labRefRange: '<5 mg/L',
    imagingTest: 'Chest X-ray PA view',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'CRP', description: 'C-Reactive Protein', cost: 2500, priority: 'urgent' },
      { id: '2', category: 'IMAGING', itemCode: 'CXR', description: 'Chest X-ray PA', cost: 5000, priority: 'urgent' },
      { id: '3', category: 'MEDICATION', itemCode: 'CEFTRIAXONE2G', description: 'Ceftriaxone 2g x5 vials', cost: 7500, priority: 'urgent' },
    ],
  },
  {
    given: ['Abiodun'], family: 'Sanni', gender: 'male', dob: '1985-06-25',
    city: 'Lagos', state: 'Lagos', phone: '08020001007', email: 'a.sanni@mail.ng',
    nin: '10001000007', bloodGroup: 'B+', genotype: 'SS', tribe: 'Yoruba', religion: 'Muslim',
    street: '12 Bode Thomas Street',
    diagnosis: 'Sickle cell vaso-occlusive crisis with acute chest syndrome',
    allergy1: 'Aspirin', allergyReaction1: 'Gastric ulceration',
    condition1: 'Sickle Cell Disease (HbSS)', conditionOnset1: '1985-08-10T00:00:00Z',
    condition2: 'Vaso-occlusive crisis with acute chest syndrome', conditionOnset2: '2026-05-22T00:00:00Z',
    nokGiven: 'Rashidat', nokFamily: 'Sanni', nokPhone: '08030001007',
    hmo: 'Lagos State Health Scheme',
    group: 'admitted',
    med1: 'Morphine 5mg IV', med1Dose: '5mg', med1Sig: '5mg IV every 4 hours titrated to pain score',
    med2: 'Hydroxyurea 500mg PO', med2Dose: '500mg', med2Sig: '500mg orally once daily',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 6.8, labObsUnit: 'g/dL',
    labRefRange: '7.0-10.0 g/dL (SCD baseline)',
    imagingTest: 'Chest X-ray and CT chest',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'FBC', description: 'Full Blood Count', cost: 2500, priority: 'urgent' },
      { id: '2', category: 'BLOOD', itemCode: 'TRANSFUSION', description: 'Blood transfusion 1 unit', cost: 15000, priority: 'urgent' },
      { id: '3', category: 'MEDICATION', itemCode: 'MORPHINE', description: 'Morphine 10mg/ml x5 amp', cost: 3500, priority: 'urgent' },
    ],
  },
  {
    given: ['Patience'], family: 'Ogbonna', gender: 'female', dob: '1956-12-03',
    city: 'Asaba', state: 'Delta', phone: '08020001008', email: 'p.ogbonna@mail.ng',
    nin: '10001000008', bloodGroup: 'O+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '6 Nnebisi Road',
    diagnosis: 'Ischaemic stroke (CVA) — left MCA territory',
    allergy1: 'Codeine', allergyReaction1: 'Confusion',
    condition1: 'Ischaemic stroke — left MCA territory', conditionOnset1: '2026-05-21T00:00:00Z',
    condition2: 'Hypertension', conditionOnset2: '2012-03-01T00:00:00Z',
    nokGiven: 'Emeka', nokFamily: 'Ogbonna', nokPhone: '08030001008',
    hmo: 'NHIS',
    group: 'admitted',
    med1: 'Aspirin 300mg PO', med1Dose: '300mg', med1Sig: '300mg orally once daily for 2 weeks then 75mg daily',
    med2: 'Atorvastatin 40mg PO', med2Dose: '40mg', med2Sig: '40mg orally at night',
    labTest: 'Lipid Profile', labLoincCode: '57698-3',
    labObsName: 'Total Cholesterol', labObsCode: '2093-3', labObsValue: 6.4, labObsUnit: 'mmol/L',
    labRefRange: '<5.0 mmol/L',
    imagingTest: 'CT Brain (plain + contrast)',
    billingItems: [
      { id: '1', category: 'IMAGING', itemCode: 'CTBRAIN', description: 'CT Brain plain + contrast', cost: 25000, priority: 'urgent' },
      { id: '2', category: 'LAB', itemCode: 'LIPID', description: 'Lipid profile', cost: 3000, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'ASPIRIN300', description: 'Aspirin 300mg x30', cost: 600, priority: 'routine' },
    ],
  },

  // ── GROUP B: REFERRED (8-12) ───────────────────────────────────────────────
  {
    given: ['Rotimi'], family: 'Taiwo', gender: 'male', dob: '1967-08-19',
    city: 'Abeokuta', state: 'Ogun', phone: '08020001009', email: 'r.taiwo@mail.ng',
    nin: '10001000009', bloodGroup: 'A+', genotype: 'AA', tribe: 'Yoruba', religion: 'Christian',
    street: '18 Igbore Road',
    diagnosis: 'Symptomatic cardiac arrhythmia — paroxysmal atrial fibrillation',
    allergy1: 'Amiodarone', allergyReaction1: 'Thyroid dysfunction',
    condition1: 'Paroxysmal Atrial Fibrillation', conditionOnset1: '2025-11-05T00:00:00Z',
    nokGiven: 'Tola', nokFamily: 'Taiwo', nokPhone: '08030001009',
    hmo: 'Leadway Health',
    group: 'referred',
    med1: 'Metoprolol 50mg PO', med1Dose: '50mg', med1Sig: '50mg twice daily orally',
    med2: 'Warfarin 5mg PO', med2Dose: '5mg', med2Sig: '5mg orally once daily — INR monitoring required',
    labTest: 'Thyroid Function Tests', labLoincCode: '58376-5',
    labObsName: 'TSH', labObsCode: '11580-8', labObsValue: 1.8, labObsUnit: 'mIU/L',
    labRefRange: '0.4-4.0 mIU/L',
    imagingTest: 'ECG (12-lead) and Echocardiogram',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'TFT', description: 'Thyroid Function Tests', cost: 4000, priority: 'routine' },
      { id: '2', category: 'PROCEDURE', itemCode: 'ECG', description: '12-lead ECG', cost: 2500, priority: 'routine' },
      { id: '3', category: 'REFERRAL', itemCode: 'CARDIOLOGY', description: 'Cardiology referral', cost: 5000, priority: 'routine' },
    ],
  },
  {
    given: ['Chidinma'], family: 'Osei', gender: 'female', dob: '1991-03-07',
    city: 'Port Harcourt', state: 'Rivers', phone: '08020001010', email: 'c.osei@mail.ng',
    nin: '10001000010', bloodGroup: 'O+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '4 Aba Road',
    diagnosis: 'High-grade cervical intraepithelial neoplasia (CIN III)',
    allergy1: 'Latex', allergyReaction1: 'Contact dermatitis',
    condition1: 'High-grade CIN (CIN III)', conditionOnset1: '2026-04-20T00:00:00Z',
    nokGiven: 'Obinna', nokFamily: 'Osei', nokPhone: '08030001010',
    hmo: 'AXA Mansard',
    group: 'referred',
    med1: 'Folic acid 5mg PO', med1Dose: '5mg', med1Sig: '5mg orally once daily',
    med2: 'Multivitamin PO', med2Dose: '1 tablet', med2Sig: '1 tablet orally once daily',
    labTest: 'Cervical biopsy histology', labLoincCode: '11526-1',
    labObsName: 'Cervical biopsy result', labObsCode: '11526-1', labObsValue: 3, labObsUnit: 'CIN grade',
    labRefRange: 'Normal (CIN I-III)',
    imagingTest: 'Colposcopy and LLETZ',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'COLPOSCOPY', description: 'Colposcopy', cost: 15000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'BIOPSY', description: 'Cervical biopsy histology', cost: 8000, priority: 'routine' },
      { id: '3', category: 'REFERRAL', itemCode: 'GYNONCOLOGY', description: 'Gynaecologic oncology referral', cost: 5000, priority: 'routine' },
    ],
  },
  {
    given: ['Yusuf'], family: 'Garba', gender: 'male', dob: '1980-10-25',
    city: 'Kaduna', state: 'Kaduna', phone: '08020001011', email: 'y.garba@mail.ng',
    nin: '10001000011', bloodGroup: 'B+', genotype: 'AA', tribe: 'Hausa', religion: 'Muslim',
    street: '11 Kawo Road',
    diagnosis: 'Chronic kidney disease Stage 4 (eGFR 18 mL/min/1.73m2)',
    allergy1: 'NSAIDs', allergyReaction1: 'Acute kidney injury',
    allergy2: 'Contrast media', allergyReaction2: 'Contrast nephropathy',
    condition1: 'Chronic Kidney Disease Stage 4', conditionOnset1: '2022-07-14T00:00:00Z',
    condition2: 'Hypertension', conditionOnset2: '2015-02-20T00:00:00Z',
    nokGiven: 'Aisha', nokFamily: 'Garba', nokPhone: '08030001011',
    hmo: 'NHIS',
    group: 'referred',
    med1: 'Amlodipine 10mg PO', med1Dose: '10mg', med1Sig: '10mg once daily',
    med2: 'Erythropoietin 4000 IU SC', med2Dose: '4000 IU', med2Sig: '4000 IU subcutaneously three times per week',
    labTest: 'Urea and Electrolytes', labLoincCode: '24326-1',
    labObsName: 'Creatinine', labObsCode: '2160-0', labObsValue: 352, labObsUnit: 'umol/L',
    labRefRange: '60-110 umol/L',
    imagingTest: 'Renal ultrasound',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'UE', description: 'Urea and Electrolytes', cost: 3500, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'RENALUS', description: 'Renal ultrasound', cost: 6000, priority: 'routine' },
      { id: '3', category: 'REFERRAL', itemCode: 'NEPHROLOGY', description: 'Nephrology referral (dialysis assessment)', cost: 5000, priority: 'routine' },
    ],
  },
  {
    given: ['Amaka'], family: 'Obi', gender: 'female', dob: '1996-01-12',
    city: 'Nnewi', state: 'Anambra', phone: '08020001012', email: 'a.obi@mail.ng',
    nin: '10001000012', bloodGroup: 'A-', genotype: 'AS', tribe: 'Igbo', religion: 'Christian',
    street: '2 Edgar Road',
    diagnosis: 'Complex pelvic fracture (Tile Type C) — MVA',
    allergy1: 'Tramadol', allergyReaction1: 'Seizure',
    condition1: 'Complex pelvic fracture — Tile Type C', conditionOnset1: '2026-05-10T00:00:00Z',
    nokGiven: 'Obiora', nokFamily: 'Obi', nokPhone: '08030001012',
    hmo: 'Hygeia HMO',
    group: 'referred',
    med1: 'Morphine 5mg IV', med1Dose: '5mg', med1Sig: '5mg IV every 6 hours PRN',
    med2: 'Enoxaparin 40mg SC', med2Dose: '40mg', med2Sig: '40mg subcutaneously once daily (DVT prophylaxis)',
    labTest: 'Group and Crossmatch', labLoincCode: '882-1',
    labObsName: 'Blood group ABO', labObsCode: '882-1', labObsValue: 0, labObsUnit: 'A-',
    labRefRange: 'N/A',
    imagingTest: 'Pelvic CT with 3D reconstruction',
    billingItems: [
      { id: '1', category: 'IMAGING', itemCode: 'CTPELVIS', description: 'CT pelvis with 3D reconstruction', cost: 30000, priority: 'urgent' },
      { id: '2', category: 'LAB', itemCode: 'GXM', description: 'Group and crossmatch', cost: 3000, priority: 'urgent' },
      { id: '3', category: 'REFERRAL', itemCode: 'ORTHO', description: 'Orthopaedic surgery referral', cost: 5000, priority: 'urgent' },
    ],
  },
  {
    given: ['Olumide'], family: 'Coker', gender: 'male', dob: '1965-05-31',
    city: 'Lagos', state: 'Lagos', phone: '08020001013', email: 'o.coker@mail.ng',
    nin: '10001000013', bloodGroup: 'AB+', genotype: 'AA', tribe: 'Yoruba', religion: 'Christian',
    street: '30 Glover Road',
    diagnosis: 'Suspicious sigmoid colonic mass — query adenocarcinoma',
    allergy1: 'Penicillin', allergyReaction1: 'Urticaria',
    condition1: 'Sigmoid colonic mass — suspicious for adenocarcinoma', conditionOnset1: '2026-03-15T00:00:00Z',
    condition2: 'Iron deficiency anaemia secondary to occult GI bleed', conditionOnset2: '2026-03-15T00:00:00Z',
    nokGiven: 'Funke', nokFamily: 'Coker', nokPhone: '08030001013',
    hmo: 'AXA Mansard',
    group: 'referred',
    med1: 'Iron sucrose 200mg IV', med1Dose: '200mg', med1Sig: '200mg IV in 100ml NS over 30 min, three times weekly',
    med2: 'Omeprazole 40mg PO', med2Dose: '40mg', med2Sig: '40mg orally once daily before meals',
    labTest: 'Carcinoembryonic Antigen (CEA)', labLoincCode: '2857-1',
    labObsName: 'CEA', labObsCode: '2857-1', labObsValue: 18.4, labObsUnit: 'ng/mL',
    labRefRange: '<5.0 ng/mL',
    imagingTest: 'CT colonography (virtual colonoscopy)',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'CEA', description: 'CEA tumour marker', cost: 5000, priority: 'routine' },
      { id: '2', category: 'PROCEDURE', itemCode: 'COLONOSCOPY', description: 'Colonoscopy + biopsy', cost: 35000, priority: 'routine' },
      { id: '3', category: 'REFERRAL', itemCode: 'COLONSURGERY', description: 'Colorectal surgery referral', cost: 5000, priority: 'routine' },
    ],
  },

  // ── GROUP C: ANC (13-17) ───────────────────────────────────────────────────
  {
    given: ['Kemi'], family: 'Bamidele', gender: 'female', dob: '1998-09-15',
    city: 'Lagos', state: 'Lagos', phone: '08020001014', email: 'k.bamidele@mail.ng',
    nin: '10001000014', bloodGroup: 'O+', genotype: 'AA', tribe: 'Yoruba', religion: 'Christian',
    street: '7 Orile Road',
    diagnosis: 'Antenatal care — G2P1 at 28 weeks gestation, uncomplicated',
    allergy1: 'Penicillin', allergyReaction1: 'Rash',
    condition1: 'Intrauterine pregnancy 28 weeks', conditionOnset1: '2025-11-12T00:00:00Z',
    nokGiven: 'Bola', nokFamily: 'Bamidele', nokPhone: '08030001014',
    hmo: 'NHIS',
    group: 'anc',
    ancWeeks: 28,
    ancGravida: 'G2P1',
    med1: 'Ferrous sulphate 200mg PO', med1Dose: '200mg', med1Sig: '200mg orally twice daily',
    med2: 'Folic acid 5mg PO', med2Dose: '5mg', med2Sig: '5mg orally once daily',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 10.4, labObsUnit: 'g/dL',
    labRefRange: '>11.0 g/dL in pregnancy',
    imagingTest: 'Obstetric ultrasound (anomaly scan)',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'ANC', description: 'ANC visit fee', cost: 3000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'FBC', description: 'Full Blood Count', cost: 2500, priority: 'routine' },
      { id: '3', category: 'IMAGING', itemCode: 'OBSUS', description: 'Obstetric ultrasound', cost: 4000, priority: 'routine' },
    ],
  },
  {
    given: ['Blessing'], family: 'Nnaemeka', gender: 'female', dob: '1993-11-28',
    city: 'Owerri', state: 'Imo', phone: '08020001015', email: 'b.nnaemeka@mail.ng',
    nin: '10001000015', bloodGroup: 'A+', genotype: 'AS', tribe: 'Igbo', religion: 'Christian',
    street: '15 Douglas Road',
    diagnosis: 'Antenatal care — G1P0 at 16 weeks gestation',
    allergy1: 'Metronidazole', allergyReaction1: 'Peripheral neuropathy',
    condition1: 'Intrauterine pregnancy 16 weeks', conditionOnset1: '2026-02-01T00:00:00Z',
    nokGiven: 'Chike', nokFamily: 'Nnaemeka', nokPhone: '08030001015',
    hmo: 'Hygeia HMO',
    group: 'anc',
    ancWeeks: 16,
    ancGravida: 'G1P0',
    med1: 'Ferrous sulphate 200mg PO', med1Dose: '200mg', med1Sig: '200mg orally once daily',
    med2: 'Folic acid 5mg PO', med2Dose: '5mg', med2Sig: '5mg orally once daily',
    labTest: 'Booking bloods', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 11.8, labObsUnit: 'g/dL',
    labRefRange: '>11.0 g/dL in pregnancy',
    imagingTest: 'Obstetric ultrasound (dating scan)',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'ANC', description: 'ANC visit fee', cost: 3000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'BOOKING', description: 'Booking bloods panel', cost: 6000, priority: 'routine' },
    ],
  },
  {
    given: ['Titilayo'], family: 'Ogunleye', gender: 'female', dob: '1999-07-04',
    city: 'Osogbo', state: 'Osun', phone: '08020001016', email: 't.ogunleye@mail.ng',
    nin: '10001000016', bloodGroup: 'B+', genotype: 'AA', tribe: 'Yoruba', religion: 'Muslim',
    street: '3 Alekuwodo Street',
    diagnosis: 'Antenatal care — G3P2 at 36 weeks gestation, borderline growth restriction',
    allergy1: 'Sulpha drugs', allergyReaction1: 'Rash',
    condition1: 'Intrauterine pregnancy 36 weeks, borderline FGR', conditionOnset1: '2025-09-10T00:00:00Z',
    nokGiven: 'Lukman', nokFamily: 'Ogunleye', nokPhone: '08030001016',
    hmo: 'Lagos State Health Scheme',
    group: 'anc',
    ancWeeks: 36,
    ancGravida: 'G3P2',
    med1: 'Ferrous sulphate 200mg PO', med1Dose: '200mg', med1Sig: '200mg twice daily',
    med2: 'Low-dose Aspirin 75mg PO', med2Dose: '75mg', med2Sig: '75mg once daily at night',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 10.9, labObsUnit: 'g/dL',
    labRefRange: '>11.0 g/dL in pregnancy',
    imagingTest: 'Obstetric ultrasound (growth scan)',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'ANC', description: 'ANC visit fee', cost: 3000, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'GROWTHSCAN', description: 'Growth scan ultrasound', cost: 5000, priority: 'routine' },
      { id: '3', category: 'LAB', itemCode: 'FBC', description: 'Full Blood Count', cost: 2500, priority: 'routine' },
    ],
  },
  {
    given: ['Hauwa'], family: 'Abdullahi', gender: 'female', dob: '1996-05-20',
    city: 'Katsina', state: 'Katsina', phone: '08020001017', email: 'h.abdullahi@mail.ng',
    nin: '10001000017', bloodGroup: 'O+', genotype: 'AA', tribe: 'Hausa', religion: 'Muslim',
    street: '9 Dutsin-Ma Road',
    diagnosis: 'Antenatal care — G1P0 at 20 weeks gestation',
    allergy1: 'Penicillin', allergyReaction1: 'Urticaria',
    condition1: 'Intrauterine pregnancy 20 weeks', conditionOnset1: '2026-01-15T00:00:00Z',
    nokGiven: 'Ibrahim', nokFamily: 'Abdullahi', nokPhone: '08030001017',
    hmo: 'NHIS',
    group: 'anc',
    ancWeeks: 20,
    ancGravida: 'G1P0',
    med1: 'Ferrous sulphate 200mg PO', med1Dose: '200mg', med1Sig: '200mg twice daily',
    med2: 'Folic acid 5mg PO', med2Dose: '5mg', med2Sig: '5mg once daily',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 11.5, labObsUnit: 'g/dL',
    labRefRange: '>11.0 g/dL in pregnancy',
    imagingTest: 'Obstetric ultrasound (anomaly scan)',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'ANC', description: 'ANC visit fee', cost: 3000, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'ANOMALYSCAN', description: 'Anomaly scan', cost: 4000, priority: 'routine' },
    ],
  },
  {
    given: ['Chiamaka'], family: 'Ugwu', gender: 'female', dob: '1990-02-14',
    city: 'Enugu', state: 'Enugu', phone: '08020001018', email: 'c.ugwu@mail.ng',
    nin: '10001000018', bloodGroup: 'A+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '22 Agbani Road',
    diagnosis: 'Antenatal care — G2P1 at 32 weeks gestation, gestational diabetes',
    allergy1: 'Aspirin', allergyReaction1: 'Urticaria',
    condition1: 'Intrauterine pregnancy 32 weeks', conditionOnset1: '2025-10-20T00:00:00Z',
    condition2: 'Gestational diabetes mellitus', conditionOnset2: '2026-02-10T00:00:00Z',
    nokGiven: 'Chukwudi', nokFamily: 'Ugwu', nokPhone: '08030001018',
    hmo: 'AXA Mansard',
    group: 'anc',
    ancWeeks: 32,
    ancGravida: 'G2P1',
    med1: 'Metformin 500mg PO', med1Dose: '500mg', med1Sig: '500mg twice daily with meals',
    med2: 'Ferrous sulphate 200mg PO', med2Dose: '200mg', med2Sig: '200mg twice daily',
    labTest: 'OGTT (75g)', labLoincCode: '1558-6',
    labObsName: 'Fasting blood glucose', labObsCode: '1558-6', labObsValue: 6.4, labObsUnit: 'mmol/L',
    labRefRange: '<5.1 mmol/L (fasting GDM threshold)',
    imagingTest: 'Obstetric ultrasound (growth + liquor)',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'ANC', description: 'ANC visit fee', cost: 3000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'OGTT', description: 'Oral glucose tolerance test', cost: 3500, priority: 'routine' },
      { id: '3', category: 'IMAGING', itemCode: 'GROWTHSCAN', description: 'Growth + liquor scan', cost: 5000, priority: 'routine' },
    ],
  },

  // ── GROUP D: OUTPATIENTS (18-29) ──────────────────────────────────────────
  {
    given: ['Tunde'], family: 'Oduola', gender: 'male', dob: '1980-04-12',
    city: 'Ibadan', state: 'Oyo', phone: '08020001019', email: 't.oduola@mail.ng',
    nin: '10001000019', bloodGroup: 'O+', genotype: 'AS', tribe: 'Yoruba', religion: 'Christian',
    street: '5 Molete Road',
    diagnosis: 'Type 2 Diabetes Mellitus — outpatient management',
    allergy1: 'Sulphonylureas', allergyReaction1: 'Hypoglycaemia',
    condition1: 'Type 2 Diabetes Mellitus', conditionOnset1: '2018-09-12T00:00:00Z',
    nokGiven: 'Yemi', nokFamily: 'Oduola', nokPhone: '08030001019',
    hmo: 'Hygeia HMO',
    group: 'outpatient',
    med1: 'Metformin 1g PO', med1Dose: '1g', med1Sig: '1g twice daily with meals',
    med2: 'Empagliflozin 10mg PO', med2Dose: '10mg', med2Sig: '10mg once daily',
    labTest: 'HbA1c', labLoincCode: '4548-4',
    labObsName: 'HbA1c', labObsCode: '4548-4', labObsValue: 7.4, labObsUnit: '%',
    labRefRange: '<7.0%',
    imagingTest: 'Renal ultrasound',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Diabetes review consultation', cost: 5000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'HBA1C', description: 'HbA1c', cost: 3000, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'METFORMIN', description: 'Metformin 1g x60', cost: 2400, priority: 'routine' },
    ],
  },
  {
    given: ['Adaeze'], family: 'Nweke', gender: 'female', dob: '1968-08-07',
    city: 'Onitsha', state: 'Anambra', phone: '08020001020', email: 'a.nweke@mail.ng',
    nin: '10001000020', bloodGroup: 'A+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '1 New Market Road',
    diagnosis: 'Bilateral knee osteoarthritis — Kellgren-Lawrence Grade III',
    allergy1: 'NSAIDs', allergyReaction1: 'Gastric ulcer',
    condition1: 'Bilateral knee osteoarthritis', conditionOnset1: '2020-05-18T00:00:00Z',
    nokGiven: 'Chukwudi', nokFamily: 'Nweke', nokPhone: '08030001020',
    hmo: 'NHIS',
    group: 'outpatient',
    med1: 'Paracetamol 1g PO', med1Dose: '1g', med1Sig: '1g three times daily',
    med2: 'Glucosamine 1500mg PO', med2Dose: '1500mg', med2Sig: '1500mg once daily',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 11.9, labObsUnit: 'g/dL',
    labRefRange: '12.0-15.5 g/dL',
    imagingTest: 'X-ray bilateral knees (AP and lateral)',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Orthopaedics consultation', cost: 5000, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'XRAYKNEE', description: 'X-ray bilateral knees', cost: 4000, priority: 'routine' },
      { id: '3', category: 'PROCEDURE', itemCode: 'PHYSIO', description: 'Physiotherapy x5 sessions', cost: 10000, priority: 'routine' },
    ],
  },
  {
    given: ['Bello'], family: 'Sulaiman', gender: 'male', dob: '1984-12-19',
    city: 'Kano', state: 'Kano', phone: '08020001021', email: 'b.sulaiman@mail.ng',
    nin: '10001000021', bloodGroup: 'B-', genotype: 'AA', tribe: 'Hausa', religion: 'Muslim',
    street: '20 Sabon Gari Road',
    diagnosis: 'Peptic ulcer disease — H. pylori positive',
    allergy1: 'Tetracycline', allergyReaction1: 'Photosensitivity',
    condition1: 'Peptic ulcer disease (H. pylori positive)', conditionOnset1: '2025-08-10T00:00:00Z',
    nokGiven: 'Hadiza', nokFamily: 'Sulaiman', nokPhone: '08030001021',
    hmo: 'RetaiCare',
    group: 'outpatient',
    med1: 'Omeprazole 20mg PO', med1Dose: '20mg', med1Sig: '20mg twice daily before meals',
    med2: 'Clarithromycin 500mg PO', med2Dose: '500mg', med2Sig: '500mg twice daily for 7 days (triple therapy)',
    labTest: 'H. pylori stool antigen', labLoincCode: '50774-0',
    labObsName: 'H. pylori stool antigen', labObsCode: '50774-0', labObsValue: 1, labObsUnit: 'Positive/Negative',
    labRefRange: 'Negative',
    imagingTest: 'Upper GI endoscopy',
    billingItems: [
      { id: '1', category: 'PROCEDURE', itemCode: 'OGD', description: 'Upper GI endoscopy', cost: 20000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'HPYLORI', description: 'H. pylori stool antigen test', cost: 2500, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'PPI', description: 'Omeprazole 20mg x30', cost: 1500, priority: 'routine' },
    ],
  },
  {
    given: ['Ifeoma'], family: 'Obiageli', gender: 'female', dob: '1975-06-30',
    city: 'Enugu', state: 'Enugu', phone: '08020001022', email: 'i.obiageli@mail.ng',
    nin: '10001000022', bloodGroup: 'O+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '17 Trans Ekulu',
    diagnosis: 'Primary hypothyroidism — on Levothyroxine replacement',
    allergy1: 'Iodine contrast', allergyReaction1: 'Anaphylaxis',
    condition1: 'Primary Hypothyroidism', conditionOnset1: '2016-03-22T00:00:00Z',
    nokGiven: 'Uche', nokFamily: 'Obiageli', nokPhone: '08030001022',
    hmo: 'AXA Mansard',
    group: 'outpatient',
    med1: 'Levothyroxine 100mcg PO', med1Dose: '100mcg', med1Sig: '100mcg once daily on empty stomach',
    med2: 'Calcium carbonate 500mg PO', med2Dose: '500mg', med2Sig: '500mg twice daily with meals',
    labTest: 'Thyroid Function Tests', labLoincCode: '58376-5',
    labObsName: 'TSH', labObsCode: '11580-8', labObsValue: 4.8, labObsUnit: 'mIU/L',
    labRefRange: '0.4-4.0 mIU/L',
    imagingTest: 'Thyroid ultrasound',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Endocrinology follow-up', cost: 5000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'TFT', description: 'Thyroid Function Tests', cost: 4000, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'LEVOTHYROXINE', description: 'Levothyroxine 100mcg x30', cost: 1800, priority: 'routine' },
    ],
  },
  {
    given: ['Chukwudi'], family: 'Eze', gender: 'male', dob: '1988-10-14',
    city: 'Awka', state: 'Anambra', phone: '08020001023', email: 'ch.eze@mail.ng',
    nin: '10001000023', bloodGroup: 'A+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '4 Unizik Road',
    diagnosis: 'Migraine with aura — chronic episodic',
    allergy1: 'Ergotamine', allergyReaction1: 'Severe vasoconstriction',
    condition1: 'Migraine with aura', conditionOnset1: '2014-07-05T00:00:00Z',
    nokGiven: 'Nneka', nokFamily: 'Eze', nokPhone: '08030001023',
    hmo: 'Leadway Health',
    group: 'outpatient',
    med1: 'Sumatriptan 50mg PO', med1Dose: '50mg', med1Sig: '50mg orally at onset of migraine, may repeat once after 2 hours',
    med2: 'Propranolol 40mg PO', med2Dose: '40mg', med2Sig: '40mg twice daily (prophylaxis)',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 15.1, labObsUnit: 'g/dL',
    labRefRange: '13.0-17.5 g/dL',
    imagingTest: 'MRI Brain without contrast',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Neurology consultation', cost: 7000, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'MRIBRAIN', description: 'MRI Brain plain', cost: 35000, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'SUMATRIPTAN', description: 'Sumatriptan 50mg x6', cost: 4500, priority: 'routine' },
    ],
  },
  {
    given: ['Stella'], family: 'Nnamdi', gender: 'female', dob: '1963-03-22',
    city: 'Asaba', state: 'Delta', phone: '08020001024', email: 's.nnamdi@mail.ng',
    nin: '10001000024', bloodGroup: 'AB+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '8 Cable Point Road',
    diagnosis: 'Essential hypertension — on dual therapy, target BP not achieved',
    allergy1: 'ACE inhibitors', allergyReaction1: 'Dry cough',
    condition1: 'Essential Hypertension', conditionOnset1: '2005-11-18T00:00:00Z',
    nokGiven: 'Cyril', nokFamily: 'Nnamdi', nokPhone: '08030001024',
    hmo: 'NHIS',
    group: 'outpatient',
    med1: 'Amlodipine 10mg PO', med1Dose: '10mg', med1Sig: '10mg once daily',
    med2: 'Losartan 100mg PO', med2Dose: '100mg', med2Sig: '100mg once daily',
    labTest: 'Urea and Electrolytes', labLoincCode: '24326-1',
    labObsName: 'Potassium', labObsCode: '2823-3', labObsValue: 4.1, labObsUnit: 'mmol/L',
    labRefRange: '3.5-5.1 mmol/L',
    imagingTest: 'ECG 12-lead',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Hypertension review', cost: 5000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'UE', description: 'Urea and Electrolytes', cost: 3500, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'LOSARTAN', description: 'Losartan 100mg x30', cost: 2500, priority: 'routine' },
    ],
  },
  {
    given: ['Kayode'], family: 'Abiola', gender: 'male', dob: '1994-07-09',
    city: 'Sagamu', state: 'Ogun', phone: '08020001025', email: 'k.abiola@mail.ng',
    nin: '10001000025', bloodGroup: 'O+', genotype: 'AA', tribe: 'Yoruba', religion: 'Christian',
    street: '2 Isale Oko Road',
    diagnosis: 'Allergic asthma — moderate persistent, uncontrolled',
    allergy1: 'NSAIDs', allergyReaction1: 'Bronchospasm',
    allergy2: 'Pet dander', allergyReaction2: 'Asthma exacerbation',
    condition1: 'Allergic asthma — moderate persistent', conditionOnset1: '2008-03-14T00:00:00Z',
    nokGiven: 'Taiwo', nokFamily: 'Abiola', nokPhone: '08030001025',
    hmo: 'Hygeia HMO',
    group: 'outpatient',
    med1: 'Seretide (fluticasone/salmeterol) 250/25 inhaler', med1Dose: '2 puffs', med1Sig: '2 puffs inhaled twice daily',
    med2: 'Salbutamol 100mcg inhaler', med2Dose: '2 puffs', med2Sig: '2 puffs inhaled as needed for relief',
    labTest: 'Full Blood Count + Eosinophils', labLoincCode: '58410-2',
    labObsName: 'Eosinophil count', labObsCode: '713-8', labObsValue: 0.8, labObsUnit: '10^9/L',
    labRefRange: '0.04-0.4 10^9/L',
    imagingTest: 'Spirometry (pre and post-bronchodilator)',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Respiratory clinic review', cost: 5000, priority: 'routine' },
      { id: '2', category: 'PROCEDURE', itemCode: 'SPIROMETRY', description: 'Spirometry', cost: 3500, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'SERETIDE', description: 'Seretide 250 inhaler', cost: 7500, priority: 'routine' },
    ],
  },
  {
    given: ['Ngozi'], family: 'Okeke', gender: 'female', dob: '1979-01-17',
    city: 'Port Harcourt', state: 'Rivers', phone: '08020001026', email: 'ng.okeke@mail.ng',
    nin: '10001000026', bloodGroup: 'B+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '10 Trans Amadi Road',
    diagnosis: 'Recurrent urinary tract infection — 3rd episode in 12 months',
    allergy1: 'Nitrofurantoin', allergyReaction1: 'Pulmonary reaction',
    condition1: 'Recurrent urinary tract infection', conditionOnset1: '2025-06-01T00:00:00Z',
    nokGiven: 'Emeka', nokFamily: 'Okeke', nokPhone: '08030001026',
    hmo: 'NHIS',
    group: 'outpatient',
    med1: 'Ciprofloxacin 500mg PO', med1Dose: '500mg', med1Sig: '500mg twice daily for 7 days',
    med2: 'Cranberry extract 500mg PO', med2Dose: '500mg', med2Sig: '500mg once daily (prophylaxis)',
    labTest: 'Urine MCS', labLoincCode: '630-4',
    labObsName: 'Urine culture organism count', labObsCode: '630-4', labObsValue: 100000, labObsUnit: 'CFU/mL',
    labRefRange: '<100000 CFU/mL',
    imagingTest: 'Renal and bladder ultrasound',
    billingItems: [
      { id: '1', category: 'LAB', itemCode: 'URINEMCS', description: 'Urine MCS', cost: 2000, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'RENALUS', description: 'Renal and bladder ultrasound', cost: 5000, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'CIPRO', description: 'Ciprofloxacin 500mg x14', cost: 2800, priority: 'routine' },
    ],
  },
  {
    given: ['Ikenna'], family: 'Duru', gender: 'male', dob: '1972-11-05',
    city: 'Owerri', state: 'Imo', phone: '08020001027', email: 'i.duru@mail.ng',
    nin: '10001000027', bloodGroup: 'O+', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '6 Bank Road',
    diagnosis: 'Lumbar spondylosis with L4-L5 disc herniation and radiculopathy',
    allergy1: 'Diclofenac', allergyReaction1: 'Gastric bleeding',
    condition1: 'Lumbar spondylosis with L4-L5 disc herniation', conditionOnset1: '2023-01-10T00:00:00Z',
    nokGiven: 'Adaeze', nokFamily: 'Duru', nokPhone: '08030001027',
    hmo: 'Leadway Health',
    group: 'outpatient',
    med1: 'Ibuprofen 400mg PO', med1Dose: '400mg', med1Sig: '400mg three times daily with food',
    med2: 'Gabapentin 300mg PO', med2Dose: '300mg', med2Sig: '300mg at night, titrate to 300mg three times daily',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 14.8, labObsUnit: 'g/dL',
    labRefRange: '13.0-17.5 g/dL',
    imagingTest: 'MRI Lumbar spine',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Neurosurgery consultation', cost: 7000, priority: 'routine' },
      { id: '2', category: 'IMAGING', itemCode: 'MRILUMBAR', description: 'MRI Lumbar spine', cost: 30000, priority: 'routine' },
      { id: '3', category: 'PROCEDURE', itemCode: 'PHYSIO', description: 'Physiotherapy x10 sessions', cost: 20000, priority: 'routine' },
    ],
  },
  {
    given: ['Chisom'], family: 'Uzodike', gender: 'female', dob: '1985-04-27',
    city: 'Nnewi', state: 'Anambra', phone: '08020001028', email: 'ch.uzodike@mail.ng',
    nin: '10001000028', bloodGroup: 'A+', genotype: 'AS', tribe: 'Igbo', religion: 'Christian',
    street: '14 Nkemdirim Road',
    diagnosis: 'Iron deficiency anaemia secondary to menorrhagia',
    allergy1: 'Iron injections', allergyReaction1: 'Anaphylaxis',
    condition1: 'Iron deficiency anaemia', conditionOnset1: '2025-10-05T00:00:00Z',
    condition2: 'Menorrhagia', conditionOnset2: '2024-01-15T00:00:00Z',
    nokGiven: 'Obiora', nokFamily: 'Uzodike', nokPhone: '08030001028',
    hmo: 'AXA Mansard',
    group: 'outpatient',
    med1: 'Ferrous sulphate 200mg PO', med1Dose: '200mg', med1Sig: '200mg twice daily between meals',
    med2: 'Norethisterone 5mg PO', med2Dose: '5mg', med2Sig: '5mg three times daily from day 5 to 26 of cycle',
    labTest: 'Full Blood Count + Serum ferritin', labLoincCode: '58410-2',
    labObsName: 'Serum Ferritin', labObsCode: '2276-4', labObsValue: 6.0, labObsUnit: 'ng/mL',
    labRefRange: '12-150 ng/mL',
    imagingTest: 'Pelvic ultrasound (TV scan)',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Gynaecology consultation', cost: 5000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'FERRITIN', description: 'Serum ferritin', cost: 3000, priority: 'routine' },
      { id: '3', category: 'IMAGING', itemCode: 'PELVICUSTV', description: 'Pelvic ultrasound (TV)', cost: 5000, priority: 'routine' },
    ],
  },
  {
    given: ['Musa'], family: 'Lawal', gender: 'male', dob: '1958-09-11',
    city: 'Ilorin', state: 'Kwara', phone: '08020001029', email: 'm.lawal@mail.ng',
    nin: '10001000029', bloodGroup: 'O+', genotype: 'AA', tribe: 'Yoruba', religion: 'Muslim',
    street: '7 Fate Road',
    diagnosis: 'COPD GOLD Stage II — on dual bronchodilator therapy',
    allergy1: 'Theophylline', allergyReaction1: 'Tachyarrhythmia',
    condition1: 'COPD GOLD Stage II', conditionOnset1: '2018-06-20T00:00:00Z',
    nokGiven: 'Fatima', nokFamily: 'Lawal', nokPhone: '08030001029',
    hmo: 'NHIS',
    group: 'outpatient',
    med1: 'Tiotropium 18mcg inhaler', med1Dose: '18mcg', med1Sig: '1 capsule inhaled once daily via HandiHaler',
    med2: 'Formoterol 12mcg inhaler', med2Dose: '12mcg', med2Sig: '1 puff inhaled twice daily',
    labTest: 'Full Blood Count', labLoincCode: '58410-2',
    labObsName: 'Haemoglobin', labObsCode: '718-7', labObsValue: 15.8, labObsUnit: 'g/dL',
    labRefRange: '13.0-17.5 g/dL',
    imagingTest: 'Chest X-ray + Spirometry',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Respiratory clinic review', cost: 5000, priority: 'routine' },
      { id: '2', category: 'PROCEDURE', itemCode: 'SPIROMETRY', description: 'Spirometry (post-BD)', cost: 3500, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'TIOTROPIUM', description: 'Tiotropium 18mcg inhaler', cost: 9000, priority: 'routine' },
    ],
  },
  {
    given: ['Ada'], family: 'Okafor', gender: 'female', dob: '2003-12-30',
    city: 'Awka', state: 'Anambra', phone: '08020001030', email: 'ada.okafor@mail.ng',
    nin: '10001000030', bloodGroup: 'A-', genotype: 'AA', tribe: 'Igbo', religion: 'Christian',
    street: '11 GRA Road',
    diagnosis: 'Generalised anxiety disorder with somatic features',
    allergy1: 'Benzodiazepines', allergyReaction1: 'Paradoxical agitation',
    condition1: 'Generalised Anxiety Disorder', conditionOnset1: '2024-03-10T00:00:00Z',
    nokGiven: 'Chukwuemeka', nokFamily: 'Okafor', nokPhone: '08030001030',
    hmo: 'Self-pay',
    group: 'outpatient',
    med1: 'Sertraline 50mg PO', med1Dose: '50mg', med1Sig: '50mg once daily in the morning',
    med2: 'Hydroxyzine 25mg PO', med2Dose: '25mg', med2Sig: '25mg three times daily PRN anxiety',
    labTest: 'Thyroid Function Tests', labLoincCode: '58376-5',
    labObsName: 'TSH', labObsCode: '11580-8', labObsValue: 2.1, labObsUnit: 'mIU/L',
    labRefRange: '0.4-4.0 mIU/L',
    imagingTest: 'No imaging indicated',
    billingItems: [
      { id: '1', category: 'CONSULTATION', itemCode: 'CONSULT', description: 'Psychiatry consultation', cost: 8000, priority: 'routine' },
      { id: '2', category: 'LAB', itemCode: 'TFT', description: 'Thyroid Function Tests (exclude thyroid cause)', cost: 4000, priority: 'routine' },
      { id: '3', category: 'MEDICATION', itemCode: 'SERTRALINE', description: 'Sertraline 50mg x30', cost: 3500, priority: 'routine' },
    ],
  },
];

// ── Vitals builder ─────────────────────────────────────────────────────────────

function buildVitals(patientId: string, effectiveDate: string) {
  const systolic  = rand(105, 170, 0);
  const diastolic = rand(65,  105, 0);
  const hr        = rand(56,  108, 0);
  const temp      = rand(36.1, 38.2);
  const spo2      = rand(94,  100, 0);
  const weight    = rand(48,  105);
  const height    = rand(153, 192);

  const vsCategory = [{ coding: [{ system: OBS_CATEGORY, code: 'vital-signs' }] }];

  return [
    {
      resourceType: 'Observation', status: 'final', category: vsCategory,
      code: { coding: [{ system: LOINC, code: '55284-4', display: 'Blood pressure' }], text: 'Blood pressure' },
      subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate,
      component: [
        { code: { coding: [{ system: LOINC, code: '8480-6', display: 'Systolic blood pressure'  }] }, valueQuantity: { value: systolic,  unit: 'mmHg', system: UCUM, code: 'mm[Hg]' } },
        { code: { coding: [{ system: LOINC, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: diastolic, unit: 'mmHg', system: UCUM, code: 'mm[Hg]' } },
      ],
    },
    {
      resourceType: 'Observation', status: 'final', category: vsCategory,
      code: { coding: [{ system: LOINC, code: '8867-4', display: 'Heart rate' }], text: 'Heart rate' },
      subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate,
      valueQuantity: { value: hr, unit: '/min', system: UCUM, code: '/min' },
    },
    {
      resourceType: 'Observation', status: 'final', category: vsCategory,
      code: { coding: [{ system: LOINC, code: '8310-5', display: 'Body temperature' }], text: 'Body temperature' },
      subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate,
      valueQuantity: { value: temp, unit: 'Cel', system: UCUM, code: 'Cel' },
    },
    {
      resourceType: 'Observation', status: 'final', category: vsCategory,
      code: { coding: [{ system: LOINC, code: '59408-5', display: 'Oxygen saturation' }], text: 'Oxygen saturation' },
      subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate,
      valueQuantity: { value: spo2, unit: '%', system: UCUM, code: '%' },
    },
    {
      resourceType: 'Observation', status: 'final', category: vsCategory,
      code: { coding: [{ system: LOINC, code: '29463-7', display: 'Body weight' }], text: 'Body weight' },
      subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate,
      valueQuantity: { value: weight, unit: 'kg', system: UCUM, code: 'kg' },
    },
    {
      resourceType: 'Observation', status: 'final', category: vsCategory,
      code: { coding: [{ system: LOINC, code: '8302-2', display: 'Body height' }], text: 'Body height' },
      subject: { reference: `Patient/${patientId}` }, effectiveDateTime: effectiveDate,
      valueQuantity: { value: height, unit: 'cm', system: UCUM, code: 'cm' },
    },
  ];
}

// ── SOAP note builder ─────────────────────────────────────────────────────────

function buildSoapNote(p: PatientDef, visitContext: string): string {
  const fullName = `${p.given.join(' ')} ${p.family}`;
  return [
    `SOAP NOTE — Lotto Central Hospital`,
    `Patient: ${fullName} | MRN: pending | ${visitContext}`,
    ``,
    `S (Subjective):`,
    `Patient presents with complaints related to ${p.diagnosis}. `,
    `${p.given[0]} reports symptoms consistent with the presenting condition. No recent foreign travel. `,
    `Known allergies: ${p.allergy1} (${p.allergyReaction1})${p.allergy2 ? `, ${p.allergy2} (${p.allergyReaction2})` : ''}.`,
    ``,
    `O (Objective):`,
    `Vitals reviewed. General examination: Alert, orientated, not in acute distress. `,
    `Systems examination findings consistent with ${p.condition1}.`,
    ``,
    `A (Assessment):`,
    `1. ${p.condition1}${p.condition2 ? `\n2. ${p.condition2}` : ''}`,
    ``,
    `P (Plan):`,
    `1. ${p.med1Sig}`,
    `2. ${p.med2Sig}`,
    `3. Investigations: ${p.labTest}, ${p.imagingTest}`,
    `4. Follow-up as scheduled. Patient educated on diagnosis and medication compliance.`,
    ``,
    `Signed: Dr. [Attending Physician] — Lotto Central Hospital`,
  ].join('\n');
}

function buildProgressNote(p: PatientDef, dayOffset: number): string {
  return [
    `PROGRESS NOTE — Lotto Central Hospital`,
    `Patient: ${p.given.join(' ')} ${p.family} | Day ${dayOffset} of admission`,
    ``,
    `Condition: ${p.condition1}`,
    `Patient is ${dayOffset <= 2 ? 'still critically unwell' : 'showing gradual improvement'}.`,
    ``,
    `Observations: Vitals reviewed and charted. Medications continued as prescribed.`,
    `Current treatment: ${p.med1} and ${p.med2}.`,
    ``,
    `Assessment: ${dayOffset <= 2 ? 'Condition stable but requiring close monitoring.' : 'Responding to treatment, plan to reassess for discharge readiness.'}`,
    ``,
    `Plan: Continue current management. Repeat ${p.labTest} tomorrow.`,
    ``,
    `Signed: Dr. [Ward Physician] — Lotto Central Hospital`,
  ].join('\n');
}

function buildReferralNote(p: PatientDef, destination: string): string {
  return [
    `REFERRAL NOTE — Lotto Central Hospital`,
    `Patient: ${p.given.join(' ')} ${p.family}`,
    ``,
    `Dear Consultant,`,
    ``,
    `We are referring this patient for specialist review regarding: ${p.diagnosis}`,
    ``,
    `Clinical summary:`,
    `- Diagnosis: ${p.condition1}${p.condition2 ? `, ${p.condition2}` : ''}`,
    `- Current medications: ${p.med1}, ${p.med2}`,
    `- Known allergies: ${p.allergy1} (${p.allergyReaction1})`,
    `- Recent investigations: ${p.labTest} — ${p.labObsName}: ${p.labObsValue} ${p.labObsUnit} (Ref: ${p.labRefRange})`,
    ``,
    `Reason for referral: Specialist management required at ${destination}.`,
    ``,
    `Please review and advise. Patient has been counselled regarding this referral.`,
    ``,
    `Signed: Dr. [Referring Physician] — Lotto Central Hospital`,
  ].join('\n');
}

function buildAncNote(p: PatientDef): string {
  return [
    `ANTENATAL CARE PROGRESS NOTE — Lotto Central Hospital`,
    `Patient: ${p.given.join(' ')} ${p.family} | ${p.ancGravida}, ${p.ancWeeks} weeks gestation`,
    ``,
    `S: Routine ANC visit. Patient reports ${p.ancWeeks && p.ancWeeks >= 28 ? 'good foetal movements' : 'no significant complaints'}. `,
    `${p.ancWeeks && p.ancWeeks >= 28 ? 'Mild lower limb oedema noted.' : 'No nausea or vomiting currently.'}`,
    ``,
    `O: Vitals reviewed. Fundal height consistent with ${p.ancWeeks} weeks. `,
    `Foetal heart sounds heard. No vaginal bleeding. `,
    `Urinalysis: ${p.ancWeeks && p.ancWeeks >= 34 ? 'Trace protein — monitor closely.' : 'No proteinuria, no glucosuria.'}`,
    ``,
    `A: ${p.diagnosis}`,
    ``,
    `P:`,
    `1. Continue ${p.med1Sig}`,
    `2. Continue ${p.med2Sig}`,
    `3. ${p.imagingTest}`,
    `4. Next visit in ${p.ancWeeks && p.ancWeeks >= 36 ? '1 week' : '4 weeks'}.`,
    `5. Advised to present immediately if reduced foetal movements, bleeding or severe headache.`,
    ``,
    `Signed: Dr. [ANC Physician] — Lotto Central Hospital`,
  ].join('\n');
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getToken(base: string, email: string, password: string): Promise<string> {
  const verifier  = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');

  const loginRes  = await fetch(`${base}auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember: false, codeChallenge: challenge, codeChallengeMethod: 'S256' }),
  });
  const loginData = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginData?.code) {
    throw new Error(loginData?.issue?.[0]?.details?.text ?? `Login failed (${loginRes.status})`);
  }

  const tokenRes  = await fetch(`${base}oauth2/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: loginData.code, code_verifier: verifier }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData?.error_description ?? 'Token exchange failed');
  }
  return tokenData.access_token as string;
}

function fhirHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/fhir+json' };
}

async function fhirPost(base: string, h: Record<string, string>, resourceType: string, body: object): Promise<{ id: string; ok: boolean; error?: string }> {
  try {
    const res  = await fetch(`${base}fhir/R4/${resourceType}`, { method: 'POST', headers: h, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.issue?.[0]?.details?.text ?? data?.issue?.[0]?.diagnostics ?? `${resourceType} create failed (${res.status})`;
      return { id: '', ok: false, error: msg };
    }
    return { id: (data as { id: string }).id, ok: true };
  } catch (err) {
    return { id: '', ok: false, error: (err as Error).message };
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.adminEmail || !body?.adminPassword) {
    return NextResponse.json({ error: 'adminEmail and adminPassword are required' }, { status: 400 });
  }

  const base = (process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL ?? 'https://api.medplum.com/').replace(/\/?$/, '/');

  let token: string;
  try {
    token = await getToken(base, body.adminEmail, body.adminPassword);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }

  const h = fhirHeaders(token);

  // Resource type counters
  const counts: Record<string, number> = {
    Patient: 0, RelatedPerson: 0, Coverage: 0, AllergyIntolerance: 0,
    Condition: 0, Observation: 0, Encounter: 0, DocumentReference: 0,
    ServiceRequest: 0, DiagnosticReport: 0, MedicationRequest: 0, RequestGroup: 0,
  };

  const results: { name: string; mrn: string; status: 'created' | 'error'; error?: string; resources?: Record<string, number> }[] = [];

  // Billing status rotation: 15 active, 10 completed, 5 revoked
  const billingStatuses = [
    ...Array(15).fill('active'),
    ...Array(10).fill('completed'),
    ...Array(5).fill('revoked'),
  ];

  for (let i = 0; i < PATIENTS.length; i++) {
    const p       = PATIENTS[i];
    const mrn     = `LCH-2026-${String(200001 + i).padStart(6, '0')}`;
    const fullName = `${p.given.join(' ')} ${p.family}`;
    const patResources: Record<string, number> = {};

    try {
      // ── 1. Patient ──────────────────────────────────────────────────────────
      const patResult = await fhirPost(base, h, 'Patient', {
        resourceType: 'Patient',
        active: true,
        identifier: [
          {
            use: 'official', system: MRN_SYSTEM, value: mrn,
            type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }], text: 'MRN' },
          },
          {
            use: 'official', system: NIN_SYSTEM, value: p.nin,
            type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'NI' }], text: 'NIN' },
          },
        ],
        name:      [{ use: 'official', given: p.given, family: p.family }],
        gender:    p.gender,
        birthDate: p.dob,
        telecom: [
          { system: 'phone', value: p.phone, use: 'mobile' },
          { system: 'email', value: p.email, use: 'home' },
        ],
        address: [{
          use: 'home',
          line:    [p.street],
          city:    p.city,
          state:   p.state,
          country: 'NG',
        }],
        extension: [
          { url: EXT_BLOOD,    valueString: p.bloodGroup },
          { url: EXT_GENO,     valueString: p.genotype   },
          { url: EXT_TRIBE,    valueString: p.tribe       },
          { url: EXT_RELIGION, valueString: p.religion    },
        ],
      });
      if (!patResult.ok) throw new Error(`Patient: ${patResult.error}`);
      const patientId = patResult.id;
      counts.Patient++;
      patResources.Patient = 1;

      const ref = `Patient/${patientId}`;

      // ── 2. RelatedPerson (next of kin) ──────────────────────────────────────
      const nokRes = await fhirPost(base, h, 'RelatedPerson', {
        resourceType: 'RelatedPerson',
        patient: { reference: ref },
        active: true,
        relationship: [{
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode', code: 'MTH' }],
          text: 'Mother',
        }],
        name: [{ use: 'official', given: [p.nokGiven], family: p.nokFamily }],
        telecom: [{ system: 'phone', value: p.nokPhone, use: 'mobile' }],
      });
      if (nokRes.ok) { counts.RelatedPerson++; patResources.RelatedPerson = 1; }

      // ── 3. Coverage ─────────────────────────────────────────────────────────
      const covRes = await fhirPost(base, h, 'Coverage', {
        resourceType: 'Coverage',
        status: 'active',
        beneficiary: { reference: ref },
        payor: [{ display: p.hmo }],
      });
      if (covRes.ok) { counts.Coverage++; patResources.Coverage = 1; }

      // ── 4. AllergyIntolerance ───────────────────────────────────────────────
      let allergyCount = 0;
      const allergy1Res = await fhirPost(base, h, 'AllergyIntolerance', {
        resourceType: 'AllergyIntolerance',
        clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
        verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
        patient: { reference: ref },
        code: { text: p.allergy1 },
        reaction: [{ manifestation: [{ text: p.allergyReaction1 }] }],
      });
      if (allergy1Res.ok) allergyCount++;

      if (p.allergy2 && p.allergyReaction2) {
        const allergy2Res = await fhirPost(base, h, 'AllergyIntolerance', {
          resourceType: 'AllergyIntolerance',
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active' }] },
          verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'confirmed' }] },
          patient: { reference: ref },
          code: { text: p.allergy2 },
          reaction: [{ manifestation: [{ text: p.allergyReaction2 }] }],
        });
        if (allergy2Res.ok) allergyCount++;
      }
      counts.AllergyIntolerance += allergyCount;
      patResources.AllergyIntolerance = allergyCount;

      // ── 5. Conditions ───────────────────────────────────────────────────────
      let condCount = 0;
      const cond1Res = await fhirPost(base, h, 'Condition', {
        resourceType: 'Condition',
        clinicalStatus: { coding: [{ system: COND_CLINICAL, code: 'active' }] },
        subject: { reference: ref },
        code: { text: p.condition1 },
        onsetDateTime: p.conditionOnset1,
      });
      if (cond1Res.ok) condCount++;

      if (p.condition2 && p.conditionOnset2) {
        const cond2Res = await fhirPost(base, h, 'Condition', {
          resourceType: 'Condition',
          clinicalStatus: { coding: [{ system: COND_CLINICAL, code: 'active' }] },
          subject: { reference: ref },
          code: { text: p.condition2 },
          onsetDateTime: p.conditionOnset2,
        });
        if (cond2Res.ok) condCount++;
      }
      counts.Condition += condCount;
      patResources.Condition = condCount;

      // ── 6. Vitals — two sets 7 days apart ──────────────────────────────────
      const vitalsDate1 = daysAgo(3 + Math.floor(Math.random() * 4));
      const vitalsDate2 = daysAgo(10 + Math.floor(Math.random() * 4));
      let obsCount = 0;

      for (const obs of buildVitals(patientId, vitalsDate1)) {
        const r = await fhirPost(base, h, 'Observation', obs);
        if (r.ok) obsCount++;
      }
      for (const obs of buildVitals(patientId, vitalsDate2)) {
        const r = await fhirPost(base, h, 'Observation', obs);
        if (r.ok) obsCount++;
      }
      counts.Observation += obsCount;
      patResources.Observation = obsCount;

      // ── 7. Encounters ───────────────────────────────────────────────────────
      let enc1Id = '';
      let enc2Id = '';

      if (p.group === 'admitted') {
        // Enc 1: current inpatient (in-progress)
        const enc1daysAgo = 3 + Math.floor(Math.random() * 5);
        const enc1Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'in-progress',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP', display: 'Inpatient' },
          type: [{ text: 'Inpatient Admission' }],
          subject: { reference: ref },
          period: { start: daysAgo(enc1daysAgo) },
          reasonCode: [{ text: p.diagnosis }],
          note: [{ text: `Patient admitted with ${p.diagnosis}. Under active inpatient management.` }],
        });
        if (enc1Res.ok) { enc1Id = enc1Res.id; counts.Encounter++; }

        // Enc 2: prior outpatient (finished)
        const enc2Start = daysAgo(30 + Math.floor(Math.random() * 31));
        const enc2End   = new Date(new Date(enc2Start).getTime() + 60 * 60000).toISOString();
        const enc2Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'Outpatient Consultation' }],
          subject: { reference: ref },
          period: { start: enc2Start, end: enc2End },
          reasonCode: [{ text: p.condition1 }],
          note: [{ text: `Follow-up consultation for ${p.condition1}.` }],
        });
        if (enc2Res.ok) { enc2Id = enc2Res.id; counts.Encounter++; }

      } else if (p.group === 'referred') {
        // Enc 1: recent outpatient (finished)
        const enc1daysAgo = 7 + Math.floor(Math.random() * 8);
        const enc1Start = daysAgo(enc1daysAgo);
        const enc1End   = new Date(new Date(enc1Start).getTime() + 45 * 60000).toISOString();
        const enc1Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'Outpatient Consultation' }],
          subject: { reference: ref },
          period: { start: enc1Start, end: enc1End },
          reasonCode: [{ text: p.condition1 }],
          note: [{ text: `Referral assessment for ${p.condition1}.` }],
        });
        if (enc1Res.ok) { enc1Id = enc1Res.id; counts.Encounter++; }

        // Enc 2: earlier outpatient (finished)
        const enc2daysAgo = 45 + Math.floor(Math.random() * 46);
        const enc2Start = daysAgo(enc2daysAgo);
        const enc2End   = new Date(new Date(enc2Start).getTime() + 30 * 60000).toISOString();
        const enc2Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'General Consultation' }],
          subject: { reference: ref },
          period: { start: enc2Start, end: enc2End },
          reasonCode: [{ text: p.condition1 }],
        });
        if (enc2Res.ok) { enc2Id = enc2Res.id; counts.Encounter++; }

      } else if (p.group === 'anc') {
        // Enc 1: recent ANC visit (finished)
        const enc1daysAgo = 7 + Math.floor(Math.random() * 8);
        const enc1Start = daysAgo(enc1daysAgo);
        const enc1End   = new Date(new Date(enc1Start).getTime() + 40 * 60000).toISOString();
        const enc1Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'Antenatal Care' }],
          subject: { reference: ref },
          period: { start: enc1Start, end: enc1End },
          reasonCode: [{ text: `Antenatal Visit - ${p.ancWeeks} weeks` }],
          note: [{ text: `ANC visit at ${p.ancWeeks} weeks gestation — ${p.ancGravida}` }],
        });
        if (enc1Res.ok) { enc1Id = enc1Res.id; counts.Encounter++; }

        // Enc 2: earlier ANC visit (finished)
        const enc2daysAgo = 30 + Math.floor(Math.random() * 21);
        const enc2Start = daysAgo(enc2daysAgo);
        const enc2End   = new Date(new Date(enc2Start).getTime() + 40 * 60000).toISOString();
        const previousWeeks = (p.ancWeeks ?? 0) - 4;
        const enc2Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'Antenatal Care' }],
          subject: { reference: ref },
          period: { start: enc2Start, end: enc2End },
          reasonCode: [{ text: `Antenatal Visit - ${previousWeeks > 0 ? previousWeeks : p.ancWeeks} weeks` }],
        });
        if (enc2Res.ok) { enc2Id = enc2Res.id; counts.Encounter++; }

      } else {
        // Outpatient: Enc 1 — recent (finished)
        const enc1daysAgo = 5 + Math.floor(Math.random() * 11);
        const enc1Start = daysAgo(enc1daysAgo);
        const enc1End   = new Date(new Date(enc1Start).getTime() + 30 * 60000).toISOString();
        const enc1Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'Outpatient Consultation' }],
          subject: { reference: ref },
          period: { start: enc1Start, end: enc1End },
          reasonCode: [{ text: p.diagnosis }],
          note: [{ text: `Outpatient review for ${p.diagnosis}.` }],
        });
        if (enc1Res.ok) { enc1Id = enc1Res.id; counts.Encounter++; }

        // Enc 2 — earlier (finished)
        const enc2daysAgo = 40 + Math.floor(Math.random() * 31);
        const enc2Start = daysAgo(enc2daysAgo);
        const enc2End   = new Date(new Date(enc2Start).getTime() + 30 * 60000).toISOString();
        const enc2Res = await fhirPost(base, h, 'Encounter', {
          resourceType: 'Encounter', status: 'finished',
          class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'Ambulatory' },
          type: [{ text: 'General Consultation' }],
          subject: { reference: ref },
          period: { start: enc2Start, end: enc2End },
          reasonCode: [{ text: p.condition1 }],
        });
        if (enc2Res.ok) { enc2Id = enc2Res.id; counts.Encounter++; }
      }
      patResources.Encounter = [enc1Id, enc2Id].filter(Boolean).length;

      // ── 8. DocumentReference notes ──────────────────────────────────────────
      const docCategory = [{
        coding: [{
          system: 'http://hl7.org/fhir/us/core/CodeSystem/us-core-documentreference-category',
          code: 'clinical-note', display: 'Clinical Note',
        }],
      }];
      let docCount = 0;

      const soapNote = buildSoapNote(p, `${p.group.toUpperCase()} | ${p.diagnosis}`);
      const soapDate = enc1Id ? daysAgo(p.group === 'admitted' ? 4 : 8) : daysAgo(8);

      const doc1Res = await fhirPost(base, h, 'DocumentReference', {
        resourceType: 'DocumentReference', status: 'current', docStatus: 'final',
        type: { coding: [{ system: LOINC, code: '34137-0', display: 'Outpatient Note' }], text: 'SOAP Note' },
        category: docCategory,
        subject: { reference: ref },
        date: soapDate,
        description: `SOAP Note — ${p.diagnosis}`,
        content: [{ attachment: { contentType: 'text/plain', data: b64(soapNote), title: 'SOAP Note' } }],
        ...(enc1Id ? { context: { encounter: [{ reference: `Encounter/${enc1Id}` }] } } : {}),
      });
      if (doc1Res.ok) docCount++;

      // Second note — type depends on group
      let doc2Note = '';
      let doc2Type = { coding: [{ system: LOINC, code: '11506-3', display: 'Progress Note' }], text: 'Progress Note' };
      let doc2Desc = 'Progress Note';

      if (p.group === 'admitted') {
        doc2Note = buildProgressNote(p, 2);
        doc2Type = { coding: [{ system: LOINC, code: '11506-3', display: 'Progress Note' }], text: 'Progress Note' };
        doc2Desc = 'Inpatient Progress Note';
      } else if (p.group === 'referred') {
        doc2Note = buildReferralNote(p, 'Tertiary / Specialist Centre');
        doc2Type = { coding: [{ system: LOINC, code: '57133-1', display: 'Referral Note' }], text: 'Referral Note' };
        doc2Desc = 'Specialist Referral Note';
      } else if (p.group === 'anc') {
        doc2Note = buildAncNote(p);
        doc2Type = { coding: [{ system: LOINC, code: '11506-3', display: 'Progress Note' }], text: 'ANC Progress Note' };
        doc2Desc = `ANC Progress Note — ${p.ancWeeks} weeks`;
      } else {
        doc2Note = buildSoapNote(p, `Follow-up | ${p.condition1}`);
        doc2Type = { coding: [{ system: LOINC, code: '34137-0', display: 'Outpatient Note' }], text: 'Outpatient SOAP Note' };
        doc2Desc = `Outpatient Note — Follow-up for ${p.condition1}`;
      }

      const doc2Date = enc2Id ? daysAgo(p.group === 'admitted' ? 3 : 45) : daysAgo(45);
      const doc2Res = await fhirPost(base, h, 'DocumentReference', {
        resourceType: 'DocumentReference', status: 'current', docStatus: 'final',
        type: doc2Type,
        category: docCategory,
        subject: { reference: ref },
        date: doc2Date,
        description: doc2Desc,
        content: [{ attachment: { contentType: 'text/plain', data: b64(doc2Note), title: doc2Desc } }],
        ...(enc2Id ? { context: { encounter: [{ reference: `Encounter/${enc2Id}` }] } } : {}),
      });
      if (doc2Res.ok) docCount++;

      counts.DocumentReference += docCount;
      patResources.DocumentReference = docCount;

      // ── 9. ServiceRequests ──────────────────────────────────────────────────
      const srStatus = p.group === 'admitted' ? 'active' : 'completed';
      const srDate   = enc1Id ? daysAgo(p.group === 'admitted' ? 2 : 7) : daysAgo(7);

      const sr1Res = await fhirPost(base, h, 'ServiceRequest', {
        resourceType: 'ServiceRequest', status: srStatus, intent: 'order',
        category: [{ coding: [{ system: SNOMED, code: '108252007', display: 'Laboratory procedure' }] }],
        code: { text: p.labTest, coding: [{ system: LOINC, code: p.labLoincCode }] },
        subject: { reference: ref },
        ...(enc1Id ? { encounter: { reference: `Encounter/${enc1Id}` } } : {}),
        authoredOn: srDate,
        priority: 'routine',
      });
      if (sr1Res.ok) counts.ServiceRequest++;

      const sr2Res = await fhirPost(base, h, 'ServiceRequest', {
        resourceType: 'ServiceRequest', status: srStatus, intent: 'order',
        category: [{ coding: [{ system: SNOMED, code: '363679005', display: 'Imaging' }] }],
        code: { text: p.imagingTest },
        subject: { reference: ref },
        ...(enc1Id ? { encounter: { reference: `Encounter/${enc1Id}` } } : {}),
        authoredOn: srDate,
        priority: 'routine',
      });
      if (sr2Res.ok) counts.ServiceRequest++;
      patResources.ServiceRequest = [sr1Res.ok, sr2Res.ok].filter(Boolean).length;

      // ── 10. DiagnosticReport + Lab Observation ──────────────────────────────
      const labDate = daysAgo(p.group === 'admitted' ? 1 : 6);

      const labObsRes = await fhirPost(base, h, 'Observation', {
        resourceType: 'Observation', status: 'final',
        category: [{ coding: [{ system: OBS_CATEGORY, code: 'laboratory' }] }],
        code: {
          coding: [{ system: LOINC, code: p.labObsCode, display: p.labObsName }],
          text: p.labObsName,
        },
        subject: { reference: ref },
        ...(enc1Id ? { encounter: { reference: `Encounter/${enc1Id}` } } : {}),
        valueQuantity: { value: p.labObsValue, unit: p.labObsUnit, system: UCUM, code: p.labObsUnit },
        referenceRange: [{ text: p.labRefRange }],
        issued: labDate,
        effectiveDateTime: labDate,
      });
      if (labObsRes.ok) counts.Observation++;

      const drRes = await fhirPost(base, h, 'DiagnosticReport', {
        resourceType: 'DiagnosticReport', status: 'final',
        category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
        code: { text: p.labTest },
        subject: { reference: ref },
        ...(enc1Id ? { encounter: { reference: `Encounter/${enc1Id}` } } : {}),
        ...(sr1Res.ok ? { basedOn: [{ reference: `ServiceRequest/${sr1Res.id}` }] } : {}),
        ...(labObsRes.ok ? { result: [{ reference: `Observation/${labObsRes.id}` }] } : {}),
        issued: labDate,
        effectiveDateTime: labDate,
        conclusion: `${p.labObsName}: ${p.labObsValue} ${p.labObsUnit}. Reference range: ${p.labRefRange}.`,
      });
      if (drRes.ok) counts.DiagnosticReport++;
      patResources.DiagnosticReport = drRes.ok ? 1 : 0;

      // ── 11. MedicationRequests ──────────────────────────────────────────────
      const medDate = enc1Id ? daysAgo(p.group === 'admitted' ? 2 : 6) : daysAgo(6);
      const medStatus = p.group === 'admitted' ? 'active' : 'active';

      const med1Res = await fhirPost(base, h, 'MedicationRequest', {
        resourceType: 'MedicationRequest', status: medStatus, intent: 'order',
        medicationCodeableConcept: { text: p.med1 },
        subject: { reference: ref },
        ...(enc1Id ? { encounter: { reference: `Encounter/${enc1Id}` } } : {}),
        authoredOn: medDate,
        priority: 'routine',
        dosageInstruction: [{
          text: p.med1Sig,
          timing: { code: { text: 'as directed' } },
          doseAndRate: [{ doseQuantity: { value: 1, unit: p.med1Dose } }],
        }],
        dispenseRequest: {
          expectedSupplyDuration: { value: 30, unit: 'days', system: UCUM, code: 'd' },
        },
      });
      if (med1Res.ok) counts.MedicationRequest++;

      const med2Res = await fhirPost(base, h, 'MedicationRequest', {
        resourceType: 'MedicationRequest', status: medStatus, intent: 'order',
        medicationCodeableConcept: { text: p.med2 },
        subject: { reference: ref },
        ...(enc1Id ? { encounter: { reference: `Encounter/${enc1Id}` } } : {}),
        authoredOn: medDate,
        priority: 'routine',
        dosageInstruction: [{
          text: p.med2Sig,
          timing: { code: { text: 'as directed' } },
          doseAndRate: [{ doseQuantity: { value: 1, unit: p.med2Dose } }],
        }],
        dispenseRequest: {
          expectedSupplyDuration: { value: 30, unit: 'days', system: UCUM, code: 'd' },
        },
      });
      if (med2Res.ok) counts.MedicationRequest++;
      patResources.MedicationRequest = [med1Res.ok, med2Res.ok].filter(Boolean).length;

      // ── 12. RequestGroup (billing) ──────────────────────────────────────────
      const billingStatus = billingStatuses[i] ?? 'active';
      const totalEstimate = (p.billingItems as Array<{ cost: number }>).reduce((s, it) => s + it.cost, 0);
      const billingNote = JSON.stringify({
        items: p.billingItems,
        totalEstimate,
        paymentMode: p.hmo === 'Self-pay' ? 'cash' : 'hmo',
      });

      const rgRes = await fhirPost(base, h, 'RequestGroup', {
        resourceType: 'RequestGroup',
        status: billingStatus,
        intent: 'order',
        subject: { reference: ref, display: fullName },
        authoredOn: medDate,
        note: [{ text: billingNote }],
      });
      if (rgRes.ok) counts.RequestGroup++;
      patResources.RequestGroup = rgRes.ok ? 1 : 0;

      results.push({ name: fullName, mrn, status: 'created', resources: patResources });

    } catch (err) {
      results.push({ name: fullName, mrn, status: 'error', error: (err as Error).message });
    }
  }

  const created = results.filter((r) => r.status === 'created').length;

  return NextResponse.json({
    message: `Seeded ${created}/${PATIENTS.length} fully-populated patients`,
    resourcesSummary: counts,
    results,
  });
}
