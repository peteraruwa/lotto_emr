export interface LabTestEntry {
  name: string;
  category: 'Hematology' | 'Chemistry' | 'Microbiology' | 'Serology' | 'Hormones' | 'Coagulation' | 'Urinalysis' | 'Other';
  loincCode?: string;
  price: number;
}

export const LAB_CATALOG: LabTestEntry[] = [
  // ── Hematology ────────────────────────────────────────────────────────────
  { name: 'Full Blood Count (FBC)',                    category: 'Hematology',    loincCode: '58410-2',  price: 3500 },
  { name: 'Packed Cell Volume (PCV)',                   category: 'Hematology',    loincCode: '20570-8',  price: 1500 },
  { name: 'Erythrocyte Sedimentation Rate (ESR)',      category: 'Hematology',    loincCode: '30341-2',  price: 1500 },
  { name: 'Peripheral Blood Film',                     category: 'Hematology',                           price: 2000 },
  { name: 'Malaria RDT',                               category: 'Hematology',    loincCode: '32700-7',  price: 1500 },
  { name: 'Malaria Thick & Thin Film',                 category: 'Hematology',                           price: 2000 },
  { name: 'Reticulocyte Count',                        category: 'Hematology',                           price: 2000 },
  { name: 'Sickling Test',                             category: 'Hematology',                           price: 1500 },
  { name: 'G6PD Screening',                            category: 'Hematology',                           price: 3500 },
  { name: 'Blood Group & Genotype',                    category: 'Hematology',                           price: 2500 },

  // ── Chemistry ─────────────────────────────────────────────────────────────
  { name: 'Fasting Blood Glucose',                     category: 'Chemistry',     loincCode: '1558-6',   price: 1500 },
  { name: 'Random Blood Glucose',                      category: 'Chemistry',     loincCode: '2345-7',   price: 1500 },
  { name: '2-Hour Post Prandial Glucose',              category: 'Chemistry',                            price: 1500 },
  { name: 'HbA1c (Glycated Haemoglobin)',              category: 'Chemistry',     loincCode: '4548-4',   price: 6500 },
  { name: 'Urea & Electrolytes (U&E)',                 category: 'Chemistry',                            price: 5000 },
  { name: 'Serum Creatinine',                          category: 'Chemistry',     loincCode: '2160-0',   price: 2500 },
  { name: 'eGFR (Estimated GFR)',                      category: 'Chemistry',                            price: 3000 },
  { name: 'Liver Function Test (LFT)',                 category: 'Chemistry',                            price: 6500 },
  { name: 'ALT (SGPT)',                                category: 'Chemistry',     loincCode: '1742-6',   price: 2500 },
  { name: 'AST (SGOT)',                                category: 'Chemistry',                            price: 2500 },
  { name: 'Alkaline Phosphatase (ALP)',                category: 'Chemistry',                            price: 2500 },
  { name: 'Total & Direct Bilirubin',                  category: 'Chemistry',                            price: 2500 },
  { name: 'Total Protein & Albumin',                   category: 'Chemistry',                            price: 2500 },
  { name: 'Lipid Profile',                             category: 'Chemistry',                            price: 8000 },
  { name: 'Total Cholesterol',                         category: 'Chemistry',                            price: 2500 },
  { name: 'C-Reactive Protein (CRP)',                  category: 'Chemistry',     loincCode: '1988-5',   price: 4000 },
  { name: 'Serum Uric Acid',                           category: 'Chemistry',                            price: 2500 },
  { name: 'Serum Amylase',                             category: 'Chemistry',                            price: 3500 },
  { name: 'Serum Calcium',                             category: 'Chemistry',                            price: 2500 },
  { name: 'Serum Iron Studies',                        category: 'Chemistry',                            price: 5500 },
  { name: 'Serum Magnesium',                           category: 'Chemistry',                            price: 2500 },

  // ── Microbiology ──────────────────────────────────────────────────────────
  { name: 'Urine Culture & Sensitivity',               category: 'Microbiology',                         price: 5500 },
  { name: 'Blood Culture & Sensitivity',               category: 'Microbiology',                         price: 7500 },
  { name: 'HVS Culture & Sensitivity',                 category: 'Microbiology',                         price: 5500 },
  { name: 'Wound Swab Culture & Sensitivity',          category: 'Microbiology',                         price: 5500 },
  { name: 'Sputum AFB Smear & Culture',                category: 'Microbiology',                         price: 5000 },
  { name: 'Stool Microscopy, Culture & Sensitivity',   category: 'Microbiology',                         price: 4500 },
  { name: 'Ear Swab C&S',                              category: 'Microbiology',                         price: 4500 },
  { name: 'Throat Swab C&S',                           category: 'Microbiology',                         price: 4500 },

  // ── Serology ──────────────────────────────────────────────────────────────
  { name: 'HIV 1 & 2 Antibody (Rapid)',                category: 'Serology',                             price: 1500 },
  { name: 'HIV Confirmatory Test',                     category: 'Serology',                             price: 5000 },
  { name: 'HBsAg (Hepatitis B Surface Antigen)',       category: 'Serology',                             price: 2000 },
  { name: 'Anti-HCV (Hepatitis C Antibody)',           category: 'Serology',                             price: 3500 },
  { name: 'VDRL / RPR (Syphilis Screening)',           category: 'Serology',                             price: 1500 },
  { name: 'TPHA (Syphilis Confirmatory)',              category: 'Serology',                             price: 3500 },
  { name: 'Typhoid IgM/IgG Rapid Test',               category: 'Serology',                             price: 2500 },
  { name: 'Widal Test',                                category: 'Serology',                             price: 2000 },
  { name: 'Brucella Agglutination Test',               category: 'Serology',                             price: 3500 },
  { name: 'ASO Titre',                                 category: 'Serology',                             price: 3500 },
  { name: 'Rheumatoid Factor (RF)',                    category: 'Serology',                             price: 3500 },

  // ── Hormones ──────────────────────────────────────────────────────────────
  { name: 'TSH (Thyroid Stimulating Hormone)',         category: 'Hormones',                             price: 4500 },
  { name: 'Free T3',                                   category: 'Hormones',                             price: 3500 },
  { name: 'Free T4',                                   category: 'Hormones',                             price: 3500 },
  { name: 'Thyroid Panel (TSH + FT3 + FT4)',          category: 'Hormones',                             price: 9000 },
  { name: 'Serum Prolactin',                           category: 'Hormones',                             price: 4500 },
  { name: 'FSH (Follicle Stimulating Hormone)',        category: 'Hormones',                             price: 4500 },
  { name: 'LH (Luteinizing Hormone)',                  category: 'Hormones',                             price: 4500 },
  { name: 'Serum Testosterone',                        category: 'Hormones',                             price: 5000 },
  { name: 'Serum Progesterone',                        category: 'Hormones',                             price: 5000 },
  { name: 'Serum Estradiol (E2)',                      category: 'Hormones',                             price: 5000 },
  { name: 'Beta-hCG (Quantitative Pregnancy Test)',    category: 'Hormones',                             price: 5500 },
  { name: 'PSA (Prostate Specific Antigen)',           category: 'Hormones',                             price: 5500 },
  { name: 'CA-125 (Tumour Marker)',                    category: 'Hormones',                             price: 8500 },
  { name: 'CEA (Carcinoembryonic Antigen)',            category: 'Hormones',                             price: 8500 },

  // ── Coagulation ───────────────────────────────────────────────────────────
  { name: 'Prothrombin Time (PT / INR)',               category: 'Coagulation',                          price: 3500 },
  { name: 'aPTT (Activated Partial Thromboplastin)',   category: 'Coagulation',                          price: 3500 },
  { name: 'D-Dimer',                                   category: 'Coagulation',                          price: 7500 },
  { name: 'Bleeding Time (BT)',                        category: 'Coagulation',                          price: 1500 },
  { name: 'Clotting Time (CT)',                        category: 'Coagulation',                          price: 1500 },

  // ── Urinalysis ────────────────────────────────────────────────────────────
  { name: 'Urinalysis (Dipstick + Microscopy)',        category: 'Urinalysis',                           price: 2000 },
  { name: 'Urine Pregnancy Test (UPT)',                category: 'Urinalysis',                           price: 1000 },
  { name: 'Urine Protein',                             category: 'Urinalysis',                           price: 1500 },
  { name: '24-Hour Urine Protein',                     category: 'Urinalysis',                           price: 4000 },
  { name: 'Urine Microalbumin',                        category: 'Urinalysis',                           price: 4000 },
];

export const LAB_CATEGORIES = ['Hematology', 'Chemistry', 'Microbiology', 'Serology', 'Hormones', 'Coagulation', 'Urinalysis', 'Other'] as const;
