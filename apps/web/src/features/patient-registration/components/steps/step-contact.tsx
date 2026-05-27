'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from '../../schemas/registration.schema';
import { NIGERIAN_STATES } from '../../types';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
}

const sel = 'w-full px-3 py-2.5 text-sm border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white';
const inp = 'w-full px-3 py-2.5 text-sm border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white';
const lbl = 'block text-xs font-semibold text-teal-800 mb-1.5';
const err = 'mt-1 text-xs text-red-600';

export function StepContact({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-400 text-white">
        <span className="text-3xl">📞</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Contact Information</h3>
          <p className="text-teal-100 text-sm mt-0.5">Phone numbers, email address, and residential address.</p>
        </div>
      </div>

      {/* Phone Numbers */}
      <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/40 space-y-4">
        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Phone Numbers</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Primary Phone <span className="text-red-500">*</span></label>
            <input
              type="tel"
              {...register('phone')}
              placeholder="08012345678"
              className={inp}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className={err}>{errors.phone.message}</p>}
          </div>
          <div>
            <label className={lbl}>Alternative Phone</label>
            <input
              type="tel"
              {...register('altPhone')}
              placeholder="07098765432"
              className={inp}
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/40 space-y-4">
        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Email Address</p>

        <div>
          <label className={lbl}>Email (Optional)</label>
          <input
            type="email"
            {...register('email')}
            placeholder="patient@email.com"
            className={inp}
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className={err}>{errors.email.message}</p>}
          <p className="mt-1 text-xs text-teal-600">Used for appointment reminders and lab result notifications.</p>
        </div>
      </div>

      {/* Residential Address */}
      <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/40 space-y-4">
        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Residential Address</p>

        <div>
          <label className={lbl}>Address Line 1</label>
          <input
            {...register('addressLine1')}
            placeholder="12 Adeola Odeku Street"
            className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Address Line 2 (Apartment, Suite, etc.)</label>
          <input
            {...register('addressLine2')}
            placeholder="Flat 3B, Victoria Island"
            className={inp}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>City / Town</label>
            <input
              {...register('city')}
              placeholder="Lagos"
              className={inp}
            />
          </div>
          <div>
            <label className={lbl}>State</label>
            <select {...register('state')} className={sel}>
              <option value="">— Select State —</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Country</label>
          <input
            value="Nigeria"
            readOnly
            className="w-full px-3 py-2.5 text-sm border border-teal-100 rounded-xl bg-teal-50 text-teal-700 font-medium cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
