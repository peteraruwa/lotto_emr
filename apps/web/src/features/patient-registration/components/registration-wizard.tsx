'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

import { registrationSchema, STEP_REQUIRED_FIELDS, type RegistrationFormData } from '../schemas/registration.schema';
import { useRegisterPatient } from '../hooks/use-register-patient';
import { StepIndicator } from './step-indicator';
import { StepIdentity }         from './steps/step-identity';
import { StepContact }          from './steps/step-contact';
import { StepNok }              from './steps/step-nok';
import { StepInsurance }        from './steps/step-insurance';
import { StepClinicalFlags }    from './steps/step-clinical-flags';
import { StepTreatmentPrefs }   from './steps/step-treatment-prefs';
import { StepReview }           from './steps/step-review';

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  'Identity', 'Contact', 'Next of Kin', 'Insurance', 'Clinical Flags', 'Treatment Prefs', 'Review',
];

const NAV_COLORS: Array<{ next: string; back: string }> = [
  { next: 'bg-blue-600 hover:bg-blue-700',    back: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
  { next: 'bg-teal-600 hover:bg-teal-700',    back: 'border-teal-200 text-teal-700 hover:bg-teal-50' },
  { next: 'bg-violet-600 hover:bg-violet-700', back: 'border-violet-200 text-violet-700 hover:bg-violet-50' },
  { next: 'bg-amber-500 hover:bg-amber-600',  back: 'border-amber-200 text-amber-700 hover:bg-amber-50' },
  { next: 'bg-rose-600 hover:bg-rose-700',    back: 'border-rose-200 text-rose-700 hover:bg-rose-50' },
  { next: 'bg-emerald-600 hover:bg-emerald-700', back: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' },
  { next: 'bg-hospital-600 hover:bg-hospital-700', back: 'border-gray-200 text-gray-700 hover:bg-gray-50' },
];

interface SuccessState {
  patientId: string;
  mrn:       string;
  fullName:  string;
}

export function RegistrationWizard() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successState, setSuccess]    = useState<SuccessState | null>(null);

  const { mutateAsync: registerPatient, isPending } = useRegisterPatient();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '', middleName: '', lastName: '',
      dateOfBirth: '', gender: undefined,
      bloodGroup: '', genotype: '', nin: '', tribe: '', religion: '',
      phone: '', altPhone: '', email: '',
      addressLine1: '', addressLine2: '', city: '', state: '',
      nokFirstName: '', nokLastName: '', nokRelationship: '',
      nokPhone: '', nokEmail: '', nokAddress: '',
      paymentMode: 'cash',
      hmoProvider: '', hmoPolicyNumber: '', hmoGroup: '', nhisNumber: '',
      allergies: [],
      chronicConditions: [],
      riskFlags: {
        diabetic: false, hypertensive: false, asthmatic: false,
        sickleCellDisease: false, pregnant: false, immunocompromised: false,
        epileptic: false, hivPositive: false,
      },
      bloodTransfusionConsent: undefined,
      bloodTransfusionConditions: '',
      resuscitationPreference: undefined,
      organDonorConsent: false,
      ndprDataConsent: false,
      ndprMarketingConsent: false,
    },
  });

  // ── Navigation ─────────────────────────────────────────────────────────
  async function goNext() {
    // Validate only the fields required for this step
    const fieldsToCheck = STEP_REQUIRED_FIELDS[step] ?? [];
    if (fieldsToCheck.length > 0) {
      const valid = await form.trigger(fieldsToCheck);
      if (!valid) {
        // Scroll to first error
        const firstErr = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
        firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Submission ─────────────────────────────────────────────────────────
  async function handleSubmit() {
    setSubmitError(null);
    // Full schema validation before final submit
    const valid = await form.trigger();
    if (!valid) {
      setSubmitError('Some fields have errors. Please review each step.');
      return;
    }

    const data = form.getValues();
    try {
      const result = await registerPatient(data);
      setSuccess({
        patientId: result.patientId,
        mrn:       result.mrn,
        fullName:  [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' '),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  }

  // ── Success Screen ─────────────────────────────────────────────────────
  if (successState) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Patient Registered!</h2>
          <p className="text-gray-500 text-sm mt-2">{successState.fullName} has been successfully registered.</p>
        </div>
        <div className="p-4 rounded-2xl bg-hospital-50 border border-hospital-200 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Medical Record Number</p>
          <p className="text-2xl font-mono font-bold text-hospital-700">{successState.mrn}</p>
          <p className="text-xs text-gray-400">This MRN uniquely identifies this patient across all systems.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push(`/patients/${successState.patientId}`)}
            className="px-6 py-3 bg-hospital-600 hover:bg-hospital-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Open Patient Profile →
          </button>
          <button
            onClick={() => router.push('/patients')}
            className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Patient List
          </button>
        </div>
      </div>
    );
  }

  const colors = NAV_COLORS[step];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pb-4 pt-2 border-b border-gray-100">
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
      </div>

      {/* Step Content */}
      <div className="pb-4">
        {step === 0 && <StepIdentity         form={form} />}
        {step === 1 && <StepContact          form={form} />}
        {step === 2 && <StepNok              form={form} />}
        {step === 3 && <StepInsurance        form={form} />}
        {step === 4 && <StepClinicalFlags    form={form} />}
        {step === 5 && <StepTreatmentPrefs   form={form} />}
        {step === 6 && (
          <StepReview
            form={form}
            isLoading={isPending}
            submitError={submitError}
            onBack={goBack}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation — hidden on review step (StepReview has its own buttons) */}
      {step < TOTAL_STEPS - 1 && (
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className={[
                'flex items-center gap-1.5 px-5 py-3 border-2 rounded-xl text-sm font-semibold transition-colors',
                colors.back,
              ].join(' ')}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          <button
            type="button"
            onClick={goNext}
            className={[
              'ml-auto flex items-center gap-1.5 px-6 py-3 rounded-xl text-white text-sm font-bold transition-colors shadow-sm',
              colors.next,
            ].join(' ')}
          >
            {step < TOTAL_STEPS - 2 ? (
              <>
                Next: {STEP_LABELS[step + 1]}
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Review & Confirm
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
