'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepMeta {
  label: string;
  emoji: string;
  bgActive:    string;
  bgComplete:  string;
  bgPending:   string;
  textActive:  string;
  textPending: string;
  borderActive: string;
}

const STEPS: StepMeta[] = [
  {
    label: 'Identity',   emoji: '🪪',
    bgActive: 'bg-blue-600',    bgComplete: 'bg-blue-600',    bgPending: 'bg-gray-100',
    textActive: 'text-white',   textPending: 'text-gray-400',
    borderActive: 'border-blue-600',
  },
  {
    label: 'Contact',    emoji: '📞',
    bgActive: 'bg-teal-600',    bgComplete: 'bg-teal-600',    bgPending: 'bg-gray-100',
    textActive: 'text-white',   textPending: 'text-gray-400',
    borderActive: 'border-teal-600',
  },
  {
    label: 'Next of Kin', emoji: '👨‍👩‍👧',
    bgActive: 'bg-violet-600',  bgComplete: 'bg-violet-600',  bgPending: 'bg-gray-100',
    textActive: 'text-white',   textPending: 'text-gray-400',
    borderActive: 'border-violet-600',
  },
  {
    label: 'Insurance',  emoji: '🏥',
    bgActive: 'bg-amber-500',   bgComplete: 'bg-amber-500',   bgPending: 'bg-gray-100',
    textActive: 'text-white',   textPending: 'text-gray-400',
    borderActive: 'border-amber-500',
  },
  {
    label: 'Clinic Flags', emoji: '🚩',
    bgActive: 'bg-rose-600',    bgComplete: 'bg-rose-600',    bgPending: 'bg-gray-100',
    textActive: 'text-white',   textPending: 'text-gray-400',
    borderActive: 'border-rose-600',
  },
  {
    label: 'Preferences', emoji: '💉',
    bgActive: 'bg-emerald-600', bgComplete: 'bg-emerald-600', bgPending: 'bg-gray-100',
    textActive: 'text-white',   textPending: 'text-gray-400',
    borderActive: 'border-emerald-600',
  },
  {
    label: 'Review',     emoji: '✅',
    bgActive: 'bg-hospital-600', bgComplete: 'bg-hospital-600', bgPending: 'bg-gray-100',
    textActive: 'text-white',    textPending: 'text-gray-400',
    borderActive: 'border-hospital-600',
  },
];

interface StepIndicatorProps {
  currentStep: number;    // 0-based
  totalSteps:  number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  return (
    <nav aria-label="Registration progress" className="w-full">
      {/* Mobile: label only */}
      <div className="sm:hidden flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm font-bold text-gray-800">
          {STEPS[currentStep]?.emoji} {STEPS[currentStep]?.label}
        </span>
      </div>
      <div className="sm:hidden h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-hospital-600 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Desktop: full step indicator */}
      <ol className="hidden sm:flex items-center w-full">
        {STEPS.slice(0, totalSteps).map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive    = index === currentStep;
          const isPending   = index > currentStep;

          return (
            <li key={step.label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2',
                    isCompleted ? `${step.bgComplete} ${step.textActive} ${step.borderActive}` :
                    isActive    ? `${step.bgActive}   ${step.textActive} ${step.borderActive} ring-2 ring-offset-2 ring-current shadow-md` :
                                  `${step.bgPending} ${step.textPending} border-gray-200`,
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : (
                    <span>{isActive ? step.emoji : index + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={[
                    'mt-1.5 text-[10px] font-semibold whitespace-nowrap leading-none',
                    isActive ? 'text-gray-900' : isPending ? 'text-gray-400' : 'text-gray-600',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector line */}
              {index < totalSteps - 1 && (
                <div className={[
                  'flex-1 h-0.5 mx-1 mb-5 transition-all duration-300',
                  index < currentStep ? 'bg-hospital-400' : 'bg-gray-200',
                ].join(' ')} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
