'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { TriageForm } from '@/features/triage';

interface TriagePageContentProps {
  patientId: string;
  encounterId?: string;
}

export function TriagePageContent({ patientId, encounterId }: TriagePageContentProps) {
  const router = useRouter();

  if (!encounterId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No encounter ID — open a visit first.
      </div>
    );
  }

  return (
    <TriageForm
      patientId={patientId}
      encounterId={encounterId}
      onComplete={() => router.push(`/patients/${patientId}`)}
    />
  );
}
