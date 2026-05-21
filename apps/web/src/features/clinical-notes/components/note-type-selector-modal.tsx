'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ClipboardList, Activity, FileText, Users, ChevronRight,
  Zap, BedDouble, TrendingUp, Syringe,
} from 'lucide-react';
import { Button } from '@lotto-emr/ui';

// ── Note type catalogue (grouped by clinical context) ────────────────────────
const OUTPATIENT_TYPES = [
  {
    type: 'consultation_note',
    label: 'Consultation Note',
    description: 'New patient or specialist review',
    icon: ClipboardList,
    iconColor: 'text-teal-600',
    accent: 'border-l-teal-500 hover:bg-teal-50/60',
    badge: 'bg-teal-100 text-teal-700',
    badgeText: 'New Patient',
  },
  {
    type: 'soap_followup',
    label: 'Follow-up SOAP Note',
    description: 'SOAP-structured review of an existing condition',
    icon: Activity,
    iconColor: 'text-blue-600',
    accent: 'border-l-blue-500 hover:bg-blue-50/60',
    badge: 'bg-blue-100 text-blue-700',
    badgeText: 'Follow-up',
  },
  {
    type: 'procedure_note',
    label: 'Procedure Note',
    description: 'Minor outpatient procedure documentation',
    icon: Syringe,
    iconColor: 'text-orange-600',
    accent: 'border-l-orange-500 hover:bg-orange-50/60',
    badge: 'bg-orange-100 text-orange-700',
    badgeText: 'Procedure',
  },
  {
    type: 'referral_note',
    label: 'Referral Note',
    description: 'Refer patient to another specialty or facility',
    icon: Users,
    iconColor: 'text-purple-600',
    accent: 'border-l-purple-500 hover:bg-purple-50/60',
    badge: 'bg-purple-100 text-purple-700',
    badgeText: 'Referral',
  },
] as const;

const EMERGENCY_TYPES = [
  {
    type: 'ed_note',
    label: 'Emergency Department Note',
    description: 'ED assessment with ABCDE primary survey and disposition',
    icon: Zap,
    iconColor: 'text-red-600',
    accent: 'border-l-red-500 hover:bg-red-50/60',
    badge: 'bg-red-100 text-red-700',
    badgeText: 'Emergency',
  },
] as const;

const INPATIENT_TYPES = [
  {
    type: 'admission_note',
    label: 'Admission Note (H&P)',
    description: 'History and physical examination on admission',
    icon: BedDouble,
    iconColor: 'text-sky-600',
    accent: 'border-l-sky-500 hover:bg-sky-50/60',
    badge: 'bg-sky-100 text-sky-700',
    badgeText: 'Admission',
  },
  {
    type: 'progress_note',
    label: 'Inpatient Progress Note',
    description: 'Daily ward round documentation and plan update',
    icon: TrendingUp,
    iconColor: 'text-indigo-600',
    accent: 'border-l-indigo-500 hover:bg-indigo-50/60',
    badge: 'bg-indigo-100 text-indigo-700',
    badgeText: 'Progress',
  },
  {
    type: 'discharge_summary',
    label: 'Discharge Summary',
    description: 'Summary of admission, treatment, and follow-up plan',
    icon: FileText,
    iconColor: 'text-emerald-600',
    accent: 'border-l-emerald-500 hover:bg-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-700',
    badgeText: 'Discharge',
  },
] as const;

type NoteTypeEntry = {
  type: string; label: string; description: string;
  icon: React.ElementType; iconColor: string; accent: string;
  badge: string; badgeText: string;
};

function NoteTypeGroup({
  heading,
  dot,
  types,
  onSelect,
}: {
  heading: string;
  dot: string;
  types: readonly NoteTypeEntry[];
  onSelect: (type: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{heading}</span>
      </div>
      <div className="space-y-1.5">
        {types.map(({ type, label, description, icon: Icon, iconColor, accent, badge, badgeText }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`w-full text-left flex items-center gap-3.5 border border-gray-100 border-l-4 ${accent} rounded-lg px-4 py-3 transition-all duration-150`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{label}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge}`}>
                  {badgeText}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface NoteTypeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export function NoteTypeSelectorModal({ isOpen, onClose, patientId }: NoteTypeSelectorModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSelect = (type: string) => {
    onClose();
    router.push(`/patients/${patientId}/clinical-note/new?type=${type}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Select Note Type"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Clinical Note Type</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose the appropriate note template for this encounter</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1.5 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-5">
          <NoteTypeGroup heading="Outpatient" dot="bg-teal-500" types={OUTPATIENT_TYPES} onSelect={handleSelect} />
          <NoteTypeGroup heading="Emergency" dot="bg-red-500" types={EMERGENCY_TYPES} onSelect={handleSelect} />
          <NoteTypeGroup heading="Inpatient / Ward" dot="bg-indigo-500" types={INPATIENT_TYPES} onSelect={handleSelect} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
