'use client';

import React from 'react';
import { X, Pencil, Printer } from 'lucide-react';
import { Button } from '@lotto-emr/ui';

interface NotePreviewData {
  presentingComplaints: string;
  hpc: string;
  pastMedicalHistory: string;
  obGynHistory: string;
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
    <div className="mb-4 print:mb-3">
      <p className="font-bold text-gray-900 mb-1">{heading}</p>
      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{content.trim()}</p>
    </div>
  );
}

export function NotePreviewModal({ isOpen, onClose, onEdit, data }: NotePreviewModalProps) {
  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const hasAnyContent = [
    data.presentingComplaints,
    data.hpc,
    data.pastMedicalHistory,
    data.obGynHistory,
    data.familySocialHistory,
    data.drugHistory,
    data.reviewOfSystems,
    data.diagnosis,
    data.examinationNarrative,
    data.plan,
  ].some((v) => v?.trim());

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#note-preview-print-root) { display: none !important; }
          #note-preview-print-root { position: static !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        id="note-preview-print-root"
        className="fixed inset-x-4 top-8 bottom-8 z-50 max-w-3xl mx-auto bg-white rounded-xl shadow-2xl flex flex-col print:static print:shadow-none print:rounded-none print:inset-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Note Preview"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 print:hidden">
          <h2 className="text-base font-semibold text-gray-900">Note Preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 print:overflow-visible print:py-0">
          {!hasAnyContent ? (
            <p className="text-sm text-muted-foreground text-center py-12 print:hidden">
              No content to preview. Fill in at least one section first.
            </p>
          ) : (
            <article className="max-w-2xl mx-auto font-serif print:max-w-none">
              <Section heading="Presenting Complaints" content={data.presentingComplaints} />
              <Section heading="History of Presenting Complaints" content={data.hpc} />
              <Section heading="Past Medical History" content={data.pastMedicalHistory} />
              {data.isFemale && (
                <Section heading="Obstetric / Gynaecological History" content={data.obGynHistory} />
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

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t shrink-0 print:hidden">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={onEdit} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </>
  );
}
