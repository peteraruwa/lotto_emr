import type { Metadata } from 'next';
import { PatientReactivationForm } from '@/features/patient-reactivation';
import { PageRoleGuard } from '@/shared/components/page-role-guard';

export const metadata: Metadata = { title: 'Reactivate Patient | Lotto Community Hospital' };

export default function ReactivatePatientPage() {
  return (
    <PageRoleGuard roles={['records']} redirectTo="/patients">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reactivate Patient</h1>
          <p className="text-sm text-gray-500 mt-1">
            Search for a returning patient by name, MRN, NIN, or phone number.
            Confirm their details and reactivate their record.
          </p>
        </div>
        <PatientReactivationForm />
      </div>
    </PageRoleGuard>
  );
}
