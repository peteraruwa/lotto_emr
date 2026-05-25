export interface MedicationCatalogEntry {
  name: string;
  strength: string;
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Inhaler' | 'Nebulizer Solution' | 'Suppository' | 'Cream' | 'Ointment' | 'Eye Drops' | 'Ear Drops' | 'Suspension' | 'Sachet' | 'Lozenge' | 'Patch';
  route: 'Oral' | 'IV' | 'IM' | 'SC' | 'Inhalation' | 'Topical' | 'Sublingual' | 'Rectal' | 'Ophthalmic' | 'Otic' | 'Intranasal' | 'Transdermal';
  defaultFrequency?: string;
  defaultDuration?: string;
  rxnormCode?: string;
  price: number;
}

export const MEDICATION_CATALOG: MedicationCatalogEntry[] = [
  // ── Antibiotics ───────────────────────────────────────────────────────────
  { name: 'Amoxicillin',                      strength: '250mg',           form: 'Capsule',  route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '7 days',  price: 50   },
  { name: 'Amoxicillin',                      strength: '500mg',           form: 'Capsule',  route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '7 days',  price: 80   },
  { name: 'Co-Amoxiclav (Augmentin)',         strength: '375mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 200  },
  { name: 'Co-Amoxiclav (Augmentin)',         strength: '625mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 280  },
  { name: 'Ciprofloxacin',                    strength: '250mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 120  },
  { name: 'Ciprofloxacin',                    strength: '500mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 180  },
  { name: 'Ciprofloxacin',                    strength: '200mg/100ml',     form: 'Injection', route: 'IV',        defaultFrequency: 'BD',     defaultDuration: '5 days',  price: 1200 },
  { name: 'Metronidazole',                    strength: '200mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '7 days',  price: 40   },
  { name: 'Metronidazole',                    strength: '400mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '7 days',  price: 60   },
  { name: 'Metronidazole',                    strength: '500mg/100ml',     form: 'Injection', route: 'IV',        defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 800  },
  { name: 'Azithromycin',                     strength: '250mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '5 days',  price: 250  },
  { name: 'Azithromycin',                     strength: '500mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '3 days',  price: 380  },
  { name: 'Doxycycline',                      strength: '100mg',           form: 'Capsule',  route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 80   },
  { name: 'Erythromycin',                     strength: '250mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'QID',    defaultDuration: '7 days',  price: 80   },
  { name: 'Cloxacillin',                      strength: '250mg',           form: 'Capsule',  route: 'Oral',       defaultFrequency: 'QID',    defaultDuration: '7 days',  price: 80   },
  { name: 'Flucloxacillin',                   strength: '500mg',           form: 'Capsule',  route: 'Oral',       defaultFrequency: 'QID',    defaultDuration: '7 days',  price: 120  },
  { name: 'Ceftriaxone',                      strength: '250mg',           form: 'Injection', route: 'IV',        defaultFrequency: 'OD',     defaultDuration: '5 days',  price: 600  },
  { name: 'Ceftriaxone',                      strength: '1g',              form: 'Injection', route: 'IV',        defaultFrequency: 'OD',     defaultDuration: '5 days',  price: 1200 },
  { name: 'Gentamicin',                       strength: '80mg/2ml',        form: 'Injection', route: 'IM',        defaultFrequency: 'BD',     defaultDuration: '5 days',  price: 350  },
  { name: 'Nitrofurantoin',                   strength: '50mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'QID',    defaultDuration: '7 days',  price: 80   },
  { name: 'Co-trimoxazole',                   strength: '480mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 60   },
  { name: 'Clarithromycin',                   strength: '500mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 350  },

  // ── Analgesics / Anti-inflammatory ────────────────────────────────────────
  { name: 'Paracetamol',                      strength: '500mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 25   },
  { name: 'Paracetamol',                      strength: '1g',              form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 60   },
  { name: 'Paracetamol',                      strength: '125mg/5ml',       form: 'Syrup',    route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 200  },
  { name: 'Ibuprofen',                        strength: '200mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 35   },
  { name: 'Ibuprofen',                        strength: '400mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 50   },
  { name: 'Diclofenac',                       strength: '50mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '5 days',  price: 60   },
  { name: 'Diclofenac',                       strength: '75mg',            form: 'Injection', route: 'IM',        defaultFrequency: 'OD',     defaultDuration: '3 days',  price: 250  },
  { name: 'Tramadol',                         strength: '50mg',            form: 'Capsule',  route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '5 days',  price: 80   },
  { name: 'Tramadol',                         strength: '100mg/2ml',       form: 'Injection', route: 'IV',        defaultFrequency: 'BD',     defaultDuration: '3 days',  price: 400  },
  { name: 'Morphine',                         strength: '10mg/ml',         form: 'Injection', route: 'IV',        defaultFrequency: 'PRN',    defaultDuration: 'As needed', price: 800 },
  { name: 'Pethidine',                        strength: '100mg/2ml',       form: 'Injection', route: 'IM',        defaultFrequency: 'PRN',    defaultDuration: 'As needed', price: 600 },
  { name: 'Aspirin',                          strength: '75mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 30   },
  { name: 'Aspirin',                          strength: '300mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',                                 price: 50   },
  { name: 'Celecoxib',                        strength: '200mg',           form: 'Capsule',  route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '7 days',  price: 180  },
  { name: 'Naproxen',                         strength: '250mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 100  },

  // ── Antimalarials ─────────────────────────────────────────────────────────
  { name: 'Artemether/Lumefantrine (Coartem)', strength: '20mg/120mg',     form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '3 days',  price: 850  },
  { name: 'Artesunate',                        strength: '50mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '3 days',  price: 300  },
  { name: 'Artesunate',                        strength: '120mg',          form: 'Injection', route: 'IV',        defaultFrequency: 'TDS on day 1, then OD', defaultDuration: '3 days', price: 2500 },
  { name: 'Chloroquine',                       strength: '250mg',          form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '3 days',  price: 50   },
  { name: 'Fansidar (Sulfadoxine/Pyrimethamine)', strength: '500mg/25mg',  form: 'Tablet',   route: 'Oral',       defaultFrequency: 'Stat',                               price: 200  },
  { name: 'Quinine',                           strength: '300mg',          form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '7 days',  price: 150  },
  { name: 'Quinine',                           strength: '300mg/ml',       form: 'Injection', route: 'IV',        defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 800  },

  // ── Antihypertensives ─────────────────────────────────────────────────────
  { name: 'Amlodipine',                       strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 80   },
  { name: 'Amlodipine',                       strength: '10mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 120  },
  { name: 'Lisinopril',                       strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 100  },
  { name: 'Lisinopril',                       strength: '10mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 150  },
  { name: 'Enalapril',                        strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 80   },
  { name: 'Losartan',                         strength: '50mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 150  },
  { name: 'Atenolol',                         strength: '50mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 80   },
  { name: 'Metoprolol',                       strength: '50mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 120  },
  { name: 'Hydrochlorothiazide',              strength: '25mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 40   },
  { name: 'Furosemide',                       strength: '40mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 50   },
  { name: 'Furosemide',                       strength: '20mg/2ml',        form: 'Injection', route: 'IV',        defaultFrequency: 'BD',     defaultDuration: '5 days',  price: 150  },
  { name: 'Spironolactone',                   strength: '25mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 150  },
  { name: 'Nifedipine',                       strength: '10mg',            form: 'Capsule',  route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: 'Ongoing', price: 50   },
  { name: 'Methyldopa',                       strength: '250mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 100  },
  { name: 'Hydralazine',                      strength: '25mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 80   },

  // ── Diabetes ──────────────────────────────────────────────────────────────
  { name: 'Metformin',                        strength: '500mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 80   },
  { name: 'Metformin',                        strength: '850mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 120  },
  { name: 'Glibenclamide',                    strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 50   },
  { name: 'Glimepiride',                      strength: '2mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 150  },
  { name: 'Insulin Regular',                  strength: '100IU/ml',        form: 'Injection', route: 'SC',        defaultFrequency: 'TDS',    defaultDuration: 'Ongoing', price: 3500 },
  { name: 'Insulin NPH (Isophane)',           strength: '100IU/ml',        form: 'Injection', route: 'SC',        defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 4000 },
  { name: 'Insulin Glargine (Lantus)',        strength: '100IU/ml',        form: 'Injection', route: 'SC',        defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 8500 },

  // ── GI / Antiemetics ─────────────────────────────────────────────────────
  { name: 'Omeprazole',                       strength: '20mg',            form: 'Capsule',  route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '14 days', price: 80   },
  { name: 'Omeprazole',                       strength: '40mg',            form: 'Capsule',  route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '14 days', price: 120  },
  { name: 'Ranitidine',                       strength: '150mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '14 days', price: 60   },
  { name: 'Metoclopramide',                   strength: '10mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 50   },
  { name: 'Metoclopramide',                   strength: '10mg/2ml',        form: 'Injection', route: 'IV',        defaultFrequency: 'TDS',    defaultDuration: '3 days',  price: 150  },
  { name: 'Ondansetron',                      strength: '4mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '5 days',  price: 250  },
  { name: 'Ondansetron',                      strength: '4mg/2ml',         form: 'Injection', route: 'IV',        defaultFrequency: 'BD',     defaultDuration: '3 days',  price: 600  },
  { name: 'Domperidone',                      strength: '10mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 100  },
  { name: 'Hyoscine Butylbromide (Buscopan)', strength: '10mg',            form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '5 days',  price: 80   },
  { name: 'Hyoscine Butylbromide (Buscopan)', strength: '20mg/ml',         form: 'Injection', route: 'IV',        defaultFrequency: 'TDS',    defaultDuration: '3 days',  price: 350  },
  { name: 'Loperamide',                       strength: '2mg',             form: 'Capsule',  route: 'Oral',       defaultFrequency: 'PRN',    defaultDuration: '3 days',  price: 80   },

  // ── Vitamins / Supplements ────────────────────────────────────────────────
  { name: 'Folic Acid',                       strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '90 days', price: 25   },
  { name: 'Folic Acid',                       strength: '400mcg',          form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '90 days', price: 50   },
  { name: 'Ferrous Sulfate',                  strength: '200mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '90 days', price: 40   },
  { name: 'Ferrous Gluconate',                strength: '300mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '90 days', price: 50   },
  { name: 'Vitamin C',                        strength: '200mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '30 days', price: 40   },
  { name: 'Vitamin B Complex',                strength: '',                form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '30 days', price: 30   },
  { name: 'Calcium',                          strength: '500mg',           form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '30 days', price: 100  },
  { name: 'Calcium + Vitamin D3',             strength: '500mg/200IU',     form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: '30 days', price: 150  },

  // ── Respiratory ───────────────────────────────────────────────────────────
  { name: 'Salbutamol (Ventolin)',            strength: '100mcg/dose',     form: 'Inhaler',  route: 'Inhalation', defaultFrequency: 'PRN',                                price: 2500 },
  { name: 'Salbutamol',                       strength: '2mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'TDS',    defaultDuration: '7 days',  price: 50   },
  { name: 'Salbutamol Nebules',               strength: '2.5mg/2.5ml',     form: 'Nebulizer Solution', route: 'Inhalation', defaultFrequency: 'TDS',  defaultDuration: '5 days', price: 500 },
  { name: 'Beclomethasone',                   strength: '100mcg/dose',     form: 'Inhaler',  route: 'Inhalation', defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 3500 },
  { name: 'Budesonide',                       strength: '200mcg/dose',     form: 'Inhaler',  route: 'Inhalation', defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 4500 },
  { name: 'Prednisolone',                     strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: '5 days',  price: 60   },
  { name: 'Hydrocortisone',                   strength: '100mg',           form: 'Injection', route: 'IV',        defaultFrequency: 'BD',     defaultDuration: '3 days',  price: 600  },

  // ── Antiretrovirals ───────────────────────────────────────────────────────
  { name: 'Tenofovir/Lamivudine/Efavirenz (TLE)', strength: '300/300/600mg', form: 'Tablet', route: 'Oral',      defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 3500 },
  { name: 'Zidovudine/Lamivudine (AZT/3TC)',  strength: '300/150mg',       form: 'Tablet',   route: 'Oral',       defaultFrequency: 'BD',     defaultDuration: 'Ongoing', price: 2500 },

  // ── Anticoagulants ────────────────────────────────────────────────────────
  { name: 'Heparin',                          strength: '5000IU/ml',       form: 'Injection', route: 'SC',        defaultFrequency: 'BD',     defaultDuration: '7 days',  price: 1200 },
  { name: 'Warfarin',                         strength: '5mg',             form: 'Tablet',   route: 'Oral',       defaultFrequency: 'OD',     defaultDuration: 'Ongoing', price: 120  },
  { name: 'Enoxaparin (Clexane)',             strength: '40mg/0.4ml',      form: 'Injection', route: 'SC',        defaultFrequency: 'OD',     defaultDuration: '7 days',  price: 3500 },

  // ── Electrolytes / IV fluids ──────────────────────────────────────────────
  { name: '0.9% Normal Saline',               strength: '500ml',           form: 'Injection', route: 'IV',        defaultFrequency: 'Continuous',                         price: 800  },
  { name: '5% Dextrose',                      strength: '500ml',           form: 'Injection', route: 'IV',        defaultFrequency: 'Continuous',                         price: 800  },
  { name: 'Ringer\'s Lactate',               strength: '500ml',           form: 'Injection', route: 'IV',        defaultFrequency: 'Continuous',                         price: 900  },
  { name: 'Potassium Chloride (KCl)',         strength: '7.5%/10ml',       form: 'Injection', route: 'IV',        defaultFrequency: 'PRN',                                price: 200  },
];

export const MEDICATION_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Nebulizer Solution', 'Suppository', 'Cream', 'Ointment', 'Eye Drops', 'Ear Drops', 'Suspension', 'Sachet'] as const;
export const MEDICATION_ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Inhalation', 'Topical', 'Sublingual', 'Rectal', 'Ophthalmic', 'Otic', 'Intranasal', 'Transdermal'] as const;
export const MEDICATION_FREQUENCIES = ['OD', 'BD', 'TDS', 'QID', 'PRN', 'Stat', 'Weekly', 'Fortnightly', 'Monthly', 'Nocte', 'Mane', 'Continuous'] as const;
