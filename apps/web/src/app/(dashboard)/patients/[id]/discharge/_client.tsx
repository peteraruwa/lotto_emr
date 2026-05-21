'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DispositionForm } from '@/features/discharge';

interface DischargePageContentProps {
  patientId: string;
  encounterId?: string;
}

export function DischargePageContent({ patientId, encounterId }: DischargePageContentProps) {
  const router = useRouter();

  if (!encounterId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No encounter ID — open a visit first.
      </div>
    );
  }

  return (
    <DispositionForm
      patientId={patientId}
      encounterId={encounterId}
      onComplete={() => router.push(`/patients/${patientId}`)}
    />
  );
}
