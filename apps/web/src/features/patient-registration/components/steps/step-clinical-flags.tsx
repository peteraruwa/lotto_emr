'use client';

import React from 'react';
import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import type { RegistrationFormData } from '../../schemas/registration.schema';

interface Props {
  form: UseFormReturn<RegistrationFormData>;
}

const inp = 'w-full px-3 py-2.5 text-sm border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white';
const sel = 'w-full px-3 py-2.5 text-sm border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white';
const lbl = 'block text-xs font-semibold text-rose-800 mb-1.5';
const err = 'mt-1 text-xs text-red-600';

const RISK_FLAG_DEFS: Array<{ key: keyof RegistrationFormData['riskFlags']; label: string; emoji: string; color: string }> = [
  { key: 'diabetic',          label: 'Diabetic',             emoji: '🩸', color: 'bg-orange-50 border-orange-300 text-orange-700' },
  { key: 'hypertensive',      label: 'Hypertensive',         emoji: '❤️',  color: 'bg-red-50 border-red-300 text-red-700' },
  { key: 'asthmatic',         label: 'Asthmatic',            emoji: '🫁', color: 'bg-sky-50 border-sky-300 text-sky-700' },
  { key: 'sickleCellDisease', label: 'Sickle Cell Disease',  emoji: '🔴', color: 'bg-rose-50 border-rose-300 text-rose-700' },
  { key: 'pregnant',          label: 'Pregnant',             emoji: '🤰', color: 'bg-pink-50 border-pink-300 text-pink-700' },
  { key: 'immunocompromised', label: 'Immunocompromised',    emoji: '🛡️', color: 'bg-purple-50 border-purple-300 text-purple-700' },
  { key: 'epileptic',         label: 'Epileptic',            emoji: '⚡', color: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { key: 'hivPositive',       label: 'HIV Positive',         emoji: '🔬', color: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
];

export function StepClinicalFlags({ form }: Props) {
  const { register, control, watch, formState: { errors } } = form;

  const allergyArray = useFieldArray({ control, name: 'allergies' });
  const condArray    = useFieldArray({ control, name: 'chronicConditions' });

  const allergies         = watch('allergies');
  const chronicConditions = watch('chronicConditions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-400 text-white">
        <span className="text-3xl">🚩</span>
        <div>
          <h3 className="font-bold text-lg leading-tight">Clinical Safety Flags</h3>
          <p className="text-rose-100 text-sm mt-0.5">
            Known allergies, chronic conditions, and risk flags. This information is always visible to clinicians.
          </p>
        </div>
      </div>

      {/* Risk Flags */}
      <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-3">
        <div>
          <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Risk Flags</p>
          <p className="text-xs text-rose-500 mt-0.5">Check all that apply. These appear as coloured badges on every clinical view.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RISK_FLAG_DEFS.map((def) => {
            const checked = watch(`riskFlags.${def.key}`);
            return (
              <label
                key={def.key}
                className={[
                  'flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all select-none',
                  checked ? def.color + ' border-opacity-100' : 'border-gray-100 bg-white hover:border-rose-200',
                ].join(' ')}
              >
                <input type="checkbox" {...register(`riskFlags.${def.key}`)} className="sr-only" />
                <span className="text-2xl">{def.emoji}</span>
                <span className="text-xs font-semibold text-center leading-tight">{def.label}</span>
                {checked && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Active</span>}
              </label>
            );
          })}
        </div>
      </div>

      {/* Known Allergies */}
      <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Known Allergies</p>
            <p className="text-xs text-rose-500 mt-0.5">List all known allergens and their reactions.</p>
          </div>
          <button
            type="button"
            onClick={() => allergyArray.append({ substance: '', reaction: '', severity: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Allergy
          </button>
        </div>

        {allergyArray.fields.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2 text-center">No allergies recorded. Click "Add Allergy" to add one.</p>
        ) : (
          <div className="space-y-3">
            {allergyArray.fields.map((field, index) => (
              <div key={field.id} className="p-3 rounded-xl bg-white border border-rose-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700">Allergy #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => allergyArray.remove(index)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className={lbl}>Substance / Allergen <span className="text-red-500">*</span></label>
                    <input
                      {...register(`allergies.${index}.substance`)}
                      placeholder="e.g. Penicillin"
                      className={inp}
                    />
                    {errors.allergies?.[index]?.substance && (
                      <p className={err}>{errors.allergies[index]?.substance?.message}</p>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <label className={lbl}>Reaction Observed</label>
                    <input
                      {...register(`allergies.${index}.reaction`)}
                      placeholder="e.g. Rash, Anaphylaxis"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Severity</label>
                    <select {...register(`allergies.${index}.severity`)} className={sel}>
                      <option value="">Unknown</option>
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chronic Conditions */}
      <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Chronic / Pre-existing Conditions</p>
            <p className="text-xs text-rose-500 mt-0.5">Established diagnoses the patient already carries.</p>
          </div>
          <button
            type="button"
            onClick={() => condArray.append({ name: '', since: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Condition
          </button>
        </div>

        {condArray.fields.length === 0 ? (
          <p className="text-xs text-gray-400 italic py-2 text-center">No conditions recorded.</p>
        ) : (
          <div className="space-y-2">
            {condArray.fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-3 p-3 rounded-xl bg-white border border-rose-100">
                <div className="flex-1">
                  <label className={lbl}>Condition <span className="text-red-500">*</span></label>
                  <input
                    {...register(`chronicConditions.${index}.name`)}
                    placeholder="e.g. Type 2 Diabetes"
                    className={inp}
                  />
                  {errors.chronicConditions?.[index]?.name && (
                    <p className={err}>{errors.chronicConditions[index]?.name?.message}</p>
                  )}
                </div>
                <div className="w-36">
                  <label className={lbl}>Since (Year)</label>
                  <input
                    {...register(`chronicConditions.${index}.since`)}
                    placeholder="2018"
                    className={inp}
                    maxLength={4}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => condArray.remove(index)}
                  className="mb-0.5 p-1.5 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
