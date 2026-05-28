import type { LabBench, ImagingModality, RejectionReason } from './types';

export const REJECTION_REASONS: Record<RejectionReason, string> = {
  'hemolyzed':            'Hemolyzed sample',
  'unlabeled':            'Unlabeled / no label',
  'insufficient-volume':  'Insufficient volume',
  'clotted':              'Clotted sample',
  'wrong-container':      'Wrong container / tube',
  'delayed-transport':    'Delayed transport (>2 hrs)',
  'mislabeled':           'Mislabeled specimen',
  'duplicate-request':    'Duplicate request',
  'other':                'Other (see notes)',
};

export const LAB_BENCH_LABELS: Record<LabBench, string> = {
  hematology:      'Hematology',
  chemistry:       'Chemistry / Biochemistry',
  microbiology:    'Microbiology / Culture',
  immunology:      'Immunology / Serology',
  histopathology:  'Histopathology / Cytology',
  serology:        'Serology / Virology',
};

export const LAB_BENCH_COLORS: Record<LabBench, string> = {
  hematology:      'bg-red-100 text-red-700',
  chemistry:       'bg-amber-100 text-amber-700',
  microbiology:    'bg-green-100 text-green-700',
  immunology:      'bg-purple-100 text-purple-700',
  histopathology:  'bg-pink-100 text-pink-700',
  serology:        'bg-blue-100 text-blue-700',
};

export const IMAGING_MODALITY_LABELS: Record<ImagingModality, string> = {
  'x-ray':       'X-Ray',
  'ultrasound':  'Ultrasound',
  'ct':          'CT Scan',
  'mri':         'MRI',
  'mammography': 'Mammography',
  'fluoroscopy': 'Fluoroscopy',
  'echo':        'Echocardiography',
};

export const IMAGING_MODALITY_COLORS: Record<ImagingModality, string> = {
  'x-ray':       'bg-slate-100 text-slate-700',
  'ultrasound':  'bg-blue-100 text-blue-700',
  'ct':          'bg-violet-100 text-violet-700',
  'mri':         'bg-indigo-100 text-indigo-700',
  'mammography': 'bg-pink-100 text-pink-700',
  'fluoroscopy': 'bg-amber-100 text-amber-700',
  'echo':        'bg-teal-100 text-teal-700',
};

// Common lab panels with reference ranges
export interface Analyte {
  name: string;
  unit: string;
  refRange: string;
  criticalLow?: number;
  criticalHigh?: number;
}

export const LAB_PANELS: Record<string, { label: string; analytes: Analyte[] }> = {
  'FBC': {
    label: 'Full Blood Count (FBC)',
    analytes: [
      { name: 'Hemoglobin (Hb)',     unit: 'g/dL',     refRange: 'M: 13.5–17.5 / F: 12–16', criticalLow: 7,   criticalHigh: 20 },
      { name: 'WBC',                  unit: '×10⁹/L',   refRange: '4.0–11.0',                 criticalLow: 2,   criticalHigh: 30 },
      { name: 'Platelets',            unit: '×10⁹/L',   refRange: '150–400',                  criticalLow: 50,  criticalHigh: 1000 },
      { name: 'PCV/Hematocrit',       unit: '%',         refRange: 'M: 41–53 / F: 36–46' },
      { name: 'MCV',                  unit: 'fL',        refRange: '80–100' },
      { name: 'MCH',                  unit: 'pg',        refRange: '27–33' },
      { name: 'Neutrophils',          unit: '%',         refRange: '50–70' },
      { name: 'Lymphocytes',          unit: '%',         refRange: '20–40' },
      { name: 'Monocytes',            unit: '%',         refRange: '2–8' },
    ],
  },
  'E/U/Cr': {
    label: 'Electrolytes, Urea & Creatinine',
    analytes: [
      { name: 'Sodium (Na⁺)',         unit: 'mEq/L',    refRange: '136–145',  criticalLow: 120, criticalHigh: 160 },
      { name: 'Potassium (K⁺)',       unit: 'mEq/L',    refRange: '3.5–5.0',  criticalLow: 2.5, criticalHigh: 6.5 },
      { name: 'Chloride (Cl⁻)',       unit: 'mEq/L',    refRange: '98–107' },
      { name: 'Bicarbonate (HCO₃⁻)', unit: 'mEq/L',    refRange: '22–29',    criticalLow: 10,  criticalHigh: 40 },
      { name: 'Urea (BUN)',           unit: 'mmol/L',   refRange: '2.5–7.1',  criticalHigh: 35 },
      { name: 'Creatinine',           unit: 'µmol/L',   refRange: 'M: 62–115 / F: 44–97', criticalHigh: 600 },
      { name: 'eGFR',                 unit: 'mL/min/1.73m²', refRange: '>60' },
    ],
  },
  'LFT': {
    label: 'Liver Function Tests (LFT)',
    analytes: [
      { name: 'Total Bilirubin',      unit: 'µmol/L',   refRange: '5–21',      criticalHigh: 200 },
      { name: 'Direct Bilirubin',     unit: 'µmol/L',   refRange: '0–5' },
      { name: 'ALT (SGPT)',           unit: 'U/L',       refRange: 'M: 7–55 / F: 7–45', criticalHigh: 1000 },
      { name: 'AST (SGOT)',           unit: 'U/L',       refRange: '10–40',     criticalHigh: 1000 },
      { name: 'ALP',                  unit: 'U/L',       refRange: '44–147' },
      { name: 'GGT',                  unit: 'U/L',       refRange: 'M: 8–61 / F: 5–36' },
      { name: 'Total Protein',        unit: 'g/dL',      refRange: '6.3–8.2' },
      { name: 'Albumin',              unit: 'g/dL',      refRange: '3.5–5.0',   criticalLow: 2.0 },
    ],
  },
  'LIPID': {
    label: 'Lipid Profile',
    analytes: [
      { name: 'Total Cholesterol',    unit: 'mmol/L',   refRange: '<5.2' },
      { name: 'LDL Cholesterol',      unit: 'mmol/L',   refRange: '<3.4' },
      { name: 'HDL Cholesterol',      unit: 'mmol/L',   refRange: 'M: >1.0 / F: >1.2' },
      { name: 'Triglycerides',        unit: 'mmol/L',   refRange: '<1.7',      criticalHigh: 11.3 },
    ],
  },
  'FBG': {
    label: 'Blood Glucose',
    analytes: [
      { name: 'Fasting Blood Glucose',unit: 'mmol/L',   refRange: '3.9–6.1',  criticalLow: 2.8, criticalHigh: 22.2 },
      { name: 'Random Blood Glucose', unit: 'mmol/L',   refRange: '<7.8' },
      { name: 'HbA1c',               unit: '%',         refRange: '<5.7' },
    ],
  },
  'COAG': {
    label: 'Coagulation Studies',
    analytes: [
      { name: 'PT (Prothrombin Time)',unit: 'seconds',  refRange: '11–13.5',  criticalHigh: 30 },
      { name: 'INR',                  unit: '',          refRange: '0.9–1.1',  criticalHigh: 5 },
      { name: 'aPTT',                unit: 'seconds',  refRange: '25–35',    criticalHigh: 70 },
      { name: 'Fibrinogen',          unit: 'g/L',       refRange: '2.0–4.0',  criticalLow: 1.0 },
    ],
  },
  'UA': {
    label: 'Urinalysis',
    analytes: [
      { name: 'pH',                   unit: '',          refRange: '4.5–8.0' },
      { name: 'Protein',              unit: '',          refRange: 'Negative' },
      { name: 'Glucose',              unit: '',          refRange: 'Negative' },
      { name: 'Ketones',             unit: '',          refRange: 'Negative' },
      { name: 'Nitrites',            unit: '',          refRange: 'Negative' },
      { name: 'Leukocyte Esterase',  unit: '',          refRange: 'Negative' },
      { name: 'RBC',                 unit: '/hpf',      refRange: '0–2' },
      { name: 'WBC',                 unit: '/hpf',      refRange: '0–5' },
    ],
  },
  'CARDIAC': {
    label: 'Cardiac Markers',
    analytes: [
      { name: 'Troponin I / T',      unit: 'ng/mL',    refRange: '<0.04',    criticalHigh: 1.0 },
      { name: 'CK-MB',               unit: 'U/L',       refRange: '<25' },
      { name: 'BNP / NT-proBNP',    unit: 'pg/mL',    refRange: '<100' },
      { name: 'D-Dimer',            unit: 'µg/mL FEU', refRange: '<0.5' },
      { name: 'LDH',                unit: 'U/L',       refRange: '140–280' },
    ],
  },
  'THYROID': {
    label: 'Thyroid Function Tests',
    analytes: [
      { name: 'TSH',                 unit: 'mIU/L',    refRange: '0.4–4.0',  criticalLow: 0.01, criticalHigh: 20 },
      { name: 'Free T4 (fT4)',       unit: 'pmol/L',   refRange: '9–25' },
      { name: 'Free T3 (fT3)',       unit: 'pmol/L',   refRange: '3.5–7.8' },
    ],
  },
  'MALARIA': {
    label: 'Malaria',
    analytes: [
      { name: 'Malaria RDT',         unit: '',          refRange: 'Negative' },
      { name: 'Malaria Parasite (MP)',unit: '',          refRange: 'Not seen' },
      { name: 'Species / Stage',     unit: '',          refRange: '—' },
    ],
  },
  'HIV': {
    label: 'HIV Screening',
    analytes: [
      { name: 'HIV 1/2 Antibody',    unit: '',          refRange: 'Non-reactive' },
      { name: 'HIV Confirmatory',    unit: '',          refRange: 'Non-reactive' },
    ],
  },
};

// Radiology report templates
export const RADIOLOGY_TEMPLATES: Record<string, { label: string; findingsTemplate: string; impressionTemplate: string }> = {
  'chest-xray': {
    label: 'Chest X-Ray (PA/AP)',
    findingsTemplate: `Heart: Normal size and contour. Cardiothoracic ratio: ___/___
Lung fields: Clear bilaterally. No consolidation, collapse, effusion or pneumothorax noted.
Hila: Normal in size and position.
Mediastinum: Normal width.
Costophrenic angles: Sharp bilaterally.
Diaphragm: Normal.
Soft tissues and bones: No abnormality detected.`,
    impressionTemplate: `Normal chest X-ray.`,
  },
  'abdominal-xray': {
    label: 'Abdominal X-Ray (Plain)',
    findingsTemplate: `Gas pattern: Normal bowel gas distribution. No dilated loops.
Solid organs: Liver, spleen and renal outlines within normal limits where visible.
Bones: No acute bony lesion.
Calcifications: None identified.
Soft tissues: No abnormality.`,
    impressionTemplate: `No significant abnormality on plain abdominal radiograph.`,
  },
  'obstetric-us': {
    label: 'Obstetric Ultrasound',
    findingsTemplate: `Gestational age: ___ weeks ___ days (by LMP)
Fetal heart activity: Present / Not detected
Fetal movement: Present / Not detected
Presentation: Cephalic / Breech / Transverse
Placenta: Anterior / Posterior / Fundal / Low-lying. Grade ___
Liquor: Adequate / Oligohydramnios / Polyhydramnios (AFI: ___ cm)
Biometry:
  BPD: ___ mm (EGA: ___ wks)
  HC: ___ mm (EGA: ___ wks)
  AC: ___ mm (EGA: ___ wks)
  FL: ___ mm (EGA: ___ wks)
  EFW: ___ grams
Cervix: Long and closed.
Adnexa: No significant abnormality.`,
    impressionTemplate: `Single live intrauterine fetus in ___ presentation at ___ weeks gestation (consistent with/discordant from LMP).`,
  },
  'pelvic-us': {
    label: 'Pelvic Ultrasound',
    findingsTemplate: `Uterus: Size ___ × ___ × ___ cm. Position: anteverted/retroverted. Myometrium: homogeneous. No fibroid noted.
Endometrium: Thickness ___ mm. Regular.
Right ovary: ___ × ___ cm. No cyst or mass.
Left ovary: ___ × ___ cm. No cyst or mass.
Pouch of Douglas: Free / Collection present.
Bladder: Adequate distension. No abnormality.`,
    impressionTemplate: `Normal pelvic ultrasound findings.`,
  },
  'abdominal-us': {
    label: 'Abdominal Ultrasound',
    findingsTemplate: `Liver: Normal size and echogenicity. No focal lesion.
Gallbladder: Normal. No gallstones. Wall thickness normal.
Common bile duct: Not dilated (diameter ___ mm).
Pancreas: Normal echogenicity. No mass or dilation of pancreatic duct.
Spleen: Normal size and echogenicity.
Kidneys:
  Right: ___ × ___ cm. Normal parenchymal echogenicity. No hydronephrosis.
  Left: ___ × ___ cm. Normal. No hydronephrosis.
Aorta: Normal calibre.
Ascites: None / Present.`,
    impressionTemplate: `Normal abdominal ultrasound. No significant abnormality detected.`,
  },
  'ct-head': {
    label: 'CT Brain (Head)',
    findingsTemplate: `Technique: Non-contrast / Contrast-enhanced CT of the brain.
Brain parenchyma: No abnormal density identified. Grey-white matter differentiation preserved.
Ventricles: Normal size and position.
Sulci and cisterns: Normal.
Midline: No shift.
Bone: No skull fracture.
Soft tissues: No significant abnormality.
Orbits: Normal.
Paranasal sinuses: Clear.`,
    impressionTemplate: `No intracranial hemorrhage, infarct or space-occupying lesion identified.`,
  },
  'ct-chest': {
    label: 'CT Chest',
    findingsTemplate: `Technique: ___ CT of the thorax.
Lung parenchyma: No consolidation, nodule, mass or pleural effusion.
Airways: Patent. No endobronchial lesion.
Mediastinum: No lymphadenopathy. Vascular structures normal.
Pleura: No effusion or thickening.
Chest wall: No abnormality.
Bones: No lytic or sclerotic lesion.
Upper abdomen (visible): No significant abnormality.`,
    impressionTemplate: `No significant intrathoracic abnormality detected.`,
  },
  'echo': {
    label: 'Echocardiogram',
    findingsTemplate: `LV dimensions:
  LVEDD: ___ mm (normal <55mm)
  LVESD: ___ mm
  Ejection Fraction: ___% (Simpson's biplane)
  Wall motion: Normal / Regional wall motion abnormality noted at ___
LV wall thickness:
  Interventricular septum (IVS): ___ mm
  Posterior wall (PW): ___ mm
Right ventricle: Normal size and function.
Left atrium: Normal size (AP diameter ___ mm)
Right atrium: Normal.
Mitral valve: Normal leaflet morphology. No MR/MS.
Aortic valve: Tricuspid. No AS/AR.
Tricuspid valve: No TR/TS of significance.
Pulmonary valve: Normal. Estimated RVSP: ___ mmHg.
Pericardium: No effusion.
IVC: Normal diameter with >50% inspiratory collapse.`,
    impressionTemplate: `Normal left ventricular size and systolic function. EF ___%. No significant valvular disease.`,
  },
};

export const SPECIMEN_TYPES = [
  'Whole Blood (EDTA)',
  'Whole Blood (Heparin)',
  'Whole Blood (Citrate)',
  'Serum (SST)',
  'Plasma',
  'Urine (MSU)',
  'Urine (24-hour)',
  'CSF',
  'Sputum',
  'Swab (HVS)',
  'Swab (Wound)',
  'Swab (Throat)',
  'Swab (Nasal)',
  'Stool (Stool MCS)',
  'Tissue (Biopsy)',
  'BAL (Bronchoalveolar Lavage)',
  'Blood Culture (Aerobic)',
  'Blood Culture (Anaerobic)',
  'Other',
];

export const BENCH_CATEGORIES: Record<string, LabBench> = {
  'FBC': 'hematology', 'PCV': 'hematology', 'Reticulocyte': 'hematology', 'ESR': 'hematology',
  'Sickle Cell': 'hematology', 'G6PD': 'hematology', 'Coagulation': 'hematology',
  'E/U/Cr': 'chemistry', 'LFT': 'chemistry', 'Lipid': 'chemistry', 'Blood Glucose': 'chemistry',
  'Amylase': 'chemistry', 'Lipase': 'chemistry', 'Cardiac Markers': 'chemistry',
  'Thyroid': 'immunology', 'Hormones': 'immunology', 'PSA': 'immunology',
  'HIV': 'serology', 'Hepatitis': 'serology', 'Widal': 'serology', 'VDRL': 'serology',
  'C/S': 'microbiology', 'MCS': 'microbiology', 'AFB': 'microbiology', 'Blood Culture': 'microbiology',
  'Malaria': 'microbiology',
  'Histology': 'histopathology', 'Cytology': 'histopathology', 'FNAC': 'histopathology',
  'PAP Smear': 'histopathology',
};
