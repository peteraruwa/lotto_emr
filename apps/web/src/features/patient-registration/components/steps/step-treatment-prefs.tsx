'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import type { RegistrationFormData } from '../../schemas/registration.schema';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
}

const err = 'mt-1 text-xs text-red-600';

const BT_OPTIONS: Array<{
  value: string;
  label: string;
  description: string;
  icon: string;
  badgeColor: string;
  cardColor: string;
}> = [
  {
    value: 'consents',
    label: 'Consents',
    description: 'Patient gives informed consent to receive blood or blood products.',
    icon: '✅',
    badgeColor: 'bg-green-100 text-green-800 border-green-300',
    cardColor: 'border-green-400 bg-green-50',
  },
  {
    value: 'refuses',
    label: 'Refuses',
    description: 'Patient categorically declines blood transfusion for any reason (e.g., religious, personal).',
    icon: '🚫',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    cardColor: 'border-red-400 bg-red-50',
  },
  {
    value: 'conditional',
    label: 'Conditional',
    description: 'Patient consents under specific conditions only. Specify conditions below.',
    icon: '⚠️',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    cardColor: 'border-amber-400 bg-amber-50',
  },
  {
    value: 'deferred',
    label: 'Deferred',
    description: 'Decision deferred — obtain informed consent before any transfusion.',
    icon: '🕐',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    cardColor: 'border-slate-300 bg-slate-50',
  },
];

const RESUS_OPTIONS: Array<{
  value: string;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: 'full',    label: 'Full Resuscitation',   description: 'All measures, including CPR, intubation, and ICU care.', icon: '💪' },
  { value: 'limited', label: 'Limited Measures',     description: 'Selected interventions only — discuss details with patient.', icon: '⚡' },
  { value: 'dnr',     label: 'Do Not Resuscitate',   description: 'No CPR or artificial life support. Comfort care only.', icon: '🕊️' },
];

export function StepTreatmentPrefs({ form }: Props) {
  const { register, watch, formState: { errors } } = form;

  const btConsent   = watch('bloodTransfusionConsent');
  const resusChoice = watch('resuscitationPreference');
  const ndprConsent = watch('ndprDataConsent');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 text-white">
        <span className="text-3xl">💉</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Treatment Preferences</h3>
          <p className="text-emerald-100 text-sm mt-0.5">
            Medico-legal consents. These choices are displayed prominently on every clinical view —
            consultation, surgery, and emergency.
          </p>
        </div>
      </div>

      {/* ── Blood Transfusion Consent ─────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🩸</span>
            <p className="text-sm font-bold text-emerald-800">Blood Transfusion Consent <span className="text-red-500">*</span></p>
          </div>
          <p className="text-xs text-emerald-600 mt-1 ml-6">
            Required by law. The patient's choice governs all blood product decisions, including emergencies.
            This is a permanent, legally binding preference — it can only be changed by the patient in writing.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {BT_OPTIONS.map((opt) => {
            const isSelected = btConsent === opt.value;
            return (
              <label
                key={opt.value}
                className={[
                  'flex flex-col gap-2 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                  isSelected ? `${opt.cardColor} border-opacity-100` : 'border-gray-200 bg-white hover:border-emerald-200',
                ].join(' ')}
              >
                <input type="radio" {...register('bloodTransfusionConsent')} value={opt.value} className="sr-only" />
                <div className="flex items-center gap-2">
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{opt.label}</span>
                  {isSelected && (
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${opt.badgeColor}`}>
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-snug">{opt.description}</p>
              </label>
            );
          })}
        </div>
        {errors.bloodTransfusionConsent && (
          <p className={err}>{errors.bloodTransfusionConsent.message}</p>
        )}

        {/* Conditions text — only shown if conditional */}
        {btConsent === 'conditional' && (
          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1.5">
              Specify Conditions for Consent <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('bloodTransfusionConditions')}
              rows={3}
              placeholder="e.g. Patient consents only in life-threatening emergencies where no autologous alternatives exist..."
              className="w-full px-3 py-2.5 text-sm border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white resize-none"
            />
          </div>
        )}

        {btConsent === 'refuses' && (
          <div className="flex gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700">
              <p className="font-bold">Important</p>
              <p>The patient's refusal must be respected at all times, including in emergencies. Ensure this is documented
              in the patient's physical file and that the clinical team is notified.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Resuscitation Preference ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🫀</span>
          <p className="text-sm font-bold text-emerald-800">Resuscitation Preference <span className="text-red-500">*</span></p>
        </div>

        <div className="space-y-2">
          {RESUS_OPTIONS.map((opt) => {
            const isSelected = resusChoice === opt.value;
            return (
              <label
                key={opt.value}
                className={[
                  'flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                  isSelected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200',
                ].join(' ')}
              >
                <input type="radio" {...register('resuscitationPreference')} value={opt.value} className="sr-only" />
                <span className="text-xl flex-shrink-0">{opt.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.description}</p>
                </div>
                <div className={[
                  'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all',
                  isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300',
                ].join(' ')} />
              </label>
            );
          })}
        </div>
        {errors.resuscitationPreference && (
          <p className={err}>{errors.resuscitationPreference.message}</p>
        )}
      </div>

      {/* ── Organ Donation ─────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" {...register('organDonorConsent')} className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Organ Donation Consent</p>
            <p className="text-xs text-gray-500 mt-0.5">
              I wish to be considered as an organ donor in the event of my death, subject to family consent.
            </p>
          </div>
        </label>
      </div>

      {/* ── NDPR Data Consent ─────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <p className="text-sm font-bold text-emerald-800">NDPR Data Processing Consent</p>
          <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">REQUIRED</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Under the <strong>Nigeria Data Protection Regulation 2019 (NDPR)</strong>, Lotto Community Hospital must obtain
          your explicit consent to collect, store, and process your personal health information for clinical purposes.
          Your data will never be shared with third parties without your express consent, except where required by law.
        </p>

        <label className={[
          'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
          ndprConsent ? 'border-emerald-500 bg-white' : 'border-red-200 bg-red-50/50',
        ].join(' ')}>
          <input
            type="checkbox"
            {...register('ndprDataConsent')}
            className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-400"
          />
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>I have explained to the patient / patient's guardian</strong> that their personal health data will be
            processed by Lotto Community Hospital for clinical care, billing, and quality improvement purposes.
            The patient / guardian has given informed verbal consent and understands their right to access,
            correct, and withdraw their data at any time. <span className="text-red-600 font-semibold">*</span>
          </p>
        </label>
        {errors.ndprDataConsent && (
          <p className={err}>{errors.ndprDataConsent.message}</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" {...register('ndprMarketingConsent')} className="mt-0.5 w-4 h-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-400" />
          <div>
            <p className="text-xs text-gray-700">
              The patient <strong>also consents</strong> to receive health tips, appointment reminders, and hospital newsletters
              via SMS / email (optional).
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
