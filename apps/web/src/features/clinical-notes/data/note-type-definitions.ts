import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  Activity,
  Baby,
  BookOpen,
  Brain,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardList,
  Clock,
  FileText,
  FlaskConical,
  Heart,
  List,
  LogOut,
  MapPin,
  Pill,
  Shield,
  Stethoscope,
  Syringe,
  Thermometer,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type FieldType = 'textarea' | 'chips' | 'exam-builder';

export interface ChipOption {
  value: string;
  label: string;
}

export interface NoteField {
  key: string;
  label: string;
  placeholder?: string;
  rows?: number;
  showAiAssist?: boolean;   // show "AI Assist" expand button
  showIcdSearch?: boolean;  // show ICD-10 search
  showSuggestPlan?: boolean; // show "Suggest Plan" button
  type?: FieldType;
  options?: ChipOption[];   // for chips type
}

export type ConsultTab = 'subjective' | 'objective' | 'assessment' | 'plan';

export interface NoteSection {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: string;             // Tailwind border-l-* class
  fields: NoteField[];
  conditionalGender?: 'female'; // hide for non-female patients
  tab?: ConsultTab;            // assigned tab for consultation_note; undefined = always visible
}

export interface NoteTypeDefinition {
  type: string;
  label: string;
  loinc: string;
  loincDisplay: string;
  loincText: string;
  description: string;
  context: 'outpatient' | 'inpatient' | 'emergency';
  sections: NoteSection[];
}

// ---------------------------------------------------------------------------
// NOTE_TYPE_DEFINITIONS
// ---------------------------------------------------------------------------

export const NOTE_TYPE_DEFINITIONS: Record<string, NoteTypeDefinition> = {
  // -------------------------------------------------------------------------
  // 1. Consultation Note
  // -------------------------------------------------------------------------
  consultation_note: {
    type: 'consultation_note',
    label: 'Consultation Note',
    loinc: '11488-4',
    loincDisplay: 'Consultation note',
    loincText: 'Consultation Note',
    description: 'Comprehensive outpatient consultation documenting history, examination, assessment, and management plan.',
    context: 'outpatient',
    sections: [
      {
        id: 'chiefComplaint',
        title: 'Chief Complaint',
        icon: AlertCircle,
        accent: 'border-l-red-400',
        tab: 'subjective',
        fields: [
          {
            key: 'chiefComplaint',
            label: 'Chief Complaint',
            placeholder: "Main reason for today's consultation…",
            rows: 3,
          },
        ],
      },
      {
        id: 'hpi',
        title: 'History of Present Illness',
        icon: Clock,
        accent: 'border-l-orange-400',
        tab: 'subjective',
        fields: [
          {
            key: 'hpi',
            label: 'History of Present Illness',
            placeholder: 'Onset, duration, character, severity, associated symptoms, relieving/aggravating factors…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'pastMedicalHistory',
        title: 'Past Medical History',
        icon: BookOpen,
        accent: 'border-l-amber-400',
        tab: 'subjective',
        fields: [
          {
            key: 'pastMedicalHistory',
            label: 'Past Medical History',
            placeholder: 'Previous illnesses, hospitalisations, surgeries, chronic conditions…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'gynaeHistory',
        title: 'Gynaecology History',
        icon: Heart,
        accent: 'border-l-pink-400',
        tab: 'subjective',
        conditionalGender: 'female',
        fields: [
          {
            key: 'gynaeHistory',
            label: 'Gynaecology History',
            placeholder: 'Menstrual cycle, LMP, contraception, gynaecological diagnoses or procedures…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'obstetricsHistory',
        title: 'Obstetrics History',
        icon: Baby,
        accent: 'border-l-rose-400',
        tab: 'subjective',
        conditionalGender: 'female',
        fields: [
          {
            key: 'obstetricsHistory',
            label: 'Obstetrics History',
            placeholder: 'G_P_, previous pregnancies, deliveries, complications, current pregnancy if applicable…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'drugHistory',
        title: 'Drug History',
        icon: Pill,
        accent: 'border-l-purple-400',
        tab: 'subjective',
        fields: [
          {
            key: 'drugHistory',
            label: 'Drug History',
            placeholder: 'Current medications including dose, frequency, route; OTC medications and supplements…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'allergyHistory',
        title: 'Allergy History',
        icon: AlertTriangle,
        accent: 'border-l-red-300',
        tab: 'subjective',
        fields: [
          {
            key: 'allergyHistory',
            label: 'Allergy History',
            placeholder: 'Drug allergies, food allergies, environmental allergies — include reaction type…',
            rows: 3,
          },
        ],
      },
      {
        id: 'familyHistory',
        title: 'Family History',
        icon: Users,
        accent: 'border-l-green-400',
        tab: 'subjective',
        fields: [
          {
            key: 'familyHistory',
            label: 'Family History',
            placeholder: 'Relevant hereditary conditions, family members affected…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'socialHistory',
        title: 'Social History',
        icon: MapPin,
        accent: 'border-l-emerald-400',
        tab: 'subjective',
        fields: [
          {
            key: 'socialHistory',
            label: 'Social History',
            placeholder: 'Smoking, alcohol, recreational drugs, living situation, occupation, support network…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'otherHistory',
        title: 'Other History',
        icon: FileText,
        accent: 'border-l-slate-400',
        tab: 'subjective',
        fields: [
          {
            key: 'otherHistory',
            label: 'Other History',
            placeholder: 'Surgical history, travel history, occupational history, immunisation history…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'reviewOfSystems',
        title: 'Review of Systems',
        icon: List,
        accent: 'border-l-blue-400',
        tab: 'subjective',
        fields: [
          {
            key: 'reviewOfSystems',
            label: 'Review of Systems',
            placeholder: 'Systematic enquiry across body systems — pertinent positives and negatives…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'examFindings',
        title: 'Physical Examination',
        icon: Stethoscope,
        accent: 'border-l-cyan-500',
        tab: 'objective',
        fields: [
          {
            key: 'examFindings',
            label: 'Physical Examination',
            type: 'exam-builder',
          },
        ],
      },
      {
        id: 'diagnosis',
        title: 'Assessment / Diagnosis',
        icon: Activity,
        accent: 'border-l-teal-500',
        tab: 'assessment',
        fields: [
          {
            key: 'diagnosis',
            label: 'Assessment / Diagnosis',
            placeholder: 'Primary and secondary diagnoses with ICD-10 codes…',
            rows: 4,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'differentialDiagnosis',
        title: 'Differential Diagnosis',
        icon: Brain,
        accent: 'border-l-violet-400',
        tab: 'assessment',
        fields: [
          {
            key: 'differentialDiagnosis',
            label: 'Differential Diagnosis',
            placeholder: 'Alternative diagnoses to consider, ranked by likelihood…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'investigations',
        title: 'Investigations',
        icon: FlaskConical,
        accent: 'border-l-sky-400',
        tab: 'plan',
        fields: [
          {
            key: 'investigations',
            label: 'Investigations',
            placeholder: 'Investigations ordered or results reviewed — bloods, imaging, microbiology…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'plan',
        title: 'Treatment Plan',
        icon: ClipboardList,
        accent: 'border-l-indigo-400',
        tab: 'plan',
        fields: [
          {
            key: 'plan',
            label: 'Treatment Plan',
            placeholder: 'Medications prescribed, procedures, referrals, lifestyle advice…',
            rows: 4,
            showSuggestPlan: true,
          },
        ],
      },
      {
        id: 'followUpPlan',
        title: 'Follow-up Plan',
        icon: Calendar,
        accent: 'border-l-gray-400',
        tab: 'plan',
        fields: [
          {
            key: 'followUpPlan',
            label: 'Follow-up Plan',
            placeholder: 'Review appointments, safety-netting advice, return precautions…',
            rows: 3,
            showAiAssist: true,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. SOAP Follow-up Note
  // -------------------------------------------------------------------------
  soap_followup: {
    type: 'soap_followup',
    label: 'SOAP Follow-up Note',
    loinc: '11506-3',
    loincDisplay: 'Progress note',
    loincText: 'SOAP Follow-up Note',
    description: 'Structured SOAP format for routine outpatient follow-up consultations.',
    context: 'outpatient',
    sections: [
      {
        id: 'subjective',
        title: 'Subjective',
        icon: FileText,
        accent: 'border-l-blue-400',
        fields: [
          {
            key: 'subjective',
            label: 'Subjective',
            placeholder: "Patient's reported symptoms, concerns, and progress since last visit…",
            rows: 6,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'objective',
        title: 'Objective',
        icon: Activity,
        accent: 'border-l-cyan-500',
        fields: [
          {
            key: 'objective',
            label: 'Objective',
            placeholder: 'Vital signs, examination findings, relevant investigation results…',
            rows: 5,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'assessment',
        title: 'Assessment',
        icon: Stethoscope,
        accent: 'border-l-teal-500',
        fields: [
          {
            key: 'assessment',
            label: 'Assessment',
            placeholder: 'Current diagnosis or working diagnosis with ICD-10 codes…',
            rows: 4,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'plan',
        title: 'Plan',
        icon: ClipboardList,
        accent: 'border-l-indigo-400',
        fields: [
          {
            key: 'plan',
            label: 'Plan',
            placeholder: 'Medications, investigations, referrals, follow-up, patient education…',
            rows: 4,
            showSuggestPlan: true,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Emergency Department Note
  // -------------------------------------------------------------------------
  ed_note: {
    type: 'ed_note',
    label: 'Emergency Department Note',
    loinc: '34878-9',
    loincDisplay: 'Emergency medicine note',
    loincText: 'Emergency Department Note',
    description: 'Comprehensive emergency department encounter note including primary survey and disposition.',
    context: 'emergency',
    sections: [
      {
        id: 'triageInfo',
        title: 'Triage Information',
        icon: Thermometer,
        accent: 'border-l-yellow-400',
        fields: [
          {
            key: 'triageInfo',
            label: 'Triage Information',
            placeholder: 'Triage category, time of arrival, triage nurse notes…',
            rows: 3,
          },
        ],
      },
      {
        id: 'presentingComplaint',
        title: 'Presenting Complaint',
        icon: AlertCircle,
        accent: 'border-l-red-400',
        fields: [
          {
            key: 'presentingComplaint',
            label: 'Presenting Complaint',
            placeholder: "Primary presenting complaint in the patient's own words…",
            rows: 3,
          },
        ],
      },
      {
        id: 'hpi',
        title: 'History of Present Illness',
        icon: Clock,
        accent: 'border-l-orange-400',
        fields: [
          {
            key: 'hpi',
            label: 'History of Present Illness',
            placeholder: 'Onset, mechanism of injury, timeline, associated symptoms, AMPLE history…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'vitalSigns',
        title: 'Vital Signs',
        icon: TrendingUp,
        accent: 'border-l-cyan-400',
        fields: [
          {
            key: 'vitalSigns',
            label: 'Vital Signs',
            placeholder: 'BP, HR, RR, SpO2, Temp, GCS…',
            rows: 3,
          },
        ],
      },
      {
        id: 'primarySurvey',
        title: 'Primary Survey (ABCDE)',
        icon: Zap,
        accent: 'border-l-red-500',
        fields: [
          {
            key: 'primarySurvey',
            label: 'Primary Survey (ABCDE)',
            placeholder: 'A: Airway… B: Breathing… C: Circulation… D: Disability… E: Exposure…',
            rows: 6,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'focusedExam',
        title: 'Focused Examination',
        icon: Stethoscope,
        accent: 'border-l-teal-400',
        fields: [
          {
            key: 'focusedExam',
            label: 'Focused Examination',
            placeholder: 'Targeted systems examination relevant to the presenting complaint…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'emergencyInterventions',
        title: 'Emergency Interventions',
        icon: Syringe,
        accent: 'border-l-orange-500',
        fields: [
          {
            key: 'emergencyInterventions',
            label: 'Emergency Interventions',
            placeholder: 'IV access, fluids, medications, oxygen, monitoring…',
            rows: 4,
          },
        ],
      },
      {
        id: 'assessment',
        title: 'Assessment',
        icon: Activity,
        accent: 'border-l-teal-500',
        fields: [
          {
            key: 'assessment',
            label: 'Assessment',
            placeholder: 'Working diagnosis or differential with ICD-10 codes…',
            rows: 4,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'differentialDiagnosis',
        title: 'Differential Diagnosis',
        icon: Brain,
        accent: 'border-l-violet-400',
        fields: [
          {
            key: 'differentialDiagnosis',
            label: 'Differential Diagnosis',
            placeholder: 'Diagnoses considered, ranked by likelihood and acuity…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'disposition',
        title: 'Disposition',
        icon: LogOut,
        accent: 'border-l-gray-400',
        fields: [
          {
            key: 'disposition',
            label: 'Disposition',
            type: 'chips',
            options: [
              { value: 'discharge', label: 'Discharge' },
              { value: 'admit', label: 'Admit to Ward' },
              { value: 'transfer', label: 'Transfer' },
              { value: 'observation', label: 'Observation' },
            ],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. Admission Note
  // -------------------------------------------------------------------------
  admission_note: {
    type: 'admission_note',
    label: 'Admission Note',
    loinc: '34117-2',
    loincDisplay: 'History and physical note',
    loincText: 'Admission Note',
    description: 'Full history and physical examination note completed at the time of hospital admission.',
    context: 'inpatient',
    sections: [
      {
        id: 'admissionReason',
        title: 'Admission Reason',
        icon: Building2,
        accent: 'border-l-blue-500',
        fields: [
          {
            key: 'admissionReason',
            label: 'Admission Reason',
            placeholder: 'Primary reason for admission…',
            rows: 3,
          },
        ],
      },
      {
        id: 'chiefComplaint',
        title: 'Chief Complaint',
        icon: AlertCircle,
        accent: 'border-l-red-400',
        fields: [
          {
            key: 'chiefComplaint',
            label: 'Chief Complaint',
            placeholder: "Patient's primary complaint in their own words…",
            rows: 3,
          },
        ],
      },
      {
        id: 'hpi',
        title: 'History of Present Illness',
        icon: Clock,
        accent: 'border-l-orange-400',
        fields: [
          {
            key: 'hpi',
            label: 'History of Present Illness',
            placeholder: 'Detailed account of the presenting illness — onset, progression, associated symptoms…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'pastMedicalHistory',
        title: 'Past Medical History',
        icon: BookOpen,
        accent: 'border-l-amber-400',
        fields: [
          {
            key: 'pastMedicalHistory',
            label: 'Past Medical History',
            placeholder: 'Previous hospitalisations, surgeries, chronic illnesses, relevant diagnoses…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'gynaeHistory',
        title: 'Gynaecology History',
        icon: Heart,
        accent: 'border-l-pink-400',
        conditionalGender: 'female',
        fields: [
          {
            key: 'gynaeHistory',
            label: 'Gynaecology History',
            placeholder: 'Menstrual cycle, LMP, contraception, gynaecological diagnoses or procedures…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'obstetricsHistory',
        title: 'Obstetrics History',
        icon: Baby,
        accent: 'border-l-rose-400',
        conditionalGender: 'female',
        fields: [
          {
            key: 'obstetricsHistory',
            label: 'Obstetrics History',
            placeholder: 'G_P_, previous pregnancies, deliveries, complications, current pregnancy status…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'drugHistory',
        title: 'Drug History',
        icon: Pill,
        accent: 'border-l-purple-400',
        fields: [
          {
            key: 'drugHistory',
            label: 'Drug History',
            placeholder: 'Regular medications with dose and frequency; OTC; herbals and supplements…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'allergyHistory',
        title: 'Allergy History',
        icon: AlertTriangle,
        accent: 'border-l-red-300',
        fields: [
          {
            key: 'allergyHistory',
            label: 'Allergy History',
            placeholder: 'Known drug, food, or environmental allergies with type of reaction…',
            rows: 3,
          },
        ],
      },
      {
        id: 'familyHistory',
        title: 'Family History',
        icon: Users,
        accent: 'border-l-green-400',
        fields: [
          {
            key: 'familyHistory',
            label: 'Family History',
            placeholder: 'Relevant hereditary conditions, first-degree relatives affected…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'socialHistory',
        title: 'Social History',
        icon: MapPin,
        accent: 'border-l-emerald-400',
        fields: [
          {
            key: 'socialHistory',
            label: 'Social History',
            placeholder: 'Occupation, living arrangements, smoking, alcohol, recreational substances, support…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'reviewOfSystems',
        title: 'Review of Systems',
        icon: List,
        accent: 'border-l-blue-400',
        fields: [
          {
            key: 'reviewOfSystems',
            label: 'Review of Systems',
            placeholder: 'Systematic enquiry — pertinent positives and negatives across body systems…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'examFindings',
        title: 'Physical Examination',
        icon: Stethoscope,
        accent: 'border-l-cyan-500',
        fields: [
          {
            key: 'examFindings',
            label: 'Physical Examination',
            type: 'exam-builder',
          },
        ],
      },
      {
        id: 'diagnosis',
        title: 'Assessment / Diagnosis',
        icon: Activity,
        accent: 'border-l-teal-500',
        fields: [
          {
            key: 'diagnosis',
            label: 'Assessment / Diagnosis',
            placeholder: 'Primary and secondary diagnoses with ICD-10 codes…',
            rows: 4,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'plan',
        title: 'Initial Management Plan',
        icon: ClipboardList,
        accent: 'border-l-indigo-400',
        fields: [
          {
            key: 'plan',
            label: 'Initial Management Plan',
            placeholder: 'Initial treatment orders, monitoring plan, investigations, consults, goals of care…',
            rows: 4,
            showSuggestPlan: true,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Inpatient Progress Note
  // -------------------------------------------------------------------------
  progress_note: {
    type: 'progress_note',
    label: 'Progress Note',
    loinc: '11506-3',
    loincDisplay: 'Progress note',
    loincText: 'Inpatient Progress Note',
    description: 'Daily inpatient progress note documenting clinical status, investigation results, and updated management.',
    context: 'inpatient',
    sections: [
      {
        id: 'overnightEvents',
        title: 'Overnight Events',
        icon: Clock,
        accent: 'border-l-orange-400',
        fields: [
          {
            key: 'overnightEvents',
            label: 'Overnight Events',
            placeholder: 'Significant events, calls, interventions, changes in condition overnight…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'subjectiveSymptoms',
        title: 'Subjective Symptoms',
        icon: FileText,
        accent: 'border-l-blue-400',
        fields: [
          {
            key: 'subjectiveSymptoms',
            label: 'Subjective Symptoms',
            placeholder: "Patient's reported symptoms, comfort level, sleep, appetite, pain score…",
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'vitalSigns',
        title: 'Vital Signs',
        icon: TrendingUp,
        accent: 'border-l-cyan-400',
        fields: [
          {
            key: 'vitalSigns',
            label: 'Vital Signs',
            placeholder: 'Current BP, HR, RR, SpO2, Temp, urine output…',
            rows: 3,
          },
        ],
      },
      {
        id: 'intakeOutput',
        title: 'Intake / Output',
        icon: Activity,
        accent: 'border-l-sky-400',
        fields: [
          {
            key: 'intakeOutput',
            label: 'Intake / Output',
            placeholder: 'IV fluids in, oral intake, urine output, drain output…',
            rows: 3,
          },
        ],
      },
      {
        id: 'examinationFindings',
        title: 'Examination Findings',
        icon: Stethoscope,
        accent: 'border-l-teal-400',
        fields: [
          {
            key: 'examinationFindings',
            label: 'Examination Findings',
            placeholder: 'Focused clinical examination — relevant systems with pertinent findings…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'investigationUpdates',
        title: 'Investigation Updates',
        icon: FlaskConical,
        accent: 'border-l-emerald-400',
        fields: [
          {
            key: 'investigationUpdates',
            label: 'Investigation Updates',
            placeholder: 'New or pending lab results, imaging reports, microbiology, ECG…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'assessment',
        title: 'Assessment',
        icon: Activity,
        accent: 'border-l-teal-500',
        fields: [
          {
            key: 'assessment',
            label: 'Assessment',
            placeholder: 'Current diagnosis and clinical status with ICD-10 codes…',
            rows: 4,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'responseToTreatment',
        title: 'Response to Treatment',
        icon: TrendingUp,
        accent: 'border-l-green-400',
        fields: [
          {
            key: 'responseToTreatment',
            label: 'Response to Treatment',
            placeholder: 'Clinical response to current treatment — improvement, deterioration, or unchanged…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'plan',
        title: 'Updated Plan',
        icon: ClipboardList,
        accent: 'border-l-indigo-400',
        fields: [
          {
            key: 'plan',
            label: 'Updated Plan',
            placeholder: 'Updated medication orders, investigations, consults, procedures, goals…',
            rows: 4,
            showSuggestPlan: true,
          },
        ],
      },
      {
        id: 'pendingTasks',
        title: 'Pending Tasks',
        icon: CheckSquare,
        accent: 'border-l-gray-400',
        fields: [
          {
            key: 'pendingTasks',
            label: 'Pending Tasks',
            placeholder: 'Pending labs, imaging, consults, procedures…',
            rows: 3,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 6. Procedure Note
  // -------------------------------------------------------------------------
  procedure_note: {
    type: 'procedure_note',
    label: 'Procedure Note',
    loinc: '28570-0',
    loincDisplay: 'Procedure note',
    loincText: 'Procedure Note',
    description: 'Detailed documentation of a clinical procedure including indication, technique, findings, and follow-up.',
    context: 'outpatient',
    sections: [
      {
        id: 'procedureName',
        title: 'Procedure Name',
        icon: Syringe,
        accent: 'border-l-blue-400',
        fields: [
          {
            key: 'procedureName',
            label: 'Procedure Name',
            placeholder: 'Full name of the procedure performed…',
            rows: 2,
          },
        ],
      },
      {
        id: 'indication',
        title: 'Indication',
        icon: AlertCircle,
        accent: 'border-l-amber-400',
        fields: [
          {
            key: 'indication',
            label: 'Indication',
            placeholder: 'Clinical indication and justification for the procedure…',
            rows: 3,
          },
        ],
      },
      {
        id: 'consent',
        title: 'Consent',
        icon: Shield,
        accent: 'border-l-green-400',
        fields: [
          {
            key: 'consent',
            label: 'Consent',
            placeholder: 'Written/verbal consent obtained, risks explained…',
            rows: 3,
          },
        ],
      },
      {
        id: 'preProcedureAssessment',
        title: 'Pre-procedure Assessment',
        icon: BookOpen,
        accent: 'border-l-orange-400',
        fields: [
          {
            key: 'preProcedureAssessment',
            label: 'Pre-procedure Assessment',
            placeholder: 'Patient condition, relevant observations, preparation, checklist completion…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'anesthesia',
        title: 'Anesthesia Used',
        icon: Syringe,
        accent: 'border-l-purple-400',
        fields: [
          {
            key: 'anesthesia',
            label: 'Anesthesia Used',
            placeholder: 'Local, regional, GA — agent, dose, route…',
            rows: 3,
          },
        ],
      },
      {
        id: 'procedureDetails',
        title: 'Procedure Details',
        icon: ClipboardList,
        accent: 'border-l-teal-400',
        fields: [
          {
            key: 'procedureDetails',
            label: 'Procedure Details',
            placeholder: 'Step-by-step description of the procedure, patient positioning, technique, equipment used…',
            rows: 6,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'findings',
        title: 'Findings',
        icon: Activity,
        accent: 'border-l-cyan-400',
        fields: [
          {
            key: 'findings',
            label: 'Findings',
            placeholder: 'Intraoperative or procedural findings — describe any abnormalities…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'complications',
        title: 'Complications',
        icon: AlertTriangle,
        accent: 'border-l-red-400',
        fields: [
          {
            key: 'complications',
            label: 'Complications',
            placeholder: 'Intraoperative/immediate complications, or none…',
            rows: 3,
          },
        ],
      },
      {
        id: 'postProcedureStatus',
        title: 'Post-procedure Status',
        icon: TrendingUp,
        accent: 'border-l-emerald-400',
        fields: [
          {
            key: 'postProcedureStatus',
            label: 'Post-procedure Status',
            placeholder: "Patient's condition and observations immediately post-procedure…",
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'followUpPlan',
        title: 'Follow-up Plan',
        icon: Calendar,
        accent: 'border-l-gray-400',
        fields: [
          {
            key: 'followUpPlan',
            label: 'Follow-up Plan',
            placeholder: 'Post-procedure instructions, review date, wound care, specimen sent…',
            rows: 3,
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. Referral Note
  // -------------------------------------------------------------------------
  referral_note: {
    type: 'referral_note',
    label: 'Referral Note',
    loinc: '57133-1',
    loincDisplay: 'Referral note',
    loincText: 'Referral Note',
    description: 'Structured referral letter to a specialist or service outlining clinical details and specific requests.',
    context: 'outpatient',
    sections: [
      {
        id: 'referralSpecialty',
        title: 'Referral Specialty',
        icon: Users,
        accent: 'border-l-blue-400',
        fields: [
          {
            key: 'referralSpecialty',
            label: 'Referral Specialty',
            placeholder: 'Specialty or clinician being referred to…',
            rows: 2,
          },
        ],
      },
      {
        id: 'reasonForReferral',
        title: 'Reason for Referral',
        icon: AlertCircle,
        accent: 'border-l-red-400',
        fields: [
          {
            key: 'reasonForReferral',
            label: 'Reason for Referral',
            placeholder: 'Primary reason and specific questions for the specialist…',
            rows: 3,
          },
        ],
      },
      {
        id: 'briefHistory',
        title: 'Brief History',
        icon: BookOpen,
        accent: 'border-l-amber-400',
        fields: [
          {
            key: 'briefHistory',
            label: 'Brief History',
            placeholder: 'Concise relevant history — presenting complaint, pertinent past history, medications…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'relevantFindings',
        title: 'Relevant Findings',
        icon: Activity,
        accent: 'border-l-teal-400',
        fields: [
          {
            key: 'relevantFindings',
            label: 'Relevant Findings',
            placeholder: 'Pertinent examination findings relevant to the referral…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'investigationsDone',
        title: 'Investigations Done',
        icon: FlaskConical,
        accent: 'border-l-sky-400',
        fields: [
          {
            key: 'investigationsDone',
            label: 'Investigations Done',
            placeholder: 'Investigations already completed with key results — labs, imaging, pathology…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'currentDiagnosis',
        title: 'Current Diagnosis',
        icon: Stethoscope,
        accent: 'border-l-teal-500',
        fields: [
          {
            key: 'currentDiagnosis',
            label: 'Current Diagnosis',
            placeholder: 'Working or confirmed diagnosis with ICD-10 codes…',
            rows: 3,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'currentTreatment',
        title: 'Current Treatment',
        icon: Pill,
        accent: 'border-l-purple-400',
        fields: [
          {
            key: 'currentTreatment',
            label: 'Current Treatment',
            placeholder: 'Current medications and other treatments in progress…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'specificQuestions',
        title: 'Specific Questions / Requests',
        icon: List,
        accent: 'border-l-indigo-400',
        fields: [
          {
            key: 'specificQuestions',
            label: 'Specific Questions / Requests',
            placeholder: 'Specific clinical questions, procedures requested, or advice sought from the specialist…',
            rows: 4,
          },
        ],
      },
      {
        id: 'urgencyLevel',
        title: 'Urgency Level',
        icon: Zap,
        accent: 'border-l-orange-400',
        fields: [
          {
            key: 'urgencyLevel',
            label: 'Urgency Level',
            type: 'chips',
            options: [
              { value: 'routine', label: 'Routine' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'emergency', label: 'Emergency' },
            ],
          },
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. Discharge Summary
  // -------------------------------------------------------------------------
  discharge_summary: {
    type: 'discharge_summary',
    label: 'Discharge Summary',
    loinc: '18842-5',
    loincDisplay: 'Discharge summary',
    loincText: 'Discharge Summary',
    description: 'Comprehensive discharge documentation summarising hospital admission, treatment, and outpatient follow-up plan.',
    context: 'inpatient',
    sections: [
      {
        id: 'admissionDiagnosis',
        title: 'Admission Diagnosis',
        icon: Building2,
        accent: 'border-l-blue-400',
        fields: [
          {
            key: 'admissionDiagnosis',
            label: 'Admission Diagnosis',
            placeholder: 'Diagnosis at the time of admission…',
            rows: 3,
          },
        ],
      },
      {
        id: 'finalDiagnosis',
        title: 'Final Diagnosis',
        icon: Stethoscope,
        accent: 'border-l-teal-500',
        fields: [
          {
            key: 'finalDiagnosis',
            label: 'Final Diagnosis',
            placeholder: 'Confirmed primary and secondary diagnoses with ICD-10 codes…',
            rows: 3,
            showIcdSearch: true,
          },
        ],
      },
      {
        id: 'hospitalCourse',
        title: 'Hospital Course',
        icon: Clock,
        accent: 'border-l-orange-400',
        fields: [
          {
            key: 'hospitalCourse',
            label: 'Hospital Course',
            placeholder: 'Narrative of the inpatient stay — significant events, interventions, clinical progress…',
            rows: 6,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'proceduresPerformed',
        title: 'Procedures Performed',
        icon: Syringe,
        accent: 'border-l-purple-400',
        fields: [
          {
            key: 'proceduresPerformed',
            label: 'Procedures Performed',
            placeholder: 'Surgical or invasive procedures performed during admission with dates…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'keyInvestigations',
        title: 'Key Investigations',
        icon: FlaskConical,
        accent: 'border-l-sky-400',
        fields: [
          {
            key: 'keyInvestigations',
            label: 'Key Investigations',
            placeholder: 'Significant investigation results — bloods, imaging, microbiology, pathology…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'treatmentsGiven',
        title: 'Treatments Given',
        icon: Pill,
        accent: 'border-l-green-400',
        fields: [
          {
            key: 'treatmentsGiven',
            label: 'Treatments Given',
            placeholder: 'Medications administered, infusions, transfusions, other treatments during admission…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'conditionAtDischarge',
        title: 'Condition at Discharge',
        icon: UserCheck,
        accent: 'border-l-emerald-400',
        fields: [
          {
            key: 'conditionAtDischarge',
            label: 'Condition at Discharge',
            placeholder: "Patient's clinical condition, functional status, and vital signs at discharge…",
            rows: 3,
          },
        ],
      },
      {
        id: 'dischargeMedications',
        title: 'Discharge Medications',
        icon: ClipboardList,
        accent: 'border-l-indigo-400',
        fields: [
          {
            key: 'dischargeMedications',
            label: 'Discharge Medications',
            placeholder: 'All medications on discharge — drug, dose, frequency, duration; changes from admission…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'followUpInstructions',
        title: 'Follow-up Instructions',
        icon: FileText,
        accent: 'border-l-amber-400',
        fields: [
          {
            key: 'followUpInstructions',
            label: 'Follow-up Instructions',
            placeholder: 'Activity restrictions, dietary advice, wound care, red-flag symptoms to watch for…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
      {
        id: 'followUpAppointments',
        title: 'Follow-up Appointments',
        icon: Calendar,
        accent: 'border-l-gray-400',
        fields: [
          {
            key: 'followUpAppointments',
            label: 'Follow-up Appointments',
            placeholder: 'Scheduled outpatient appointments, specialist reviews, GP follow-up dates…',
            rows: 3,
          },
        ],
      },
      {
        id: 'counselingGiven',
        title: 'Counseling Given',
        icon: Users,
        accent: 'border-l-slate-400',
        fields: [
          {
            key: 'counselingGiven',
            label: 'Counseling Given',
            placeholder: 'Patient and family education provided — diagnosis, medications, lifestyle, prognosis…',
            rows: 4,
            showAiAssist: true,
          },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export function getNoteTypeDef(type: string | undefined): NoteTypeDefinition {
  return NOTE_TYPE_DEFINITIONS[type ?? ''] ?? NOTE_TYPE_DEFINITIONS['consultation_note'];
}
