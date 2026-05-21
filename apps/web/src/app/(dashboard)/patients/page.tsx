import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { PatientList } from '@/features/patients';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return (
    <div>
      <PageHeader
        title="Patients"
        description="Search and manage patient records"
        icon={Users}
      />
      <PatientList />
    </div>
  );
}
