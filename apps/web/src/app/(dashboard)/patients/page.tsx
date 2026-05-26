import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { PatientList } from '@/features/patients';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Patients' };

interface Props {
  searchParams?: Promise<{ name?: string }>;
}

export default async function PatientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialSearch = params?.name ?? '';

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search and manage patient records"
        icon={Users}
      />
      <PatientList initialSearch={initialSearch} />
    </div>
  );
}
