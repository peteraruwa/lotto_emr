import type { Metadata } from 'next';
import { RegistrationWizard } from '@/features/patient-registration';
import { PageRoleGuard } from '@/shared/components/page-role-guard';

export const metadata: Metadata = { title: 'Register New Patient | Lotto Community Hospital' };

export default function NewPatientPage() {
  return (
    <PageRoleGuard roles={['admin', 'records']} redirectTo="/patients">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Register New Patient</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete all 7 steps. A Medical Record Number (MRN) will be automatically generated on submission.
            All fields marked <span className="text-red-500 font-bold">*</span> are required.
          </p>
        </div>
        <RegistrationWizard />
      </div>
    </PageRoleGuard>
  );
}
