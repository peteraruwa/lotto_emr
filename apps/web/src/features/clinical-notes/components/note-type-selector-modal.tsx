'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X, ClipboardList, Activity, FileText, Users, ChevronRight,
  Zap, BedDouble, TrendingUp, Syringe,
} from 'lucide-react';
import { Button } from '@lotto-emr/ui';

const OUTPATIENT_TYPES = [
  { type: 'consultation_note', label: 'Consultation Note',        description: 'New patient or specialist review',                          icon: ClipboardList },
  { type: 'soap_followup',    label: 'Follow-up SOAP Note',       description: 'SOAP-structured review of an existing condition',           icon: Activity     },
  { type: 'procedure_note',   label: 'Procedure Note',            description: 'Minor outpatient procedure documentation',                  icon: Syringe      },
  { type: 'referral_note',    label: 'Referral Note',             description: 'Refer patient to another specialty or facility',           icon: Users        },
] as const;

const EMERGENCY_TYPES = [
  { type: 'ed_note',          label: 'Emergency Department Note', description: 'ED assessment with primary survey and disposition',        icon: Zap          },
] as const;

const INPATIENT_TYPES = [
  { type: 'admission_note',   label: 'Admission Note (H&P)',      description: 'History and physical examination on admission',            icon: BedDouble    },
  { type: 'progress_note',    label: 'Inpatient Progress Note',   description: 'Daily ward round documentation and plan update',           icon: TrendingUp   },
  { type: 'discharge_summary',label: 'Discharge Summary',         description: 'Summary of admission, treatment, and follow-up plan',      icon: FileText     },
] as const;

type NoteTypeEntry = { type: string; label: string; description: string; icon: React.ElementType };

function NoteTypeGroup({
  heading,
  types,
  onSelect,
}: {
  heading: string;
  types: readonly NoteTypeEntry[];
  onSelect: (type: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">{heading}</p>
      <div className="space-y-1">
        {types.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="w-full text-left flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <Icon className="h-4 w-4 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
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
            <h2 className="text-base font-semibold text-gray-900">Select Note Type</h2>
            <p className="text-xs text-gray-400 mt-0.5">Choose the appropriate template for this encounter</p>
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
        <div className="overflow-y-auto p-5 space-y-5">
          <NoteTypeGroup heading="Outpatient"      types={OUTPATIENT_TYPES} onSelect={handleSelect} />
          <NoteTypeGroup heading="Emergency"       types={EMERGENCY_TYPES}  onSelect={handleSelect} />
          <NoteTypeGroup heading="Inpatient / Ward" types={INPATIENT_TYPES}  onSelect={handleSelect} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>
  );
}
