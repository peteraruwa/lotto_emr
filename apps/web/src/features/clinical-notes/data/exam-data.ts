// ── Exam module types ──────────────────────────────────────────────────────────
export interface ExamOption {
  category: string;
  type: 'single_select' | 'multi_select' | 'free_numeric_text';
  options?: string[];
  default?: string;           // for single_select
  default_selected?: string[]; // for multi_select
  placeholder?: string;       // for free_numeric_text
  vitalKey?: string;          // maps to a VitalsSnapshot key
}

export interface ExamModule {
  id: string;
  label: string;
  items: ExamOption[];
}

// ── Vitals snapshot type ───────────────────────────────────────────────────────
export interface VitalsSnapshot {
  bp?: string;       // "120/80 mmHg"
  hr?: string;       // "88 /min"
  temp?: string;     // "37.2 °C"
  rr?: string;       // "18 /min"
  spo2?: string;     // "98 %"
  weight?: string;   // "70 kg"
  height?: string;   // "170 cm"
}

// ── Clinical examination data ──────────────────────────────────────────────────
export const EXAM_MODULES: ExamModule[] = [
  {
    id: 'general_examination',
    label: 'General Examination',
    items: [
      {
        category: 'Weight',
        type: 'free_numeric_text',
        placeholder: 'e.g. 70 kg',
        vitalKey: 'weight',
      },
      {
        category: 'Height',
        type: 'free_numeric_text',
        placeholder: 'e.g. 170 cm',
        vitalKey: 'height',
      },
      {
        category: 'Temperature',
        type: 'free_numeric_text',
        placeholder: 'e.g. 37.2 °C',
        vitalKey: 'temp',
      },
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
        category: 'Blood Pressure',
        type: 'free_numeric_text',
        placeholder: 'e.g. 120/80 mmHg',
        vitalKey: 'bp',
      },
      {
        category: 'Pulse Rate',
        type: 'free_numeric_text',
        placeholder: 'e.g. 88 bpm',
        vitalKey: 'hr',
      },
      {
        category: 'Pulse Rhythm',
        type: 'single_select',
        options: ['Regular', 'Irregularly irregular', 'Regularly irregular'],
        default: 'Regular',
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
        options: ['No murmurs', 'Systolic murmur', 'Diastolic murmur', 'Pansystolic murmur'],
        default: 'No murmurs',
      },
      {
        category: 'Peripheral Pulses',
        type: 'single_select',
        options: [
          'Present bilaterally',
          'Reduced on right',
          'Reduced on left',
          'Absent on right',
          'Absent on left',
        ],
        default: 'Present bilaterally',
      },
    ],
  },
  {
    id: 'respiratory_system',
    label: 'Respiratory System',
    items: [
      {
        category: 'Respiratory Rate',
        type: 'free_numeric_text',
        placeholder: 'e.g. 18 /min',
        vitalKey: 'rr',
      },
      {
        category: 'SpO₂',
        type: 'free_numeric_text',
        placeholder: 'e.g. 98 %',
        vitalKey: 'spo2',
      },
      {
        category: 'Chest Expansion',
        type: 'single_select',
        options: ['Symmetrical', 'Reduced on right', 'Reduced on left', 'Reduced bilaterally'],
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
        options: ['Resonant bilaterally', 'Dull on right', 'Dull on left', 'Hyper-resonant'],
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
        options: ['Vesicular', 'Bronchial breathing', 'Reduced'],
        default: 'Vesicular',
      },
      {
        category: 'Added Sounds',
        type: 'multi_select',
        options: ['No added sounds', 'Fine crackles', 'Coarse crackles', 'Wheeze', 'Pleural rub'],
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
        category: 'Tenderness / Guarding',
        type: 'multi_select',
        options: [
          'No tenderness',
          'Epigastric tenderness',
          'Right upper quadrant tenderness',
          'Left upper quadrant tenderness',
          'Right lower quadrant tenderness',
          'Left lower quadrant tenderness',
          'Central tenderness',
          'Generalised tenderness',
          'Guarding',
          'Rigidity',
          'Rebound tenderness',
        ],
        default_selected: ['No tenderness'],
      },
      {
        category: 'Liver',
        type: 'free_numeric_text',
        placeholder: 'e.g. Not palpable / 2 cm below RCM',
      },
      {
        category: 'Spleen',
        type: 'free_numeric_text',
        placeholder: 'e.g. Not palpable / mild splenomegaly',
      },
      {
        category: 'Bowel Sounds',
        type: 'single_select',
        options: ['Present and normoactive', 'Hyperactive', 'Hypoactive', 'Absent'],
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
          'Reduced on right',
          'Reduced on left',
          'Reduced bilaterally',
        ],
        default: '5/5 bilaterally',
      },
      {
        category: 'Motor Power (Lower Limbs)',
        type: 'single_select',
        options: [
          '5/5 bilaterally',
          'Reduced on right',
          'Reduced on left',
          'Reduced bilaterally',
        ],
        default: '5/5 bilaterally',
      },
      {
        category: 'Tone',
        type: 'single_select',
        options: ['Normal tone', 'Hypotonia', 'Hypertonia (spastic)', 'Hypertonia (rigid)'],
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
        ],
        default: 'Normal deep tendon reflexes',
      },
      {
        category: 'Plantar Response',
        type: 'single_select',
        options: [
          'Flexor bilaterally',
          'Extensor (right)',
          'Extensor (left)',
          'Extensor bilaterally',
        ],
        default: 'Flexor bilaterally',
      },
    ],
  },
];
