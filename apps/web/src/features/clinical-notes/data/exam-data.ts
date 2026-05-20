// ── Exam module types ──────────────────────────────────────────────────────────
export interface ExamOption {
  category: string;
  type: 'single_select' | 'multi_select';
  options: string[];
  default?: string;           // for single_select
  default_selected?: string[]; // for multi_select
}

export interface ExamModule {
  id: string;
  label: string;
  items: ExamOption[];
}

// ── Clinical examination data ──────────────────────────────────────────────────
export const EXAM_MODULES: ExamModule[] = [
  {
    id: 'general_examination',
    label: 'General Examination',
    items: [
      {
        category: 'Consciousness',
        type: 'single_select',
        options: ['Conscious', 'Drowsy', 'Confused', 'Unconscious'],
        default: 'Conscious',
      },
      {
        category: 'Distress',
        type: 'single_select',
        options: ['Not in distress', 'Mild distress', 'Moderate distress', 'Severe distress'],
        default: 'Not in distress',
      },
      {
        category: 'General Appearance',
        type: 'multi_select',
        options: [
          'Not pale',
          'Pale',
          'Not jaundiced',
          'Jaundiced',
          'Not cyanosed',
          'Cyanosed (peripheral)',
          'Cyanosed (central)',
          'Afebrile',
          'Febrile',
          'Not dehydrated',
          'Mildly dehydrated',
          'Severely dehydrated',
          'No pedal oedema',
          'Pedal oedema present',
          'No peripheral lymphadenopathy',
          'Peripheral lymphadenopathy present',
        ],
        default_selected: [
          'Not pale',
          'Not jaundiced',
          'Not cyanosed',
          'Afebrile',
          'Not dehydrated',
          'No pedal oedema',
          'No peripheral lymphadenopathy',
        ],
      },
    ],
  },
  {
    id: 'cardiovascular_system',
    label: 'Cardiovascular System',
    items: [
      {
        category: 'Pulse',
        type: 'single_select',
        options: ['Regular', 'Irregularly irregular', 'Regularly irregular'],
        default: 'Regular',
      },
      {
        category: 'Pulse Volume',
        type: 'single_select',
        options: ['Normal volume', 'Low volume', 'High volume'],
        default: 'Normal volume',
      },
      {
        category: 'JVP',
        type: 'single_select',
        options: ['Not elevated', 'Elevated'],
        default: 'Not elevated',
      },
      {
        category: 'Heart Sounds',
        type: 'single_select',
        options: [
          'S1 and S2 heard, no added sounds',
          'S1 and S2 heard with S3',
          'S1 and S2 heard with S4',
          'Muffled heart sounds',
        ],
        default: 'S1 and S2 heard, no added sounds',
      },
      {
        category: 'Murmurs',
        type: 'single_select',
        options: ['No murmurs', 'Systolic murmur', 'Diastolic murmur', 'Continuous murmur'],
        default: 'No murmurs',
      },
      {
        category: 'Peripheral Pulses',
        type: 'single_select',
        options: [
          'Peripheral pulses present bilaterally',
          'Peripheral pulses reduced',
          'Peripheral pulses absent',
        ],
        default: 'Peripheral pulses present bilaterally',
      },
    ],
  },
  {
    id: 'respiratory_system',
    label: 'Respiratory System',
    items: [
      {
        category: 'Respiratory Rate',
        type: 'single_select',
        options: [
          'Normal (12–20/min)',
          'Tachypnoeic (>20/min)',
          'Bradypnoeic (<12/min)',
        ],
        default: 'Normal (12–20/min)',
      },
      {
        category: 'Chest Expansion',
        type: 'single_select',
        options: [
          'Symmetrical',
          'Reduced on right',
          'Reduced on left',
          'Reduced bilaterally',
        ],
        default: 'Symmetrical',
      },
      {
        category: 'Trachea',
        type: 'single_select',
        options: ['Central', 'Deviated to right', 'Deviated to left'],
        default: 'Central',
      },
      {
        category: 'Percussion Note',
        type: 'single_select',
        options: [
          'Resonant bilaterally',
          'Dull on right',
          'Dull on left',
          'Hyper-resonant',
        ],
        default: 'Resonant bilaterally',
      },
      {
        category: 'Air Entry',
        type: 'single_select',
        options: [
          'Equal bilaterally',
          'Reduced on right',
          'Reduced on left',
          'Absent on right',
          'Absent on left',
        ],
        default: 'Equal bilaterally',
      },
      {
        category: 'Breath Sounds',
        type: 'single_select',
        options: [
          'Vesicular breath sounds',
          'Bronchial breathing',
          'Reduced breath sounds',
        ],
        default: 'Vesicular breath sounds',
      },
      {
        category: 'Added Sounds',
        type: 'multi_select',
        options: [
          'No added sounds',
          'Fine crackles',
          'Coarse crackles',
          'Wheeze',
          'Pleural rub',
        ],
        default_selected: ['No added sounds'],
      },
    ],
  },
  {
    id: 'abdomen',
    label: 'Abdomen',
    items: [
      {
        category: 'Shape',
        type: 'single_select',
        options: ['Flat', 'Scaphoid', 'Distended', 'Protuberant'],
        default: 'Flat',
      },
      {
        category: 'Tenderness',
        type: 'single_select',
        options: [
          'No tenderness',
          'Right upper quadrant tenderness',
          'Left upper quadrant tenderness',
          'Right lower quadrant tenderness',
          'Left lower quadrant tenderness',
          'Central tenderness',
          'Generalised tenderness',
          'Guarding present',
          'Rigidity present',
        ],
        default: 'No tenderness',
      },
      {
        category: 'Liver',
        type: 'single_select',
        options: [
          'Not palpable',
          'Hepatomegaly — 2cm below costal margin',
          'Hepatomegaly — 4cm below costal margin',
          'Hepatomegaly — >4cm below costal margin',
          'Tender hepatomegaly',
        ],
        default: 'Not palpable',
      },
      {
        category: 'Spleen',
        type: 'single_select',
        options: [
          'Not palpable',
          'Splenomegaly — mild',
          'Splenomegaly — moderate',
          'Massive splenomegaly',
        ],
        default: 'Not palpable',
      },
      {
        category: 'Kidneys',
        type: 'single_select',
        options: [
          'Not ballotable',
          'Right kidney ballotable',
          'Left kidney ballotable',
          'Bilateral kidneys ballotable',
        ],
        default: 'Not ballotable',
      },
      {
        category: 'Bowel Sounds',
        type: 'single_select',
        options: [
          'Present and normoactive',
          'Hyperactive',
          'Hypoactive',
          'Absent',
        ],
        default: 'Present and normoactive',
      },
    ],
  },
  {
    id: 'neurological_system',
    label: 'Neurological System',
    items: [
      {
        category: 'GCS',
        type: 'single_select',
        options: [
          '15/15',
          '13–14/15 (mild impairment)',
          '9–12/15 (moderate impairment)',
          '<9/15 (severe impairment)',
        ],
        default: '15/15',
      },
      {
        category: 'Orientation',
        type: 'single_select',
        options: [
          'Oriented in time, place and person',
          'Disoriented to time',
          'Disoriented to time and place',
          'Disoriented to time, place and person',
        ],
        default: 'Oriented in time, place and person',
      },
      {
        category: 'Motor Power (Upper Limbs)',
        type: 'single_select',
        options: [
          '5/5 bilaterally',
          'Reduced on right (upper)',
          'Reduced on left (upper)',
          'Reduced bilaterally (upper)',
        ],
        default: '5/5 bilaterally',
      },
      {
        category: 'Motor Power (Lower Limbs)',
        type: 'single_select',
        options: [
          '5/5 bilaterally',
          'Reduced on right (lower)',
          'Reduced on left (lower)',
          'Reduced bilaterally (lower)',
        ],
        default: '5/5 bilaterally',
      },
      {
        category: 'Tone',
        type: 'single_select',
        options: [
          'Normal tone',
          'Hypotonia',
          'Hypertonia (spastic)',
          'Hypertonia (rigid)',
          'Clonus present',
        ],
        default: 'Normal tone',
      },
      {
        category: 'Reflexes',
        type: 'single_select',
        options: [
          'Normal deep tendon reflexes',
          'Hyperreflexia',
          'Hyporeflexia',
          'Absent reflexes',
          'Plantar — flexor bilaterally',
          'Plantar — extensor (right)',
          'Plantar — extensor (left)',
        ],
        default: 'Normal deep tendon reflexes',
      },
      {
        category: 'Cerebellar Signs',
        type: 'single_select',
        options: [
          'No cerebellar signs',
          'Dysdiadochokinesia',
          'Past-pointing',
          'Intention tremor',
          'Ataxic gait',
        ],
        default: 'No cerebellar signs',
      },
    ],
  },
  {
    id: 'ent_examination',
    label: 'ENT Examination',
    items: [
      {
        category: 'Ears',
        type: 'multi_select',
        options: [
          'Ears — normal',
          'Ear discharge (right)',
          'Ear discharge (left)',
          'Mastoid tenderness (right)',
          'Mastoid tenderness (left)',
          'Reduced hearing (right)',
          'Reduced hearing (left)',
        ],
        default_selected: ['Ears — normal'],
      },
      {
        category: 'Nose',
        type: 'multi_select',
        options: [
          'Nose — normal',
          'Nasal discharge',
          'Nasal congestion',
          'Deviated nasal septum',
          'Nasal polyp',
        ],
        default_selected: ['Nose — normal'],
      },
      {
        category: 'Throat/Tonsils',
        type: 'single_select',
        options: [
          'Throat clear',
          'Oropharyngeal erythema',
          'Tonsillar enlargement',
          'Tonsillar exudate',
          'Peritonsillar abscess',
        ],
        default: 'Throat clear',
      },
    ],
  },
  {
    id: 'ophthalmology_examination',
    label: 'Ophthalmology Examination',
    items: [
      {
        category: 'Conjunctiva',
        type: 'single_select',
        options: [
          'Normal',
          'Pale conjunctiva',
          'Injected conjunctiva',
          'Subconjunctival haemorrhage',
        ],
        default: 'Normal',
      },
      {
        category: 'Pupils',
        type: 'single_select',
        options: [
          'Equal, round, reactive to light (PERL)',
          'Unequal pupils',
          'Dilated and fixed (right)',
          'Dilated and fixed (left)',
          'Dilated and fixed bilaterally',
          'Miosis',
        ],
        default: 'Equal, round, reactive to light (PERL)',
      },
      {
        category: 'Fundi',
        type: 'single_select',
        options: [
          'Not assessed',
          'Normal fundi bilaterally',
          'Papilloedema',
          'Hypertensive retinopathy',
          'Diabetic retinopathy',
        ],
        default: 'Not assessed',
      },
    ],
  },
];
