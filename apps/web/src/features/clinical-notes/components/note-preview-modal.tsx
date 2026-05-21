'use client';

import React from 'react';
import { X, Pencil, Printer } from 'lucide-react';
import { Button } from '@lotto-emr/ui';

interface NotePreviewData {
  presentingComplaints: string;
  hpc: string;
  pastMedicalHistory: string;
  obstetricsHistory: string;
  gynaecologyHistory: string;
  familySocialHistory: string;
  drugHistory: string;
  reviewOfSystems: string;
  diagnosis: string;
  plan: string;
  examinationNarrative: string;
  isFemale: boolean;
}

interface NotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  data: NotePreviewData;
}

function Section({ heading, content }: { heading: string; content: string }) {
  if (!content?.trim()) return null;
  return (
    <div className="mb-5 print:mb-4">
      <p className="font-bold text-gray-900 text-sm mb-1">{heading}</p>
      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{content.trim()}</p>
    </div>
  );
}

export function NotePreviewModal({ isOpen, onClose, onEdit, data }: NotePreviewModalProps) {
  if (!isOpen) return null;

  const hasAnyContent = [
    data.presentingComplaints,
    data.hpc,
    data.pastMedicalHistory,
    data.obstetricsHistory,
    data.gynaecologyHistory,
    data.familySocialHistory,
    data.drugHistory,
    data.reviewOfSystems,
    data.diagnosis,
    data.examinationNarrative,
    data.plan,
  ].some((v) => v?.trim());

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#note-preview-print-root) { display: none !important; }
          #note-preview-print-root { position: static !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        id="note-preview-print-root"
        className="fixed inset-x-4 top-8 bottom-8 z-50 max-w-3xl mx-auto bg-white rounded-xl shadow-2xl flex flex-col print:static print:shadow-none print:rounded-none print:inset-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Note Preview"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 print:hidden">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Note Preview</h2>
            <p className="text-xs text-muted-foreground">Essay view — review before printing or signing</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-md p-1"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 print:overflow-visible print:py-4">
          {!hasAnyContent ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              No content to preview yet — fill in at least one section first.
            </p>
          ) : (
            <article className="max-w-2xl mx-auto print:max-w-none">
              <Section heading="Presenting Complaints" content={data.presentingComplaints} />
              <Section heading="History of Presenting Complaints" content={data.hpc} />
              <Section heading="Past Medical History" content={data.pastMedicalHistory} />
              {data.isFemale && (
                <>
                  <Section heading="Obstetrics History" content={data.obstetricsHistory} />
                  <Section heading="Gynaecology History" content={data.gynaecologyHistory} />
                </>
              )}
              <Section heading="Family & Social History" content={data.familySocialHistory} />
              <Section heading="Drug History" content={data.drugHistory} />
              <Section heading="Review of Systems" content={data.reviewOfSystems} />
              <Section heading="Diagnosis / Assessment" content={data.diagnosis} />
              <Section heading="Examination" content={data.examinationNarrative} />
              <Section heading="Management Plan" content={data.plan} />
            </article>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => window.print()}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>
    </>
  );
}
