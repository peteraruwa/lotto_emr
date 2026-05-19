import type { Metadata } from 'next';
import { PatientList } from '@/features/patients';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
        <p className="text-muted-foreground text-sm">
          Search and manage patient records
        </p>
      </div>
      <PatientList />
    </div>
  );
}
