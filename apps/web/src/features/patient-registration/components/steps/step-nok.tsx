'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from '../../schemas/registration.schema';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
}

const inp = 'w-full px-3 py-2.5 text-sm border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white';
const sel = 'w-full px-3 py-2.5 text-sm border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white';
const lbl = 'block text-xs font-semibold text-violet-800 mb-1.5';
const err = 'mt-1 text-xs text-red-600';

const RELATIONSHIPS = [
  { value: 'spouse',   label: 'Spouse / Partner' },
  { value: 'parent',   label: 'Parent' },
  { value: 'child',    label: 'Child' },
  { value: 'sibling',  label: 'Sibling' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'friend',   label: 'Friend' },
  { value: 'other',    label: 'Other' },
];

export function StepNok({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-400 text-white">
        <span className="text-3xl">👨‍👩‍👧</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Next of Kin</h3>
          <p className="text-violet-100 text-sm mt-0.5">
            Emergency contact who can be reached if the patient is incapacitated.
            This field is optional but strongly recommended.
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-3.5 rounded-xl bg-violet-50 border border-violet-200">
        <span className="text-violet-500 text-lg leading-none">ℹ️</span>
        <p className="text-xs text-violet-700">
          The next of kin is contacted in emergencies and for decisions when the patient cannot consent.
          Their information is kept strictly confidential per NDPR guidelines.
        </p>
      </div>

      {/* NOK Name */}
      <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50/40 space-y-4">
        <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Next of Kin Details</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>First Name</label>
            <input
              {...register('nokFirstName')}
              placeholder="Ngozi"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Last Name / Surname</label>
            <input
              {...register('nokLastName')}
              placeholder="Okonkwo"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className={lbl}>Relationship to Patient</label>
          <select {...register('nokRelationship')} className={sel}>
            <option value="">— Select Relationship —</option>
            {RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* NOK Contact */}
      <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50/40 space-y-4">
        <p className="text-xs font-bold text-violet-700 uppercase tracking-wider">Contact Details</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Phone Number</label>
            <input
              type="tel"
              {...register('nokPhone')}
              placeholder="08098765432"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>Email Address</label>
            <input
              type="email"
              {...register('nokEmail')}
              placeholder="nok@email.com"
              className={inp}
              aria-invalid={!!errors.nokEmail}
            />
            {errors.nokEmail && <p className={err}>{errors.nokEmail.message}</p>}
          </div>
        </div>

        <div>
          <label className={lbl}>Address</label>
          <textarea
            {...register('nokAddress')}
            placeholder="14 Broad Street, Marina, Lagos"
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white resize-none"
          />
        </div>
      </div>
    </div>
  );
}
