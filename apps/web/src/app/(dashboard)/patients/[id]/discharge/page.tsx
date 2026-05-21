import type { Metadata } from 'next';
import { DischargePageContent } from './_client';

interface DischargePageProps {
  params: { id: string };
  searchParams: { encounter?: string };
}

export const metadata: Metadata = { title: 'Discharge / Disposition' };

export default function DischargePage({ params, searchParams }: DischargePageProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Discharge &amp; Disposition</h2>
      <DischargePageContent patientId={params.id} encounterId={searchParams.encounter} />
    </div>
  );
}
