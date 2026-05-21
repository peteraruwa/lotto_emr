'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMedplum } from '@medplum/react';
import { useQuery } from '@tanstack/react-query';
import type { Bundle, Condition } from '@medplum/fhirtypes';
import { Baby, Stethoscope, AlertTriangle, Truck, Heart, Sun, ArrowLeft } from 'lucide-react';
import { Button } from '@lotto-emr/ui';
import { BookingNoteForm } from '@/features/anc/components/booking-note-form';
import { FollowUpNoteForm } from '@/features/anc/components/followup-note-form';
import { HighRiskReviewForm } from '@/features/anc/components/high-risk-review-form';
import { DeliveryAdmissionForm } from '@/features/anc/components/delivery-admission-form';
import { DeliveryNoteForm } from '@/features/anc/components/delivery-note-form';
import { PostnatalNoteForm } from '@/features/anc/components/postnatal-note-form';
import { ANC_NOTE_TYPE_LABELS } from '@/features/anc/types';
import type { AncNoteType } from '@/features/anc/types';

interface PageProps {
  params: { id: string };
  searchParams: { pregnancy?: string };
}

const NOTE_TYPE_CONFIG: Array<{
  type: AncNoteType;
  icon: React.ReactNode;
  color: string;
  border: string;
  bg: string;
  desc: string;
}> = [
  {
    type: 'booking',
    icon: <Baby className="h-6 w-6" />,
    color: 'text-teal-600',
    border: 'border-teal-200 hover:border-teal-400',
    bg: 'bg-teal-50',
    desc: 'First ANC visit. Records full obstetric history and enrols patient in ANC.',
  },
  {
    type: 'followup',
    icon: <Stethoscope className="h-6 w-6" />,
    color: 'text-blue-600',
    border: 'border-blue-200 hover:border-blue-400',
    bg: 'bg-blue-50',
    desc: 'Routine follow-up. Vitals, obstetric exam, risk monitoring.',
  },
  {
    type: 'high-risk-review',
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'text-orange-600',
    border: 'border-orange-200 hover:border-orange-400',
    bg: 'bg-orange-50',
    desc: 'Specialist review of high-risk conditions such as pre-eclampsia or GDM.',
  },
  {
    type: 'delivery-admission',
    icon: <Truck className="h-6 w-6" />,
    color: 'text-purple-600',
    border: 'border-purple-200 hover:border-purple-400',
    bg: 'bg-purple-50',
    desc: 'Admission to labour ward. Cervical assessment, fetal condition.',
  },
  {
    type: 'delivery',
    icon: <Heart className="h-6 w-6" />,
    color: 'text-pink-600',
    border: 'border-pink-200 hover:border-pink-400',
    bg: 'bg-pink-50',
    desc: 'Records delivery outcome — mode, APGAR, birth weight, complications.',
  },
  {
    type: 'postnatal',
    icon: <Sun className="h-6 w-6" />,
    color: 'text-green-600',
    border: 'border-green-200 hover:border-green-400',
    bg: 'bg-green-50',
    desc: 'Postnatal check. Involution, breastfeeding, mood, family planning.',
  },
];

export default function NewAncVisitPage({ params, searchParams }: PageProps) {
  const router = useRouter();
  const medplum = useMedplum();
  const patientId = params.id;
  const pregnancyId = searchParams.pregnancy ?? '';

  const [selectedType, setSelectedType] = useState<AncNoteType | null>(null);

  // Fetch pregnancy Condition to get lmpDate (needed by most forms)
  const { data: conditionBundle } = useQuery<Bundle<Condition>>({
    queryKey: ['anc-condition-for-visit', pregnancyId],
    queryFn: () =>
      pregnancyId
        ? (medplum.readResource('Condition', pregnancyId) as Promise<Condition>).then(
            (c) => ({ resourceType: 'Bundle', entry: [{ resource: c }] }) as unknown as Bundle<Condition>,
          )
        : Promise.resolve({ resourceType: 'Bundle', entry: [] } as unknown as Bundle<Condition>),
    enabled: !!pregnancyId,
  });

  const condition = conditionBundle?.entry?.[0]?.resource as Condition | undefined;
  const lmpDate = (condition?.onsetDateTime ?? '').split('T')[0];

  const backToAnc = () => router.push(`/patients/${patientId}/anc`);

  const formProps = {
    patientId,
    pregnancyId,
    lmpDate,
    onSuccess: backToAnc,
    onCancel: () => setSelectedType(null),
  };

  // Step 2: render selected form
  if (selectedType) {
    return (
      <div className="max-w-3xl mx-auto pb-10 space-y-4">
        <button
          type="button"
          onClick={() => setSelectedType(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to visit type selection
        </button>

        {selectedType === 'booking' && (
          <BookingNoteForm patientId={patientId} onSuccess={backToAnc} />
        )}
        {selectedType === 'followup' && (
          <FollowUpNoteForm {...formProps} visitNumber={1} />
        )}
        {selectedType === 'high-risk-review' && (
          <HighRiskReviewForm {...formProps} />
        )}
        {selectedType === 'delivery-admission' && (
          <DeliveryAdmissionForm {...formProps} />
        )}
        {selectedType === 'delivery' && (
          <DeliveryNoteForm patientId={patientId} pregnancyId={pregnancyId} onSuccess={backToAnc} onCancel={() => setSelectedType(null)} />
        )}
        {selectedType === 'postnatal' && (
          <PostnatalNoteForm patientId={patientId} pregnancyId={pregnancyId} onSuccess={backToAnc} onCancel={() => setSelectedType(null)} />
        )}
      </div>
    );
  }

  // Step 1: visit type selector
  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={backToAnc} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" />
          Back to ANC
        </button>
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Record New ANC Visit</h1>
        <p className="text-sm text-gray-500 mt-1">Select the type of visit to record</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NOTE_TYPE_CONFIG.map(({ type, icon, color, border, bg, desc }) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`text-left p-4 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${border} bg-white`}
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} ${color} mb-3`}>
              {icon}
            </div>
            <div className={`font-semibold text-sm mb-1 ${color}`}>
              {ANC_NOTE_TYPE_LABELS[type]}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
