export interface ImagingEntry {
  name: string;
  modality: 'X-Ray' | 'Ultrasound' | 'CT Scan' | 'MRI' | 'Mammography' | 'Fluoroscopy' | 'Nuclear Medicine' | 'PET Scan';
  defaultBodySite?: string;
  snomedCode?: string;
  price: number;
}

export const IMAGING_CATALOG: ImagingEntry[] = [
  // ── X-Ray ─────────────────────────────────────────────────────────────────
  { name: 'Chest X-Ray (PA view)',               modality: 'X-Ray',      defaultBodySite: 'Chest',           snomedCode: '399208008', price: 8500  },
  { name: 'Chest X-Ray (Lateral view)',          modality: 'X-Ray',      defaultBodySite: 'Chest',                                    price: 9000  },
  { name: 'Chest X-Ray (PA + Lateral)',          modality: 'X-Ray',      defaultBodySite: 'Chest',                                    price: 12000 },
  { name: 'Skull X-Ray (AP / Lateral)',          modality: 'X-Ray',      defaultBodySite: 'Skull',                                    price: 8500  },
  { name: 'Cervical Spine X-Ray',               modality: 'X-Ray',      defaultBodySite: 'Cervical Spine',                           price: 10000 },
  { name: 'Thoracic Spine X-Ray',               modality: 'X-Ray',      defaultBodySite: 'Thoracic Spine',                           price: 10000 },
  { name: 'Lumbar Spine X-Ray (AP / Lateral)',  modality: 'X-Ray',      defaultBodySite: 'Lumbar Spine',                             price: 10000 },
  { name: 'Pelvis X-Ray',                        modality: 'X-Ray',      defaultBodySite: 'Pelvis',                                   price: 10000 },
  { name: 'Hip X-Ray',                           modality: 'X-Ray',      defaultBodySite: 'Hip',                                      price: 10000 },
  { name: 'Knee X-Ray (AP / Lateral)',          modality: 'X-Ray',      defaultBodySite: 'Knee',                                     price: 9000  },
  { name: 'Ankle X-Ray',                         modality: 'X-Ray',      defaultBodySite: 'Ankle',                                    price: 9000  },
  { name: 'Foot X-Ray',                          modality: 'X-Ray',      defaultBodySite: 'Foot',                                     price: 9000  },
  { name: 'Wrist X-Ray',                         modality: 'X-Ray',      defaultBodySite: 'Wrist',                                    price: 9000  },
  { name: 'Hand X-Ray',                          modality: 'X-Ray',      defaultBodySite: 'Hand',                                     price: 9000  },
  { name: 'Forearm X-Ray',                       modality: 'X-Ray',      defaultBodySite: 'Forearm',                                  price: 9000  },
  { name: 'Abdomen X-Ray (Erect / Supine)',     modality: 'X-Ray',      defaultBodySite: 'Abdomen',                                  price: 10000 },
  { name: 'Paranasal Sinuses X-Ray',            modality: 'X-Ray',      defaultBodySite: 'Paranasal Sinuses',                        price: 9000  },

  // ── Ultrasound ────────────────────────────────────────────────────────────
  { name: 'Abdominal Ultrasound',                modality: 'Ultrasound', defaultBodySite: 'Abdomen',                                  price: 12000 },
  { name: 'Pelvic Ultrasound (Female)',         modality: 'Ultrasound', defaultBodySite: 'Pelvis',                                   price: 12000 },
  { name: 'Obstetric / Dating Scan',            modality: 'Ultrasound', defaultBodySite: 'Uterus',                                   price: 12000 },
  { name: 'Anomaly Scan (18–22 weeks)',         modality: 'Ultrasound', defaultBodySite: 'Foetus',                                   price: 18000 },
  { name: 'Renal / Urinary Tract Ultrasound',  modality: 'Ultrasound', defaultBodySite: 'Kidney',                                   price: 12000 },
  { name: 'Thyroid Ultrasound',                  modality: 'Ultrasound', defaultBodySite: 'Thyroid',                                  price: 12000 },
  { name: 'Breast Ultrasound',                   modality: 'Ultrasound', defaultBodySite: 'Breast',                                   price: 12000 },
  { name: 'Scrotal Ultrasound',                  modality: 'Ultrasound', defaultBodySite: 'Scrotum',                                  price: 12000 },
  { name: 'Doppler Flow Studies',                modality: 'Ultrasound', defaultBodySite: 'Vascular',                                 price: 18000 },
  { name: 'Soft Tissue Ultrasound',              modality: 'Ultrasound', defaultBodySite: 'Soft Tissue',                              price: 12000 },
  { name: 'Echocardiography (ECHO)',            modality: 'Ultrasound', defaultBodySite: 'Heart',                                    price: 25000 },
  { name: 'Abdominopelvic Ultrasound',           modality: 'Ultrasound', defaultBodySite: 'Abdomen & Pelvis',                         price: 15000 },

  // ── CT Scan ───────────────────────────────────────────────────────────────
  { name: 'CT Head (Plain)',                     modality: 'CT Scan',    defaultBodySite: 'Head',                                     price: 60000  },
  { name: 'CT Head with Contrast',              modality: 'CT Scan',    defaultBodySite: 'Head',                                     price: 75000  },
  { name: 'CT Chest (HRCT)',                    modality: 'CT Scan',    defaultBodySite: 'Chest',                                    price: 75000  },
  { name: 'CT Abdomen & Pelvis',               modality: 'CT Scan',    defaultBodySite: 'Abdomen & Pelvis',                         price: 90000  },
  { name: 'CT Chest, Abdomen & Pelvis',        modality: 'CT Scan',    defaultBodySite: 'Chest/Abdomen/Pelvis',                     price: 120000 },
  { name: 'CT Spine (Cervical)',               modality: 'CT Scan',    defaultBodySite: 'Cervical Spine',                           price: 75000  },
  { name: 'CT Spine (Lumbar)',                 modality: 'CT Scan',    defaultBodySite: 'Lumbar Spine',                             price: 75000  },
  { name: 'CT Paranasal Sinuses',              modality: 'CT Scan',    defaultBodySite: 'Paranasal Sinuses',                        price: 65000  },
  { name: 'CT Angiography (Coronary)',         modality: 'CT Scan',    defaultBodySite: 'Coronary Arteries',                        price: 150000 },

  // ── MRI ───────────────────────────────────────────────────────────────────
  { name: 'MRI Brain (Plain)',                  modality: 'MRI',        defaultBodySite: 'Brain',                                    price: 80000  },
  { name: 'MRI Brain with Contrast',           modality: 'MRI',        defaultBodySite: 'Brain',                                    price: 100000 },
  { name: 'MRI Spine (Cervical)',              modality: 'MRI',        defaultBodySite: 'Cervical Spine',                           price: 90000  },
  { name: 'MRI Spine (Lumbar)',               modality: 'MRI',        defaultBodySite: 'Lumbar Spine',                             price: 90000  },
  { name: 'MRI Spine (Thoracic)',             modality: 'MRI',        defaultBodySite: 'Thoracic Spine',                           price: 90000  },
  { name: 'MRI Knee',                          modality: 'MRI',        defaultBodySite: 'Knee',                                     price: 85000  },
  { name: 'MRI Shoulder',                      modality: 'MRI',        defaultBodySite: 'Shoulder',                                 price: 85000  },
  { name: 'MRI Abdomen',                        modality: 'MRI',        defaultBodySite: 'Abdomen',                                  price: 100000 },
  { name: 'MRI Pelvis',                         modality: 'MRI',        defaultBodySite: 'Pelvis',                                   price: 100000 },

  // ── Mammography ───────────────────────────────────────────────────────────
  { name: 'Mammography (Bilateral)',            modality: 'Mammography', defaultBodySite: 'Bilateral Breasts',                       price: 20000 },
  { name: 'Mammography (Unilateral)',           modality: 'Mammography', defaultBodySite: 'Breast',                                  price: 15000 },
];

export const IMAGING_MODALITIES = ['X-Ray', 'Ultrasound', 'CT Scan', 'MRI', 'Mammography', 'Fluoroscopy', 'Nuclear Medicine', 'PET Scan'] as const;
