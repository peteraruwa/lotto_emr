'use client';

import { useRouter } from 'next/navigation';
import { AdmitPatientModal } from '@/features/ward';

export default function AdmitPatientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  return (
    <AdmitPatientModal
      patientId={params.id}
      patientName="Patient"
      isOpen={true}
      onClose={() => router.push(`/patients/${params.id}`)}
      onAdmitted={() => router.push('/ward')}
    />
  );
}
