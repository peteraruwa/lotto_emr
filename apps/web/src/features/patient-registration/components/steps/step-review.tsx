'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import type { RegistrationFormData } from '../../schemas/registration.schema';

interface Props {
  form:       UseFormReturn<RegistrationFormData>;
  isLoading:  boolean;
  submitError: string | null;
  onBack:     () => void;
  onSubmit:   () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 flex-shrink-0 w-36">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

function Section({ title, emoji, color, children }: { title: string; emoji: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`p-4 rounded-2xl border ${color} space-y-1`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{emoji}</span>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</p>
      </div>
      {children}
    </div>
  );
}

const BT_LABELS: Record<string, string> = {
  consents:    '✅ Consents to transfusion',
  refuses:     '🚫 Refuses transfusion',
  conditional: '⚠️ Conditional consent',
  deferred:    '🕐 Decision deferred',
};

const RESUS_LABELS: Record<string, string> = {
  full:    '💪 Full resuscitation',
  limited: '⚡ Limited measures',
  dnr:     '🕊️ Do Not Resuscitate (DNR)',
};

export function StepReview({ form, isLoading, submitError, onBack, onSubmit }: Props) {
  const data = form.watch();

  const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');
  const nokName  = [data.nokFirstName, data.nokLastName].filter(Boolean).join(' ');
  const address  = [data.addressLine1, data.addressLine2, data.city, data.state].filter(Boolean).join(', ');
  const activeRiskFlags = Object.entries(data.riskFlags ?? {})
    .filter(([, v]) => v)
    .map(([k]) => {
      const labels: Record<string, string> = {
        diabetic: 'Diabetic', hypertensive: 'Hypertensive', asthmatic: 'Asthmatic',
        sickleCellDisease: 'Sickle Cell Disease', pregnant: 'Pregnant',
        immunocompromised: 'Immunocompromised', epileptic: 'Epileptic', hivPositive: 'HIV+',
      };
      return labels[k] ?? k;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-hospital-600 to-hospital-400 text-white">
        <span className="text-3xl">✅</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Review & Confirm</h3>
          <p className="text-hospital-100 text-sm mt-0.5">
            Please review all information carefully before registering the patient.
          </p>
        </div>
      </div>

      {/* ── Step 1: Identity ─────────────────────────────────────────── */}
      <Section title="Identity" emoji="🪪" color="border-blue-100 bg-blue-50/30">
        <Row label="Full Name"    value={fullName} />
        <Row label="Date of Birth" value={data.dateOfBirth} />
        <Row label="Biological Sex" value={data.gender} />
        <Row label="Blood Group"  value={data.bloodGroup || 'Not recorded'} />
        <Row label="Genotype"     value={data.genotype   || 'Not recorded'} />
        <Row label="NIN"          value={data.nin        || 'Not provided'} />
        <Row label="Tribe"        value={data.tribe      || '—'} />
        <Row label="Religion"     value={data.religion   || '—'} />
      </Section>

      {/* ── Step 2: Contact ──────────────────────────────────────────── */}
      <Section title="Contact" emoji="📞" color="border-teal-100 bg-teal-50/30">
        <Row label="Primary Phone" value={data.phone} />
        <Row label="Alt Phone"     value={data.altPhone  || '—'} />
        <Row label="Email"         value={data.email     || '—'} />
        <Row label="Address"       value={address        || '—'} />
      </Section>

      {/* ── Step 3: Next of Kin ──────────────────────────────────────── */}
      <Section title="Next of Kin" emoji="👨‍👩‍👧" color="border-violet-100 bg-violet-50/30">
        {nokName ? (
          <>
            <Row label="Name"         value={nokName} />
            <Row label="Relationship" value={data.nokRelationship || '—'} />
            <Row label="Phone"        value={data.nokPhone        || '—'} />
            <Row label="Email"        value={data.nokEmail        || '—'} />
            <Row label="Address"      value={data.nokAddress      || '—'} />
          </>
        ) : (
          <p className="text-xs text-gray-400 italic">No next of kin recorded.</p>
        )}
      </Section>

      {/* ── Step 4: Insurance ────────────────────────────────────────── */}
      <Section title="Insurance & Payment" emoji="🏥" color="border-amber-100 bg-amber-50/30">
        <Row label="Payment Mode"  value={data.paymentMode?.toUpperCase()} />
        {(data.paymentMode === 'hmo' || data.paymentMode === 'private') && (
          <>
            <Row label="HMO Provider" value={data.hmoProvider    || '—'} />
            <Row label="Policy No."   value={data.hmoPolicyNumber || '—'} />
            <Row label="Group / Plan" value={data.hmoGroup        || '—'} />
          </>
        )}
        {data.paymentMode === 'nhis' && (
          <Row label="NHIS Number" value={data.nhisNumber || '—'} />
        )}
      </Section>

      {/* ── Step 5: Clinical Safety Flags ──────────────────────────── */}
      <Section title="Clinical Safety Flags" emoji="🚩" color="border-rose-100 bg-rose-50/30">
        {activeRiskFlags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {activeRiskFlags.map((f) => (
              <span key={f} className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">{f}</span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No risk flags.</p>
        )}

        {(data.allergies?.length ?? 0) > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold text-gray-600">Allergies:</p>
            {data.allergies.filter((a) => a.substance).map((a, i) => (
              <div key={i} className="text-xs text-gray-700 flex gap-2">
                <span className="font-medium">{a.substance}</span>
                {a.reaction && <span className="text-gray-500">→ {a.reaction}</span>}
                {a.severity && <span className="text-orange-600">({a.severity})</span>}
              </div>
            ))}
          </div>
        )}

        {(data.chronicConditions?.length ?? 0) > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold text-gray-600">Chronic Conditions:</p>
            {data.chronicConditions.filter((c) => c.name).map((c, i) => (
              <div key={i} className="text-xs text-gray-700 flex gap-2">
                <span className="font-medium">{c.name}</span>
                {c.since && <span className="text-gray-500">since {c.since}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Step 6: Treatment Preferences ──────────────────────────── */}
      <Section title="Treatment Preferences" emoji="💉" color="border-emerald-100 bg-emerald-50/30">
        <div className="space-y-2">
          {/* Blood transfusion — highlighted */}
          <div className={[
            'flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold text-sm',
            data.bloodTransfusionConsent === 'refuses' ? 'bg-red-50 border-red-300 text-red-800' :
            data.bloodTransfusionConsent === 'consents' ? 'bg-green-50 border-green-300 text-green-800' :
            'bg-amber-50 border-amber-300 text-amber-800',
          ].join(' ')}>
            <span className="text-lg">{BT_LABELS[data.bloodTransfusionConsent]?.split(' ')[0]}</span>
            <span>{BT_LABELS[data.bloodTransfusionConsent]?.split(' ').slice(1).join(' ')}</span>
          </div>
          {data.bloodTransfusionConditions && (
            <p className="text-xs text-gray-600 italic ml-1">{data.bloodTransfusionConditions}</p>
          )}

          <Row label="Resuscitation" value={RESUS_LABELS[data.resuscitationPreference]} />
          <Row label="Organ Donor"   value={data.organDonorConsent ? 'Yes' : 'No'} />
          <Row label="NDPR Consent"  value={data.ndprDataConsent ? '✅ Confirmed' : '❌ NOT confirmed'} />
        </div>
      </Section>

      {/* Error */}
      {submitError && (
        <div className="flex gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Registration failed</p>
            <p className="text-xs text-red-700 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !data.ndprDataConsent}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-hospital-600 hover:bg-hospital-700 disabled:bg-hospital-400 text-white text-sm font-bold rounded-xl transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registering…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Register Patient
            </>
          )}
        </button>
      </div>
    </div>
  );
}
