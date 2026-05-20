'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button, Card, CardContent, Label, Input } from '@lotto-emr/ui';
import { useAdmitPatient } from '../hooks/use-ward-data';

const WARD_OPTIONS = [
  'General Ward',
  'Surgical Ward',
  'Paediatric Ward',
  'Obstetric Ward',
  'ICU',
  'HDU',
  'Isolation Ward',
  'Private Ward',
] as const;

type AdmissionType = 'emergency' | 'urgent' | 'elective';

interface AdmitPatientModalProps {
  patientId: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
  onAdmitted: (encounterId: string) => void;
}

export function AdmitPatientModal({
  patientId,
  patientName,
  isOpen,
  onClose,
  onAdmitted,
}: AdmitPatientModalProps) {
  const router = useRouter();
  const { admitPatient, isAdmitting } = useAdmitPatient();

  const [ward, setWard] = useState<string>('General Ward');
  const [bedNumber, setBedNumber] = useState('');
  const [admissionType, setAdmissionType] = useState<AdmissionType>('emergency');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!patientId) {
      setError('No patient selected. Please select a patient first.');
      return;
    }
    if (!diagnosis.trim()) {
      setError('Admitting diagnosis is required.');
      return;
    }
    if (!bedNumber.trim()) {
      setError('Bed number is required.');
      return;
    }

    try {
      const encId = await admitPatient({
        patientId,
        ward,
        bedNumber: bedNumber.trim(),
        diagnosis: diagnosis.trim(),
        admissionType,
      });
      onAdmitted(encId);
      router.push('/ward');
    } catch (err) {
      console.error('Admit patient failed:', err);
      setError('Failed to admit patient. Please try again.');
    }
  }

  const admissionTypes: { value: AdmissionType; label: string }[] = [
    { value: 'emergency', label: 'Emergency' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'elective', label: 'Elective' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <Card className="relative z-10 w-full max-w-md mx-4 bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Admit Patient</h2>
            {patientName && patientName !== 'Patient' && (
              <p className="text-sm text-muted-foreground mt-0.5">{patientName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <CardContent className="px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ward */}
            <div className="space-y-1.5">
              <Label htmlFor="admit-ward" className="text-sm font-medium text-gray-700">
                Ward
              </Label>
              <select
                id="admit-ward"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {WARD_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>

            {/* Bed Number */}
            <div className="space-y-1.5">
              <Label htmlFor="admit-bed" className="text-sm font-medium text-gray-700">
                Bed Number
              </Label>
              <Input
                id="admit-bed"
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                placeholder="e.g. 12A"
                required
              />
            </div>

            {/* Admission Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Admission Type</Label>
              <div className="flex gap-2">
                {admissionTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setAdmissionType(t.value)}
                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium border transition-colors ${
                      admissionType === t.value
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admitting Diagnosis */}
            <div className="space-y-1.5">
              <Label htmlFor="admit-diagnosis" className="text-sm font-medium text-gray-700">
                Admitting Diagnosis
              </Label>
              <textarea
                id="admit-diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={3}
                placeholder="Primary diagnosis for admission"
                required
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>

            {/* Additional Notes (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="admit-notes" className="text-sm font-medium text-gray-700">
                Additional Notes{' '}
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <textarea
                id="admit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdmitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isAdmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Admitting...
                  </>
                ) : (
                  'Admit Patient'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
