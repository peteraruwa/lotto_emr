'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Label } from '@lotto-emr/ui';
import { Baby } from 'lucide-react';
import type { AncEnrollmentData, AncRiskLevel } from '../types';
import { calculateEDD, calculateGestationalWeeks } from '../lib/anc-utils';

interface AncEnrollmentFormProps {
  patientId: string;
  onEnrolled: (record: AncEnrollmentData) => void;
}

const RISK_FACTOR_OPTIONS = [
  'Advanced maternal age (>35)',
  'Teenage pregnancy (<18)',
  'Hypertension',
  'Diabetes mellitus',
  'Previous C-section',
  'Multiple pregnancy',
  'Anaemia',
  'HIV positive',
  'Booking after 20 weeks',
  'Previous stillbirth',
];

function deriveRiskLevel(count: number): AncRiskLevel {
  if (count === 0) return 'low';
  if (count <= 2) return 'moderate';
  return 'high';
}

const RISK_BADGE: Record<AncRiskLevel, string> = {
  low: 'bg-green-100 text-green-700',
  moderate: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
};

export function AncEnrollmentForm({ patientId, onEnrolled }: AncEnrollmentFormProps) {
  const medplum = useMedplum();

  const [lmpDate, setLmpDate] = useState('');
  const [gravida, setGravida] = useState(1);
  const [para, setPara] = useState(0);
  const [abortus, setAbortus] = useState(0);
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [manualRisk, setManualRisk] = useState<AncRiskLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const edd = lmpDate ? calculateEDD(lmpDate) : '';
  const gestWeeks = lmpDate ? calculateGestationalWeeks(lmpDate) : 0;
  const autoRisk = deriveRiskLevel(selectedFactors.length);
  const riskLevel: AncRiskLevel = manualRisk ?? autoRisk;

  function toggleFactor(factor: string) {
    setSelectedFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor],
    );
    setManualRisk(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lmpDate) return;
    setIsSubmitting(true);

    try {
      const data: AncEnrollmentData = {
        lmpDate,
        edd,
        gestationalWeekAtBooking: gestWeeks,
        gravida,
        para,
        abortus,
        riskFactors: selectedFactors,
        riskLevel,
      };

      await medplum.createResource({
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active',
            },
          ],
        },
        code: {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '77386006',
              display: 'Pregnancy',
            },
          ],
          text: 'Pregnancy',
        },
        subject: { reference: `Patient/${patientId}` },
        onsetDateTime: lmpDate,
        note: [
          {
            text: `G${gravida}P${para}A${abortus}. EDD: ${edd}. Risk: ${riskLevel}. Risk factors: ${selectedFactors.join(', ')}`,
          },
        ],
      });

      onEnrolled(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-l-4 border-pink-400">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-500" />
            Enrol Patient in ANC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* LMP + derived info */}
          <div className="space-y-1">
            <Label htmlFor="lmp">Last Menstrual Period (LMP) *</Label>
            <input
              id="lmp"
              type="date"
              required
              value={lmpDate}
              onChange={(e) => setLmpDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {lmpDate && (
            <div className="grid grid-cols-2 gap-4 bg-pink-50 border border-pink-200 rounded-lg p-3 text-sm">
              <div>
                <p className="text-xs font-medium text-pink-700 uppercase tracking-wide">EDD</p>
                <p className="font-semibold text-gray-900 mt-0.5">{edd}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-pink-700 uppercase tracking-wide">Gestational Age</p>
                <p className="font-semibold text-gray-900 mt-0.5">{gestWeeks} weeks</p>
              </div>
            </div>
          )}

          {/* Obstetric history */}
          <div>
            <Label className="mb-2 block">Obstetric History</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="gravida" className="text-xs text-muted-foreground">Gravida</Label>
                <input
                  id="gravida"
                  type="number"
                  min={1}
                  value={gravida}
                  onChange={(e) => setGravida(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="para" className="text-xs text-muted-foreground">Para</Label>
                <input
                  id="para"
                  type="number"
                  min={0}
                  value={para}
                  onChange={(e) => setPara(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="abortus" className="text-xs text-muted-foreground">Abortus</Label>
                <input
                  id="abortus"
                  type="number"
                  min={0}
                  value={abortus}
                  onChange={(e) => setAbortus(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Risk factors */}
          <div>
            <Label className="mb-2 block">Risk Factors</Label>
            <div className="flex flex-wrap gap-2">
              {RISK_FACTOR_OPTIONS.map((factor) => {
                const selected = selectedFactors.includes(factor);
                return (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => toggleFactor(factor)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? 'bg-pink-600 text-white border-pink-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400 hover:text-pink-700'
                    }`}
                  >
                    {factor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Risk level */}
          <div className="flex items-center gap-4">
            <div>
              <Label className="mb-1.5 block">Risk Level</Label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${RISK_BADGE[riskLevel]}`}>
                {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
              </span>
            </div>
            <div className="flex gap-2 ml-4">
              {(['low', 'moderate', 'high'] as AncRiskLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setManualRisk(level === riskLevel && manualRisk !== null ? null : level)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    riskLevel === level
                      ? RISK_BADGE[level] + ' border-current'
                      : 'border-gray-300 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !lmpDate}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSubmitting ? 'Enrolling...' : 'Enrol in ANC'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
