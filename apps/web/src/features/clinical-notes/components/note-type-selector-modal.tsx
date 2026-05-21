'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, ClipboardList, Activity, FileText, Users, ChevronRight } from 'lucide-react';
import { Button } from '@lotto-emr/ui';

const NOTE_TYPE_OPTIONS = [
  {
    type: 'consultation_note',
    label: 'Consultation Note',
    description: 'New patient or specialist review',
    icon: ClipboardList,
    accentBorder: 'border-l-teal-500',
    hover: 'hover:bg-teal-50',
    iconColor: 'text-teal-600',
    badgeBg: 'bg-teal-100 text-teal-700',
    badgeText: 'New Patient',
  },
  {
    type: 'soap_followup',
    label: 'Follow-up SOAP Note',
    description: 'Review of an existing condition with SOAP structure',
    icon: Activity,
    accentBorder: 'border-l-blue-500',
    hover: 'hover:bg-blue-50',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-700',
    badgeText: 'Follow-up',
  },
  {
    type: 'procedure_note',
    label: 'Procedure Note',
    description: 'Minor outpatient procedure documentation',
    icon: FileText,
    accentBorder: 'border-l-orange-500',
    hover: 'hover:bg-orange-50',
    iconColor: 'text-orange-600',
    badgeBg: 'bg-orange-100 text-orange-700',
    badgeText: 'Procedure',
  },
  {
    type: 'referral_note',
    label: 'Referral Note',
    description: 'Refer patient to another specialty or facility',
    icon: Users,
    accentBorder: 'border-l-purple-500',
    hover: 'hover:bg-purple-50',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-100 text-purple-700',
    badgeText: 'Referral',
  },
] as const;

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
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto bg-white rounded-xl shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Select Note Type"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Clinical Note Type</h2>
            <p className="text-xs text-muted-foreground">Outpatient context</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-md p-1"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2">
          {NOTE_TYPE_OPTIONS.map(({ type, label, description, icon: Icon, accentBorder, hover, iconColor, badgeBg, badgeText }) => (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              className={`w-full text-left flex items-center gap-4 border border-gray-200 border-l-4 ${accentBorder} rounded-lg px-4 py-3 transition-colors ${hover}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  );
}
