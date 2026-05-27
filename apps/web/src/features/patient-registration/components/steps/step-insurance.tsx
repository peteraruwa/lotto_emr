'use client';

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { RegistrationFormData } from '../../schemas/registration.schema';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
}

const inp = 'w-full px-3 py-2.5 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white';
const lbl = 'block text-xs font-semibold text-amber-800 mb-1.5';

const PAYMENT_MODES: Array<{
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}> = [
  { value: 'cash',    label: 'Out of Pocket',  description: 'Patient pays directly at point of service', icon: '💵', color: 'border-green-400 bg-green-50' },
  { value: 'hmo',     label: 'HMO',            description: 'Health Management Organisation', icon: '🏥', color: 'border-blue-400 bg-blue-50' },
  { value: 'nhis',    label: 'NHIS',           description: 'National Health Insurance Scheme', icon: '🇳🇬', color: 'border-violet-400 bg-violet-50' },
  { value: 'private', label: 'Private / Corporate', description: 'Employer or private insurance plan', icon: '💼', color: 'border-amber-400 bg-amber-50' },
];

const HMO_PROVIDERS = [
  'Hygeia HMO', 'Leadway Health', 'Reliance HMO', 'Total Health Trust', 'AXA Mansard Health',
  'ARM Life PLC', 'Avon HMO', 'Bastion Health', 'Clearline HMO', 'Conga Health',
  'NovaBright Health', 'Integrated Healthcare Ltd', 'Marina Medical Services',
  'Oceanic Health Management', 'Pro-health HMO', 'Swift HMO', 'Zuma Health Trust',
];

export function StepInsurance({ form }: Props) {
  const { register, watch } = form;
  const paymentMode = watch('paymentMode');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-white">
        <span className="text-3xl">🏥</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Insurance & Payment</h3>
          <p className="text-amber-100 text-sm mt-0.5">How this patient's care will be funded. Required for billing and claims.</p>
        </div>
      </div>

      {/* Payment Mode Selection */}
      <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 space-y-3">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Payment / Coverage Mode <span className="text-red-500">*</span></p>

        <div className="grid grid-cols-2 gap-3">
          {PAYMENT_MODES.map((mode) => {
            const isSelected = paymentMode === mode.value;
            return (
              <label
                key={mode.value}
                className={[
                  'flex flex-col gap-1.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                  isSelected ? `${mode.color} border-opacity-100` : 'border-gray-200 bg-white hover:border-amber-200',
                ].join(' ')}
              >
                <input
                  type="radio"
                  {...register('paymentMode')}
                  value={mode.value}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xl">{mode.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{mode.label}</span>
                  {isSelected && <span className="ml-auto text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Selected</span>}
                </div>
                <p className="text-xs text-gray-500 leading-snug">{mode.description}</p>
              </label>
            );
          })}
        </div>
      </div>

      {/* HMO Details */}
      {(paymentMode === 'hmo' || paymentMode === 'private') && (
        <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 space-y-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            {paymentMode === 'hmo' ? 'HMO Details' : 'Private Insurance Details'}
          </p>

          <div>
            <label className={lbl}>Provider Name</label>
            <input
              {...register('hmoProvider')}
              list="hmo-providers"
              placeholder="Hygeia HMO"
              className={inp}
            />
            <datalist id="hmo-providers">
              {HMO_PROVIDERS.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Policy / Membership Number</label>
              <input
                {...register('hmoPolicyNumber')}
                placeholder="HYG-2024-00001234"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Group / Plan Name</label>
              <input
                {...register('hmoGroup')}
                placeholder="Premium Plan"
                className={inp}
              />
            </div>
          </div>
        </div>
      )}

      {/* NHIS Details */}
      {paymentMode === 'nhis' && (
        <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 space-y-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">NHIS Details</p>

          <div>
            <label className={lbl}>NHIS Registration Number</label>
            <input
              {...register('nhisNumber')}
              placeholder="NHIS-12345678"
              className={inp}
            />
            <p className="mt-1 text-xs text-amber-600">The 10–14 character NHIS ID printed on your NHIS card.</p>
          </div>
        </div>
      )}

      {/* Cash notice */}
      {paymentMode === 'cash' && (
        <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
          <span className="text-green-600 text-lg">💵</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Out-of-Pocket Payment Selected</p>
            <p className="text-xs text-green-700 mt-0.5">
              Billing will be processed directly with the patient. You can update the payment mode later from the patient profile.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
