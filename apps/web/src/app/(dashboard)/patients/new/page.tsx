import type { Metadata } from 'next';
import { NewPatientForm } from '@/features/patients';
import { PageRoleGuard } from '@/shared/components/page-role-guard';

export const metadata: Metadata = { title: 'Register New Patient' };

export default function NewPatientPage() {
  return (
    <PageRoleGuard roles={['admin']} redirectTo="/patients">
      <div className="max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register New Patient</h1>
          <p className="text-muted-foreground text-sm">
            Complete all required fields. An MRN will be auto-assigned on submission.
          </p>
        </div>
        <NewPatientForm />
      </div>
    </PageRoleGuard>
  );
}
