import type { InventoryItem } from './types';

export const PHARMACY_STATUS_LABELS: Record<string, string> = {
  pending:          'Pending Review',
  'under-review':   'Under Review',
  verified:         'Verified',
  'safety-cleared': 'Safety Cleared',
  dispensing:       'Dispensing',
  dispensed:        'Dispensed',
  rejected:         'Rejected',
  returned:         'Returned',
  'on-hold':        'On Hold',
};

export const PHARMACY_STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  'under-review':   'bg-blue-100 text-blue-800',
  verified:         'bg-teal-100 text-teal-800',
  'safety-cleared': 'bg-green-100 text-green-700',
  dispensing:       'bg-indigo-100 text-indigo-700',
  dispensed:        'bg-gray-100 text-gray-600',
  rejected:         'bg-red-100 text-red-700',
  returned:         'bg-orange-100 text-orange-700',
  'on-hold':        'bg-amber-100 text-amber-700',
};

export const CONTROLLED_DRUGS = new Set([
  'morphine', 'codeine', 'tramadol', 'fentanyl', 'pethidine', 'meperidine',
  'oxycodone', 'buprenorphine', 'midazolam', 'diazepam', 'nitrazepam',
  'lorazepam', 'clonazepam', 'phenobarbitone', 'phenobarbital',
  'ketamine', 'pentazocine', 'tapentadol', 'alprazolam', 'temazepam',
]);

export const HIGH_ALERT_MEDICATIONS = new Set([
  'insulin', 'heparin', 'warfarin', 'morphine', 'potassium chloride',
  'methotrexate', 'vincristine', 'digoxin', 'amiodarone',
  'thrombolytics', 'concentrated electrolytes', 'neuromuscular blocking',
]);

export interface DrugInteraction {
  drugs: [string, string];
  severity: 'critical' | 'high' | 'moderate';
  message: string;
  recommendation?: string;
}

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  { drugs: ['warfarin', 'aspirin'],      severity: 'critical', message: 'Major bleeding risk — warfarin + aspirin',             recommendation: 'Avoid unless specific clinical indication. Monitor INR.' },
  { drugs: ['warfarin', 'ibuprofen'],    severity: 'critical', message: 'Major bleeding risk — warfarin + NSAID',               recommendation: 'Use paracetamol for analgesia. Avoid NSAIDs.' },
  { drugs: ['warfarin', 'diclofenac'],   severity: 'critical', message: 'Major bleeding risk — warfarin + diclofenac',          recommendation: 'Avoid NSAIDs with warfarin.' },
  { drugs: ['warfarin', 'naproxen'],     severity: 'critical', message: 'Major bleeding risk — warfarin + naproxen',            recommendation: 'Avoid NSAIDs with warfarin.' },
  { drugs: ['warfarin', 'ciprofloxacin'],severity: 'high',     message: 'Ciprofloxacin potentiates warfarin — elevated INR',    recommendation: 'Monitor INR closely. Consider dose reduction.' },
  { drugs: ['warfarin', 'metronidazole'],severity: 'high',     message: 'Metronidazole significantly potentiates warfarin',     recommendation: 'Monitor INR closely. Reduce warfarin dose.' },
  { drugs: ['digoxin', 'amiodarone'],    severity: 'critical', message: 'Amiodarone markedly increases digoxin levels',         recommendation: 'Reduce digoxin dose by 50%. Check digoxin levels.' },
  { drugs: ['digoxin', 'furosemide'],    severity: 'high',     message: 'Furosemide hypokalaemia increases digoxin toxicity',   recommendation: 'Monitor K+ and digoxin levels.' },
  { drugs: ['methotrexate', 'trimethoprim'], severity: 'critical', message: 'Severe bone marrow suppression risk',              recommendation: 'Avoid combination. Use alternative antibiotic.' },
  { drugs: ['gentamicin', 'furosemide'], severity: 'high',     message: 'Additive nephrotoxicity and ototoxicity risk',         recommendation: 'Avoid concurrent use. Monitor renal function.' },
  { drugs: ['gentamicin', 'vancomycin'], severity: 'high',     message: 'Additive nephrotoxicity risk',                        recommendation: 'Monitor renal function. Drug levels required.' },
  { drugs: ['lithium', 'ibuprofen'],     severity: 'high',     message: 'NSAIDs increase lithium levels — toxicity risk',      recommendation: 'Use paracetamol. Monitor lithium levels.' },
  { drugs: ['lithium', 'diclofenac'],    severity: 'high',     message: 'NSAIDs increase lithium levels — toxicity risk',      recommendation: 'Use paracetamol for analgesia.' },
  { drugs: ['simvastatin', 'amiodarone'],severity: 'high',     message: 'Amiodarone increases simvastatin — myopathy risk',    recommendation: 'Max simvastatin 20mg with amiodarone.' },
  { drugs: ['amlodipine', 'simvastatin'],severity: 'moderate', message: 'Amlodipine increases simvastatin exposure',           recommendation: 'Max simvastatin 20mg with amlodipine.' },
  { drugs: ['clopidogrel', 'omeprazole'],severity: 'moderate', message: 'Omeprazole reduces clopidogrel antiplatelet effect',  recommendation: 'Use pantoprazole instead of omeprazole.' },
  { drugs: ['lisinopril', 'spironolactone'], severity: 'high', message: 'Hyperkalaemia risk — ACEi + potassium-sparing diuretic', recommendation: 'Monitor K+ closely.' },
  { drugs: ['ramipril', 'spironolactone'],   severity: 'high', message: 'Hyperkalaemia risk — ACEi + spironolactone',          recommendation: 'Monitor K+ closely.' },
  { drugs: ['tramadol', 'sertraline'],   severity: 'high',     message: 'Serotonin syndrome risk — tramadol + SSRI',           recommendation: 'Monitor for serotonin syndrome. Consider alternative.' },
  { drugs: ['tramadol', 'fluoxetine'],   severity: 'high',     message: 'Serotonin syndrome risk — tramadol + fluoxetine',     recommendation: 'Consider alternative analgesic.' },
  { drugs: ['carbamazepine', 'erythromycin'], severity: 'high', message: 'Erythromycin inhibits carbamazepine metabolism',     recommendation: 'Monitor carbamazepine levels. Consider azithromycin.' },
  { drugs: ['atenolol', 'verapamil'],    severity: 'critical', message: 'Life-threatening bradycardia and heart block',        recommendation: 'Avoid combination.' },
  { drugs: ['metoprolol', 'verapamil'],  severity: 'critical', message: 'Severe bradycardia and AV block risk',               recommendation: 'Avoid especially concurrent IV use.' },
  { drugs: ['phenytoin', 'ciprofloxacin'], severity: 'moderate', message: 'Ciprofloxacin may alter phenytoin levels',         recommendation: 'Monitor phenytoin levels.' },
  { drugs: ['metformin', 'contrast'],    severity: 'high',     message: 'Hold metformin before IV contrast — lactic acidosis',recommendation: 'Withhold metformin 48h before and after contrast.' },
];

export interface RenalDoseAdjustment {
  drug: string;
  severity: 'critical' | 'high' | 'moderate';
  message: string;
}

export const RENAL_DOSE_DRUGS: RenalDoseAdjustment[] = [
  { drug: 'gentamicin',     severity: 'critical', message: 'Renal dose adjustment mandatory. Check eGFR and drug levels.' },
  { drug: 'vancomycin',     severity: 'critical', message: 'Renal dose adjustment mandatory. Check trough levels before 4th dose.' },
  { drug: 'metformin',      severity: 'critical', message: 'Contraindicated if eGFR <30. Reduce dose if eGFR 30–45.' },
  { drug: 'digoxin',        severity: 'high',     message: 'Reduce dose in renal impairment — toxicity risk.' },
  { drug: 'amoxicillin',    severity: 'moderate', message: 'Reduce dose if eGFR <30.' },
  { drug: 'ciprofloxacin',  severity: 'moderate', message: 'Reduce dose in severe renal impairment (eGFR <30).' },
  { drug: 'atenolol',       severity: 'moderate', message: 'Reduce dose if eGFR <35.' },
  { drug: 'spironolactone', severity: 'high',     message: 'Avoid if eGFR <30 — hyperkalaemia risk.' },
  { drug: 'lisinopril',     severity: 'moderate', message: 'Start low, titrate carefully in renal impairment.' },
  { drug: 'ramipril',       severity: 'moderate', message: 'Start low, titrate carefully in renal impairment.' },
  { drug: 'cephalexin',     severity: 'moderate', message: 'Reduce dose if eGFR <30.' },
  { drug: 'cotrimoxazole',  severity: 'high',     message: 'Avoid if eGFR <15. Reduce dose if eGFR 15–30.' },
];

export const DUPLICATE_DRUG_CLASSES: { class: string; drugs: string[]; message: string }[] = [
  { class: 'NSAID',           drugs: ['ibuprofen', 'diclofenac', 'naproxen', 'piroxicam', 'indomethacin', 'ketorolac', 'aspirin', 'mefenamic acid'], message: 'Duplicate NSAID therapy — increased GI bleed and renal risk.' },
  { class: 'Quinolone',       drugs: ['ciprofloxacin', 'levofloxacin', 'moxifloxacin', 'ofloxacin'],                                                 message: 'Duplicate quinolone antibiotic — therapeutic redundancy.' },
  { class: 'ACE Inhibitor',   drugs: ['lisinopril', 'ramipril', 'enalapril', 'captopril', 'perindopril', 'quinapril'],                               message: 'Duplicate ACE inhibitor therapy.' },
  { class: 'Statin',          drugs: ['simvastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin', 'fluvastatin'],                                  message: 'Duplicate statin therapy — myopathy risk.' },
  { class: 'PPI',             drugs: ['omeprazole', 'lansoprazole', 'pantoprazole', 'esomeprazole', 'rabeprazole'],                                  message: 'Duplicate proton pump inhibitor — therapeutic redundancy.' },
  { class: 'Aminoglycoside',  drugs: ['gentamicin', 'amikacin', 'tobramycin', 'netilmicin'],                                                        message: 'Duplicate aminoglycoside — nephrotoxicity and ototoxicity risk.' },
  { class: 'Anticoagulant',   drugs: ['warfarin', 'heparin', 'enoxaparin', 'dalteparin', 'rivaroxaban', 'apixaban', 'dabigatran'],                  message: 'Duplicate anticoagulation — major bleeding risk.' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-1',  drugName: 'Amoxicillin',        genericName: 'Amoxicillin',         form: 'Capsule',   strength: '500mg',    currentStock: 340, unit: 'caps',     minThreshold: 100, reorderLevel: 200, storageCondition: 'room-temp',   isControlled: false, location: 'A-1'  },
  { id: 'inv-2',  drugName: 'Metformin',           genericName: 'Metformin HCl',       form: 'Tablet',    strength: '500mg',    currentStock: 520, unit: 'tabs',     minThreshold: 150, reorderLevel: 300, storageCondition: 'room-temp',   isControlled: false, location: 'A-2'  },
  { id: 'inv-3',  drugName: 'Amlodipine',          genericName: 'Amlodipine besylate', form: 'Tablet',    strength: '5mg',      currentStock: 180, unit: 'tabs',     minThreshold: 60,  reorderLevel: 120, storageCondition: 'room-temp',   isControlled: false, location: 'A-3'  },
  { id: 'inv-4',  drugName: 'Ciprofloxacin',       genericName: 'Ciprofloxacin HCl',   form: 'Tablet',    strength: '500mg',    currentStock: 85,  unit: 'tabs',     minThreshold: 80,  reorderLevel: 160, storageCondition: 'room-temp',   isControlled: false, location: 'A-4', expiryDate: new Date(Date.now() + 25 * 86400000).toISOString() },
  { id: 'inv-5',  drugName: 'Insulin (Regular)',   genericName: 'Soluble insulin',     form: 'Injection', strength: '100IU/mL', currentStock: 12,  unit: 'vials',    minThreshold: 10,  reorderLevel: 20,  storageCondition: 'refrigerated', isControlled: false, location: 'COLD-1' },
  { id: 'inv-6',  drugName: 'Ceftriaxone',         genericName: 'Ceftriaxone sodium',  form: 'Injection', strength: '1g',       currentStock: 28,  unit: 'vials',    minThreshold: 20,  reorderLevel: 40,  storageCondition: 'room-temp',   isControlled: false, location: 'B-1'  },
  { id: 'inv-7',  drugName: 'Morphine Sulphate',   genericName: 'Morphine sulphate',   form: 'Injection', strength: '10mg/mL',  currentStock: 8,   unit: 'ampoules', minThreshold: 5,   reorderLevel: 15,  storageCondition: 'controlled',  isControlled: true,  location: 'CD-1' },
  { id: 'inv-8',  drugName: 'Diazepam',            genericName: 'Diazepam',            form: 'Tablet',    strength: '5mg',      currentStock: 50,  unit: 'tabs',     minThreshold: 20,  reorderLevel: 40,  storageCondition: 'controlled',  isControlled: true,  location: 'CD-2' },
  { id: 'inv-9',  drugName: 'Furosemide',          genericName: 'Furosemide',          form: 'Tablet',    strength: '40mg',     currentStock: 210, unit: 'tabs',     minThreshold: 80,  reorderLevel: 150, storageCondition: 'room-temp',   isControlled: false, location: 'A-5'  },
  { id: 'inv-10', drugName: 'Warfarin',            genericName: 'Warfarin sodium',     form: 'Tablet',    strength: '5mg',      currentStock: 90,  unit: 'tabs',     minThreshold: 40,  reorderLevel: 80,  storageCondition: 'room-temp',   isControlled: false, location: 'A-6'  },
  { id: 'inv-11', drugName: 'Omeprazole',          genericName: 'Omeprazole',          form: 'Capsule',   strength: '20mg',     currentStock: 400, unit: 'caps',     minThreshold: 100, reorderLevel: 200, storageCondition: 'room-temp',   isControlled: false, location: 'A-7'  },
  { id: 'inv-12', drugName: 'Metronidazole',       genericName: 'Metronidazole',       form: 'Tablet',    strength: '400mg',    currentStock: 160, unit: 'tabs',     minThreshold: 60,  reorderLevel: 120, storageCondition: 'room-temp',   isControlled: false, location: 'A-8'  },
  { id: 'inv-13', drugName: 'Salbutamol Inhaler',  genericName: 'Salbutamol',          form: 'Inhaler',   strength: '100mcg',   currentStock: 22,  unit: 'inhalers', minThreshold: 10,  reorderLevel: 20,  storageCondition: 'room-temp',   isControlled: false, location: 'A-9'  },
  { id: 'inv-14', drugName: 'Atorvastatin',        genericName: 'Atorvastatin Ca',     form: 'Tablet',    strength: '40mg',     currentStock: 280, unit: 'tabs',     minThreshold: 80,  reorderLevel: 160, storageCondition: 'room-temp',   isControlled: false, location: 'A-10' },
  { id: 'inv-15', drugName: 'Lisinopril',          genericName: 'Lisinopril',          form: 'Tablet',    strength: '10mg',     currentStock: 45,  unit: 'tabs',     minThreshold: 60,  reorderLevel: 120, storageCondition: 'room-temp',   isControlled: false, location: 'A-11', expiryDate: new Date(Date.now() + 55 * 86400000).toISOString() },
  { id: 'inv-16', drugName: 'Tramadol',            genericName: 'Tramadol HCl',        form: 'Tablet',    strength: '50mg',     currentStock: 30,  unit: 'tabs',     minThreshold: 30,  reorderLevel: 60,  storageCondition: 'controlled',  isControlled: true,  location: 'CD-3' },
  { id: 'inv-17', drugName: 'Ceftazidime',         genericName: 'Ceftazidime',         form: 'Injection', strength: '1g',       currentStock: 6,   unit: 'vials',    minThreshold: 10,  reorderLevel: 20,  storageCondition: 'room-temp',   isControlled: false, location: 'B-2', expiryDate: new Date(Date.now() + 12 * 86400000).toISOString() },
];
