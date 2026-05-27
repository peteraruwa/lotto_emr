'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from '../../schemas/registration.schema';
import { BLOOD_GROUPS, GENOTYPES, NIGERIAN_TRIBES, RELIGIONS } from '../../types';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
}

const sel = 'w-full px-3 py-2.5 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white disabled:bg-gray-50';
const inp = 'w-full px-3 py-2.5 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white';
const lbl = 'block text-xs font-semibold text-blue-800 mb-1.5';
const err = 'mt-1 text-xs text-red-600';

export function StepIdentity({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <span className="text-3xl">🪪</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Personal Identity</h3>
          <p className="text-blue-100 text-sm mt-0.5">Legal name, date of birth, biological sex, and national identifiers.</p>
        </div>
      </div>

      {/* Legal Name */}
      <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Legal Name</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={lbl}>First Name <span className="text-red-500">*</span></label>
            <input {...register('firstName')} placeholder="Emeka" className={inp} aria-invalid={!!errors.firstName} />
            {errors.firstName && <p className={err}>{errors.firstName.message}</p>}
          </div>
          <div>
            <label className={lbl}>Middle Name</label>
            <input {...register('middleName')} placeholder="Chukwuemeka" className={inp} />
          </div>
          <div>
            <label className={lbl}>Last Name / Surname <span className="text-red-500">*</span></label>
            <input {...register('lastName')} placeholder="Okonkwo" className={inp} aria-invalid={!!errors.lastName} />
            {errors.lastName && <p className={err}>{errors.lastName.message}</p>}
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Demographics</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Date of Birth <span className="text-red-500">*</span></label>
            <input type="date" {...register('dateOfBirth')} className={inp} aria-invalid={!!errors.dateOfBirth}
              max={new Date().toISOString().slice(0, 10)} />
            {errors.dateOfBirth && <p className={err}>{errors.dateOfBirth.message}</p>}
          </div>
          <div>
            <label className={lbl}>Biological Sex <span className="text-red-500">*</span></label>
            <select {...register('gender')} className={sel} aria-invalid={!!errors.gender}>
              <option value="">— Select —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other / Intersex</option>
              <option value="unknown">Prefer not to say</option>
            </select>
            {errors.gender && <p className={err}>{errors.gender.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Blood Group</label>
            <select {...register('bloodGroup')} className={sel}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Genotype</label>
            <select {...register('genotype')} className={sel}>
              <option value="">Unknown</option>
              {GENOTYPES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* National ID */}
      <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">National Identifier</p>

        <div>
          <label className={lbl}>National Identification Number (NIN)</label>
          <input
            {...register('nin')}
            placeholder="12345678901"
            maxLength={11}
            className={inp}
            aria-invalid={!!errors.nin}
            inputMode="numeric"
          />
          <p className="mt-1 text-xs text-blue-600">11-digit NIN as printed on your NIMC slip or National ID card.</p>
          {errors.nin && <p className={err}>{errors.nin.message}</p>}
        </div>
      </div>

      {/* Cultural / Social */}
      <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
        <div>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Cultural & Social (Optional)</p>
          <p className="text-xs text-blue-500 mt-0.5">Non-clinical. Stored for administrative and cultural sensitivity purposes only.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Tribe / Ethnicity</label>
            <select {...register('tribe')} className={sel}>
              <option value="">— Select —</option>
              {NIGERIAN_TRIBES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Religion</label>
            <select {...register('religion')} className={sel}>
              <option value="">— Select —</option>
              {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
