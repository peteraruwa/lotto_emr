import type { Metadata } from 'next';
import { NursingDashboard } from '@/features/nursing';
import { PageRoleGuard } from '@/shared/components/page-role-guard';

export const metadata: Metadata = { title: 'Nursing Dashboard' };

export default function NursingPage() {
  return (
    <PageRoleGuard roles={['nurse']}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <NursingDashboard />
      </div>
    </PageRoleGuard>
  );
}
